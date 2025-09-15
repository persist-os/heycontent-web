import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Share a note with another user
 */
export const shareNote = mutation({
  args: {
    noteId: v.id("notes"),
    sharedWithEmail: v.string(),
    permission: v.union(v.literal("read"), v.literal("edit")),
    sharedBy: v.string(), // userId of person sharing
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
    // Get the note to verify ownership or edit permission
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      return {
        success: false,
        message: "Note not found",
      };
    }

    // Check if the sharer has permission to share this note
    const canShare = note.userId === args.sharedBy || 
      await hasEditPermission(ctx, args.noteId, args.sharedBy);
    
    if (!canShare) {
      return {
        success: false,
        message: "You don't have permission to share this note",
      };
    }

    // Find the user to share with by email
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.sharedWithEmail))
      .unique();

    if (!targetUser) {
      return {
        success: false,
        message: "User not found with that email address",
      };
    }

    // Don't allow sharing with yourself
    if (targetUser.userId === args.sharedBy) {
      return {
        success: false,
        message: "You cannot share a note with yourself",
      };
    }

    // Check if already shared with this user
    const existingShare = await ctx.db
      .query("shared_notes")
      .withIndex("by_note_user", (q) => 
        q.eq("noteId", args.noteId).eq("sharedWithUserId", targetUser.userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    if (existingShare) {
      // Update existing share permission
      await ctx.db.patch(existingShare._id, {
        permission: args.permission,
        sharedAt: Date.now(),
        sharedBy: args.sharedBy,
      });
      
      return {
        success: true,
        message: `Updated sharing permissions for ${targetUser.name}`,
        sharedWithUser: {
          _id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
        },
      };
    }

    // Create new share record
    await ctx.db.insert("shared_notes", {
      noteId: args.noteId,
      ownerId: note.userId,
      sharedWithUserId: targetUser.userId,
      permission: args.permission,
      sharedAt: Date.now(),
      sharedBy: args.sharedBy,
      isActive: true,
    });

    return {
      success: true,
      message: `Note shared with ${targetUser.name}`,
      sharedWithUser: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
      },
    };
  },
});

/**
 * Revoke note access for a user
 */
export const revokeNoteAccess = mutation({
  args: {
    noteId: v.id("notes"),
    revokedUserId: v.string(),
    revokedBy: v.string(), // userId of person revoking
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the note to verify ownership
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      return {
        success: false,
        message: "Note not found",
      };
    }

    // Only the owner can revoke access
    if (note.userId !== args.revokedBy) {
      return {
        success: false,
        message: "Only the note owner can revoke access",
      };
    }

    // Find the share record
    const shareRecord = await ctx.db
      .query("shared_notes")
      .withIndex("by_note_user", (q) => 
        q.eq("noteId", args.noteId).eq("sharedWithUserId", args.revokedUserId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    if (!shareRecord) {
      return {
        success: false,
        message: "No active share found for this user",
      };
    }

    // Soft delete the share record
    await ctx.db.patch(shareRecord._id, {
      isActive: false,
    });

    return {
      success: true,
      message: "Access revoked successfully",
    };
  },
});

/**
 * Get all users who have access to a note
 */
export const getNoteSharedUsers = query({
  args: {
    noteId: v.id("notes"),
    requestingUserId: v.string(),
  },
  returns: v.array(v.object({
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    permission: v.union(v.literal("read"), v.literal("edit")),
    sharedAt: v.number(),
    sharedBy: v.string(),
  })),
  handler: async (ctx, args) => {
    // Verify the requesting user has access to this note
    const hasAccess = await hasNoteAccess(ctx, args.noteId, args.requestingUserId);
    if (!hasAccess) {
      return [];
    }

    // Get all active shares for this note
    const shares = await ctx.db
      .query("shared_notes")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get user details for each share
    const sharedUsers = await Promise.all(
      shares.map(async (share) => {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userId"), share.sharedWithUserId))
          .unique();
        
        return {
          userId: share.sharedWithUserId,
          name: user?.name || "Unknown User",
          email: user?.email || "Unknown Email",
          permission: share.permission,
          sharedAt: share.sharedAt,
          sharedBy: share.sharedBy,
        };
      })
    );

    return sharedUsers;
  },
});

/**
 * Get all notes shared with a user
 */
export const getSharedNotes = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("notes"),
    title: v.string(),
    content: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("idea_bank"),
      v.literal("content_script"),
      v.literal("collaboration_note"),
      v.literal("analytics_insight"),
      v.literal("reflection_journal"),
      v.literal("task_checklist"),
      v.literal("email_draft"),
      v.literal("idea")
    )),
    tags: v.array(v.string()),
    important: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
    ownerId: v.string(),
    ownerName: v.string(),
    permission: v.union(v.literal("read"), v.literal("edit")),
    sharedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    // Get all active shares for this user
    const shares = await ctx.db
      .query("shared_notes")
      .withIndex("by_shared_user", (q) => q.eq("sharedWithUserId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get note details for each share
    const sharedNotes = await Promise.all(
      shares.map(async (share) => {
        const note = await ctx.db.get(share.noteId);
        if (!note) return null;

        // Get owner details
        const owner = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userId"), share.ownerId))
          .unique();

        return {
          _id: note._id,
          title: note.title,
          content: note.content,
          type: note.type,
          tags: note.tags,
          important: note.important,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          ownerId: share.ownerId,
          ownerName: owner?.name || "Unknown User",
          permission: share.permission,
          sharedAt: share.sharedAt,
        };
      })
    );

    // Filter out null values and return
    return sharedNotes.filter((note) => note !== null);
  },
});

/**
 * Share a note with a friend using their userId (for friend list sharing)
 */
export const shareNoteWithFriend = mutation({
  args: {
    noteId: v.id("notes"),
    friendUserId: v.string(),
    permission: v.union(v.literal("read"), v.literal("edit")),
    sharedBy: v.string(), // userId of person sharing
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
    // Get the note to verify ownership or edit permission
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      return {
        success: false,
        message: "Note not found",
      };
    }

    // Check if the sharer has permission to share this note
    const canShare = note.userId === args.sharedBy || 
      await hasEditPermission(ctx, args.noteId, args.sharedBy);
    
    if (!canShare) {
      return {
        success: false,
        message: "You don't have permission to share this note",
      };
    }

    // Find the friend user by userId
    const friendUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.friendUserId))
      .unique();

    if (!friendUser) {
      return {
        success: false,
        message: "Friend not found",
      };
    }

    // Don't allow sharing with yourself
    if (friendUser.userId === args.sharedBy) {
      return {
        success: false,
        message: "You cannot share a note with yourself",
      };
    }

    // Verify they are friends
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_userId1", (q) => q.eq("userId1", args.sharedBy))
      .filter((q) => q.and(
        q.eq(q.field("userId2"), args.friendUserId),
        q.eq(q.field("status"), "accepted")
      ))
      .first();

    const reverseFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_userId1", (q) => q.eq("userId1", args.friendUserId))
      .filter((q) => q.and(
        q.eq(q.field("userId2"), args.sharedBy),
        q.eq(q.field("status"), "accepted")
      ))
      .first();

    if (!friendship && !reverseFriendship) {
      return {
        success: false,
        message: "You can only share notes with friends",
      };
    }

    // Check if already shared with this user
    const existingShare = await ctx.db
      .query("shared_notes")
      .withIndex("by_note_user", (q) => 
        q.eq("noteId", args.noteId).eq("sharedWithUserId", friendUser.userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    if (existingShare) {
      // Update existing share permission
      await ctx.db.patch(existingShare._id, {
        permission: args.permission,
        sharedAt: Date.now(),
        sharedBy: args.sharedBy,
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

    // Create new share record
    await ctx.db.insert("shared_notes", {
      noteId: args.noteId,
      ownerId: note.userId,
      sharedWithUserId: friendUser.userId,
      permission: args.permission,
      sharedAt: Date.now(),
      sharedBy: args.sharedBy,
      isActive: true,
    });

    return {
      success: true,
      message: `Note shared with ${friendUser.name}`,
      sharedWithUser: {
        _id: friendUser._id,
        name: friendUser.name,
        email: friendUser.email,
      },
    };
  },
});

/**
 * Helper function to check if a user has access to a note
 */
async function hasNoteAccess(ctx: any, noteId: Id<"notes">, userId: string): Promise<boolean> {
  // Check if user owns the note
  const note = await ctx.db.get(noteId);
  if (note?.userId === userId) {
    return true;
  }

  // Check if note is shared with user
  const shareRecord = await ctx.db
    .query("shared_notes")
    .withIndex("by_note_user", (q) => 
      q.eq("noteId", noteId).eq("sharedWithUserId", userId)
    )
    .filter((q) => q.eq(q.field("isActive"), true))
    .unique();

  return !!shareRecord;
}

/**
 * Helper function to check if a user has edit permission for a note
 */
async function hasEditPermission(ctx: any, noteId: Id<"notes">, userId: string): Promise<boolean> {
  // Check if user owns the note
  const note = await ctx.db.get(noteId);
  if (note?.userId === userId) {
    return true;
  }

  // Check if note is shared with edit permission
  const shareRecord = await ctx.db
    .query("shared_notes")
    .withIndex("by_note_user", (q) => 
      q.eq("noteId", noteId).eq("sharedWithUserId", userId)
    )
    .filter((q) => q.eq(q.field("isActive"), true))
    .unique();

  return shareRecord?.permission === "edit";
}

/**
 * Check if user can access a specific note (used by other queries/mutations)
 */
export const checkNoteAccess = query({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    permission: v.optional(v.union(v.literal("owner"), v.literal("read"), v.literal("edit"))),
  }),
  handler: async (ctx, args) => {
    // Check if user owns the note
    const note = await ctx.db.get(args.noteId);
    if (note?.userId === args.userId) {
      return {
        hasAccess: true,
        permission: "owner" as const,
      };
    }

    // Check if note is shared with user
    const shareRecord = await ctx.db
      .query("shared_notes")
      .withIndex("by_note_user", (q) => 
        q.eq("noteId", args.noteId).eq("sharedWithUserId", args.userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    if (shareRecord) {
      return {
        hasAccess: true,
        permission: shareRecord.permission,
      };
    }

    return {
      hasAccess: false,
    };
  },
});
