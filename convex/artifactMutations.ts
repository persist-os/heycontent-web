/**
 * Artifact Mutations
 * 
 * CRITICAL: Follows CONVEX_SAVE_ABSOLUTE_LAW
 * - Auto-generates: _id, createdAt, updatedAt
 * - Validates against artifact.ts schema
 * - Returns artifact ID
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { artifactCreateValidator, artifactUpdateValidator, artifactDeleteValidator } from "./types/artifact";

/**
 * Create new artifact
 * 
 * Backend sends: type, title, data_model, data, tags, metadata, projectId, userId, widgetId (optional)
 * Convex adds: _id, createdAt, updatedAt
 */
export const createArtifact = mutation({
  args: artifactCreateValidator,
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const artifactId = await ctx.db.insert("artifacts", {
      type: args.type,
      title: args.title,  // Include title field
      data_model: args.dataModel,
      data: args.data,
      tags: args.tags,
      metadata: {
        version: args.metadata.version,
        lastUpdatedBy: args.metadata.lastUpdatedBy,
        lastUpdatedAt: now,
        editSource: args.metadata.editSource || "widget",  // Default to "widget" for backward compatibility
      },
      projectId: args.projectId,
      widgetId: args.widgetId,
      conversationId: args.conversationId,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });
    
    // ✅ PATTERN 13: Atomic Parent-Child Updates - Update project.artifactIds array
    const project = await ctx.db.get(args.projectId) as any;
    if (project) {
      const existingArtifactIds = project.artifactIds || [];
      await ctx.db.patch(args.projectId, {
        artifactIds: [...existingArtifactIds, artifactId],
        updatedAt: now,
      });
    }
    
    // ✅ PATTERN 13: Atomic Parent-Child Updates - Update conversation.artifactIds array if conversationId provided
    if (args.conversationId) {
      const conversation = await ctx.db.get(args.conversationId) as any;
      if (conversation) {
        const existingArtifactIds = conversation.artifactIds || [];
        await ctx.db.patch(args.conversationId, {
          artifactIds: [...existingArtifactIds, artifactId],
          updatedAt: now,
        });
      }
    }
    
    // ✅ NEW: Create version 1 snapshot
    await ctx.db.insert("artifact_versions", {
      artifactId: artifactId,
      versionNumber: 1,
      isLatest: true,
      data: args.data,
      dataModel: args.dataModel,
      tags: args.tags,
      createdAt: now,
      createdBy: args.metadata.lastUpdatedBy,
      editSource: args.metadata.editSource || "widget",
      parentVersionId: undefined,  // No parent for version 1
      storageType: "snapshot",
      widgetExecutionId: undefined,
      taskRunId: undefined,
    });
    
    return artifactId;
  },
});

/**
 * Update artifact
 * Only data and tags can be updated (type and relationships are immutable)
 * 
 * NEW: Supports version-based optimistic concurrency control and edit source tracking
 */
export const updateArtifact = mutation({
  args: artifactUpdateValidator,
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get existing artifact for version check and metadata update
    const existing = await ctx.db.get(args.artifactId);
    if (!existing) {
      throw new Error("Artifact not found");
    }
    
    // NEW: Optimistic concurrency control - check version if provided
    if (args.expectedVersion !== undefined) {
      const currentVersion = existing.metadata?.version || 1;
      if (currentVersion !== args.expectedVersion) {
        // Version mismatch - conflict detected
        // Return error so backend can handle conflict resolution
        throw new Error(`Version mismatch: expected ${args.expectedVersion}, got ${currentVersion}`);
      }
    }
    
    const updates: any = {
      updatedAt: now,
    };
    
    if (args.data !== undefined) {
      updates.data = args.data;
    }
    
    if (args.dataModel !== undefined) {  // ✅ NEW: Accept dataModel updates
      updates.data_model = args.dataModel;
    }
    
    if (args.tags !== undefined) {
      updates.tags = args.tags;
    }
    
    const currentVersion = existing.metadata?.version || 1;
    const editSource = args.editSource || "widget";  // Default to "widget" for backward compatibility
    const skipVersion = args.skipVersion || false;  // Skip version creation for non-content updates (e.g., sends)
    
    // Only create versions for actual content edits, not for sends or metadata-only updates
    if (!skipVersion) {
      // ✅ Create version snapshot BEFORE update (only for content edits)
      // Find existing latest version record (if exists)
      const currentLatest = await ctx.db
        .query("artifact_versions")
        .withIndex("by_latest", (q) =>
          q.eq("artifactId", args.artifactId).eq("isLatest", true)
        )
        .first();
      
      // If latest version exists and matches current version, mark it as historical
      // Otherwise, create snapshot of current version
      let versionSnapshotId;
      if (currentLatest && currentLatest.versionNumber === currentVersion) {
        // Update existing version record to mark as historical
        await ctx.db.patch(currentLatest._id, { isLatest: false });
        versionSnapshotId = currentLatest._id;
      } else {
        // Create snapshot of current version (shouldn't happen normally, but handle edge case)
        const previousVersion = await ctx.db
          .query("artifact_versions")
          .withIndex("by_artifact_version", (q) =>
            q.eq("artifactId", args.artifactId).eq("versionNumber", currentVersion)
          )
          .first();
        
        versionSnapshotId = await ctx.db.insert("artifact_versions", {
          artifactId: args.artifactId,
          versionNumber: currentVersion,
          isLatest: false,  // Mark as historical
          data: existing.data,
          dataModel: existing.data_model,
          tags: existing.tags,
          createdAt: existing.updatedAt,  // Use artifact's last update time
          createdBy: existing.metadata?.lastUpdatedBy || "system",
          editSource: existing.metadata?.editSource || "widget",
          parentVersionId: previousVersion?._id,
          storageType: "snapshot",
          widgetExecutionId: undefined,
          taskRunId: undefined,
        });
      }
      
      // Build edit history entry
      const editHistory = existing.metadata?.editHistory || [];
      const newEditEntry = {
        timestamp: now,
        ...(editSource === "widget" ? { widgetId: args.updatedBy } : { userId: args.updatedBy }),
        editSource: editSource,
        changes: JSON.stringify({ data: args.data !== undefined, dataModel: args.dataModel !== undefined, tags: args.tags !== undefined })
      };
      
      updates.metadata = {
        ...existing.metadata,
        version: currentVersion + 1,  // Increment version on content edit
        lastUpdatedBy: args.updatedBy,
        lastUpdatedAt: now,
        editSource: editSource,  // Track edit source
        editHistory: [...editHistory, newEditEntry].slice(-50),  // Keep last 50 edits
      };
      
      await ctx.db.patch(args.artifactId, updates);
      
      // ✅ Create new version record (version N+1) - only for content edits
      await ctx.db.insert("artifact_versions", {
        artifactId: args.artifactId,
        versionNumber: currentVersion + 1,
        isLatest: true,  // This is the new latest
        data: updates.data !== undefined ? updates.data : existing.data,
        dataModel: updates.data_model !== undefined ? updates.data_model : existing.data_model,
        tags: updates.tags !== undefined ? updates.tags : existing.tags,
        createdAt: now,
        createdBy: args.updatedBy,
        editSource: editSource,
        parentVersionId: versionSnapshotId,  // Link to previous version
        storageType: "snapshot",
        widgetExecutionId: undefined,
        taskRunId: undefined,
      });
    } else {
      // Skip version creation - just update metadata (for sends, metadata-only updates)
      updates.metadata = {
        ...existing.metadata,
        // Keep same version - don't increment
        lastUpdatedBy: args.updatedBy,
        lastUpdatedAt: now,
        editSource: editSource,
      };
      
      await ctx.db.patch(args.artifactId, updates);
    }
    
    return true;
  },
});

/**
 * Create multiple artifacts in batch
 * 
 * Backend sends: array of artifacts (each with type, title, dataModel, data, tags, metadata, projectId, userId, widgetId optional, conversationId optional)
 * Convex adds: _id, createdAt, updatedAt for each artifact
 * 
 * CRITICAL: Follows CONVEX_SAVE_ABSOLUTE_LAW
 * - Returns array of artifact IDs
 * - Updates project.artifactIds array atomically (PATTERN 13)
 * - Updates conversation.artifactIds array if conversationId provided (PATTERN 13)
 * - All artifacts created atomically (if one fails, all fail)
 */
export const createArtifactsBatch = mutation({
  args: {
    artifacts: v.array(artifactCreateValidator),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const artifactIds: string[] = [];
    
    // Create all artifacts in batch
    for (const artifact of args.artifacts) {
      const artifactId = await ctx.db.insert("artifacts", {
        type: artifact.type,
        title: artifact.title,
        data_model: artifact.dataModel,
        data: artifact.data,
        tags: artifact.tags,
        metadata: {
          version: artifact.metadata.version,
          lastUpdatedBy: artifact.metadata.lastUpdatedBy,
          lastUpdatedAt: now,
          editSource: artifact.metadata.editSource || "widget",  // Default to "widget" for backward compatibility
        },
        projectId: artifact.projectId,
        widgetId: artifact.widgetId,
        conversationId: artifact.conversationId,
        userId: artifact.userId,
        createdAt: now,
        updatedAt: now,
      });
      
      artifactIds.push(artifactId);
      
      // ✅ PATTERN 13: Atomic Parent-Child Updates - Update project.artifactIds array
      const project = await ctx.db.get(artifact.projectId) as any;
      if (project) {
        const existingArtifactIds = project.artifactIds || [];
        await ctx.db.patch(artifact.projectId, {
          artifactIds: [...existingArtifactIds, artifactId],
          updatedAt: now,
        });
      }
      
      // ✅ PATTERN 13: Atomic Parent-Child Updates - Update conversation.artifactIds array if conversationId provided
      if (artifact.conversationId) {
        const conversation = await ctx.db.get(artifact.conversationId) as any;
        if (conversation) {
          const existingArtifactIds = conversation.artifactIds || [];
          await ctx.db.patch(artifact.conversationId, {
            artifactIds: [...existingArtifactIds, artifactId],
            updatedAt: now,
          });
        }
      }
    }
    
    return artifactIds;
  },
});

/**
 * Delete artifact
 */
export const deleteArtifact = mutation({
  args: artifactDeleteValidator,
  handler: async (ctx, args) => {
    // Get artifact before deleting to access parent references
    const artifact = await ctx.db.get(args.artifactId);
    if (!artifact) {
      throw new Error("Artifact not found");
    }
    
    const now = Date.now();
    
    // Delete the artifact
    await ctx.db.delete(args.artifactId);
    
    // ✅ PATTERN 13: Atomic Parent-Child Updates - Remove artifact ID from project array
    const project = await ctx.db.get(artifact.projectId) as any;
    if (project && project.artifactIds) {
      const updatedArtifactIds = project.artifactIds.filter((id: any) => id !== args.artifactId);
      await ctx.db.patch(artifact.projectId, {
        artifactIds: updatedArtifactIds,
        updatedAt: now,
      });
    }
    
    // ✅ PATTERN 13: Atomic Parent-Child Updates - Remove artifact ID from conversation array if exists
    if (artifact.conversationId) {
      const conversation = await ctx.db.get(artifact.conversationId) as any;
      if (conversation && conversation.artifactIds) {
        const updatedArtifactIds = conversation.artifactIds.filter((id: any) => id !== args.artifactId);
        await ctx.db.patch(artifact.conversationId, {
          artifactIds: updatedArtifactIds,
          updatedAt: now,
        });
      }
    }
    
    return true;
  },
});

