/**
 * Messages Mutations - Individual message management
 * 
 * MIGRATION STRATEGY: Dual-write system
 * - New messages are written to BOTH messages table AND conversations.messages array
 * - After migration complete, we'll remove the array writes
 * 
 * DATA FLOW: Backend -> http.ts -> These mutations -> Convex DB
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Add a single message to a conversation (dual-write during migration)
 * Writes to BOTH new messages table AND legacy messages array
 */
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    timestamp: v.number(),
    context: v.optional(v.string()),
    fileAttachments: v.optional(v.array(v.object({
      file_url: v.string(),
      original_filename: v.string(),
      content_type: v.string(),
      file_size: v.number(),
      gcs_url: v.string(),
      uploaded_at: v.string(),
    }))),
    enrichment_metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== args.userId) {
      throw new Error("Conversation not found or access denied");
    }

    const now = Date.now();
    const sequence = conversation.messageCount || 0;

    // 1. Write to NEW messages table
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId: args.userId,
      content: args.content,
      role: args.role,
      sequence,
      timestamp: args.timestamp,
      context: args.context,
      fileAttachments: args.fileAttachments,
      enrichment_metadata: args.enrichment_metadata,
      createdAt: now,
      updatedAt: now,
    });

    // 2. DUAL-WRITE: Also update legacy messages array (during migration)
    const legacyMessage = {
      content: args.content,
      role: args.role,
      timestamp: args.timestamp,
      context: args.context,
      fileAttachments: args.fileAttachments,
      enrichment_metadata: args.enrichment_metadata,
    };

    await ctx.db.patch(args.conversationId, {
      messages: [...(conversation.messages || []), legacyMessage],
      messageCount: sequence + 1,
      lastMessageAt: args.timestamp,
      updatedAt: now,
    });

    // 3. Track intelligence activity (only for user messages)
    if (args.role === "user") {
      await ctx.runMutation(api.intelligenceMutations.incrementActivity, {
        userId: args.userId,
        activity_type: "chat",
      });
    }

    return messageId;
  },
});

/**
 * Get all messages for a conversation (from new messages table)
 * Ordered by sequence for guaranteed correct ordering
 */
export const getConversationMessages = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user has access to conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== args.userId) {
      throw new Error("Conversation not found or access denied");
    }

    // Fetch messages from new table
    const query = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc");  // Ascending order by sequence

    const messages = args.limit 
      ? await query.take(args.limit)
      : await query.collect();

    return messages;
  },
});

/**
 * Get recent messages for a conversation (pagination support)
 */
export const getRecentMessages = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== args.userId) {
      throw new Error("Conversation not found or access denied");
    }

    // Get most recent messages (descending order)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(args.limit);

    // Return in ascending order (oldest first)
    return messages.reverse();
  },
});

/**
 * Get messages by role (useful for analytics)
 */
export const getMessagesByRole = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== args.userId) {
      throw new Error("Conversation not found or access denied");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_role", (q) => 
        q.eq("conversationId", args.conversationId).eq("role", args.role)
      )
      .collect();

    return messages;
  },
});

/**
 * Update message metadata (e.g., enrichment_metadata after MAB feedback)
 * NOTE: Content updates not supported - messages are immutable
 */
export const updateMessageMetadata = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    enrichment_metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message || message.userId !== args.userId) {
      throw new Error("Message not found or access denied");
    }

    await ctx.db.patch(args.messageId, {
      enrichment_metadata: args.enrichment_metadata,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Soft delete a message (sets deletedAt timestamp)
 * Does NOT cascade delete from conversation
 */
export const softDeleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message || message.userId !== args.userId) {
      throw new Error("Message not found or access denied");
    }

    await ctx.db.patch(args.messageId, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

