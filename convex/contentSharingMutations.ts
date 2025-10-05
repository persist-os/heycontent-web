import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Universal content sharing mutations for notes, projects, widgets, and conversations
 * No deprecated social media fields - uses crystal system for content insights
 */

// Content type validator for reuse
const contentTypeValidator = v.union(
  v.literal("note"),
  v.literal("project"),
  v.literal("widget"),
  v.literal("conversation")
);

// Permission validator for reuse
const permissionValidator = v.union(
  v.literal("read"),
  v.literal("edit")
);

/**
 * Share content (notes, projects, widgets, or conversations) with another user
 */
export const shareContent = mutation({
  args: {
    userId: v.string(),
    contentType: contentTypeValidator,
    contentId: v.string(),
    friendUserId: v.string(),
    permission: permissionValidator,
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
        .withIndex("by_user_pair", (q) => 
          q.eq("userId1", userId < friendUserId ? userId : friendUserId)
           .eq("userId2", userId < friendUserId ? friendUserId : userId)
        )
        .filter((q) => q.eq(q.field("status"), "accepted"))
        .unique();

      if (!friendship) {
        return {
          success: false,
          message: "You can only share content with friends. Please send a friend request first.",
        };
      }

      // Get friend user details
      const friendUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), friendUserId))
        .unique();

      if (!friendUser) {
        return {
          success: false,
          message: "Friend user not found",
        };
      }

      // Verify ownership and get owner ID
      let content: any;
      let ownerId: string;

      if (contentType === "note") {
        // For notes, check both ownership and edit permission
        content = await ctx.db.get(contentId as Id<"notes">);
        if (!content) {
          return {
            success: false,
            message: "Note not found",
          };
        }

        const canShare = content.userId === userId || await hasEditPermission(ctx, contentId as Id<"notes">, userId);
        if (!canShare) {
          return {
            success: false,
            message: "You don't have permission to share this note",
          };
        }

        ownerId = content.userId;

        // Check if already shared with this user via shared_notes
        const existingShare = await ctx.db
          .query("shared_notes")
          .withIndex("by_note_user", (q) => 
            q.eq("noteId", contentId as Id<"notes">).eq("sharedWithUserId", friendUserId)
          )
          .filter((q) => q.eq(q.field("isActive"), true))
          .unique();

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

        // Create new share record in shared_notes (legacy table)
        await ctx.db.insert("shared_notes", {
          noteId: contentId as Id<"notes">,
          ownerId: ownerId,
          sharedWithUserId: friendUserId,
          permission: permission,
          sharedAt: Date.now(),
          sharedBy: userId,
          isActive: true,
        });

      } else if (contentType === "project") {
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

        ownerId = content.userId;

      } else if (contentType === "widget") {
        content = await ctx.db.get(contentId as Id<"widgets">);
        if (!content) {
          return {
            success: false,
            message: "Widget not found",
          };
        }

        // Only widget owner can share widgets
        if (content.userId !== userId) {
          return {
            success: false,
            message: "You don't have permission to share this widget",
          };
        }

        ownerId = content.userId;

      } else if (contentType === "conversation") {
        content = await ctx.db.get(contentId as Id<"conversations">);
        if (!content) {
          return {
            success: false,
            message: "Conversation not found",
          };
        }

        // Only conversation owner can share conversations
        if (content.userId !== userId) {
          return {
            success: false,
            message: "You don't have permission to share this conversation",
          };
        }

        ownerId = content.userId;
      } else {
        return {
          success: false,
          message: "Invalid content type",
        };
      }

      // For all content types except notes (which use legacy table), use shared_content
      if (contentType !== "note") {
        // Check if already shared with this user via shared_content
        const existingShare = await ctx.db
          .query("shared_content")
          .withIndex("by_content_user", (q) => 
            q.eq("contentId", contentId).eq("sharedWithUserId", friendUserId)
          )
          .filter((q) => q.and(
            q.eq(q.field("contentType"), contentType),
            q.eq(q.field("isActive"), true)
          ))
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
          contentType: contentType,
          contentId: contentId,
          ownerId: ownerId,
          sharedWithUserId: friendUserId,
          permission: permission,
          sharedBy: userId,
          sharedAt: Date.now(),
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      const contentTypeLabel = contentType.charAt(0).toUpperCase() + contentType.slice(1);
      return {
        success: true,
        message: `${contentTypeLabel} shared with ${friendUser.name}`,
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
    contentType: contentTypeValidator,
    contentId: v.string(),
    targetUserId: v.string(),
    newPermission: permissionValidator,
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Verify the user is the owner
      const hasOwnership = await verifyOwnership(ctx, args.userId, args.contentType, args.contentId);
      if (!hasOwnership) {
        return {
          success: false,
          message: "You don't have permission to update sharing permissions",
        };
      }

      // Update permission based on content type
      if (args.contentType === "note") {
        const share = await ctx.db
          .query("shared_notes")
          .withIndex("by_note_user", (q) => 
            q.eq("noteId", args.contentId as Id<"notes">).eq("sharedWithUserId", args.targetUserId)
          )
          .filter((q) => q.eq(q.field("isActive"), true))
          .unique();

        if (!share) {
          return {
            success: false,
            message: "Share not found",
          };
        }

        await ctx.db.patch(share._id, {
          permission: args.newPermission,
          updatedAt: Date.now(),
        });
      } else {
        const share = await ctx.db
          .query("shared_content")
          .withIndex("by_content_user", (q) => 
            q.eq("contentId", args.contentId).eq("sharedWithUserId", args.targetUserId)
          )
          .filter((q) => q.and(
            q.eq(q.field("contentType"), args.contentType),
            q.eq(q.field("isActive"), true)
          ))
          .unique();

        if (!share) {
          return {
            success: false,
            message: "Share not found",
          };
        }

        await ctx.db.patch(share._id, {
          permission: args.newPermission,
          updatedAt: Date.now(),
        });
      }

      return {
        success: true,
        message: "Permission updated successfully",
      };
    } catch (error) {
      console.error("Error updating permission:", error);
      return {
        success: false,
        message: "Failed to update permission",
      };
    }
  },
});

/**
 * Revoke access to shared content
 */
export const revokeContentAccess = mutation({
  args: {
    userId: v.string(),
    contentType: contentTypeValidator,
    contentId: v.string(),
    targetUserId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Verify the user is the owner
      const hasOwnership = await verifyOwnership(ctx, args.userId, args.contentType, args.contentId);
      if (!hasOwnership) {
        return {
          success: false,
          message: "You don't have permission to revoke access",
        };
      }

      // Revoke access based on content type
      if (args.contentType === "note") {
        const share = await ctx.db
          .query("shared_notes")
          .withIndex("by_note_user", (q) => 
            q.eq("noteId", args.contentId as Id<"notes">).eq("sharedWithUserId", args.targetUserId)
          )
          .filter((q) => q.eq(q.field("isActive"), true))
          .unique();

        if (!share) {
          return {
            success: false,
            message: "Share not found",
          };
        }

        await ctx.db.patch(share._id, {
          isActive: false,
        });
      } else {
        const share = await ctx.db
          .query("shared_content")
          .withIndex("by_content_user", (q) => 
            q.eq("contentId", args.contentId).eq("sharedWithUserId", args.targetUserId)
          )
          .filter((q) => q.and(
            q.eq(q.field("contentType"), args.contentType),
            q.eq(q.field("isActive"), true)
          ))
          .unique();

        if (!share) {
          return {
            success: false,
            message: "Share not found",
          };
        }

        await ctx.db.patch(share._id, {
          isActive: false,
          updatedAt: Date.now(),
        });
      }

      return {
        success: true,
        message: "Access revoked successfully",
      };
    } catch (error) {
      console.error("Error revoking access:", error);
      return {
        success: false,
        message: "Failed to revoke access",
      };
    }
  },
});

/**
 * Helper: Check if user has edit permission for a note
 */
async function hasEditPermission(ctx: any, noteId: Id<"notes">, userId: string): Promise<boolean> {
  const share = await ctx.db
    .query("shared_notes")
    .withIndex("by_note_user", (q) => 
      q.eq("noteId", noteId).eq("sharedWithUserId", userId)
    )
    .filter((q) => q.eq(q.field("isActive"), true))
    .unique();

  if (share && share.permission === "edit") {
    return true;
  }

  // Also check shared_content table
  const contentShare = await ctx.db
    .query("shared_content")
    .withIndex("by_content_user", (q) => 
      q.eq("contentId", noteId).eq("sharedWithUserId", userId)
    )
    .filter((q) => q.and(
      q.eq(q.field("contentType"), "note"),
      q.eq(q.field("isActive"), true)
    ))
    .unique();

  return contentShare?.permission === "edit";
}

/**
 * Helper: Verify ownership of content
 */
async function verifyOwnership(
  ctx: any,
  userId: string,
  contentType: "note" | "project" | "widget" | "conversation",
  contentId: string
): Promise<boolean> {
  if (contentType === "note") {
    const note = await ctx.db.get(contentId as Id<"notes">);
    return note?.userId === userId;
  } else if (contentType === "project") {
    const project = await ctx.db.get(contentId as Id<"projects">);
    return project?.userId === userId;
  } else if (contentType === "widget") {
    const widget = await ctx.db.get(contentId as Id<"widgets">);
    return widget?.userId === userId;
  } else if (contentType === "conversation") {
    const conversation = await ctx.db.get(contentId as Id<"conversations">);
    return conversation?.userId === userId;
  }
  return false;
}
