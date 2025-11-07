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
 */
export const updateArtifact = mutation({
  args: {
    artifactId: v.id("artifacts"),
    data: v.optional(v.any()),
    tags: v.optional(v.array(v.string())),
    updatedBy: v.string(), // widget_id or user_id
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const updates: any = {
      updatedAt: now,
    };
    
    if (args.data !== undefined) {
      updates.data = args.data;
    }
    
    if (args.tags !== undefined) {
      updates.tags = args.tags;
    }
    
    // Update metadata
    const existing = await ctx.db.get(args.artifactId);
    if (existing) {
      updates.metadata = {
        ...existing.metadata,
        lastUpdatedBy: args.updatedBy,
        lastUpdatedAt: now,
      };
    }
    
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

