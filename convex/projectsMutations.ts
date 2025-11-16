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
    // Validate project access (owner or editor)
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Check permission using helper
    const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
      userId,
      contentType: "project",
      contentId: projectId,
    });
    
    if (!permission || (permission !== "owner" && permission !== "editor")) {
      throw new Error("Access denied: You don't have permission to edit this project");
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
    // Validate project access (owner or editor)
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Check permission using helper
    const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
      userId,
      contentType: "project",
      contentId: projectId,
    });
    
    if (!permission || (permission !== "owner" && permission !== "editor")) {
      throw new Error("Access denied: You don't have permission to edit this project");
    }
    
    // Map content type to field
    const fieldMap = {
      note: "noteIds",
      conversation: "conversationIds",
      crystal: "crystalIds",
      cognitiveField: "cognitiveFieldIds",
      shard: "shardIds",
      stardust: "stardustIds",
      artifact: "artifactIds",
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
    // Validate project access (owner or editor)
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Check permission using helper
    const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
      userId,
      contentType: "project",
      contentId: projectId,
    });
    
    if (!permission || (permission !== "owner" && permission !== "editor")) {
      throw new Error("Access denied: You don't have permission to edit this project");
    }
    
    // Map content type to field
    const fieldMap = {
      note: "noteIds",
      conversation: "conversationIds",
      crystal: "crystalIds",
      cognitiveField: "cognitiveFieldIds",
      shard: "shardIds",
      stardust: "stardustIds",
      artifact: "artifactIds",
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
      artifact: "artifactIds",
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
// COLLABORATOR MANAGEMENT
// ============================================================================

/**
 * Add a collaborator to a project
 * Used by: Project sharing UI
 * Pattern: Copy from noteSharing.ts:shareNote
 */
export const addProjectCollaborator = mutation({
  args: {
    projectId: v.id("projects"),
    invitedByUserId: v.string(),
    invitedEmail: v.string(),
    role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    collaborator: v.optional(v.object({
      userId: v.string(),
      name: v.string(),
      email: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    // Get the project to verify ownership or edit permission
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return {
        success: false,
        message: "Project not found",
      };
    }

    // Check if the inviter has permission to add collaborators
    const isOwner = project.userId === args.invitedByUserId;
    const isEditor = project.collaborators?.some(
      c => c.userId === args.invitedByUserId && c.role === "editor"
    );
    
    if (!isOwner && !isEditor) {
      return {
        success: false,
        message: "You don't have permission to add collaborators",
      };
    }

    // Find the user to invite by email
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.invitedEmail))
      .unique();

    if (!targetUser) {
      return {
        success: false,
        message: "User not found with that email address",
      };
    }

    // Don't allow inviting yourself
    if (targetUser.userId === args.invitedByUserId) {
      return {
        success: false,
        message: "You cannot invite yourself as a collaborator",
      };
    }

    // Check if already a collaborator
    const existingCollaborator = project.collaborators?.find(
      c => c.userId === targetUser.userId
    );

    if (existingCollaborator) {
      // Update existing collaborator role
      const updatedCollaborators = project.collaborators!.map(c =>
        c.userId === targetUser.userId 
          ? { ...c, role: args.role, addedAt: Date.now(), addedBy: args.invitedByUserId }
          : c
      );
      
      await ctx.db.patch(args.projectId, {
        collaborators: updatedCollaborators,
        updatedAt: Date.now(),
      });
      
      return {
        success: true,
        message: `Updated ${targetUser.name}'s role to ${args.role}`,
        collaborator: {
          userId: targetUser.userId,
          name: targetUser.name,
          email: targetUser.email,
        },
      };
    }

    // Add new collaborator (Pattern 13: Atomic update with updatedAt)
    const newCollaborator = {
      userId: targetUser.userId,
      role: args.role,
      addedAt: Date.now(),
      addedBy: args.invitedByUserId,
    };
    
    await ctx.db.patch(args.projectId, {
      collaborators: [...(project.collaborators || []), newCollaborator],
      updatedAt: Date.now(),
    });
    
    return {
      success: true,
      message: `Added ${targetUser.name} as ${args.role}`,
      collaborator: {
        userId: targetUser.userId,
        name: targetUser.name,
        email: targetUser.email,
      },
    };
  },
});

/**
 * Remove a collaborator from a project
 * Used by: Project sharing UI
 * Pattern: Only owner can remove
 */
export const removeProjectCollaborator = mutation({
  args: {
    projectId: v.id("projects"),
    removedByUserId: v.string(),
    collaboratorUserId: v.string(),
  },
  returns: v.object({ 
    success: v.boolean(), 
    message: v.string() 
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return { 
        success: false, 
        message: "Project not found" 
      };
    }
    
    // Only owner can remove collaborators
    if (project.userId !== args.removedByUserId) {
      return { 
        success: false, 
        message: "Only project owner can remove collaborators" 
      };
    }
    
    // Filter out the collaborator (Pattern 13: Atomic update with updatedAt)
    const updatedCollaborators = (project.collaborators || []).filter(
      c => c.userId !== args.collaboratorUserId
    );
    
    await ctx.db.patch(args.projectId, {
      collaborators: updatedCollaborators,
      updatedAt: Date.now(),
    });
    
    return { 
      success: true, 
      message: "Collaborator removed" 
    };
  },
});

// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================

/**
 * Delete project and cleanup - Production-ready cascade deletion
 * Used by: Project deletion
 * 
 * Implements atomic cascade deletion following Gold Standard pattern from deleteUserAndData.
 * Deletes all related entities in proper dependency order:
 * Phase 1: Messages, Conversation Summaries, Artifacts, Widgets, Project Widgets
 * Phase 2: Cognitive Fields, Assignment Fingerprints, Conversations
 * Phase 3: Project (deleted LAST)
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
    
    const summary: Record<string, any> = { errors: [] };
    const BATCH_SIZE = 50;
    
    // Helper for batch deletion with resilient error handling (Gold Standard pattern)
    async function batchDelete(table: string, getQuery: () => Promise<any[]>) {
      let deleted = 0;
      const errors: any[] = [];
      try {
        let hasMore = true;
        while (hasMore) {
          const items = await getQuery();
          if (!items || items.length === 0) break;
          for (const item of items) {
            try {
              await ctx.db.delete(item._id);
              deleted++;
            } catch (err) {
              errors.push({ id: item._id, error: String(err) });
            }
          }
          hasMore = items.length === BATCH_SIZE;
        }
        summary[table] = { deleted, errors };
        if (errors.length > 0) summary.errors.push({ table, errors });
      } catch (err) {
        // Table or index might not exist - log but continue
        summary[table] = { deleted, errors: [{ table, error: String(err) }] };
        summary.errors.push({ table, error: String(err) });
      }
    }
    
    // Phase 1: Leaf Nodes (No Dependencies)
    // 1. Delete widgets FIRST (each widget has its own conversation, cognitive field, fingerprint)
    // This ensures widget-specific entities are deleted before project-level entities
    const projectWidgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    
    const widgetConversationIds = new Set<string>();
    for (const widget of projectWidgets) {
      // Delete widget with cascade (will delete its conversation, cognitive field, fingerprint)
      const widgetDeleteResult = await ctx.runMutation(api.widgetsMutations.deleteWidget, {
        widgetId: widget._id,
        userId: userId,
        hardDelete: true,
      });
      
      // Track widget conversations to avoid double-deletion
      const conversationId = (widget as any).conversationId;
      if (conversationId) {
        widgetConversationIds.add(conversationId);
      }
    }
    
    // 2. Delete messages via remaining conversations (excluding widget conversations already deleted)
    const projectConversations = await ctx.db
      .query("conversations")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    
    for (const conversation of projectConversations) {
      // Skip conversations already deleted by widget cascade
      if (widgetConversationIds.has(conversation._id)) continue;
      
      await batchDelete("messages", () =>
        ctx.db.query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .take(BATCH_SIZE)
      );
    }
    
    // 3. Delete conversation summaries (by projectId)
    await batchDelete("conversation_summaries", () =>
      ctx.db.query("conversation_summaries")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .take(BATCH_SIZE)
    );
    
    // 4. Delete artifacts (by projectId) - widget artifacts already deleted by widget cascade
    await batchDelete("artifacts", () =>
      ctx.db.query("artifacts")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .take(BATCH_SIZE)
    );
    
    // 5. Delete project widgets (by projectId)
    await batchDelete("project_widgets", () =>
      ctx.db.query("project_widgets")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .take(BATCH_SIZE)
    );
    
    // Phase 2: Parent Nodes (Depend on Phase 1)
    // 6. Delete cognitive fields (by projectId) - widget cognitive fields already deleted by widget cascade
    // Filter out widget conversations to avoid double-deletion
    await batchDelete("cognitive_fields", async () => {
      const allFields = await ctx.db
        .query("cognitive_fields")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .take(BATCH_SIZE);
      // Filter out cognitive fields linked to widget conversations (already deleted)
      return allFields.filter((field: any) => 
        !field.conversationId || !widgetConversationIds.has(field.conversationId)
      );
    });
    
    // 7. Delete assignment fingerprints (by projectId) - widget fingerprints already deleted by widget cascade
    // Only delete project-level fingerprints (not widget-specific ones)
    await batchDelete("assignment_fingerprints", async () => {
      const allFingerprints = await ctx.db
        .query("assignment_fingerprints")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .take(BATCH_SIZE);
      // Filter out fingerprints linked to widget conversations (already deleted)
      return allFingerprints.filter((fp: any) => 
        !fp.conversationId || !widgetConversationIds.has(fp.conversationId)
      );
    });
    
    // 8. Delete remaining conversations (by projectId) - widget conversations already deleted by widget cascade
    await batchDelete("conversations", async () => {
      const allConversations = await ctx.db
        .query("conversations")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .take(BATCH_SIZE);
      // Filter out widget conversations (already deleted)
      return allConversations.filter((conv: any) => 
        !widgetConversationIds.has(conv._id)
      );
    });
    
    // Phase 3: Root Node
    // 9. Delete the project record LAST
    try {
      await ctx.db.delete(projectId);
      summary["projects"] = { deleted: 1, errors: [] };
    } catch (err) {
      summary["projects"] = { deleted: 0, errors: [{ id: projectId, error: String(err) }] };
      summary.errors.push({ table: "projects", errors: [{ id: projectId, error: String(err) }] });
    }
    
    return { success: summary.errors.length === 0, summary };
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
          // Use deleteProject mutation for proper cascade deletion
          // This ensures all related entities (conversations, cognitive fields, fingerprints, widgets, artifacts, messages) are deleted
          const result = await ctx.runMutation(api.projectsMutations.deleteProject, {
            projectId,
            userId,
          });
          
          if (result.success) {
            chunkResults.push({
              id: projectId,
              success: true,
            });
            chunkSuccessful++;
          } else {
            // Cascade deletion had errors but may have partially succeeded
            const errorMsg = result.summary?.errors?.length > 0
              ? `Cascade deletion had errors: ${JSON.stringify(result.summary.errors)}`
              : "Cascade deletion failed";
            chunkResults.push({
              id: projectId,
              success: false,
              error: errorMsg,
            });
            chunkFailed++;
          }
          
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

