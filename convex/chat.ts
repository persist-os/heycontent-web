import { query, mutation } from "./_generated/server";
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