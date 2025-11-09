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
import { artifactTypeValidator } from "./types/artifact";

/**
 * Create new artifact
 * 
 * Backend sends: type, data_model, data, tags, metadata, projectId, userId, widgetId (optional)
 * Convex adds: _id, createdAt, updatedAt
 */
export const createArtifact = mutation({
  args: {
    // AI-generated
    type: artifactTypeValidator,
    dataModel: v.any(),
    data: v.any(),
    tags: v.optional(v.array(v.string())),
    
    // Backend-set
    metadata: v.object({
      version: v.number(),
      lastUpdatedBy: v.string(),
      editSource: v.optional(v.union(v.literal("widget"), v.literal("user"))),  // NEW: Track edit source
    }),
    projectId: v.id("projects"),
    widgetId: v.optional(v.id("widgets")),  // Optional: project-level artifacts may not link to a widget
    conversationId: v.optional(v.id("conversations")),  // Optional: conversation-level artifacts
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const artifactId = await ctx.db.insert("artifacts", {
      type: args.type,
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
  args: {
    artifactId: v.id("artifacts"),
    data: v.optional(v.any()),
    tags: v.optional(v.array(v.string())),
    updatedBy: v.string(), // widget_id or user_id
    editSource: v.optional(v.union(v.literal("widget"), v.literal("user"))),  // NEW: Track edit source
    expectedVersion: v.optional(v.number()),  // NEW: Optimistic concurrency control
  },
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
    
    if (args.tags !== undefined) {
      updates.tags = args.tags;
    }
    
    // Update metadata with version increment and edit source tracking
    const currentVersion = existing.metadata?.version || 1;
    const editSource = args.editSource || "widget";  // Default to "widget" for backward compatibility
    
    // Build edit history entry
    const editHistory = existing.metadata?.editHistory || [];
    const newEditEntry = {
      timestamp: now,
      ...(editSource === "widget" ? { widgetId: args.updatedBy } : { userId: args.updatedBy }),
      editSource: editSource,
      changes: JSON.stringify({ data: args.data !== undefined, tags: args.tags !== undefined })
    };
    
    updates.metadata = {
      ...existing.metadata,
      version: currentVersion + 1,  // Increment version on each update
      lastUpdatedBy: args.updatedBy,
      lastUpdatedAt: now,
      editSource: editSource,  // Track edit source
      editHistory: [...editHistory, newEditEntry].slice(-50),  // Keep last 50 edits
    };
    
    await ctx.db.patch(args.artifactId, updates);
    
    return true;
  },
});

/**
 * Delete artifact
 */
export const deleteArtifact = mutation({
  args: {
    artifactId: v.id("artifacts"),
  },
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

