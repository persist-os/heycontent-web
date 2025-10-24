import { action } from "./_generated/server";
import { v } from "convex/values";
import { contentTypesArrayValidator } from "./types/embeddings";
import { api } from "./_generated/api";

/**
 * Vector Search Query Handler
 * 
 * Thin wrapper around hybridSearchContentWithQuotas action.
 * Backend calls this with operation="similarity_search" which forwards to the actual search.
 */

export const getVectorSearchData = action({
  args: {
    userId: v.string(),
    operation: v.string(),
    query: v.optional(v.string()),
    contentTypes: contentTypesArrayValidator,
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    data: v.any(),
    error: v.optional(v.string()),
    metadata: v.optional(v.object({
      processingTimeMs: v.optional(v.number()),
      resultsCount: v.optional(v.number()),
      operationType: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    try {
      const { userId, query, contentTypes, limit = 10, threshold = 0.7 } = args;
      
      if (!query) {
        throw new Error("Query is required for vector search");
      }
      
      // Forward to actual hybrid search implementation
      const results = await ctx.runAction(api.vectorSearch.hybridSearchContentWithQuotas, {
        userId,
        query,
        contentTypes: contentTypes || ["note", "crystal", "conversation", "shard"],
        limit: Math.min(limit, 50),
        minSimilarity: threshold,
      });
      
      return {
        success: true,
        data: results || [],
        metadata: {
          processingTimeMs: Date.now() - startTime,
          resultsCount: results?.length || 0,
          operationType: args.operation,
        },
      };
    } catch (error) {
      console.error(`Vector search operation '${args.operation}' failed:`, error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          processingTimeMs: Date.now() - startTime,
          operationType: args.operation,
        },
      };
    }
  },
});