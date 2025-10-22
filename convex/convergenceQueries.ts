/**
 * Convergence Queries - Read-only access to Convergence-optimized configurations
 * 
 * Provides queries for:
 * - Configuration retrieval by system/rank/status
 * - Configuration analysis and statistics
 * - Performance metrics and usage tracking
 * 
 * Used by The Convergence framework to load optimized parameters for:
 * - MAB systems (context enrichment, crystal thresholds, intelligence triggers)
 * - Tool workflows (Reddit tools, search tools, extraction tools)
 * - Agent configurations
 * - Feature-specific parameters
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { 
  configTypeValidator,
  configStatusValidator,
  convergenceConfigValidator,
  convergenceConfigReturnValidator
} from "./types/convergence";

/**
 * Shared handler for flexible config retrieval with index optimization
 * 
 * @param ctx - Convex query context
 * @param system_name - The system to query configs for
 * @param options - Query configuration object
 * @param options.useIndex - Index name for optimization
 * @param options.status - Filter by status
 * @param options.rank - Filter by specific rank
 * @param options.limit - Maximum number of results
 * @param options.orderBy - Sort direction
 * @returns Promise resolving to query results
 */
const queryConfigsWithOptions = async (
  ctx: any,
  system_name: string,
  options: {
    useIndex?: string;
    status?: string;
    rank?: number;
    limit?: number;
    orderBy?: "asc" | "desc";
  } = {}
) => {
  // Build base query with optimized index
  const baseQuery = ctx.db.query("convergence_configs");
  
  // Use the most specific index available
  let indexedQuery;
  if (options.useIndex === "by_system_rank" && options.rank !== undefined) {
    // Most specific: system + rank
    indexedQuery = baseQuery.withIndex("by_system_rank", (q: any) =>
      q.eq("system_name", system_name).eq("rank", options.rank)
    );
  } else if (options.useIndex === "by_system_status" && options.status) {
    // Specific: system + status
    indexedQuery = baseQuery.withIndex("by_system_status", (q: any) =>
      q.eq("system_name", system_name).eq("status", options.status)
    );
  } else {
    // Default: system only
    indexedQuery = baseQuery.withIndex("by_system", (q: any) =>
      q.eq("system_name", system_name)
    );
  }
  
  // Apply status filter if not in index
  let filteredQuery = indexedQuery;
  if (options.status && options.useIndex !== "by_system_status") {
    filteredQuery = indexedQuery.filter((q: any) =>
      q.eq(q.field("status"), options.status)
    );
  }
  
  // Apply ordering
  let orderedQuery = filteredQuery;
  if (options.orderBy) {
    orderedQuery = filteredQuery.order(options.orderBy);
  }
  
  // Execute with limits
  if (options.limit) {
    return await orderedQuery.take(options.limit);
  } else {
    return await orderedQuery.collect();
  }
};

/**
 * Master function for flexible convergence config retrieval
 * 
 * Provides a unified interface for querying convergence_configs table
 * with support for various indexes, filters, and result constraints.
 * 
 * @example
 * ```typescript
 * // Get top 5 active configs for a system
 * const configs = await getConfigs(ctx, {
 *   system_name: "context_enrichment",
 *   operation: "top",
 *   limit: 5,
 *   status: "active"
 * });
 * 
 * // Get specific config by rank
 * const config = await getConfigs(ctx, {
 *   system_name: "crystal_thresholds",
 *   operation: "by_rank",
 *   rank: 1,
 *   status: "active"
 * });
 * ```
 */
export const getConfigs = query({
  args: {
    system_name: v.string(),
    operation: v.union(
      v.literal("top"),        // Get top N ranked configs
      v.literal("by_rank"),    // Get single config by rank
      v.literal("all"),        // Get all configs for system
      v.literal("by_status")   // Get all configs with specific status
    ),
    status: v.optional(configStatusValidator),
    rank: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.union(v.array(convergenceConfigReturnValidator), v.null()),
  handler: async (ctx, args) => {
    const { system_name, operation, status, rank, limit } = args;
    
    switch (operation) {
      case "top":
        // Get top N configs, ranked by performance
        return await queryConfigsWithOptions(ctx, system_name, {
          useIndex: status ? "by_system_status" : "by_system_rank",
          status: status || "active",
          limit: limit || 3,
          orderBy: "asc", // rank 1 is best
        });
      
      case "by_rank":
        // Get single config by specific rank
        if (rank === undefined) {
          throw new Error("rank parameter required for by_rank operation");
        }
        const configs = await queryConfigsWithOptions(ctx, system_name, {
          useIndex: "by_system_rank",
          status: status || "active",
          rank,
          limit: 1,
        });
        return configs[0] || null;
      
      case "all":
        // Get all configs for system, sorted by rank
        const allConfigs = await queryConfigsWithOptions(ctx, system_name, {
          status,
          orderBy: "asc",
        });
        return allConfigs.sort((a, b) => a.rank - b.rank);
      
      case "by_status":
        // Get all configs with specific status
        if (!status) {
          throw new Error("status parameter required for by_status operation");
        }
        return await queryConfigsWithOptions(ctx, system_name, {
          useIndex: "by_system_status",
          status,
          orderBy: "asc",
        });
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
});

/**
 * Get top N configs for a system (convenience function)
 * 
 * Optimized for quick retrieval of best-performing configs.
 * Uses by_system_rank index for efficient lookup.
 */
export const getTopConfigs = query({
  args: {
    system_name: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(configStatusValidator),
  },
  returns: v.array(convergenceConfigReturnValidator),
  handler: async (ctx, args) => {
    return await queryConfigsWithOptions(ctx, args.system_name, {
      useIndex: args.status ? "by_system_status" : "by_system_rank",
      status: args.status || "active",
      limit: args.limit || 3,
      orderBy: "asc",
    });
  },
});

/**
 * Get single config by rank (convenience function)
 * 
 * Optimized for direct lookup by system name and rank.
 * Uses by_system_rank compound index for O(log n) lookup.
 */
export const getConfigByRank = query({
  args: {
    system_name: v.string(),
    rank: v.number(),
    status: v.optional(configStatusValidator),
  },
  returns: v.union(convergenceConfigReturnValidator, v.null()),
  handler: async (ctx, args) => {
    const configs = await queryConfigsWithOptions(ctx, args.system_name, {
      useIndex: "by_system_rank",
      status: args.status || "active",
      rank: args.rank,
      limit: 1,
    });
    
    return configs[0] || null;
  },
});

/**
 * Get all configs for a system (for analysis)
 * 
 * Returns all configurations regardless of status, sorted by rank.
 * Useful for analysis, comparison, and historical review.
 */
export const getAllConfigs = query({
  args: {
    system_name: v.string(),
    status: v.optional(configStatusValidator),
  },
  returns: v.array(convergenceConfigReturnValidator),
  handler: async (ctx, args) => {
    const configs = await queryConfigsWithOptions(ctx, args.system_name, {
      status: args.status,
      orderBy: "asc",
    });
    
    return configs.sort((a, b) => a.rank - b.rank);
  },
});

/**
 * Get configs by optimization run ID
 * 
 * Retrieves all configurations generated during a specific optimization run.
 * Uses by_optimization_run index for efficient lookup.
 */
export const getConfigsByOptimizationRun = query({
  args: {
    optimization_run_id: v.string(),
  },
  returns: v.array(convergenceConfigReturnValidator),
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("convergence_configs")
      .withIndex("by_optimization_run", (q) =>
        q.eq("optimization_run_id", args.optimization_run_id)
      )
      .collect();
    
    return configs.sort((a, b) => a.rank - b.rank);
  },
});

/**
 * Get configs by type across all systems
 * 
 * Retrieves all configurations of a specific type (e.g., "mab_params", "tool_workflow").
 * Uses by_type index for efficient lookup.
 */
export const getConfigsByType = query({
  args: {
    config_type: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(convergenceConfigReturnValidator),
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("convergence_configs")
      .withIndex("by_type", (q) =>
        q.eq("config_type", args.config_type)
      )
      .take(args.limit || 100);
    
    return configs.sort((a, b) => a.rank - b.rank);
  },
});

/**
 * Get configs by score range for a system
 * 
 * Retrieves configurations within a specific score range for a system.
 * Uses by_score index for efficient range queries.
 */
export const getConfigsByScore = query({
  args: {
    system_name: v.string(),
    min_score: v.optional(v.number()),
    max_score: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(convergenceConfigReturnValidator),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("convergence_configs")
      .withIndex("by_score", (q) =>
        q.eq("system_name", args.system_name)
      );
    
    // Apply score filters
    if (args.min_score !== undefined) {
      query = query.filter((q) => q.gte(q.field("score"), args.min_score));
    }
    if (args.max_score !== undefined) {
      query = query.filter((q) => q.lte(q.field("score"), args.max_score));
    }
    
    const configs = await query
      .take(args.limit || 50);
    
    return configs.sort((a, b) => b.score - a.score); // Sort by score descending
  },
});

/**
 * Get comprehensive stats for a system
 * 
 * Returns statistics including:
 * - Config counts by status
 * - Performance metrics (best/average scores)
 * - Deployment status
 * - Usage tracking
 * 
 * Useful for monitoring system health and optimization progress.
 */
export const getSystemStats = query({
  args: {
    system_name: v.string(),
  },
  returns: v.object({
    total_configs: v.number(),
    active_configs: v.number(),
    candidate_configs: v.number(),
    archived_configs: v.number(),
    best_score: v.number(),
    avg_score: v.number(),
    total_usage: v.number(),
    avg_success_rate: v.number(),
    last_updated: v.number(),
    last_deployed: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("convergence_configs")
      .withIndex("by_system", (q) => q.eq("system_name", args.system_name))
      .collect();
    
    if (configs.length === 0) {
      return {
        total_configs: 0,
        active_configs: 0,
        candidate_configs: 0,
        archived_configs: 0,
        best_score: 0,
        avg_score: 0,
        total_usage: 0,
        avg_success_rate: 0,
        last_updated: 0,
        last_deployed: null,
      };
    }
    
    const active = configs.filter((c) => c.status === "active");
    const candidates = configs.filter((c) => c.status === "candidate");
    const archived = configs.filter((c) => c.status === "archived");
    
    const scores = configs.map((c) => c.score);
    const best_score = Math.max(...scores);
    const avg_score = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    const total_usage = configs.reduce((sum, c) => sum + (c.usage_count || 0), 0);
    const configsWithUsage = configs.filter((c) => c.usage_count && c.usage_count > 0);
    const avg_success_rate = configsWithUsage.length > 0
      ? configsWithUsage.reduce((sum, c) => sum + (c.success_rate || 0), 0) / configsWithUsage.length
      : 0;
    
    const last_updated = Math.max(...configs.map((c) => c.updatedAt));
    const deployedConfigs = configs.filter((c) => c.deployed_at);
    const last_deployed = deployedConfigs.length > 0
      ? Math.max(...deployedConfigs.map((c) => c.deployed_at!))
      : null;
    
    return {
      total_configs: configs.length,
      active_configs: active.length,
      candidate_configs: candidates.length,
      archived_configs: archived.length,
      best_score,
      avg_score,
      total_usage,
      avg_success_rate,
      last_updated,
      last_deployed,
    };
  },
});

/**
 * Search configs by context
 * 
 * For now, returns top-ranked configs filtered by contextTag.
 * Vector similarity search will be added when Convex vector search API is integrated.
 */
export const searchConfigsByContext = query({
  args: {
    system_name: v.string(),
    contextTag: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(convergenceConfigReturnValidator),
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    
    let query = ctx.db
      .query("convergence_configs")
      .withIndex("by_system_rank", (q) => 
        q.eq("system_name", args.system_name)
      );
    
    // Filter by contextTag if provided
    if (args.contextTag) {
      query = query.filter((q) => 
        q.eq(q.field("contextTag"), args.contextTag)
      );
    }
    
    const results = await query.take(limit);
    return results;
  },
});

