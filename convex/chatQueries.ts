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
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Use direct ID lookup for reliable conversation fetching
    const doc = await ctx.db.get(args.conversationId as any);

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

export const getRecentConversations = query({
  args: {
    userId: v.string(),
    hours: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - (args.hours * 60 * 60 * 1000);
    
    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.gt(q.field("updatedAt"), cutoffTime)
        )
      )
      .order("desc")
      .collect();

    return conversations;
  },
});


