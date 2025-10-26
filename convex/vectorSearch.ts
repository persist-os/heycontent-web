// @ts-nocheck
import { action, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { contentTypesArrayValidator } from "./types/embeddings";

/**
 * Vector Search System
 * 
 * ⚠️ IMPORTANT: Embedding generation is handled automatically in the BACKEND:
 * - Notes: backend-new/app/agents/smart_notes/note_processor.py
 * - Conversations: backend-new/app/agents/chat_engine/services/chat_api_service.py
 * - Crystals: backend-new/app/agents/persona_crystallization/crystal_dam/
 * 
 * This file ONLY handles:
 * - Reading existing embeddings
 * - Vector similarity search
 * - Hybrid search (vector + keyword)
 */

const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

/**
 * Hybrid search that combines vector similarity with keyword matching (no quotas)
 */
export const hybridSearchContent = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    contentTypes: contentTypesArrayValidator,
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
    try {
      // Validate query
      if (!args.query || typeof args.query !== 'string' || args.query.trim().length === 0) {
        return [];
      }

      // Generate embedding for the query
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is required");
      }

      const requestBody = {
        model: "models/text-embedding-004",
        content: {
          parts: [{ text: args.query.trim() }],
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
      
      // Get user embeddings
      const userEmbeddings = await ctx.runQuery(internal.vectorSearch.getUserEmbeddings, {
        userId: args.userId,
        contentTypes: args.contentTypes
      });
      
      // Calculate similarities
      const similarities = userEmbeddings.map((doc) => {
        try {
          if (!doc.embedding || !Array.isArray(doc.embedding) || doc.embedding.length !== queryEmbedding.length) {
            return {
              contentId: doc.contentId,
              contentType: doc.contentType,
              title: doc.title,
              content: doc.content,
              embedding: doc.embedding,
              score: 0,
            };
          }
          
          // Cosine similarity calculation
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;
          
          for (let i = 0; i < queryEmbedding.length; i++) {
            const queryVal = queryEmbedding[i];
            const docVal = doc.embedding[i];
            
            if (typeof queryVal !== 'number' || typeof docVal !== 'number' || isNaN(queryVal) || isNaN(docVal)) {
              continue;
            }
            
            dotProduct += queryVal * docVal;
            normA += queryVal * queryVal;
            normB += docVal * docVal;
          }
          
          const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
          const finalScore = isNaN(score) || !isFinite(score) ? 0 : score;
          
          return {
            contentId: doc.contentId,
            contentType: doc.contentType,
            title: doc.title,
            content: doc.content,
            embedding: doc.embedding,
            score: finalScore,
          };
        } catch (error) {
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

      // Apply similarity threshold and sort by score
      const minThreshold = args.minSimilarity || 0.35;
      const filteredSimilarities = similarities
        .filter(item => item.score >= minThreshold)
        .sort((a, b) => b.score - a.score);
      
      // Return top results up to limit
      const limit = args.limit || 50;
      return filteredSimilarities.slice(0, limit);
      
    } catch (error) {
      console.error("❌ [HYBRID SEARCH] Error:", error);
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
    contentTypes: contentTypesArrayValidator,
  },
  handler: async (ctx, args) => {
    try {
      console.log('🔍 [GET USER EMBEDDINGS] Starting query for user:', args.userId);
      console.log('🔍 [GET USER EMBEDDINGS] Content types filter:', args.contentTypes);
      
      const query = ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId));
      
      let results;
      // Apply content type filter if specified
      if (args.contentTypes && args.contentTypes.length > 0) {
        console.log('🔍 [GET USER EMBEDDINGS] Applying content type filter for:', args.contentTypes);
        results = await query
          .filter((q) => {
            let filter = q.eq(q.field("contentType"), args.contentTypes![0]);
            for (let i = 1; i < args.contentTypes!.length; i++) {
              filter = q.or(filter, q.eq(q.field("contentType"), args.contentTypes![i]));
            }
            return filter;
          })
          .collect();
      } else {
        console.log('🔍 [GET USER EMBEDDINGS] No content type filter, getting all embeddings');
        results = await query.collect();
      }
      
      // Log detailed breakdown of what we found
      const contentTypeCounts = results.reduce((acc, embedding) => {
        acc[embedding.contentType] = (acc[embedding.contentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('🔍 [GET USER EMBEDDINGS] Found embeddings:', {
        total: results.length,
        byType: contentTypeCounts
      });
      
      return results;
    } catch (error) {
      console.error('❌ [GET USER EMBEDDINGS] Error fetching embeddings:', error);
      console.error('❌ [GET USER EMBEDDINGS] Error details:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack',
        userId: args.userId,
        contentTypes: args.contentTypes
      });
      // Return empty array to prevent cascading failures
      return [];
    }
  },
});

/**
 * Fetch embeddings by content IDs
 * Used by clustering to get pre-computed shard embeddings
 */
export const getEmbeddingsByContentIds = internalQuery({
  args: {
    userId: v.string(),
    contentType: v.string(),
    contentIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`🔍 [GET EMBEDDINGS BY IDS] Fetching ${args.contentIds.length} ${args.contentType} embeddings for user ${args.userId}`);
      console.log(`🔍 [GET EMBEDDINGS BY IDS] Requested content IDs: ${args.contentIds.slice(0, 3)}${args.contentIds.length > 3 ? '...' : ''}`);
      
      // Query all embeddings for this user and content type
      const allEmbeddings = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_user_type", (q) => 
          q.eq("userId", args.userId).eq("contentType", args.contentType)
        )
        .collect();
      
      console.log(`🔍 [GET EMBEDDINGS BY IDS] Found ${allEmbeddings.length} total ${args.contentType} embeddings for user ${args.userId}`);
      
      // DEBUG: Log all available content IDs
      const availableContentIds = allEmbeddings.map(e => e.contentId);
      console.log(`🔍 [GET EMBEDDINGS BY IDS] Available content IDs: ${availableContentIds.slice(0, 5)}${availableContentIds.length > 5 ? '...' : ''}`);
      
      // Filter to only requested content IDs
      const contentIdSet = new Set(args.contentIds);
      const results = allEmbeddings.filter(e => contentIdSet.has(e.contentId));
      
      // DEBUG: Log which IDs were found vs missing
      const foundIds = results.map(r => r.contentId);
      const missingIds = args.contentIds.filter(id => !foundIds.includes(id));
      
      console.log(`🔍 [GET EMBEDDINGS BY IDS] Found IDs: ${foundIds.slice(0, 3)}${foundIds.length > 3 ? '...' : ''}`);
      if (missingIds.length > 0) {
        console.log(`⚠️ [GET EMBEDDINGS BY IDS] Missing IDs: ${missingIds.slice(0, 3)}${missingIds.length > 3 ? '...' : ''}`);
      }
      
      console.log(`✅ [GET EMBEDDINGS BY IDS] Found ${results.length}/${args.contentIds.length} embeddings`);
      
      return results;
    } catch (error) {
      console.error('❌ [GET EMBEDDINGS BY IDS] Error:', error);
      return [];
    }
  },
});

/**
 * Get average embedding for multiple content items
 * Used by attachment detector to compare shard clusters without regenerating embeddings
 */
export const getAverageEmbedding = internalAction({
  args: {
    userId: v.string(),
    contentType: v.string(),
    contentIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Get embeddings for content IDs (already exist in database)
      const embeddings = await ctx.runQuery(internal.vectorSearch.getEmbeddingsByContentIds, {
        userId: args.userId,
        contentType: args.contentType,
        contentIds: args.contentIds,
      });
      
      if (!embeddings || embeddings.length === 0) {
        throw new Error(`No embeddings found for ${args.contentType} IDs`);
      }
      
      // Calculate average embedding
      const embeddingLength = embeddings[0].embedding.length;
      const avgEmbedding = new Array(embeddingLength).fill(0);
      
      for (const doc of embeddings) {
        for (let i = 0; i < embeddingLength; i++) {
          avgEmbedding[i] += doc.embedding[i];
        }
      }
      
      for (let i = 0; i < embeddingLength; i++) {
        avgEmbedding[i] /= embeddings.length;
      }
      
      console.log(`✅ [GET AVERAGE EMBEDDING] Averaged ${embeddings.length} ${args.contentType} embeddings`);
      return avgEmbedding;
      
    } catch (error) {
      console.error('❌ [GET AVERAGE EMBEDDING] Error:', error);
      throw error;
    }
  },
});

/**
 * Search using pre-computed embedding (no generation needed)
 * Used by attachment detector to find similar crystals using shard cluster embeddings
 */
export const searchByEmbedding = internalAction({
  args: {
    userId: v.string(),
    embedding: v.array(v.float64()),
    contentTypes: contentTypesArrayValidator,
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's embeddings from database
      const userEmbeddings = await ctx.runQuery(internal.vectorSearch.getUserEmbeddings, {
        userId: args.userId,
        contentTypes: args.contentTypes
      });
      
      // Calculate similarities with provided embedding
      const similarities = userEmbeddings.map((doc) => {
        try {
          if (!doc.embedding || !Array.isArray(doc.embedding) || doc.embedding.length !== args.embedding.length) {
            return {
              contentId: doc.contentId,
              contentType: doc.contentType,
              title: doc.title,
              content: doc.content,
              embedding: doc.embedding,
              score: 0,
            };
          }
          
          // Cosine similarity calculation
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;
          
          for (let i = 0; i < args.embedding.length; i++) {
            const queryVal = args.embedding[i];
            const docVal = doc.embedding[i];
            
            if (typeof queryVal !== 'number' || typeof docVal !== 'number' || isNaN(queryVal) || isNaN(docVal)) {
              continue;
            }
            
            dotProduct += queryVal * docVal;
            normA += queryVal * queryVal;
            normB += docVal * docVal;
          }
          
          const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
          const finalScore = isNaN(score) || !isFinite(score) ? 0 : score;
          
          return {
            contentId: doc.contentId,
            contentType: doc.contentType,
            title: doc.title,
            content: doc.content,
            embedding: doc.embedding,
            score: finalScore,
          };
        } catch (error) {
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

      // Apply similarity threshold and sort by score
      const minThreshold = args.threshold || 0.35;
      const filteredSimilarities = similarities
        .filter(item => item.score >= minThreshold)
        .sort((a, b) => b.score - a.score);
      
      // Return top results up to limit
      const limit = args.limit || 50;
      const results = filteredSimilarities.slice(0, limit);
      
      console.log(`✅ [SEARCH BY EMBEDDING] Found ${results.length} results above threshold ${minThreshold}`);
      return results;
      
    } catch (error) {
      console.error('❌ [SEARCH BY EMBEDDING] Error:', error);
      return [];
    }
  },
});
