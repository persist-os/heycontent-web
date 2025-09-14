import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Share content (notes or projects) with another user
 */
export const shareContent = mutation({
  args: {
    userId: v.string(),
    contentType: v.union(v.literal("note"), v.literal("project")),
    contentId: v.string(),
    friendUserId: v.string(),
    permission: v.union(v.literal("read"), v.literal("edit")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    sharedWithUser: v.optional(v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    const { userId, contentType, contentId, friendUserId, permission } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      return {
        success: false,
        message: "User ID is required",
      };
    }

    if (!contentId || contentId.trim() === '') {
      return {
        success: false,
        message: "Content ID is required",
      };
    }

    if (!friendUserId || friendUserId.trim() === '') {
      return {
        success: false,
        message: "Friend user ID is required",
      };
    }

    // Don't allow sharing with yourself
    if (userId === friendUserId) {
      return {
        success: false,
        message: "You cannot share content with yourself",
      };
    }

    try {
      // Verify friendship exists
      const friendship = await ctx.db
        .query("friendships")
        .withIndex("by_userId1", (q) => q.eq("userId1", userId))
        .filter((q) => q.and(q.eq(q.field("userId2"), friendUserId), q.eq(q.field("status"), "accepted")))
        .first();

      const reverseFriendship = await ctx.db
        .query("friendships")
        .withIndex("by_userId1", (q) => q.eq("userId1", friendUserId))
        .filter((q) => q.and(q.eq(q.field("userId2"), userId), q.eq(q.field("status"), "accepted")))
        .first();

      if (!friendship && !reverseFriendship) {
        return {
          success: false,
          message: "You can only share content with friends",
        };
      }

      // Get the friend user details
      const friendUser = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", friendUserId))
        .first();

      if (!friendUser) {
        return {
          success: false,
          message: "Friend user not found",
        };
      }

      // Validate content ownership and existence
      let content = null;
      let canShare = false;

      if (contentType === "note") {
        // For notes, check ownership or existing edit permission
        content = await ctx.db.get(contentId as Id<"notes">);
        if (!content) {
          return {
            success: false,
            message: "Note not found",
          };
        }

        // Check if user owns the note
        canShare = content.userId === userId;

        // If not owner, check if user has edit permission via shared_notes
        if (!canShare) {
          const sharedNote = await ctx.db
            .query("shared_notes")
            .withIndex("by_note_user", (q) => 
              q.eq("noteId", contentId as Id<"notes">).eq("sharedWithUserId", userId)
            )
            .filter((q) => q.and(q.eq(q.field("isActive"), true), q.eq(q.field("permission"), "edit")))
            .first();
          
          canShare = !!sharedNote;
        }

        if (!canShare) {
          return {
            success: false,
            message: "You don't have permission to share this note",
          };
        }

        // Check if already shared with this user via shared_notes
        const existingShare = await ctx.db
          .query("shared_notes")
          .withIndex("by_note_user", (q) => 
            q.eq("noteId", contentId as Id<"notes">).eq("sharedWithUserId", friendUserId)
          )
          .filter((q) => q.eq(q.field("isActive"), true))
          .first();

        if (existingShare) {
          // Update existing share permission
          await ctx.db.patch(existingShare._id, {
            permission: permission,
            sharedAt: Date.now(),
            sharedBy: userId,
          });
          
          return {
            success: true,
            message: `Updated sharing permissions for ${friendUser.name}`,
            sharedWithUser: {
              _id: friendUser._id,
              name: friendUser.name,
              email: friendUser.email,
            },
          };
        }

        // Create new share record in shared_notes
        await ctx.db.insert("shared_notes", {
          noteId: contentId as Id<"notes">,
          ownerId: content.userId,
          sharedWithUserId: friendUserId,
          permission: permission,
          sharedAt: Date.now(),
          sharedBy: userId,
          isActive: true,
        });

      } else if (contentType === "project") {
        // For projects, check ownership
        content = await ctx.db.get(contentId as Id<"projects">);
        if (!content) {
          return {
            success: false,
            message: "Project not found",
          };
        }

        // Only project owner can share projects
        if (content.userId !== userId) {
          return {
            success: false,
            message: "You don't have permission to share this project",
          };
        }

        // Check if already shared with this user via shared_content
        const existingShare = await ctx.db
          .query("shared_content")
          .withIndex("by_content_user", (q) => 
            q.eq("contentId", contentId).eq("sharedWithUserId", friendUserId)
          )
          .filter((q) => q.and(q.eq(q.field("contentType"), "project"), q.eq(q.field("isActive"), true)))
          .first();

        if (existingShare) {
          // Update existing share permission
          await ctx.db.patch(existingShare._id, {
            permission: permission,
            sharedAt: Date.now(),
            sharedBy: userId,
            updatedAt: Date.now(),
          });
          
          return {
            success: true,
            message: `Updated sharing permissions for ${friendUser.name}`,
            sharedWithUser: {
              _id: friendUser._id,
              name: friendUser.name,
              email: friendUser.email,
            },
          };
        }

        // Create new share record in shared_content
        await ctx.db.insert("shared_content", {
          contentType: "project",
          contentId: contentId,
          ownerId: content.userId,
          sharedWithUserId: friendUserId,
          permission: permission,
          sharedBy: userId,
          sharedAt: Date.now(),
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      return {
        success: true,
        message: `${contentType === "note" ? "Note" : "Project"} shared with ${friendUser.name}`,
        sharedWithUser: {
          _id: friendUser._id,
          name: friendUser.name,
          email: friendUser.email,
        },
      };

    } catch (error) {
      console.error("Error sharing content:", error);
      return {
        success: false,
        message: `Failed to share ${contentType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

/**
 * Update content permission for a shared content item
 */
export const updateContentPermission = mutation({
  args: {
    userId: v.string(),
    sharedContentId: v.id("shared_content"),
    newPermission: v.union(v.literal("read"), v.literal("edit")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const { userId, sharedContentId, newPermission } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      return {
        success: false,
        message: "User ID is required",
      };
    }

    try {
      // Get the shared content record
      const sharedContent = await ctx.db.get(sharedContentId);
      if (!sharedContent) {
        return {
          success: false,
          message: "Shared content not found",
        };
      }

      if (!sharedContent.isActive) {
        return {
          success: false,
          message: "This content share is no longer active",
        };
      }

      // Verify user has permission to update (must be owner or the person who shared it)
      if (sharedContent.ownerId !== userId && sharedContent.sharedBy !== userId) {
        return {
          success: false,
          message: "You don't have permission to update this share",
        };
      }

      // Update the permission
      await ctx.db.patch(sharedContentId, {
        permission: newPermission,
        updatedAt: Date.now(),
      });

      return {
        success: true,
        message: "Permission updated successfully",
      };

    } catch (error) {
      console.error("Error updating content permission:", error);
      return {
        success: false,
        message: `Failed to update permission: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

/**
 * Revoke content access for a user
 */
export const revokeContentAccess = mutation({
  args: {
    userId: v.string(),
    sharedContentId: v.id("shared_content"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const { userId, sharedContentId } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      return {
        success: false,
        message: "User ID is required",
      };
    }

    try {
      // Get the shared content record
      const sharedContent = await ctx.db.get(sharedContentId);
      if (!sharedContent) {
        return {
          success: false,
          message: "Shared content not found",
        };
      }

      if (!sharedContent.isActive) {
        return {
          success: false,
          message: "This content share is already inactive",
        };
      }

      // Verify user has permission to revoke (must be owner)
      if (sharedContent.ownerId !== userId) {
        return {
          success: false,
          message: "Only the content owner can revoke access",
        };
      }

      // Soft delete the share record
      await ctx.db.patch(sharedContentId, {
        isActive: false,
        updatedAt: Date.now(),
      });

      // If this is a note, also handle the shared_notes table for backward compatibility
      if (sharedContent.contentType === "note") {
        const noteShare = await ctx.db
          .query("shared_notes")
          .withIndex("by_note_user", (q) => 
            q.eq("noteId", sharedContent.contentId as Id<"notes">)
             .eq("sharedWithUserId", sharedContent.sharedWithUserId)
          )
          .filter((q) => q.eq(q.field("isActive"), true))
          .first();

        if (noteShare) {
          await ctx.db.patch(noteShare._id, {
            isActive: false,
          });
        }
      }

      return {
        success: true,
        message: "Access revoked successfully",
      };

    } catch (error) {
      console.error("Error revoking content access:", error);
      return {
        success: false,
        message: `Failed to revoke access: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
