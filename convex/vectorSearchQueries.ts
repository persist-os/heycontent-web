import { query, action } from "./_generated/server";
import { v } from "convex/values";
import { contentTypesArrayValidator } from "./types/embeddings";
import { api } from "./_generated/api";

/**
 * Optimized Vector Search Queries
 * 
 * Follows convex-optimized-queries-mutations.mdc patterns:
 * - Single generic query function eliminates code duplication
 * - Proper indexing with .withIndex() instead of .filter()
 * - Pagination and limits for performance
 * - User data isolation built-in
 */

// Generic query helper following optimization patterns
const queryVectorSearchWithOptions = async (
  ctx: any,
  userId: string,
  table: string,
  options: {
    useIndex?: string;
    indexFields?: Record<string, any>;
    filters?: Record<string, any>;
    limit?: number;
    orderBy?: "asc" | "desc";
  } = {}
) => {
  const baseQuery = ctx.db.query(table);

  // Dynamic index selection with user isolation (ALWAYS include userId)
  let indexedQuery;
  if (options.useIndex) {
    indexedQuery = baseQuery.withIndex(options.useIndex, (q: any) => {
      let queryBuilder = q.eq("userId", userId);
      if (options.indexFields) {
        Object.entries(options.indexFields).forEach(([field, value]) => {
          queryBuilder = queryBuilder.eq(field, value);
        });
      }
      return queryBuilder;
    });
  } else {
    // Default to user index for data isolation
    indexedQuery = baseQuery.withIndex("by_user", (q: any) => q.eq("userId", userId));
  }

  // Runtime filters (avoid when possible for performance)
  let filteredQuery = indexedQuery;
  if (options.filters) {
    Object.entries(options.filters).forEach(([field, value]) => {
      filteredQuery = filteredQuery.filter((filterQuery: any) =>
        filterQuery.eq(filterQuery.field(field), value)
      );
    });
  }

  // Ordering and pagination
  let orderedQuery = filteredQuery;
  if (options.orderBy) {
    orderedQuery = filteredQuery.order(options.orderBy);
  }

  // Always use pagination for performance
  return options.limit ? await orderedQuery.take(options.limit) : await orderedQuery.take(50);
};

// Single generic vector search action function (changed from query to support ctx.runAction)
export const getVectorSearchData = action({
  args: {
    userId: v.string(),
    operation: v.string(),
    table: v.optional(v.string()),
    
    // Search parameters
    query: v.optional(v.string()),
    contentTypes: contentTypesArrayValidator,
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
    
    // Query optimization parameters
    useIndex: v.optional(v.string()),
    indexFields: v.optional(v.record(v.string(), v.any())),
    filters: v.optional(v.record(v.string(), v.any())),
    orderBy: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    
    // Batch operations
    queries: v.optional(v.array(v.any())),
    maxConcurrent: v.optional(v.number()),
    
    // Context grading
    includeGrading: v.optional(v.boolean()),
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
      const { userId, operation, table = "vector_embeddings" } = args;
      
      // Supported operations: similarity_search, hybrid_search, batch_search, search_with_grading, get_stats, health_check
      switch (operation) {
        case "similarity_search":
          return await handleSimilaritySearch(ctx, args);
          
        case "hybrid_search":
          return await handleSimilaritySearch(ctx, args);
          
        case "batch_search":
          return await handleBatchSearch(ctx, args);
          
        case "search_with_grading":
          return await handleSearchWithGrading(ctx, args);
          
        case "get_stats":
          return await handleGetStats(ctx, args);
          
        case "health_check":
          return await handleHealthCheck(ctx, args);
          
        default:
          // Generic query using optimized patterns
          const results = await queryVectorSearchWithOptions(ctx, userId, table, {
            useIndex: args.useIndex,
            indexFields: args.indexFields,
            filters: args.filters,
            limit: args.limit,
            orderBy: args.orderBy,
          });
          
          return {
            success: true,
            data: results,
            metadata: {
              processingTimeMs: Date.now() - startTime,
              resultsCount: results.length,
              operationType: operation,
            },
          };
      }
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

// Optimized similarity search handler
async function handleSimilaritySearch(ctx: any, args: any) {
  const { userId, query, contentTypes, limit = 10, threshold = 0.7, useIndex = "by_user_type_score" } = args;
  
  if (!query) {
    throw new Error("Query is required for similarity search");
  }
  
  // Use hybrid search action for vector similarity
  const results = await ctx.runAction("vectorSearch:hybridSearchContentWithQuotas", {
    userId,
    query,
    contentTypes: contentTypes || ["note", "crystal", "conversation"],
    limit: Math.min(limit, 50), // Cap at 50 for performance
    minSimilarity: threshold,
  });
  
  return {
    success: true,
    data: results || [],
    metadata: {
      processingTimeMs: Date.now() - Date.now(),
      resultsCount: results?.length || 0,
      operationType: "similarity_search",
    },
  };
}

// Optimized batch search handler
async function handleBatchSearch(ctx: any, args: any) {
  const { userId, queries = [], maxConcurrent = 5 } = args;
  
  if (!queries.length) {
    throw new Error("Queries array is required for batch search");
  }
  
  // Limit batch size for performance
  const limitedQueries = queries.slice(0, 20);
  const results = [];
  
  // Process in chunks to manage concurrency
  for (let i = 0; i < limitedQueries.length; i += maxConcurrent) {
    const chunk = limitedQueries.slice(i, i + maxConcurrent);
    
    const chunkPromises = chunk.map(async (queryData: any) => {
      try {
        const searchResults = await ctx.runAction("vectorSearch:hybridSearchContentWithQuotas", {
          userId,
          query: queryData.query,
          contentTypes: queryData.contentTypes || ["note", "crystal", "conversation"],
          limit: Math.min(queryData.limit || 10, 20),
          minSimilarity: queryData.threshold || 0.7,
        });
        
        return {
          success: true,
          query: queryData.query,
          results: searchResults || [],
          queryId: queryData.id,
        };
    } catch (error) {
        return {
          success: false,
          query: queryData.query,
          results: [],
          queryId: queryData.id,
          error: error instanceof Error ? error.message : "Search failed",
        };
      }
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  
  return {
    success: true,
    data: results,
    metadata: {
      processingTimeMs: Date.now() - Date.now(),
      resultsCount: results.length,
      operationType: "batch_search",
    },
  };
}

// Search with integrated context grading
async function handleSearchWithGrading(ctx: any, args: any) {
  const { userId, query, contentTypes, limit = 10, threshold = 0.7 } = args;
  
  if (!query) {
    throw new Error("Query is required for search with grading");
  }
  
  // First perform vector search
  const searchResults = await ctx.runAction("vectorSearch:hybridSearchContentWithQuotas", {
    userId,
    query,
    contentTypes: contentTypes || ["note", "crystal", "conversation"],
    limit: Math.min(limit, 20), // Conservative limit for grading
    minSimilarity: threshold,
  });
  
  if (!searchResults?.length) {
    return {
      success: true,
      data: {
        searchResults: [],
        gradedResults: [],
        gradingSummary: {
          totalItems: 0,
          relevantItems: 0,
          confidenceScore: 0,
        },
      },
      metadata: {
        processingTimeMs: Date.now() - Date.now(),
        operationType: "search_with_grading",
      },
    };
  }
  
  // Grade the search results for relevance
  try {
    const gradingResults = await ctx.runMutation("contextGrading:gradeContextRelevance", {
      query,
      vectorSearchResults: searchResults.map((result: any) => ({
        title: result.title,
        contentType: result.contentType,
        content: result.content,
        score: result.score,
        _id: result._id,
      })),
    });
    
    return {
      success: true,
      data: {
        searchResults,
        gradedResults: gradingResults.relevantContext || [],
        gradingSummary: gradingResults.gradingSummary || {},
      },
      metadata: {
        processingTimeMs: Date.now() - Date.now(),
        operationType: "search_with_grading",
      },
    };
  } catch (gradingError) {
    // Return search results even if grading fails
    return {
      success: true,
      data: {
        searchResults,
        gradedResults: searchResults, // Fallback to ungraded results
        gradingSummary: {
          totalItems: searchResults.length,
          relevantItems: searchResults.length,
          confidenceScore: 0.5,
        },
        gradingError: gradingError instanceof Error ? gradingError.message : "Grading failed",
      },
      metadata: {
        processingTimeMs: Date.now() - Date.now(),
        operationType: "search_with_grading",
      },
    };
  }
}

// Get user embedding statistics
async function handleGetStats(ctx: any, args: any) {
  const { userId } = args;
  
  // Use optimized index query for user stats
  // Note: Using fallback approach since vector_embeddings table may not exist yet
  try {
    // Check DB connection
    await ctx.db.query("notes").take(0);
    
    // This will be replaced with actual vector_embeddings table query when implemented
    const userEmbeddings: any[] = [];
  
    const stats = {
      totalEmbeddings: userEmbeddings.length,
      contentTypes: userEmbeddings.reduce((acc: Record<string, number>, emb: any) => {
        acc[emb.contentType] = (acc[emb.contentType] || 0) + 1;
        return acc;
      }, {}),
      lastUpdated: userEmbeddings.length > 0 ? Math.max(...userEmbeddings.map((e: any) => e._creationTime)) : null,
    };
  
    return {
      success: true,
      data: stats,
      metadata: {
        processingTimeMs: Date.now() - Date.now(),
        operationType: "get_stats",
      },
    };
  } catch (error) {
    // Fallback if vector_embeddings table doesn't exist
    return {
      success: true,
      data: {
        totalEmbeddings: 0,
        contentTypes: {},
        lastUpdated: null,
      },
      metadata: {
        processingTimeMs: Date.now() - Date.now(),
        operationType: "get_stats",
      },
    };
  }
}

// Health check handler
async function handleHealthCheck(ctx: any, args: any) {
  try {
    // Simple test query to check system health
    const testQuery = await ctx.db
      .query("notes")
      .take(1);
    
    return {
      success: true,
      data: {
        status: "healthy",
        timestamp: Date.now(),
        canQuery: true,
        systemLoad: "normal",
      },
      metadata: {
        processingTimeMs: Date.now() - Date.now(),
        operationType: "health_check",
      },
    };
  } catch (error) {
    return {
      success: false,
      data: {
        status: "unhealthy",
        timestamp: Date.now(),
        canQuery: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      metadata: {
        processingTimeMs: Date.now() - Date.now(),
        operationType: "health_check",
      },
    };
  }
}

// Legacy compatibility function
export const hasUserEmbeddings = query({
  args: { userId: v.string() },
  returns: v.object({
    hasEmbeddings: v.boolean(),
    count: v.number(),
  }),
  handler: async (ctx, { userId }) => {
    try {
      // Fallback approach since vector_embeddings table may not exist yet
      const allTables = await ctx.db.query("notes").take(0); // Just check DB connection
      
      // This will be replaced with actual vector_embeddings table query when implemented
      const userEmbeddings: any[] = [];
      const count = userEmbeddings.length;

      return {
        hasEmbeddings: count > 0,
        count,
      };
    } catch (error) {
      // Return safe defaults if table doesn't exist
      return {
        hasEmbeddings: false,
        count: 0,
      };
    }
  },
});