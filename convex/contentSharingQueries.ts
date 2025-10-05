import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Universal content sharing system supporting notes, projects, widgets, and conversations
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
  v.literal("owner"),
  v.literal("read"),
  v.literal("edit")
);

/**
 * Get all content shared with a user (notes, projects, widgets, conversations)
 */
export const getSharedWithMe = query({
  args: {
    userId: v.string(),
    contentType: v.optional(contentTypeValidator),
  },
  returns: v.array(v.object({
    _id: v.string(),
    contentType: contentTypeValidator,
    contentId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    ownerId: v.string(),
    ownerName: v.string(),
    ownerEmail: v.string(),
    permission: v.union(v.literal("read"), v.literal("edit")),
    sharedAt: v.number(),
    sharedBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Note-specific fields
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
    tags: v.optional(v.array(v.string())),
    important: v.optional(v.boolean()),
    // Project-specific fields
    noteIds: v.optional(v.array(v.string())),
    conversationIds: v.optional(v.array(v.string())),
    crystalIds: v.optional(v.array(v.string())),
    shardIds: v.optional(v.array(v.string())),
    // Widget-specific fields
    widgetType: v.optional(v.string()),
    category: v.optional(v.string()),
    projectId: v.optional(v.string()),
    // Conversation-specific fields
    messageCount: v.optional(v.number()),
    lastMessageAt: v.optional(v.number()),
    starred: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    const sharedContent = [];

    // Get shared notes from legacy shared_notes table
    if (!args.contentType || args.contentType === "note") {
      const sharedNotes = await ctx.db
        .query("shared_notes")
        .withIndex("by_shared_user", (q) => q.eq("sharedWithUserId", args.userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      for (const share of sharedNotes) {
        const note = await ctx.db.get(share.noteId);
        if (!note) continue;

        const owner = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userId"), share.ownerId))
          .unique();

        if (!owner) continue;

        sharedContent.push({
          _id: share._id,
          contentType: "note" as const,
          contentId: note._id,
          title: note.title,
          description: undefined,
          content: note.content,
          ownerId: share.ownerId,
          ownerName: owner.name,
          ownerEmail: owner.email,
          permission: share.permission,
          sharedAt: share.sharedAt,
          sharedBy: share.sharedBy,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          type: note.type,
          tags: note.tags,
          important: note.important,
          noteIds: undefined,
          conversationIds: undefined,
          crystalIds: undefined,
          shardIds: undefined,
          widgetType: undefined,
          category: undefined,
          projectId: undefined,
          messageCount: undefined,
          lastMessageAt: undefined,
          starred: undefined,
        });
      }
    }

    // Get shared content from unified shared_content table
    const sharedContentQuery = ctx.db
      .query("shared_content")
      .withIndex("by_sharedWithUserId", (q) => q.eq("sharedWithUserId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true));

    const sharedContentRecords = args.contentType 
      ? await sharedContentQuery.filter((q) => q.eq(q.field("contentType"), args.contentType)).collect()
      : await sharedContentQuery.collect();

    for (const share of sharedContentRecords) {
      const owner = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), share.ownerId))
        .unique();

      if (!owner) continue;

      if (share.contentType === "note") {
        const note = await ctx.db.get(share.contentId as Id<"notes">);
        if (!note) continue;

        sharedContent.push({
          _id: share._id,
          contentType: "note" as const,
          contentId: share.contentId,
          title: note.title,
          description: undefined,
          content: note.content,
          ownerId: share.ownerId,
          ownerName: owner.name,
          ownerEmail: owner.email,
          permission: share.permission,
          sharedAt: share.sharedAt,
          sharedBy: share.sharedBy,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          type: note.type,
          tags: note.tags,
          important: note.important,
          noteIds: undefined,
          conversationIds: undefined,
          crystalIds: undefined,
          shardIds: undefined,
          widgetType: undefined,
          category: undefined,
          projectId: undefined,
          messageCount: undefined,
          lastMessageAt: undefined,
          starred: undefined,
        });
      } else if (share.contentType === "project") {
        const project = await ctx.db.get(share.contentId as Id<"projects">);
        if (!project) continue;

        sharedContent.push({
          _id: share._id,
          contentType: "project" as const,
          contentId: share.contentId,
          title: project.name,
          description: project.description,
          content: undefined,
          ownerId: share.ownerId,
          ownerName: owner.name,
          ownerEmail: owner.email,
          permission: share.permission,
          sharedAt: share.sharedAt,
          sharedBy: share.sharedBy,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          type: undefined,
          tags: undefined,
          important: undefined,
          noteIds: project.noteIds,
          conversationIds: project.conversationIds,
          crystalIds: project.crystalIds,
          shardIds: project.shardIds,
          widgetType: undefined,
          category: undefined,
          projectId: undefined,
          messageCount: undefined,
          lastMessageAt: undefined,
          starred: undefined,
        });
      } else if (share.contentType === "widget") {
        const widget = await ctx.db.get(share.contentId as Id<"widgets">);
        if (!widget) continue;

        sharedContent.push({
          _id: share._id,
          contentType: "widget" as const,
          contentId: share.contentId,
          title: widget.title,
          description: widget.description,
          content: undefined,
          ownerId: share.ownerId,
          ownerName: owner.name,
          ownerEmail: owner.email,
          permission: share.permission,
          sharedAt: share.sharedAt,
          sharedBy: share.sharedBy,
          createdAt: widget.createdAt,
          updatedAt: widget.updatedAt,
          type: undefined,
          tags: undefined,
          important: undefined,
          noteIds: undefined,
          conversationIds: undefined,
          crystalIds: undefined,
          shardIds: undefined,
          widgetType: widget.widget_type,
          category: widget.category,
          projectId: widget.projectId,
          messageCount: undefined,
          lastMessageAt: undefined,
          starred: undefined,
        });
      } else if (share.contentType === "conversation") {
        const conversation = await ctx.db.get(share.contentId as Id<"conversations">);
        if (!conversation) continue;

        sharedContent.push({
          _id: share._id,
          contentType: "conversation" as const,
          contentId: share.contentId,
          title: conversation.title,
          description: undefined,
          content: undefined,
          ownerId: share.ownerId,
          ownerName: owner.name,
          ownerEmail: owner.email,
          permission: share.permission,
          sharedAt: share.sharedAt,
          sharedBy: share.sharedBy,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          type: undefined,
          tags: undefined,
          important: undefined,
          noteIds: undefined,
          conversationIds: undefined,
          crystalIds: undefined,
          shardIds: undefined,
          widgetType: undefined,
          category: undefined,
          projectId: conversation.projectId,
          messageCount: conversation.messageCount,
          lastMessageAt: conversation.lastMessageAt,
          starred: conversation.starred,
        });
      }
    }

    // Sort by sharedAt timestamp (most recent first)
    return sharedContent.sort((a, b) => b.sharedAt - a.sharedAt);
  },
});

/**
 * Get all users who have access to specific content
 */
export const getContentSharedUsers = query({
  args: {
    userId: v.string(),
    contentType: contentTypeValidator,
    contentId: v.string(),
  },
  returns: v.array(v.object({
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    permission: v.union(v.literal("read"), v.literal("edit")),
    sharedAt: v.number(),
    sharedBy: v.string(),
    sharedByName: v.string(),
  })),
  handler: async (ctx, args) => {
    // First verify the requesting user has access to this content
    const hasAccess = await checkUserContentAccess(ctx, args.userId, args.contentType, args.contentId);
    if (!hasAccess.hasAccess) {
      return [];
    }

    const sharedUsers = [];

    // Check legacy shared_notes table for notes
    if (args.contentType === "note") {
      const legacyShares = await ctx.db
        .query("shared_notes")
        .withIndex("by_note", (q) => q.eq("noteId", args.contentId as Id<"notes">))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      for (const share of legacyShares) {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userId"), share.sharedWithUserId))
          .unique();

        const sharedByUser = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userId"), share.sharedBy))
          .unique();

        if (user && sharedByUser) {
          sharedUsers.push({
            userId: share.sharedWithUserId,
            name: user.name,
            email: user.email,
            permission: share.permission,
            sharedAt: share.sharedAt,
            sharedBy: share.sharedBy,
            sharedByName: sharedByUser.name,
          });
        }
      }
    }

    // Check unified shared_content table
    const shares = await ctx.db
      .query("shared_content")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .filter((q) => q.eq(q.field("contentType"), args.contentType))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const share of shares) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), share.sharedWithUserId))
        .unique();

      const sharedByUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), share.sharedBy))
        .unique();

      if (user && sharedByUser) {
        // Avoid duplicates from legacy table
        const existingUser = sharedUsers.find(u => u.userId === share.sharedWithUserId);
        if (!existingUser) {
          sharedUsers.push({
            userId: share.sharedWithUserId,
            name: user.name,
            email: user.email,
            permission: share.permission,
            sharedAt: share.sharedAt,
            sharedBy: share.sharedBy,
            sharedByName: sharedByUser.name,
          });
        }
      }
    }

    return sharedUsers.sort((a, b) => b.sharedAt - a.sharedAt);
  },
});

/**
 * Get all content that a user has shared with others
 */
export const getMySharedContent = query({
  args: {
    userId: v.string(),
    contentType: v.optional(contentTypeValidator),
  },
  returns: v.array(v.object({
    _id: v.string(),
    contentType: contentTypeValidator,
    contentId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    sharedWithCount: v.number(),
    sharedUsers: v.array(v.object({
      userId: v.string(),
      name: v.string(),
      email: v.string(),
      permission: v.union(v.literal("read"), v.literal("edit")),
      sharedAt: v.number(),
    })),
    // Note-specific fields
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
    tags: v.optional(v.array(v.string())),
    important: v.optional(v.boolean()),
    // Project-specific fields
    noteIds: v.optional(v.array(v.string())),
    conversationIds: v.optional(v.array(v.string())),
    crystalIds: v.optional(v.array(v.string())),
    shardIds: v.optional(v.array(v.string())),
    // Widget-specific fields
    widgetType: v.optional(v.string()),
    category: v.optional(v.string()),
    projectId: v.optional(v.string()),
    // Conversation-specific fields
    messageCount: v.optional(v.number()),
    lastMessageAt: v.optional(v.number()),
    starred: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    const sharedContentMap = new Map();

    // Get shared notes from legacy shared_notes table
    if (!args.contentType || args.contentType === "note") {
      const sharedNotes = await ctx.db
        .query("shared_notes")
        .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      for (const share of sharedNotes) {
        const note = await ctx.db.get(share.noteId);
        if (!note) continue;

        const key = `note:${share.noteId}`;
        if (!sharedContentMap.has(key)) {
          sharedContentMap.set(key, {
            _id: share.noteId,
            contentType: "note" as const,
            contentId: share.noteId,
            title: note.title,
            description: undefined,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            sharedWithCount: 0,
            sharedUsers: [],
            type: note.type,
            tags: note.tags,
            important: note.important,
            noteIds: undefined,
            conversationIds: undefined,
            crystalIds: undefined,
            shardIds: undefined,
            widgetType: undefined,
            category: undefined,
            projectId: undefined,
            messageCount: undefined,
            lastMessageAt: undefined,
            starred: undefined,
          });
        }

        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userId"), share.sharedWithUserId))
          .unique();

        if (user) {
          const contentItem = sharedContentMap.get(key);
          contentItem.sharedUsers.push({
            userId: share.sharedWithUserId,
            name: user.name,
            email: user.email,
            permission: share.permission,
            sharedAt: share.sharedAt,
          });
          contentItem.sharedWithCount++;
        }
      }
    }

    // Get shared content from unified shared_content table
    const sharedContentQuery = ctx.db
      .query("shared_content")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true));

    const sharedContentRecords = args.contentType 
      ? await sharedContentQuery.filter((q) => q.eq(q.field("contentType"), args.contentType)).collect()
      : await sharedContentQuery.collect();

    for (const share of sharedContentRecords) {
      const key = `${share.contentType}:${share.contentId}`;
      
      if (!sharedContentMap.has(key)) {
        if (share.contentType === "note") {
          const note = await ctx.db.get(share.contentId as Id<"notes">);
          if (!note) continue;

          sharedContentMap.set(key, {
            _id: share.contentId,
            contentType: "note" as const,
            contentId: share.contentId,
            title: note.title,
            description: undefined,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            sharedWithCount: 0,
            sharedUsers: [],
            type: note.type,
            tags: note.tags,
            important: note.important,
            noteIds: undefined,
            conversationIds: undefined,
            crystalIds: undefined,
            shardIds: undefined,
            widgetType: undefined,
            category: undefined,
            projectId: undefined,
            messageCount: undefined,
            lastMessageAt: undefined,
            starred: undefined,
          });
        } else if (share.contentType === "project") {
          const project = await ctx.db.get(share.contentId as Id<"projects">);
          if (!project) continue;

          sharedContentMap.set(key, {
            _id: share.contentId,
            contentType: "project" as const,
            contentId: share.contentId,
            title: project.name,
            description: project.description,
            content: undefined,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            sharedWithCount: 0,
            sharedUsers: [],
            type: undefined,
            tags: undefined,
            important: undefined,
            noteIds: project.noteIds,
            conversationIds: project.conversationIds,
            crystalIds: project.crystalIds,
            shardIds: project.shardIds,
            widgetType: undefined,
            category: undefined,
            projectId: undefined,
            messageCount: undefined,
            lastMessageAt: undefined,
            starred: undefined,
          });
        } else if (share.contentType === "widget") {
          const widget = await ctx.db.get(share.contentId as Id<"widgets">);
          if (!widget) continue;

          sharedContentMap.set(key, {
            _id: share.contentId,
            contentType: "widget" as const,
            contentId: share.contentId,
            title: widget.title,
            description: widget.description,
            content: undefined,
            createdAt: widget.createdAt,
            updatedAt: widget.updatedAt,
            sharedWithCount: 0,
            sharedUsers: [],
            type: undefined,
            tags: undefined,
            important: undefined,
            noteIds: undefined,
            conversationIds: undefined,
            crystalIds: undefined,
            shardIds: undefined,
            widgetType: widget.widget_type,
            category: widget.category,
            projectId: widget.projectId,
            messageCount: undefined,
            lastMessageAt: undefined,
            starred: undefined,
          });
        } else if (share.contentType === "conversation") {
          const conversation = await ctx.db.get(share.contentId as Id<"conversations">);
          if (!conversation) continue;

          sharedContentMap.set(key, {
            _id: share.contentId,
            contentType: "conversation" as const,
            contentId: share.contentId,
            title: conversation.title,
            description: undefined,
            content: undefined,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            sharedWithCount: 0,
            sharedUsers: [],
            type: undefined,
            tags: undefined,
            important: undefined,
            noteIds: undefined,
            conversationIds: undefined,
            crystalIds: undefined,
            shardIds: undefined,
            widgetType: undefined,
            category: undefined,
            projectId: conversation.projectId,
            messageCount: conversation.messageCount,
            lastMessageAt: conversation.lastMessageAt,
            starred: conversation.starred,
          });
        }
      }

      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), share.sharedWithUserId))
        .unique();

      if (user) {
        const contentItem = sharedContentMap.get(key);
        if (contentItem) {
          // Avoid duplicates from legacy table
          const existingUser = contentItem.sharedUsers.find((u: any) => u.userId === share.sharedWithUserId);
          if (!existingUser) {
            contentItem.sharedUsers.push({
              userId: share.sharedWithUserId,
              name: user.name,
              email: user.email,
              permission: share.permission,
              sharedAt: share.sharedAt,
            });
            contentItem.sharedWithCount++;
          }
        }
      }
    }

    // Convert map to array and sort by most recently updated
    const result = Array.from(sharedContentMap.values());
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Check if a user has access to specific content and return permission level
 */
export const checkContentAccess = query({
  args: {
    userId: v.string(),
    contentType: contentTypeValidator,
    contentId: v.string(),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    permission: v.optional(permissionValidator),
    isOwner: v.boolean(),
  }),
  handler: async (ctx, args) => {
    return await checkUserContentAccess(ctx, args.userId, args.contentType, args.contentId);
  },
});

/**
 * Helper function to check if a user has access to content
 */
async function checkUserContentAccess(
  ctx: any,
  userId: string,
  contentType: "note" | "project" | "widget" | "conversation",
  contentId: string
): Promise<{
  hasAccess: boolean;
  permission?: "owner" | "read" | "edit";
  isOwner: boolean;
}> {
  // Check if user owns the content
  if (contentType === "note") {
    const note = await ctx.db.get(contentId as Id<"notes">);
    if (note?.userId === userId) {
      return {
        hasAccess: true,
        permission: "owner" as const,
        isOwner: true,
      };
    }

    // Check legacy shared_notes table
    const legacyShare = await ctx.db
      .query("shared_notes")
      .withIndex("by_note_user", (q) => 
        q.eq("noteId", contentId as Id<"notes">).eq("sharedWithUserId", userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    if (legacyShare) {
      return {
        hasAccess: true,
        permission: legacyShare.permission,
        isOwner: false,
      };
    }
  } else if (contentType === "project") {
    const project = await ctx.db.get(contentId as Id<"projects">);
    if (project?.userId === userId) {
      return {
        hasAccess: true,
        permission: "owner" as const,
        isOwner: true,
      };
    }
  } else if (contentType === "widget") {
    const widget = await ctx.db.get(contentId as Id<"widgets">);
    if (widget?.userId === userId) {
      return {
        hasAccess: true,
        permission: "owner" as const,
        isOwner: true,
      };
    }
  } else if (contentType === "conversation") {
    const conversation = await ctx.db.get(contentId as Id<"conversations">);
    if (conversation?.userId === userId) {
      return {
        hasAccess: true,
        permission: "owner" as const,
        isOwner: true,
      };
    }
  }

  // Check unified shared_content table
  const share = await ctx.db
    .query("shared_content")
    .withIndex("by_content_user", (q) => 
      q.eq("contentId", contentId).eq("sharedWithUserId", userId)
    )
    .filter((q) => q.eq(q.field("contentType"), contentType))
    .filter((q) => q.eq(q.field("isActive"), true))
    .unique();

  if (share) {
    return {
      hasAccess: true,
      permission: share.permission,
      isOwner: false,
    };
  }

  return {
    hasAccess: false,
    isOwner: false,
  };
}
