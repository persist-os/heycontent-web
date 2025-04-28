import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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
      .take(args.limit || 5);

    return conversations;
  },
});

export const createConversation = mutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
    messages: v.array(v.object({
      content: v.string(),
      role: v.string(),
      timestamp: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const conversationId = await ctx.db.insert("conversations", {
      userId: args.userId,
      title: args.title || "Untitled Chat",
      messages: args.messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      starred: false,
    });

    return conversationId;
  },
});

export const deleteConversation = mutation({
  args: {
    conversationId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the conversation and verify ownership
    const conversation = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.eq(q.field("_id"), args.conversationId) &&
        q.eq(q.field("userId"), args.userId)
      )
      .first();

    if (!conversation) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Delete the conversation
    await ctx.db.delete(conversation._id);
    return { success: true };
  },
});

export const starConversation = mutation({
  args: {
    conversationId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the conversation and verify ownership
    const conversation = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.eq(q.field("_id"), args.conversationId) &&
        q.eq(q.field("userId"), args.userId)
      )
      .first();

    if (!conversation) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Toggle the starred status
    await ctx.db.patch(conversation._id, {
      starred: !conversation.starred,
      updatedAt: Date.now(),
    });

    return { success: true, starred: !conversation.starred };
  },
});