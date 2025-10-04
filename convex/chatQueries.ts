import { query } from "./_generated/server";
import { v } from "convex/values";

export const getHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(args.limit || 20);

    return conversations;
  },
});

export const getConversation = query({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    // Use direct ID lookup for reliable conversation fetching
    const doc = await ctx.db.get(args.conversationId);

    if (!doc) {
      return null;
    }

    // Type check to ensure it's a conversation document
    if (!('userId' in doc) || !('messages' in doc)) {
      return null;
    }

    const conversation = doc as any; // Type assertion after validation

    // Verify ownership
    if (conversation.userId !== args.userId) {
      return null;
    }

    return conversation;
  },
});

export const getConversationsWithFiles = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();

    // Filter to only conversations that have messages with file attachments
    const conversationsWithFiles = conversations.filter(conv =>
      conv.messages.some((msg: any) =>
        msg.fileAttachments && msg.fileAttachments.length > 0
      )
    );

    // Calculate total file count for each conversation
    return conversationsWithFiles.map(conv => {
      const fileCount = conv.messages.reduce((total: number, msg: any) => {
        return total + (msg.fileAttachments?.length || 0);
      }, 0);

      return {
        ...conv,
        fileCount
      };
    });
  },
});

/**
 * Get all conversations connected to a specific widget
 * @param widgetId - The widget ID to filter conversations by
 * @param userId - The user ID for authorization
 */
export const getConversationsByWidgetId = query({
  args: {
    widgetId: v.union(v.string(), v.id("widgets")),
    userId: v.string(),
  },
  handler: async (ctx, { widgetId, userId }) => {
    try {
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user_widget", (q) =>
          q.eq("userId", userId).eq("widgetId", widgetId)
        )
        .order("desc")
        .collect();

      return conversations;
    } catch (error) {
      console.error('Error fetching conversations by widgetId:', error);
      return [];
    }
  },
});

/**
 * Get all conversations connected to a specific project
 * @param projectId - The project ID to filter conversations by
 * @param userId - The user ID for authorization
 */
export const getConversationsByProjectId = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    try {
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user_project", (q) =>
          q.eq("userId", userId).eq("projectId", projectId)
        )
        .order("desc")
        .collect();

      return conversations;
    } catch (error) {
      console.error('Error fetching conversations by projectId:', error);
      return [];
    }
  },
});

