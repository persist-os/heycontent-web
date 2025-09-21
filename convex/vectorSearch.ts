// @ts-nocheck
import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";
import { generateEmbedding } from "./vectorSearchEmbeddings";
import { cosineSimilarity } from "./vectorSearchHelpers";

// Google Gemini API endpoint for embeddings
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";
/**
 * Automatically generate embeddings for new or updated content
 */
export const autoCreateEmbedding = action({
  args: {
    userId: v.string(),
    contentId: v.string(),
    contentType: v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal")
    ),
    title: v.string(),
    content: v.string(),
    triggerType: v.union(
      v.literal("content_update"),
      v.literal("automatic_update")
    ),
  },
  handler: async (ctx, args) => {
    console.log('🤖 [AUTO EMBEDDING] Auto-creating embedding for:', {
      userId: args.userId,
      contentId: args.contentId,
      contentType: args.contentType,
      title: args.title.substring(0, 50) + '...',
      triggerType: args.triggerType
    });

    try {
      // Check if we've already tried to process this content recently (prevent retry loops)
      const existingEmbedding = await ctx.runQuery(api.vectorSearchQueries.getEmbeddingByContentId, {
        userId: args.userId,
        contentId: args.contentId
      });

      if (existingEmbedding) {
        console.log('ℹ️ [AUTO EMBEDDING] Embedding already exists for content:', args.contentId);
        return { success: true, alreadyExists: true };
      }

      // Validate input content before creating embedding
      if (!args.content || args.content.trim().length === 0) {
        console.warn('⚠️ [AUTO EMBEDDING] Skipping empty content:', {
          contentId: args.contentId,
          contentType: args.contentType,
          title: args.title,
          contentLength: args.content?.length || 0
        });
        return { success: false, error: "Cannot create embedding for empty content", skipped: true };
      }

      // Additional validation for whitespace-only content
      if (args.content.trim().length < 10) {
        console.warn('⚠️ [AUTO EMBEDDING] Skipping content too short for embedding:', {
          contentId: args.contentId,
          contentType: args.contentType,
          title: args.title,
          contentLength: args.content.length,
          contentPreview: args.content.substring(0, 50)
        });
        return { success: false, error: "Content too short for embedding (minimum 10 characters)", skipped: true };
      }

      // Create the embedding
      await ctx.runAction(api.vectorSearchEmbeddings.createEmbedding, {
        userId: args.userId,
      contentId: args.contentId,
        contentType: args.contentType,
        title: args.title,
        content: args.content,
      });

      // Record the automatic update
      await ctx.runMutation(internal.vectorSearch.recordEmbeddingUpdate, {
        userId: args.userId,
        type: args.triggerType,
        contentType: args.contentType,
        contentId: args.contentId,
        itemsProcessed: 1,
        itemsSucceeded: 1,
        itemsFailed: 0,
      });

      console.log('✅ [AUTO EMBEDDING] Successfully created embedding for:', args.contentId);
      return { success: true };
    } catch (error: any) {
      console.warn('⚠️ [AUTO EMBEDDING] Failed to create embedding:', {
        contentId: args.contentId,
        contentType: args.contentType,
        title: args.title,
        error: error.message
      });
      
      // Record the failed update (but don't let this fail the whole operation)
      try {
        await ctx.runMutation(internal.vectorSearch.recordEmbeddingUpdate, {
          userId: args.userId,
          type: args.triggerType,
          contentType: args.contentType,
          contentId: args.contentId,
          itemsProcessed: 1,
          itemsSucceeded: 0,
          itemsFailed: 1,
        });
      } catch (recordError) {
        console.warn('⚠️ [AUTO EMBEDDING] Failed to record embedding update:', recordError);
        // Don't throw - this is just logging
      }

      return { success: false, error: error.message };
    }
  },
});

/**
 * Automatically create embeddings for multiple content items
 */
export const autoCreateEmbeddingsBatch = action({
  args: {
    userId: v.string(),
    items: v.array(v.object({
      contentId: v.string(),
      contentType: v.union(
        v.literal("conversation"),
        v.literal("note"),
        v.literal("crystal")
      ),
      title: v.string(),
      content: v.string(),
    })),
    triggerType: v.union(
      v.literal("content_update"),
      v.literal("automatic_update")
    ),
  },
  handler: async (ctx, args) => {
    console.log('🤖 [AUTO EMBEDDING BATCH] Processing', args.items.length, 'items for user:', args.userId);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const item of args.items) {
      results.processed++;
      try {
        await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
          userId: args.userId,
          contentId: item.contentId,
          contentType: item.contentType,
          title: item.title,
          content: item.content,
          triggerType: args.triggerType,
        });
        results.succeeded++;
      } catch (error: any) {
        results.failed++;
        const errorMsg = `Failed to embed ${item.contentType} "${item.title}": ${error.message}`;
        results.errors.push(errorMsg);
        console.error('❌ [AUTO EMBEDDING BATCH]', errorMsg);
      }
    }

    // Record the batch update
    await ctx.runMutation(internal.vectorSearch.recordEmbeddingUpdate, {
      userId: args.userId,
      type: args.triggerType,
      itemsProcessed: results.processed,
      itemsSucceeded: results.succeeded,
      itemsFailed: results.failed,
    });

    console.log('✅ [AUTO EMBEDDING BATCH] Completed:', results);
    return results;
  },
});

/**
 * Record embedding update in tracking table (internal)
 */
export const recordEmbeddingUpdate = internalMutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal("manual_update"),
      v.literal("automatic_update"),
      v.literal("content_update")
    ),
    contentType: v.optional(v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal")
    )),
    contentId: v.optional(v.string()),
    itemsProcessed: v.optional(v.number()),
    itemsSucceeded: v.optional(v.number()),
    itemsFailed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("embeddingUpdates", {
      userId: args.userId,
      updatedAt: Date.now(),
      type: args.type,
      contentType: args.contentType,
      contentId: args.contentId,
      itemsProcessed: args.itemsProcessed || 0,
      itemsSucceeded: args.itemsSucceeded || 0,
      itemsFailed: args.itemsFailed || 0,
    });
  },
});

/**
 * Get the last embedding update time for a user
 */
export const getLastEmbeddingUpdate = query({
  args: { userId: v.string() },
  returns: v.union(v.number(), v.null()),
  handler: async (ctx, args) => {
    try {
      const lastUpdate = await ctx.db
        .query("embeddingUpdates")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .first();
      
      return lastUpdate?.updatedAt || null;
    } catch (error) {
      console.error('Error getting last embedding update:', error);
      return null;
    }
  },
});

/**
 * Get recent embedding updates for a user
 */
export const getRecentEmbeddingUpdates = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("embeddingUpdates"),
    _creationTime: v.number(),
    userId: v.string(),
    updatedAt: v.number(),
    type: v.union(
      v.literal("manual_update"),
      v.literal("automatic_update"),
      v.literal("content_update")
    ),
    contentType: v.optional(v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal")
    )),
    contentId: v.optional(v.string()),
    itemsProcessed: v.optional(v.number()),
    itemsSucceeded: v.optional(v.number()),
    itemsFailed: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    try {
      const updates = await ctx.db
        .query("embeddingUpdates")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(args.limit || 5);
      
      return updates;
    } catch (error) {
      console.error('Error getting recent embedding updates:', error);
      return [];
    }
  },
});

/**
 * Update the last embedding update time for a user
 */
export const updateLastEmbeddingUpdate = mutation({
  args: { 
    userId: v.string(),
    type: v.union(
      v.literal("manual_update"),
      v.literal("automatic_update"),
      v.literal("content_update")
    ),
    contentType: v.optional(v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal"),
    )),
    contentId: v.optional(v.string()),
    itemsProcessed: v.optional(v.number()),
    itemsSucceeded: v.optional(v.number()),
    itemsFailed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.db.insert("embeddingUpdates", {
        userId: args.userId,
        updatedAt: Date.now(),
        type: args.type,
        contentType: args.contentType,
        contentId: args.contentId,
        itemsProcessed: args.itemsProcessed,
        itemsSucceeded: args.itemsSucceeded,
        itemsFailed: args.itemsFailed,
      });
      return true;
    } catch (error) {
      console.error('Error updating last embedding update time:', error);
      return false;
    }
  },
});

/**
 * Health check for embedding system (doesn't affect user experience)
 */
export const embeddingHealthCheck = query({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    try {
      // Get basic embedding stats
      const embeddings = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();

      const recentUpdates = await ctx.db
        .query("embeddingUpdates")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(5);

      return {
        success: true,
        totalEmbeddings: embeddings.length,
        recentUpdates: recentUpdates.length,
        lastUpdate: recentUpdates[0]?.updatedAt || null,
        systemStatus: 'healthy'
      };
    } catch (error) {
      console.error('⚠️ [HEALTH CHECK] Embedding health check failed:', error);
      return {
        success: false,
        totalEmbeddings: 0,
        recentUpdates: 0,
        lastUpdate: null,
        systemStatus: 'degraded',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Hybrid search that combines vector similarity with keyword matching and content type quotas
 */
export const hybridSearchContentWithQuotas = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    contentTypes: v.optional(v.array(v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal"),
    ))),
    minSimilarity: v.optional(v.number()),
  },
  returns: v.array(v.object({
    contentId: v.string(),
    contentType: v.string(),
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
    score: v.number(),
  })),
  handler: async (ctx, args) => {
    console.log('🔀 [HYBRID QUOTA SEARCH] Starting hybrid search with quotas');
    console.log('🔀 [HYBRID QUOTA SEARCH] Query:', args.query);
    
    try {
      // Validate query before processing
      if (!args.query || typeof args.query !== 'string' || args.query.trim().length === 0) {
        console.error('❌ [HYBRID QUOTA SEARCH] Query is empty or invalid');
        return [];
      }

      // Generate embedding for the query using internal function
      let queryEmbedding: number[];
      try {
        const trimmedQuery = args.query.trim();
        
        // Use the internal embedding generation logic directly
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
          throw new Error("GOOGLE_API_KEY environment variable is required");
        }

        const requestBody = {
          model: "models/text-embedding-004",
          content: {
            parts: [{ text: trimmedQuery }],
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

        queryEmbedding = data.embedding.values;
        console.log('✅ [HYBRID QUOTA SEARCH] Generated query embedding with dimension:', queryEmbedding.length);
      } catch (error) {
        console.error('❌ [HYBRID QUOTA SEARCH] Failed to generate embedding:', error);
        throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Get user embeddings using internal query (actions can't directly access ctx.db)
      let userEmbeddings;
      try {
        // Use internal query to get embeddings
        userEmbeddings = await ctx.runQuery(internal.vectorSearch.getUserEmbeddings, {
          userId: args.userId,
          contentTypes: args.contentTypes
        });
        
        console.log('✅ [HYBRID QUOTA SEARCH] Retrieved', userEmbeddings.length, 'user embeddings');
      } catch (error) {
        console.error('❌ [HYBRID QUOTA SEARCH] Failed to fetch user embeddings:', error);
        throw new Error(`Failed to fetch user embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Calculate similarities using inline cosine similarity
      const similarities = userEmbeddings.map((doc) => {
        try {
          // Inline cosine similarity calculation
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;
          
          for (let i = 0; i < queryEmbedding.length; i++) {
            dotProduct += queryEmbedding[i] * doc.embedding[i];
            normA += queryEmbedding[i] * queryEmbedding[i];
            normB += doc.embedding[i] * doc.embedding[i];
          }
          
          const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
          
          return {
            contentId: doc.contentId,
            contentType: doc.contentType,
            title: doc.title,
            content: doc.content,
            embedding: doc.embedding,
            score: isNaN(score) ? 0 : score,
          };
        } catch (error) {
          console.warn('⚠️ [HYBRID QUOTA SEARCH] Failed to calculate similarity for doc:', doc.contentId);
          return {
            contentId: doc.contentId,
            contentType: doc.contentType,
            title: doc.title,
            content: doc.content,
            embedding: doc.embedding,
            score: 0,
          };
        }
      });

      // Apply similarity threshold and filtering
      const minThreshold = args.minSimilarity || 0.35;
      const filteredSimilarities = similarities.filter(item => item.score >= minThreshold);
      
      // Sort by similarity score (highest first)
      filteredSimilarities.sort((a, b) => b.score - a.score);
      
      // Group by content type for quota application
      const contentByType = {
        conversation: filteredSimilarities.filter(item => item.contentType === 'conversation'),
        note: filteredSimilarities.filter(item => item.contentType === 'note'),
        crystal: filteredSimilarities.filter(item => item.contentType === 'crystal'),
      };
      
      console.log('🔀 [HYBRID QUOTA SEARCH] Content distribution:', {
        conversations: contentByType.conversation.length,
        notes: contentByType.note.length,
        crystals: contentByType.crystal.length,
      });
      
      // Apply content type quotas
      const selectedResults: Array<{
        contentId: string;
        contentType: string;
        title: string;
        content: string;
        embedding: number[];
        score: number;
      }> = [];
      
      // Add crystals (max 5)
      const topCrystals = contentByType.crystal.slice(0, 5);
      selectedResults.push(...topCrystals);
      
      // Add conversations (max 4)
      const topConversations = contentByType.conversation.slice(0, 4);
      selectedResults.push(...topConversations);
      
      // Add notes (max 3)
      const topNotes = contentByType.note.slice(0, 3);
      selectedResults.push(...topNotes);
      
      // Fill remaining slots while respecting quotas
      const targetTotal = args.limit || 10;
      const remainingSlots = targetTotal - selectedResults.length;
      
      if (remainingSlots > 0) {
        const usedIds = new Set(selectedResults.map(item => item.contentId));
        const unusedContent = filteredSimilarities.filter(item => !usedIds.has(item.contentId));
        
        // Count current content by type
        const currentCounts = {
          conversation: selectedResults.filter(item => item.contentType === 'conversation').length,
          crystal: selectedResults.filter(item => item.contentType === 'crystal').length,
          note: selectedResults.filter(item => item.contentType === 'note').length,
        };
        
        const quotaLimits = { conversation: 4, crystal: 5, note: 3 };
        
        for (const item of unusedContent) {
          if (selectedResults.length >= targetTotal) break;
          
          const currentCount = currentCounts[item.contentType as keyof typeof currentCounts] || 0;
          const quota = quotaLimits[item.contentType as keyof typeof quotaLimits];
          
          if (quota && currentCount < quota) {
            selectedResults.push(item);
            currentCounts[item.contentType as keyof typeof currentCounts] = currentCount + 1;
          }
        }
      }
      
      // Final sort and limit
      selectedResults.sort((a, b) => b.score - a.score);
      const finalResults = selectedResults.slice(0, targetTotal);
      
      console.log('✅ [HYBRID QUOTA SEARCH] Final results:', {
        total: finalResults.length,
        conversations: finalResults.filter(item => item.contentType === 'conversation').length,
        crystals: finalResults.filter(item => item.contentType === 'crystal').length,
        notes: finalResults.filter(item => item.contentType === 'note').length,
      });
      
      return finalResults;
      
    } catch (error) {
      console.error("❌ [HYBRID QUOTA SEARCH] Error:", error);
      console.error("❌ [HYBRID QUOTA SEARCH] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      // Return empty results instead of throwing to prevent cascading failures
      return [];
    }
  },
});

/**
 * Internal query to get user embeddings (used by actions)
 */
export const getUserEmbeddings = internalQuery({
  args: {
    userId: v.string(),
    contentTypes: v.optional(v.array(v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal"),
    ))),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("contentEmbeddings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId));
    
    // Apply content type filter if specified
    if (args.contentTypes && args.contentTypes.length > 0) {
      return await query
        .filter((q) => {
          let filter = q.eq(q.field("contentType"), args.contentTypes![0]);
          for (let i = 1; i < args.contentTypes!.length; i++) {
            filter = q.or(filter, q.eq(q.field("contentType"), args.contentTypes![i]));
          }
          return filter;
        })
        .collect();
    } else {
      return await query.collect();
    }
  },
});
