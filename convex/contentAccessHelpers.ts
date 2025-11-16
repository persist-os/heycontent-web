import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Content Access Helper Functions
 * 
 * These utilities provide unified permission checking for both notes and projects,
 * handling ownership validation and shared access through the shared_content and friendships tables.
 */

/**
 * Validates if a user has access to specific content (note or project)
 * 
 * @param userId - The user requesting access
 * @param contentType - Type of content ("note" or "project")
 * @param contentId - ID of the content to check
 * @returns boolean indicating if user has access
 */
export const validateContentAccess = query({
  args: {
    userId: v.string(),
    contentType: v.union(v.literal("note"), v.literal("project")),
    contentId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { userId, contentType, contentId } = args;

    try {
      if (contentType === "note") {
        // Check note ownership
        const note = await ctx.db.get(contentId as Id<"notes">);
        if (!note) return false;
        
        // User owns the note
        if (note.userId === userId) return true;

        // Check if note is shared with user via shared_notes table
        const shareRecord = await ctx.db
          .query("shared_notes")
          .withIndex("by_note_user", (q) => 
            q.eq("noteId", contentId as Id<"notes">).eq("sharedWithUserId", userId)
          )
          .filter((q) => q.eq(q.field("isActive"), true))
          .unique();

        return !!shareRecord;

      } else if (contentType === "project") {
        // Check project ownership
        const project = await ctx.db.get(contentId as Id<"projects">);
        if (!project) return false;
        
        // User owns the project
        if (project.userId === userId) return true;

        // Check if user is a collaborator
        const isCollaborator = project.collaborators?.some(
          c => c.userId === userId
        );
        if (isCollaborator) return true;

        // Check if project is shared with user via shared_content table (legacy)
        const shareRecord = await ctx.db
          .query("shared_content")
          .withIndex("by_content_user", (q) => 
            q.eq("contentId", contentId).eq("sharedWithUserId", userId)
          )
          .filter((q) => q.eq(q.field("contentType"), "project"))
          .filter((q) => q.eq(q.field("isActive"), true))
          .unique();

        return !!shareRecord;
      }

      return false;
    } catch (error) {
      console.error("Error validating content access:", error);
      return false;
    }
  },
});

/**
 * Gets the user's permission level for specific content
 * 
 * @param userId - The user requesting permission info
 * @param contentType - Type of content ("note" or "project")
 * @param contentId - ID of the content to check
 * @returns Permission level: 'owner' | 'edit' | 'read' | null
 */
export const getUserContentPermission = query({
  args: {
    userId: v.string(),
    contentType: v.union(v.literal("note"), v.literal("project")),
    contentId: v.string(),
  },
  returns: v.union(
    v.literal("owner"),
    v.literal("edit"),
    v.literal("read"),
    v.null()
  ),
  handler: async (ctx, args) => {
    const { userId, contentType, contentId } = args;

    try {
      if (contentType === "note") {
        // Check note ownership
        const note = await ctx.db.get(contentId as Id<"notes">);
        if (!note) return null;
        
        // User owns the note
        if (note.userId === userId) return "owner";

        // Check shared access via shared_notes table
        const shareRecord = await ctx.db
          .query("shared_notes")
          .withIndex("by_note_user", (q) => 
            q.eq("noteId", contentId as Id<"notes">).eq("sharedWithUserId", userId)
          )
          .filter((q) => q.eq(q.field("isActive"), true))
          .unique();

        if (shareRecord) {
          return shareRecord.permission; // "read" or "edit"
        }

      } else if (contentType === "project") {
        // Check project ownership
        const project = await ctx.db.get(contentId as Id<"projects">);
        if (!project) return null;
        
        // ✅ FIX: Normalize userId for consistent comparison
        const normalizedUserId = userId?.trim() || userId;
        const normalizedProjectUserId = project.userId?.trim() || project.userId;
        
        // User owns the project
        if (normalizedProjectUserId === normalizedUserId) return "owner";

        // Check if user is a collaborator
        const collaborator = project.collaborators?.find(
          c => (c.userId?.trim() || c.userId) === normalizedUserId
        );
        if (collaborator) {
          // Map collaborator roles to permission format: editor -> edit, viewer -> read
          if (collaborator.role === "owner") return "owner";
          if (collaborator.role === "editor") return "edit";
          if (collaborator.role === "viewer") return "read";
        }

        // Check shared access via shared_content table (legacy)
        const shareRecord = await ctx.db
          .query("shared_content")
          .withIndex("by_content_user", (q) => 
            q.eq("contentId", contentId).eq("sharedWithUserId", userId)
          )
          .filter((q) => q.eq(q.field("contentType"), "project"))
          .filter((q) => q.eq(q.field("isActive"), true))
          .unique();

        if (shareRecord) {
          return shareRecord.permission; // "read" or "edit"
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting user content permission:", error);
      return null;
    }
  },
});

/**
 * Enriches content arrays with sharing metadata for display purposes
 * 
 * @param contentArray - Array of content items (notes or projects)
 * @param userId - The user viewing the content
 * @param contentType - Type of content ("note" or "project")
 * @returns Array of content items enriched with sharing information
 */
export const enrichContentWithSharingInfo = internalQuery({
  args: {
    contentArray: v.array(v.any()),
    userId: v.string(),
    contentType: v.union(v.literal("note"), v.literal("project")),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const { contentArray, userId, contentType } = args;

    try {
      const enrichedContent = await Promise.all(
        contentArray.map(async (item) => {
          const contentId = item._id;
          
          // Determine if user owns this content
          const isOwner = item.userId === userId;
          
          // Get sharing information
          const sharingInfo: {
            isOwner: boolean;
            permission: "owner" | "read" | "edit" | null;
            sharedWith: Array<{
              userId: string;
              permission: "read" | "edit";
              sharedAt: number;
              sharedBy: string;
            }>;
            sharedBy: string | null;
            sharedAt: number | null;
          } = {
            isOwner,
            permission: isOwner ? "owner" : null,
            sharedWith: [],
            sharedBy: null,
            sharedAt: null,
          };

          if (contentType === "note") {
            if (isOwner) {
              // Get users this note is shared with
              const shares = await ctx.db
                .query("shared_notes")
                .withIndex("by_note", (q) => q.eq("noteId", contentId))
                .filter((q) => q.eq(q.field("isActive"), true))
                .collect();

              sharingInfo.sharedWith = shares.map(share => ({
                userId: share.sharedWithUserId,
                permission: share.permission,
                sharedAt: share.sharedAt,
                sharedBy: share.sharedBy,
              }));
            } else {
              // This is a shared note, get sharing details
              const shareRecord = await ctx.db
                .query("shared_notes")
                .withIndex("by_note_user", (q) => 
                  q.eq("noteId", contentId).eq("sharedWithUserId", userId)
                )
                .filter((q) => q.eq(q.field("isActive"), true))
                .unique();

              if (shareRecord) {
                sharingInfo.permission = shareRecord.permission;
                sharingInfo.sharedBy = shareRecord.sharedBy;
                sharingInfo.sharedAt = shareRecord.sharedAt;
              }
            }

          } else if (contentType === "project") {
            if (isOwner) {
              // Get users this project is shared with
              const shares = await ctx.db
                .query("shared_content")
                .withIndex("by_contentId", (q) => q.eq("contentId", contentId))
                .filter((q) => q.eq(q.field("contentType"), "project"))
                .filter((q) => q.eq(q.field("isActive"), true))
                .collect();

              sharingInfo.sharedWith = shares.map(share => ({
                userId: share.sharedWithUserId,
                permission: share.permission,
                sharedAt: share.sharedAt,
                sharedBy: share.sharedBy,
              }));
            } else {
              // This is a shared project, get sharing details
              const shareRecord = await ctx.db
                .query("shared_content")
                .withIndex("by_content_user", (q) => 
                  q.eq("contentId", contentId).eq("sharedWithUserId", userId)
                )
                .filter((q) => q.eq(q.field("contentType"), "project"))
                .filter((q) => q.eq(q.field("isActive"), true))
                .unique();

              if (shareRecord) {
                sharingInfo.permission = shareRecord.permission;
                sharingInfo.sharedBy = shareRecord.sharedBy;
                sharingInfo.sharedAt = shareRecord.sharedAt;
              }
            }
          }

          // Return enriched item with sharing metadata
          return {
            ...item,
            sharing: sharingInfo,
          };
        })
      );

      return enrichedContent;
    } catch (error) {
      console.error("Error enriching content with sharing info:", error);
      return contentArray; // Return original array on error
    }
  },
});

/**
 * Public query wrapper for validateContentAccess
 * Allows external calls to check content access
 */
export const checkContentAccess = query({
  args: {
    userId: v.string(),
    contentType: v.union(v.literal("note"), v.literal("project")),
    contentId: v.string(),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    permission: v.union(
      v.literal("owner"),
      v.literal("edit"),
      v.literal("read"),
      v.null()
    ),
  }),
  handler: async (ctx, args) => {
    try {
      const hasAccess = await ctx.runQuery(api.contentAccessHelpers.validateContentAccess, args);
      const permission = hasAccess 
        ? await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, args)
        : null;

      return {
        hasAccess,
        permission,
      };
    } catch (error) {
      console.error("Error checking content access:", error);
      return {
        hasAccess: false,
        permission: null,
      };
    }
  },
});

/**
 * Helper function to check if two users are friends
 * Used internally by sharing functions to validate friendship-based sharing
 */
export const checkFriendship = internalQuery({
  args: {
    userId1: v.string(),
    userId2: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { userId1, userId2 } = args;

    try {
      // Check both directions of friendship
      const friendship = await ctx.db
        .query("friendships")
        .withIndex("by_user_pair", (q) => q.eq("userId1", userId1).eq("userId2", userId2))
        .filter((q) => q.eq(q.field("status"), "accepted"))
        .unique();

      if (friendship) return true;

      // Check reverse direction
      const reverseFriendship = await ctx.db
        .query("friendships")
        .withIndex("by_user_pair", (q) => q.eq("userId1", userId2).eq("userId2", userId1))
        .filter((q) => q.eq(q.field("status"), "accepted"))
        .unique();

      return !!reverseFriendship;
    } catch (error) {
      console.error("Error checking friendship:", error);
      return false;
    }
  },
});

/**
 * Get all content shared with a user (both notes and projects)
 */
export const getSharedContentForUser = query({
  args: {
    userId: v.string(),
    contentType: v.optional(v.union(v.literal("note"), v.literal("project"))),
  },
  returns: v.array(v.object({
    contentId: v.string(),
    contentType: v.union(v.literal("note"), v.literal("project")),
    permission: v.union(v.literal("read"), v.literal("edit")),
    sharedBy: v.string(),
    sharedAt: v.number(),
    ownerId: v.string(),
  })),
  handler: async (ctx, args) => {
    const { userId, contentType } = args;

    try {
      const sharedContent = [];

      // Get shared notes if requested or no specific type
      if (!contentType || contentType === "note") {
        const sharedNotes = await ctx.db
          .query("shared_notes")
          .withIndex("by_shared_user", (q) => q.eq("sharedWithUserId", userId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

        sharedContent.push(...sharedNotes.map(share => ({
          contentId: share.noteId,
          contentType: "note" as const,
          permission: share.permission,
          sharedBy: share.sharedBy,
          sharedAt: share.sharedAt,
          ownerId: share.ownerId,
        })));
      }

      // Get shared projects if requested or no specific type
      if (!contentType || contentType === "project") {
        const sharedProjects = await ctx.db
          .query("shared_content")
          .withIndex("by_sharedWithUserId", (q) => q.eq("sharedWithUserId", userId))
          .filter((q) => q.eq(q.field("contentType"), "project"))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

        sharedContent.push(...sharedProjects.map(share => ({
          contentId: share.contentId,
          contentType: "project" as const,
          permission: share.permission,
          sharedBy: share.sharedBy,
          sharedAt: share.sharedAt,
          ownerId: share.ownerId,
        })));
      }

      // Sort by shared date (most recent first)
      return sharedContent.sort((a, b) => b.sharedAt - a.sharedAt);
    } catch (error) {
      console.error("Error getting shared content for user:", error);
      return [];
    }
  },
});
