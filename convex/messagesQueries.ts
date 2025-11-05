/**
 * Messages Queries - Read operations for individual messages
 * 
 * DATA FLOW: Frontend components -> These queries -> Convex DB
 * Frontend uses these queries DIRECTLY (no HTTP layer)
 */

import { query, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Get all messages for a conversation
 * Used by chat UI to display conversation history
 */
export const getConversationMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
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

/**
 * Semantic search messages using pre-computed embedding (INTERNAL QUERY)
 * Most efficient pattern: Backend generates embedding, passes to this query
 * 
 * SECURITY: Requires conversationId filter to prevent cross-conversation access
 * 
 * @param conversationId - REQUIRED: Conversation to search within
 * @param queryEmbedding - Pre-computed embedding vector (768d)
 * @param limit - Maximum number of results (default 10, max 50)
 * @returns Array of relevant messages with similarity scores
 */
export const searchMessagesByEmbedding = internalQuery({
  args: {
    conversationId: v.id("conversations"),
    queryEmbedding: v.array(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const limit = args.limit && args.limit <= 50 ? args.limit : 10;

      // Get messages from conversation with embeddings
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", args.conversationId)
        )
        .collect();

      // Filter valid messages
      const validMessages = messages.filter(msg => 
        !msg.deletedAt && 
        msg.embedding && 
        Array.isArray(msg.embedding) && 
        msg.embedding.length === args.queryEmbedding.length
      );

      // Calculate cosine similarities
      const withScores = validMessages
        .map((msg) => {
          // Cosine similarity
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;

          for (let i = 0; i < args.queryEmbedding.length; i++) {
            const queryVal = args.queryEmbedding[i];
            const docVal = msg.embedding![i];

            if (typeof queryVal !== 'number' || typeof docVal !== 'number' || isNaN(queryVal) || isNaN(docVal)) {
              continue;
            }

            dotProduct += queryVal * docVal;
            normA += queryVal * queryVal;
            normB += docVal * docVal;
          }

          const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
          const similarity = isNaN(score) || !isFinite(score) ? 0 : score;

          return {
            _id: msg._id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            sequence: msg.sequence,
            similarity,
          };
        })
        .filter((result) => result.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return withScores;
    } catch (error) {
      console.error("❌ [SEARCH MESSAGES BY EMBEDDING] Error:", error);
      return [];
    }
  },
});

/**
 * Semantic search messages by natural language query (ACTION)
 * Convenience method for direct frontend use - generates embedding then searches
 * 
 * NOTE: For backend usage, prefer generating embedding in backend and calling
 * searchMessagesByEmbedding directly (more efficient, better rate limiting)
 * 
 * @param conversationId - REQUIRED: Conversation to search within
 * @param queryText - Natural language search query
 * @param limit - Maximum number of results (default 10, max 50)
 * @returns Array of relevant messages with similarity scores
 */
export const semanticSearchMessages = action({
  args: {
    conversationId: v.id("conversations"),
    queryText: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Validate query
      if (!args.queryText || args.queryText.trim().length === 0) {
        return [];
      }

      // Generate embedding for the query using Google API
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is required");
      }

      const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";
      
      const requestBody = {
        model: "models/text-embedding-004",
        content: {
          parts: [{ text: args.queryText.trim() }],
        },
        taskType: "RETRIEVAL_QUERY",
      };

      const response = await fetch(`${GOOGLE_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google API error: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      if (!data.embedding || !data.embedding.values) {
        throw new Error('Invalid embedding response structure');
      }

      const queryEmbedding = data.embedding.values;

      // Use internal query for actual search
      return await ctx.runQuery(internal.messagesQueries.searchMessagesByEmbedding, {
        conversationId: args.conversationId,
        queryEmbedding: queryEmbedding,
        limit: args.limit,
      });

    } catch (error) {
      console.error("❌ [SEMANTIC SEARCH MESSAGES] Error:", error);
      return [];
    }
  },
});

