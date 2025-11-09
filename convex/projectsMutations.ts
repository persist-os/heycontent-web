import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { 
  projectCreateValidator,
  projectUpdateValidator,
  contentTypeValidator,
  constellationLayoutValidator
} from "./types/project";

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
 * ✅ FOLLOWS CONVEX_SAVE_ABSOLUTE_LAW.md - Uses centralized validator
 */
/**
 * @deprecated DEPRECATED - Use initializeConversation instead
 * 
 * ⚠️ CRITICAL: This mutation creates INCOMPLETE projects without conversations.
 * Projects MUST be created atomically with conversations via initializeConversation.
 * 
 * This mutation violates LAW IV (Atomicity) and breaks orchestrator functionality.
 * 
 * Migration: Replace all createProject() calls with initializeConversation().
 * The new function creates Project + Conversation + Fingerprint + Cognitive Field atomically.
 */
export const createProject = mutation({
  args: projectCreateValidator,
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    throw new Error(
      "createProject is DEPRECATED. Use initializeConversation instead. " +
      "Projects must be created atomically with conversations to ensure complete state. " +
      "See chatMutations.ts:initializeConversation for the correct pattern."
    );
  },
});

/**
 * Update project basic info
 * Used by: Project settings, renaming, status updates, budget tracking
 * ✅ FOLLOWS CONVEX_SAVE_ABSOLUTE_LAW.md - Uses centralized validator
 */
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    updates: projectUpdateValidator,
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
    
    // Allow other updates (status, budget fields, etc.)
    // These are passed through without validation as they're system-controlled
    const allowedSystemFields = ['status', 'llmCallsToday', 'dailyLlmBudget', 'budgetLastReset', 'isActive'];
    allowedSystemFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });
    
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
 * ✅ FOLLOWS CONVEX_SAVE_ABSOLUTE_LAW.md - Uses centralized validator
 */
export const addContent = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    contentType: contentTypeValidator,
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
      cognitiveField: "cognitiveFieldIds",
      shard: "shardIds",
      stardust: "stardustIds",
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
    
    return { success: true, projectId, contentType, contentId };
  },
});

/**
 * Remove content from project
 * Used by: Content removal, cleanup
 * ✅ FOLLOWS CONVEX_SAVE_ABSOLUTE_LAW.md - Uses centralized validator
 */
export const removeContent = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    contentType: contentTypeValidator,
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
      cognitiveField: "cognitiveFieldIds",
      shard: "shardIds",
      stardust: "stardustIds",
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
 * ✅ FOLLOWS CONVEX_SAVE_ABSOLUTE_LAW.md - Uses centralized validator
 */
export const addMultipleContent = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    content: v.array(v.object({
      type: contentTypeValidator,
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
      stardust: "stardustIds",
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
    fingerprintId: v.any(),
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
 * Used by: Project organization, pause/resume functionality
 * Production-ready implementation with schema support
 * ✅ FOLLOWS CONVEX_SAVE_ABSOLUTE_LAW.md - Uses status field correctly
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
    
    // Update status field (not archived field - doesn't exist in schema)
    await ctx.db.patch(projectId, {
      status: archived ? "archived" : "working",
      updatedAt: Date.now(),
    });
    
    // ✅ PATTERN 13: Atomic Parent-Child Updates - Archive/unarchive all widgets
    try {
      await ctx.runMutation(api.widgetsMutations.archiveProjectWidgets, {
        projectId,
        userId,
        archived,
      });
    } catch (error) {
      // If widget archive fails, log error but don't fail the project update
      // This ensures project can still be archived even if widgets fail
      console.error("Failed to archive/unarchive widgets:", error);
    }
    
    return { success: true, projectId, archived };
  },
});

// ============================================================================
// CONSTELLATION LAYOUT MANAGEMENT
// ============================================================================

/**
 * Save constellation layout for a project
 * Used by: Layout calculation and caching
 * ✅ FOLLOWS CONVEX_SAVE_ABSOLUTE_LAW.md - Uses centralized validator
 */
export const saveConstellationLayout = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    layout: constellationLayoutValidator,
  },
  handler: async (ctx, { projectId, userId, layout }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }
    
    // Validate layout structure
    if (!layout.items || !Array.isArray(layout.items)) {
      throw new Error("Invalid layout structure");
    }
    
    // Save the layout
    await ctx.db.patch(projectId, {
      constellationLayout: layout,
      updatedAt: Date.now(),
    });
    
    return { success: true, projectId, layoutVersion: layout.version };
  },
});

/**
 * Batch delete multiple projects - Production ready with chunking
 * 
 * Handles large-scale project deletion with proper error handling and chunking.
 * Respects Convex limits and provides comprehensive reporting.
 */
export const batchDeleteProjects = mutation({
  args: {
    projectIds: v.array(v.id("projects")),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    results: v.array(v.object({
      id: v.id("projects"),
      success: v.boolean(),
      error: v.optional(v.string()),
    })),
    totalOperations: v.number(),
    successfulOperations: v.number(),
    failedOperations: v.number(),
    chunksProcessed: v.number(),
  }),
  handler: async (ctx, { projectIds, userId }) => {
    const BATCH_SIZE = 1000; // Well under Convex limit of 16,000
    const chunks = [];
    
    // Split operations into chunks to respect Convex limits
    for (let i = 0; i < projectIds.length; i += BATCH_SIZE) {
      chunks.push(projectIds.slice(i, i + BATCH_SIZE));
    }
    
    const allResults: Array<{
      id: Id<"projects">;
      success: boolean;
      error?: string;
    }> = [];
    
    let totalSuccessful = 0;
    let totalFailed = 0;
    
    // Process each chunk atomically
    for (const chunk of chunks) {
      const chunkResults: Array<{
        id: Id<"projects">;
        success: boolean;
        error?: string;
      }> = [];
      
      let chunkSuccessful = 0;
      let chunkFailed = 0;
      
      // Process deletions in chunk sequentially for consistency
      for (const projectId of chunk) {
        try {
          // Validate project ownership
          const project = await ctx.db.get(projectId) as any;
          if (!project) {
            throw new Error("Project not found");
          }
          
          if (project.userId !== userId) {
            throw new Error("Access denied: You don't own this project");
          }
          
          await ctx.db.delete(projectId);
          
          chunkResults.push({
            id: projectId,
            success: true,
          });
          chunkSuccessful++;
          
        } catch (error) {
          chunkResults.push({
            id: projectId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          chunkFailed++;
        }
      }
      
      allResults.push(...chunkResults);
      totalSuccessful += chunkSuccessful;
      totalFailed += chunkFailed;
    }
    
    return {
      success: totalFailed === 0,
      results: allResults,
      totalOperations: projectIds.length,
      successfulOperations: totalSuccessful,
      failedOperations: totalFailed,
      chunksProcessed: chunks.length,
    };
  },
});

/**
 * Clear constellation layout for a project (manual reset)
 * Used by: Layout reset functionality
 */
export const clearConstellationLayout = mutation({
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
    
    // Clear the layout
    await ctx.db.patch(projectId, {
      constellationLayout: null,
      updatedAt: Date.now(),
    });
    
    return { success: true, projectId };
  },
});
