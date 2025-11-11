/**
 * Messages Queries - Read operations for individual messages
 * 
 * DATA FLOW: Frontend components -> These queries -> Convex DB
 * Frontend uses these queries DIRECTLY (no HTTP layer)
 * ✅ FIX BLOCKER 3: All queries check conversation/project access
 */

import { query, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

/**
 * Get all messages for a conversation
 * Used by chat UI to display conversation history
 * ✅ FIX BLOCKER 3: Checks conversation/project access
 */
export const getConversationMessages = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get conversation to check access
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    
    // ✅ FIX BLOCKER 3: Check ownership or project collaborator access
    const isOwner = conversation.userId === args.userId;
    if (!isOwner && conversation.projectId) {
      const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
        userId: args.userId,
        contentType: "project",
        contentId: conversation.projectId,
      });
      if (!permission) {
        throw new Error("Access denied: You don't have permission to view this conversation");
      }
    } else if (!isOwner) {
      throw new Error("Access denied: You don't have permission to view this conversation");
    }
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    // Filter out soft-deleted messages
    return messages.filter(msg => !msg.deletedAt);
  },
});

/**
 * Get paginated messages for a conversation
 * Supports infinite scroll or load-more patterns
 */
export const getPaginatedMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.number(),
    beforeSequence: v.optional(v.number()),  // For pagination
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId));

    // If beforeSequence provided, get messages before that sequence
    if (args.beforeSequence !== undefined) {
      const messages = await query.collect();
      const filtered = messages.filter(m => m.sequence < args.beforeSequence!);
      return filtered.slice(-args.limit);  // Get last N messages before sequence
    }

    // Otherwise get most recent messages
    const messages = await query
      .order("desc")
      .take(args.limit);

    return messages.reverse();  // Return in ascending order
  },
});

/**
 * Get message count for a conversation
 * Used for UI display and analytics
 */
export const getMessageCount = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    return conversation?.messageCount || 0;
  },
});

/**
 * Get messages with file attachments
 * Used for "Files" view or file browser
 */
export const getMessagesWithAttachments = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    return messages.filter(msg => 
      msg.fileAttachments && msg.fileAttachments.length > 0 && !msg.deletedAt
    );
  },
});

/**
 * Get user's recent messages across all conversations
 * Used for user activity timeline or analytics
 */
export const getUserRecentMessages = query({
  args: {
    userId: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit);

    return messages.filter(msg => !msg.deletedAt);
  },
});

/**
 * Check if conversation has been migrated
 * Used during migration to determine which data source to use
 */
export const isConversationMigrated = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    return conversation?.migrated || false;
  },
});

/**
 * Get recent family activity messages for activity feed
 * Includes family_question and family_update messages
 */
export const getRecentFamilyUpdates = query({
  args: {
    userId: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit * 2);  // Get more to filter

    // Filter for family messages only
    const familyMessages = messages.filter(msg => 
      !msg.deletedAt && 
      (msg.contentType === "family_question" || msg.contentType === "family_update")
    );

    return familyMessages.slice(0, args.limit);
  },
});

