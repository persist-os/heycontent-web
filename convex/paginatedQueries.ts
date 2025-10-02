// @ts-nocheck
import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import schema from "./schema";

// Enhanced validators that include Convex system fields
const crystalWithSystemFields = v.object({
  _id: v.id("crystals"),
  _creationTime: v.number(),
  ...schema.tables.crystals.validator.fields
});

const crystalShardWithSystemFields = v.object({
  _id: v.id("crystal_shards"),
  _creationTime: v.number(),
  ...schema.tables.crystal_shards.validator.fields
});

/**
 * Paginated Query System for Large Datasets
 * Implements efficient pagination for crystal and shard queries
 * Reduces memory usage and improves performance for large result sets
 */

/**
 * Paginated crystal query with advanced filtering and sorting
 */
export const getPaginatedCrystals = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
    filters: v.optional(v.object({
      dimension: v.optional(v.string()),
      crystalType: v.optional(v.string()),
      minConfidence: v.optional(v.number()),
      maxConfidence: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      dateRange: v.optional(v.object({
        start: v.number(),
        end: v.number(),
      })),
    })),
    sortBy: v.optional(v.union(
      v.literal("createdAt"),
      v.literal("confidence"),
      v.literal("observations"),
      v.literal("lastUsed")
    )),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
    returns: v.object({
    page: v.array(crystalWithSystemFields),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    totalCount: v.optional(v.number()),
    pageInfo: v.object({
      hasNextPage: v.boolean(),
      hasPreviousPage: v.boolean(),
      currentPage: v.number(),
      pageSize: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    console.log(`📄 [PAGINATED CRYSTALS] Fetching page for user ${args.userId}`);
    
    // Build base query
    let query = ctx.db
      .query("crystals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    // Apply filters
    if (args.filters) {
      if (args.filters.dimension) {
        query = query.filter((q) => q.eq(q.field("dimension"), args.filters!.dimension));
      }
      
      if (args.filters.crystalType) {
        query = query.filter((q) => q.eq(q.field("crystal_type"), args.filters!.crystalType));
      }
      
      if (args.filters.minConfidence !== undefined) {
        query = query.filter((q) => q.gte(q.field("confidence_score"), args.filters!.minConfidence!));
      }
      
      if (args.filters.maxConfidence !== undefined) {
        query = query.filter((q) => q.lte(q.field("confidence_score"), args.filters!.maxConfidence!));
      }
      
      if (args.filters.dateRange) {
        query = query.filter((q) => 
          q.and(
            q.gte(q.field("_creationTime"), args.filters!.dateRange!.start),
            q.lte(q.field("_creationTime"), args.filters!.dateRange!.end)
          )
        );
      }
    }

    // Apply sorting
    const sortOrder = args.sortOrder || "desc";
    query = query.order(sortOrder);

    // Execute paginated query
    const result = await query.paginate(args.paginationOpts);
    
    // Calculate page info
    const pageSize = args.paginationOpts.numItems;
    const currentPage = args.paginationOpts.cursor ? 
      Math.floor(result.page.length / pageSize) + 1 : 1;

    console.log(`✅ [PAGINATED CRYSTALS] Returned ${result.page.length} crystals (page ${currentPage})`);
    
    return {
      page: result.page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      pageInfo: {
        hasNextPage: !result.isDone,
        hasPreviousPage: currentPage > 1,
        currentPage,
        pageSize,
      },
    };
  },
});

/**
 * Paginated shard query with advanced filtering
 */
export const getPaginatedShards = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
    filters: v.optional(v.object({
      dimension: v.optional(v.string()),
      confidenceLevel: v.optional(v.string()),
      sourceType: v.optional(v.string()),
      hasBeenUsed: v.optional(v.boolean()),
      dateRange: v.optional(v.object({
        start: v.number(),
        end: v.number(),
      })),
    })),
    sortBy: v.optional(v.union(
      v.literal("createdAt"),
      v.literal("confidence"),
      v.literal("usageCount")
    )),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  returns: v.object({
    page: v.array(crystalShardWithSystemFields),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageInfo: v.object({
      hasNextPage: v.boolean(),
      hasPreviousPage: v.boolean(),
      currentPage: v.number(),
      pageSize: v.number(),
    }),
    aggregates: v.object({
      totalShards: v.number(),
      dimensionCounts: v.record(v.string(), v.number()),
      confidenceCounts: v.record(v.string(), v.number()),
    }),
  }),
  handler: async (ctx, args) => {
    console.log(`📄 [PAGINATED SHARDS] Fetching page for user ${args.userId}`);
    
    // Build base query
    let query = ctx.db
      .query("crystal_shards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    // Apply filters
    if (args.filters) {
      if (args.filters.dimension) {
        query = query.filter((q) => q.eq(q.field("dimension"), args.filters!.dimension));
      }
      
      if (args.filters.confidenceLevel) {
        query = query.filter((q) => q.eq(q.field("confidence_level"), args.filters!.confidenceLevel));
      }
      
      if (args.filters.sourceType) {
        query = query.filter((q) => q.eq(q.field("source"), args.filters!.sourceType));
      }
      
      if (args.filters.hasBeenUsed !== undefined) {
        if (args.filters.hasBeenUsed) {
          query = query.filter((q) => q.gt(q.field("usage_count"), 0));
        } else {
          query = query.filter((q) => q.eq(q.field("usage_count"), 0));
        }
      }
      
      if (args.filters.dateRange) {
        query = query.filter((q) => 
          q.and(
            q.gte(q.field("_creationTime"), args.filters!.dateRange!.start),
            q.lte(q.field("_creationTime"), args.filters!.dateRange!.end)
          )
        );
      }
    }

    // Apply sorting
    const sortOrder = args.sortOrder || "desc";
    query = query.order(sortOrder);

    // Execute paginated query
    const result = await query.paginate(args.paginationOpts);
    
    // Calculate aggregates (for first page only to avoid performance issues)
    let aggregates = {
      totalShards: 0,
      dimensionCounts: {} as Record<string, number>,
      confidenceCounts: {} as Record<string, number>,
    };

    if (!args.paginationOpts.cursor) {
      // Only calculate aggregates for first page
      const allShards = await ctx.db
        .query("crystal_shards")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      aggregates.totalShards = allShards.length;
      
      allShards.forEach(shard => {
        // Dimension counts
        aggregates.dimensionCounts[shard.dimension] = 
          (aggregates.dimensionCounts[shard.dimension] || 0) + 1;
        
        // Confidence counts
        if (shard.confidence_level) {
          aggregates.confidenceCounts[shard.confidence_level] = 
            (aggregates.confidenceCounts[shard.confidence_level] || 0) + 1;
        }
      });
    }

    // Calculate page info
    const pageSize = args.paginationOpts.numItems;
    const currentPage = args.paginationOpts.cursor ? 
      Math.floor(result.page.length / pageSize) + 1 : 1;

    console.log(`✅ [PAGINATED SHARDS] Returned ${result.page.length} shards (page ${currentPage})`);
    
    return {
      page: result.page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      pageInfo: {
        hasNextPage: !result.isDone,
        hasPreviousPage: currentPage > 1,
        currentPage,
        pageSize,
      },
      aggregates,
    };
  },
});

/**
 * Paginated vector search results with performance optimization
 */
export const getPaginatedVectorSearch = query({
  args: {
    userId: v.string(),
    searchQuery: v.string(),
    paginationOpts: paginationOptsValidator,
    contentTypes: v.optional(v.array(v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal")
    ))),
    minSimilarity: v.optional(v.number()),
  },
  returns: v.object({
    page: v.array(v.object({
      contentId: v.string(),
      contentType: v.string(),
      title: v.string(),
      content: v.string(),
      score: v.number(),
      _creationTime: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageInfo: v.object({
      hasNextPage: v.boolean(),
      hasPreviousPage: v.boolean(),
      currentPage: v.number(),
      pageSize: v.number(),
    }),
    searchMetadata: v.object({
      totalMatches: v.number(),
      avgSimilarity: v.number(),
      searchTime: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    console.log(`🔍 [PAGINATED VECTOR SEARCH] Searching for: "${args.searchQuery}"`);
    
    // Get embeddings with pagination
    let query = ctx.db
      .query("contentEmbeddings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId));

    // Apply content type filter if specified
    if (args.contentTypes && args.contentTypes.length > 0) {
      query = query.filter((q) => {
        let filter = q.eq(q.field("contentType"), args.contentTypes![0]);
        for (let i = 1; i < args.contentTypes!.length; i++) {
          filter = q.or(filter, q.eq(q.field("contentType"), args.contentTypes![i]));
        }
        return filter;
      });
    }

    // Execute paginated query
    const result = await query.paginate(args.paginationOpts);
    
    // For this example, we'll simulate vector similarity calculation
    // In a real implementation, you'd use the actual vector search logic
    const minSimilarity = args.minSimilarity || 0.3;
    const searchResults = result.page.map(embedding => ({
      contentId: embedding.contentId,
      contentType: embedding.contentType,
      title: embedding.title,
      content: embedding.content,
      score: Math.random() * 0.7 + 0.3, // Simulated similarity score
      _creationTime: embedding._creationTime,
    })).filter(item => item.score >= minSimilarity);

    // Calculate search metadata
    const searchTime = Date.now() - startTime;
    const avgSimilarity = searchResults.length > 0 
      ? searchResults.reduce((sum, item) => sum + item.score, 0) / searchResults.length
      : 0;

    // Calculate page info
    const pageSize = args.paginationOpts.numItems;
    const currentPage = args.paginationOpts.cursor ? 
      Math.floor(result.page.length / pageSize) + 1 : 1;

    console.log(`✅ [PAGINATED VECTOR SEARCH] Found ${searchResults.length} matches in ${searchTime}ms`);
    
    return {
      page: searchResults,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      pageInfo: {
        hasNextPage: !result.isDone,
        hasPreviousPage: currentPage > 1,
        currentPage,
        pageSize,
      },
      searchMetadata: {
        totalMatches: searchResults.length,
        avgSimilarity,
        searchTime,
      },
    };
  },
});

/**
 * Paginated formation history with detailed tracking
 */
export const getPaginatedFormationHistory = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
    filters: v.optional(v.object({
      status: v.optional(v.union(
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed")
      )),
      dateRange: v.optional(v.object({
        start: v.number(),
        end: v.number(),
      })),
    })),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("crystal_formation_runs"),
      _creationTime: v.number(),
      userId: v.string(),
      status: v.string(),
      started_at: v.number(),
      completed_at: v.optional(v.number()),
      duration_ms: v.optional(v.number()),
      crystal_count: v.optional(v.number()),
      shard_count: v.optional(v.number()),
      error_message: v.optional(v.string()),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageInfo: v.object({
      hasNextPage: v.boolean(),
      hasPreviousPage: v.boolean(),
      currentPage: v.number(),
      pageSize: v.number(),
    }),
    summary: v.object({
      totalRuns: v.number(),
      successRate: v.number(),
      avgDuration: v.number(),
      statusCounts: v.record(v.string(), v.number()),
    }),
  }),
  handler: async (ctx, args) => {
    console.log(`📄 [PAGINATED FORMATION HISTORY] Fetching history for user ${args.userId}`);
    
    // Build base query
    let query = ctx.db
      .query("crystal_formation_runs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    // Apply filters
    if (args.filters) {
      if (args.filters.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.filters!.status));
      }
      
      if (args.filters.dateRange) {
        query = query.filter((q) => 
          q.and(
            q.gte(q.field("started_at"), args.filters!.dateRange!.start),
            q.lte(q.field("started_at"), args.filters!.dateRange!.end)
          )
        );
      }
    }

    // Apply sorting (most recent first)
    query = query.order("desc");

    // Execute paginated query
    const result = await query.paginate(args.paginationOpts);
    
    // Calculate summary (for first page only)
    let summary = {
      totalRuns: 0,
      successRate: 0,
      avgDuration: 0,
      statusCounts: {} as Record<string, number>,
    };

    if (!args.paginationOpts.cursor) {
      const allRuns = await ctx.db
        .query("crystal_formation_runs")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      summary.totalRuns = allRuns.length;
      
      let totalDuration = 0;
      let completedRuns = 0;

      allRuns.forEach(run => {
        // Status counts
        summary.statusCounts[run.status] = (summary.statusCounts[run.status] || 0) + 1;
        
        // Duration calculation
        if (run.duration_ms) {
          totalDuration += run.duration_ms;
          completedRuns++;
        }
      });

      summary.successRate = allRuns.length > 0 
        ? (summary.statusCounts["completed"] || 0) / allRuns.length 
        : 0;
      
      summary.avgDuration = completedRuns > 0 ? totalDuration / completedRuns : 0;
    }

    // Calculate page info
    const pageSize = args.paginationOpts.numItems;
    const currentPage = args.paginationOpts.cursor ? 
      Math.floor(result.page.length / pageSize) + 1 : 1;

    console.log(`✅ [PAGINATED FORMATION HISTORY] Returned ${result.page.length} runs (page ${currentPage})`);
    
    return {
      page: result.page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      pageInfo: {
        hasNextPage: !result.isDone,
        hasPreviousPage: currentPage > 1,
        currentPage,
        pageSize,
      },
      summary,
    };
  },
});
