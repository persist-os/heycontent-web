import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Optimized Projects Mutations
 * Following Convex best practices for performance and scalability
 * Clean implementation without legacy social media fields
 */

// ============================================================================
// CORE PROJECT OPERATIONS
// ============================================================================

/**
 * Create a new project - Clean implementation
 * Used by: Frontend project creation, backend discovery
 */
export const createProject = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    noteIds: v.optional(v.array(v.string())),
    conversationIds: v.optional(v.array(v.string())),
    crystalIds: v.optional(v.array(v.string())),
    shardIds: v.optional(v.array(v.string())),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.userId || args.userId.trim() === '') {
      throw new Error("Valid user ID is required");
    }
    
    if (!args.name || args.name.trim() === '') {
      throw new Error("Project name is required");
    }
    
    // Sanitize and validate name length
    const sanitizedName = args.name.trim();
    if (sanitizedName.length > 100) {
      throw new Error("Project name must be 100 characters or less");
    }
    
    // Sanitize description if provided
    const sanitizedDescription = args.description?.trim() || undefined;
    if (sanitizedDescription && sanitizedDescription.length > 500) {
      throw new Error("Project description must be 500 characters or less");
    }
    
    const now = Date.now();
    
    try {
      const projectId = await ctx.db.insert("projects", {
        userId: args.userId,
        name: sanitizedName,
        description: sanitizedDescription,
        
        // Initialize content arrays with provided content or empty
        noteIds: args.noteIds || [],
        conversationIds: args.conversationIds || [],
        crystalIds: args.crystalIds || [],
        shardIds: args.shardIds || [],
        analysisIds: [],
        
        // No fingerprint initially - created during discovery
        fingerprintId: undefined,
        
        // Timestamps
        createdAt: now,
        updatedAt: now,
      });

      return projectId;
    } catch (error) {
      console.error("Failed to create project:", error);
      throw new Error("Failed to create project");
    }
  },
});

/**
 * Update project basic info
 * Used by: Project settings, renaming
 */
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { projectId, userId, updates }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }
    
    // Prepare update object
    const updateData: any = {
      updatedAt: Date.now(),
    };
    
    // Validate and add name if provided
    if (updates.name !== undefined) {
      const sanitizedName = updates.name.trim();
      if (sanitizedName.length === 0) {
        throw new Error("Project name cannot be empty");
      }
      if (sanitizedName.length > 100) {
        throw new Error("Project name must be 100 characters or less");
      }
      updateData.name = sanitizedName;
    }
    
    // Validate and add description if provided
    if (updates.description !== undefined) {
      const sanitizedDescription = updates.description.trim() || undefined;
      if (sanitizedDescription && sanitizedDescription.length > 500) {
        throw new Error("Project description must be 500 characters or less");
      }
      updateData.description = sanitizedDescription;
    }
    
    await ctx.db.patch(projectId, updateData);
    
    return { success: true, projectId };
  },
});

// ============================================================================
// CONTENT MANAGEMENT
// ============================================================================

/**
 * Add content to project - Unified function for all content types
 * Used by: Content creation, association
 */
export const addContent = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    contentType: v.union(
      v.literal("note"),
      v.literal("conversation"),
      v.literal("crystal"),
      v.literal("shard"),
      v.literal("analysis")
    ),
    contentId: v.string(),
  },
  handler: async (ctx, { projectId, userId, contentType, contentId }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }
    
    // Map content type to field
    const fieldMap = {
      note: "noteIds",
      conversation: "conversationIds",
      crystal: "crystalIds",
      shard: "shardIds",
      analysis: "analysisIds",
    };
    
    const field = fieldMap[contentType];
    const currentIds = project[field] || [];
    
    // Avoid duplicates
    if (currentIds.includes(contentId)) {
      return { success: true, projectId, message: "Content already in project" };
    }
    
    // Add content ID
    const updatedIds = [...currentIds, contentId];
    
    await ctx.db.patch(projectId, {
      [field]: updatedIds,
      updatedAt: Date.now(),
    });
    
    // 🆕 INCREMENT FINGERPRINT SIGNALS
    const signalTypeMap: Record<string, string> = {
      note: "note_added",
      crystal: "crystal_added",
      shard: "shard_added",
    };
    
    const signalType = signalTypeMap[contentType];
    if (signalType) {
      try {
        await ctx.runMutation(api.fingerprintSignalsMutations.increment, {
          projectId,
          signalType: signalType as any,
          count: 1,
        });
      } catch (error) {
        // Don't fail the operation if signal increment fails
        console.error("Failed to increment signal:", error);
      }
    }
    
    return { success: true, projectId, contentType, contentId };
  },
});

/**
 * Remove content from project
 * Used by: Content removal, cleanup
 */
export const removeContent = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    contentType: v.union(
      v.literal("note"),
      v.literal("conversation"),
      v.literal("crystal"),
      v.literal("shard"),
      v.literal("analysis")
    ),
    contentId: v.string(),
  },
  handler: async (ctx, { projectId, userId, contentType, contentId }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }
    
    // Map content type to field
    const fieldMap = {
      note: "noteIds",
      conversation: "conversationIds",
      crystal: "crystalIds",
      shard: "shardIds",
      analysis: "analysisIds",
    };
    
    const field = fieldMap[contentType];
    const currentIds = project[field] || [];
    
    // Remove content ID
    const updatedIds = currentIds.filter(id => id !== contentId);
    
    await ctx.db.patch(projectId, {
      [field]: updatedIds,
      updatedAt: Date.now(),
    });
    
    return { success: true, projectId, contentType, contentId };
  },
});

/**
 * Bulk add content to project
 * Used by: Bulk operations, migration
 */
export const addMultipleContent = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    content: v.array(v.object({
      type: v.union(
        v.literal("note"),
        v.literal("conversation"),
        v.literal("crystal"),
        v.literal("shard"),
        v.literal("analysis")
      ),
      id: v.string(),
    })),
  },
  handler: async (ctx, { projectId, userId, content }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }
    
    // Group content by type
    const updates: any = { updatedAt: Date.now() };
    const fieldMap = {
      note: "noteIds",
      conversation: "conversationIds",
      crystal: "crystalIds",
      shard: "shardIds",
      analysis: "analysisIds",
    };
    
    for (const item of content) {
      const field = fieldMap[item.type];
      const currentIds = project[field] || [];
      
      // Add if not already present
      if (!currentIds.includes(item.id)) {
        updates[field] = [...(updates[field] || currentIds), item.id];
      }
    }
    
    await ctx.db.patch(projectId, updates);
    
    return { success: true, projectId, addedCount: content.length };
  },
});

// ============================================================================
// INTELLIGENCE MANAGEMENT
// ============================================================================

/**
 * Link project to fingerprint
 * Used by: Project discovery completion
 */
export const linkFingerprint = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    fingerprintId: v.id("project_fingerprints"),
  },
  handler: async (ctx, { projectId, userId, fingerprintId }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }
    
    // Validate fingerprint exists
    const fingerprint = await ctx.db.get(fingerprintId);
    if (!fingerprint) {
      throw new Error("Fingerprint not found");
    }
    
    if (fingerprint.userId !== userId) {
      throw new Error("Access denied: You don't own this fingerprint");
    }
    
    await ctx.db.patch(projectId, {
      fingerprintId,
      updatedAt: Date.now(),
    });
    
    return { success: true, projectId, fingerprintId };
  },
});

/**
 * Unlink project from fingerprint
 * Used by: Reset intelligence, cleanup
 */
export const unlinkFingerprint = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }
    
    await ctx.db.patch(projectId, {
      fingerprintId: undefined,
      updatedAt: Date.now(),
    });
    
    return { success: true, projectId };
  },
});

// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================

/**
 * Delete project and cleanup
 * Used by: Project deletion
 */
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }
    
    // TODO: In a full implementation, we might want to:
    // 1. Remove project references from notes, conversations, etc.
    // 2. Optionally delete the linked fingerprint
    // 3. Clean up any project-specific data
    
    await ctx.db.delete(projectId);
    
    return { success: true, projectId };
  },
});

/**
 * Archive/unarchive project
 * Used by: Project organization
 * Note: This would require adding an 'archived' field to the schema
 */
export const toggleArchive = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    archived: v.boolean(),
  },
  handler: async (ctx, { projectId, userId, archived }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }
    
    // Note: This assumes an 'archived' field exists in the schema
    // You would need to add: archived: v.optional(v.boolean()) to the schema
    
    await ctx.db.patch(projectId, {
      // archived, // Uncomment when schema is updated
      updatedAt: Date.now(),
    });
    
    return { success: true, projectId, archived };
  },
});
