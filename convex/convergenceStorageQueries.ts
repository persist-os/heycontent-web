/**
 * Convergence Storage Queries - Read-only access to Convergence storage system
 * 
 * Provides queries for:
 * - RL training data retrieval and filtering
 * - Experiment analysis and comparison
 * - Run tracking and evolution progress
 * 
 * Used by The Convergence framework to:
 * - Load RL episodes for policy training
 * - Analyze experiment results
 * - Track optimization progress
 * - Generate dashboards and reports
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  rlRecordTypeValidator,
  rlTrainingDataReturnValidator,
  optimizationExperimentReturnValidator,
  optimizationRunReturnValidator,
} from "./types/convergenceStorage";

// ============================================================================
// RL TRAINING DATA QUERIES
// ============================================================================

// Internal handler functions
async function getRLDataByKeyHandler(ctx: any, args: { rl_key: string }) {
  const record = await ctx.db
    .query("convergence_rl_training_data")
    .withIndex("by_rl_key", q => q.eq("rl_key", args.rl_key))
    .first();
  
  return record || null;
}

/**
 * Get RL data by key
 * 
 * Direct lookup for specific RL records.
 * Uses by_rl_key index for O(log n) performance.
 */
export const getRLDataByKey = query({
  args: {
    rl_key: v.string(),
  },
  returns: v.union(rlTrainingDataReturnValidator, v.null()),
  handler: getRLDataByKeyHandler,
});

async function queryRLEpisodesForTrainingHandler(ctx: any, args: {
  agent_id: string;
  record_type?: string;
  station?: string;
  min_reward_score?: number;
  limit?: number;
}) {
  const limit = args.limit || 100;
  
  // Start with agent index (use only the first field of the index)
  let query = ctx.db
    .query("convergence_rl_training_data")
    .withIndex("by_agent", q => q.eq("agent_id", args.agent_id));
  
  // Apply filters for optional fields
  if (args.record_type) {
    query = query.filter(q => q.eq(q.field("rl_record_type"), args.record_type));
  }
  if (args.station) {
    query = query.filter(q => q.eq(q.field("station"), args.station));
  }
  if (args.min_reward_score !== undefined) {
    query = query.filter(q => q.gte(q.field("reward_score"), args.min_reward_score));
  }
  
  const results = await query.take(limit);
  return results.sort((a, b) => b.episode_timestamp - a.episode_timestamp);
}

/**
 * Query RL episodes for training
 * 
 * Retrieves RL episodes for a specific agent, optionally filtered by:
 * - Record type (episode, trajectory, legacy, training_run)
 * - Station (web_playground, research_library, etc.)
 * - Minimum reward score (for high-performing episodes)
 * 
 * Results are sorted by timestamp (most recent first).
 */
export const queryRLEpisodesForTraining = query({
  args: {
    agent_id: v.string(),
    record_type: v.optional(rlRecordTypeValidator),
    station: v.optional(v.string()),
    min_reward_score: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(rlTrainingDataReturnValidator),
  handler: queryRLEpisodesForTrainingHandler,
});

async function getTopRLPerformersHandler(ctx: any, args: { agent_id: string; limit?: number }) {
  const limit = args.limit || 10;
  
  const results = await ctx.db
    .query("convergence_rl_training_data")
    .withIndex("by_agent_reward", q => q.eq("agent_id", args.agent_id))
    .order("desc")
    .take(limit);
  
  return results;
}

/**
 * Get top RL performers for an agent
 * 
 * Returns the highest-scoring RL episodes for an agent.
 * Uses by_agent_reward index for efficient sorting.
 * Useful for identifying successful patterns.
 */
export const getTopRLPerformers = query({
  args: {
    agent_id: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(rlTrainingDataReturnValidator),
  handler: getTopRLPerformersHandler,
});

async function getRLDataByStationHandler(ctx: any, args: { agent_id: string; station: string; limit?: number }) {
  const limit = args.limit || 50;
  
  const results = await ctx.db
    .query("convergence_rl_training_data")
    .withIndex("by_agent_station", q => 
      q.eq("agent_id", args.agent_id).eq("station", args.station)
    )
    .take(limit);
  
  return results.sort((a, b) => b.episode_timestamp - a.episode_timestamp);
}

/**
 * Get RL data by station
 * 
 * Retrieves all RL data for a specific agent at a specific station.
 * Uses by_agent_station index for efficient filtering.
 */
export const getRLDataByStation = query({
  args: {
    agent_id: v.string(),
    station: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(rlTrainingDataReturnValidator),
  handler: getRLDataByStationHandler,
});

async function getRLTimeSeriesHandler(ctx: any, args: {
  start_timestamp: number;
  end_timestamp: number;
  agent_id?: string;
  limit?: number;
}) {
  const limit = args.limit || 500;
  
  let query = ctx.db
    .query("convergence_rl_training_data")
    .withIndex("by_timestamp", q => 
      q.gte("episode_timestamp", args.start_timestamp)
       .lte("episode_timestamp", args.end_timestamp)
    );
  
  if (args.agent_id) {
    query = query.filter(q => q.eq(q.field("agent_id"), args.agent_id));
  }
  
  const results = await query.take(limit);
  return results.sort((a, b) => a.episode_timestamp - b.episode_timestamp);
}

/**
 * Get RL time series data
 * 
 * Retrieves RL episodes within a time range for trend analysis.
 * Uses by_timestamp index for efficient range queries.
 */
export const getRLTimeSeries = query({
  args: {
    start_timestamp: v.number(),
    end_timestamp: v.number(),
    agent_id: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(rlTrainingDataReturnValidator),
  handler: getRLTimeSeriesHandler,
});

// ============================================================================
// OPTIMIZATION EXPERIMENT QUERIES
// ============================================================================

async function getExperimentsForRunHandler(ctx: any, args: { optimization_run_id: string; limit?: number }) {
  const limit = args.limit || 1000;
  
  const experiments = await ctx.db
    .query("convergence_optimization_experiments")
    .withIndex("by_run", q => q.eq("optimization_run_id", args.optimization_run_id))
    .take(limit);
  
  return experiments.sort((a, b) => a.experiment_timestamp - b.experiment_timestamp);
}

/**
 * Get experiments for optimization run
 * 
 * Retrieves all experiments from a specific optimization run.
 * Uses by_run index for efficient lookup.
 */
export const getExperimentsForRun = query({
  args: {
    optimization_run_id: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(optimizationExperimentReturnValidator),
  handler: getExperimentsForRunHandler,
});

async function getExperimentsBySystemHandler(ctx: any, args: { system_name: string; min_score?: number; limit?: number }) {
  const limit = args.limit || 100;
  
  let query = ctx.db
    .query("convergence_optimization_experiments")
    .withIndex("by_system", q => q.eq("system_name", args.system_name));
  
  if (args.min_score !== undefined) {
    query = query.filter(q => q.gte(q.field("experiment_score"), args.min_score));
  }
  
  const experiments = await query.take(limit);
  return experiments.sort((a, b) => b.experiment_score - a.experiment_score);
}

/**
 * Get experiments by system
 * 
 * Retrieves experiments for a specific system across all runs.
 * Uses by_system index for efficient filtering.
 */
export const getExperimentsBySystem = query({
  args: {
    system_name: v.string(),
    min_score: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(optimizationExperimentReturnValidator),
  handler: getExperimentsBySystemHandler,
});

async function getTopExperimentsByScoreHandler(ctx: any, args: { system_name: string; limit?: number }) {
  const limit = args.limit || 10;
  
  const experiments = await ctx.db
    .query("convergence_optimization_experiments")
    .withIndex("by_system_score", q => q.eq("system_name", args.system_name))
    .order("desc")
    .take(limit);
  
  return experiments;
}

/**
 * Get top experiments by score for a system
 * 
 * Returns the best-performing experiments for a system.
 * Uses by_system_score index for efficient sorting.
 */
export const getTopExperimentsByScore = query({
  args: {
    system_name: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(optimizationExperimentReturnValidator),
  handler: getTopExperimentsByScoreHandler,
});

async function getEvolutionProgressHandler(ctx: any, args: { optimization_run_id: string; generation?: number }) {
  let query = ctx.db
    .query("convergence_optimization_experiments")
    .withIndex("by_run_generation", q => {
      let builder = q.eq("optimization_run_id", args.optimization_run_id);
      if (args.generation !== undefined) {
        builder = builder.eq("generation_number", args.generation);
      }
      return builder;
    });
  
  const experiments = await query.collect();
  return experiments.sort((a, b) => {
    if (a.generation_number !== b.generation_number) {
      return (a.generation_number || 0) - (b.generation_number || 0);
    }
    return b.experiment_score - a.experiment_score;
  });
}

/**
 * Get evolution progress for a run
 * 
 * Retrieves experiments grouped by generation for evolutionary algorithms.
 * Uses by_run_generation index for efficient filtering.
 */
export const getEvolutionProgress = query({
  args: {
    optimization_run_id: v.string(),
    generation: v.optional(v.number()),
  },
  returns: v.array(optimizationExperimentReturnValidator),
  handler: getEvolutionProgressHandler,
});

async function getExperimentTimelineHandler(ctx: any, args: {
  start_timestamp: number;
  end_timestamp: number;
  system_name?: string;
  limit?: number;
}) {
  const limit = args.limit || 500;
  
  let query = ctx.db
    .query("convergence_optimization_experiments")
    .withIndex("by_timestamp", q =>
      q.gte("experiment_timestamp", args.start_timestamp)
       .lte("experiment_timestamp", args.end_timestamp)
    );
  
  if (args.system_name) {
    query = query.filter(q => q.eq(q.field("system_name"), args.system_name));
  }
  
  const experiments = await query.take(limit);
  return experiments.sort((a, b) => a.experiment_timestamp - b.experiment_timestamp);
}

/**
 * Get experiment timeline
 * 
 * Retrieves experiments within a time range for analysis.
 * Uses by_timestamp index for efficient range queries.
 */
export const getExperimentTimeline = query({
  args: {
    start_timestamp: v.number(),
    end_timestamp: v.number(),
    system_name: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(optimizationExperimentReturnValidator),
  handler: getExperimentTimelineHandler,
});

// ============================================================================
// OPTIMIZATION RUN QUERIES
// ============================================================================

async function getOptimizationRunHandler(ctx: any, args: { run_id: string }) {
  const run = await ctx.db
    .query("convergence_optimization_runs")
    .withIndex("by_run_id", q => q.eq("run_id", args.run_id))
    .first();
  
  return run || null;
}

/**
 * Get optimization run by ID
 * 
 * Direct lookup for a specific optimization run.
 * Uses by_run_id index for O(log n) performance.
 */
export const getOptimizationRun = query({
  args: {
    run_id: v.string(),
  },
  returns: v.union(optimizationRunReturnValidator, v.null()),
  handler: getOptimizationRunHandler,
});

async function getRunsForSystemHandler(ctx: any, args: { system_name: string; limit?: number }) {
  const limit = args.limit || 50;
  
  const runs = await ctx.db
    .query("convergence_optimization_runs")
    .withIndex("by_system", q => q.eq("system_name", args.system_name))
    .take(limit);
  
  return runs.sort((a, b) => b.run_started_at - a.run_started_at);
}

/**
 * Get optimization runs for system
 * 
 * Retrieves all optimization runs for a specific system.
 * Uses by_system index for efficient filtering.
 */
export const getRunsForSystem = query({
  args: {
    system_name: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(optimizationRunReturnValidator),
  handler: getRunsForSystemHandler,
});

async function getBestRunsByScoreHandler(ctx: any, args: { system_name: string; limit?: number }) {
  const limit = args.limit || 10;
  
  const runs = await ctx.db
    .query("convergence_optimization_runs")
    .withIndex("by_best_score", q => q.eq("system_name", args.system_name))
    .order("desc")
    .take(limit);
  
  return runs;
}

/**
 * Get best runs by score for a system
 * 
 * Returns the most successful optimization runs for a system.
 * Uses by_best_score index for efficient sorting.
 */
export const getBestRunsByScore = query({
  args: {
    system_name: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(optimizationRunReturnValidator),
  handler: getBestRunsByScoreHandler,
});

async function getRecentRunsHandler(ctx: any, args: { limit?: number; system_name?: string }) {
  const limit = args.limit || 20;
  
  let query = ctx.db.query("convergence_optimization_runs");
  
  if (args.system_name) {
    query = query.withIndex("by_system", q => q.eq("system_name", args.system_name));
  }
  
  const runs = await query.take(limit);
  return runs.sort((a, b) => b.run_started_at - a.run_started_at);
}

/**
 * Get recent optimization runs
 * 
 * Retrieves the most recent optimization runs across all systems.
 */
export const getRecentRuns = query({
  args: {
    limit: v.optional(v.number()),
    system_name: v.optional(v.string()),
  },
  returns: v.array(optimizationRunReturnValidator),
  handler: getRecentRunsHandler,
});

async function getSystemOptimizationStatsHandler(ctx: any, args: { system_name: string }) {
  const runs = await ctx.db
    .query("convergence_optimization_runs")
    .withIndex("by_system", q => q.eq("system_name", args.system_name))
    .collect();
  
  if (runs.length === 0) {
    return {
      total_runs: 0,
      completed_runs: 0,
      best_score_ever: 0,
      avg_best_score: 0,
      total_experiments: 0,
      avg_experiments_per_run: 0,
      convergence_rate: 0,
      last_run_timestamp: null,
    };
  }
  
  const completed = runs.filter(r => r.run_completed_at);
  const best_scores = runs.map(r => r.best_experiment_score);
  const best_score_ever = Math.max(...best_scores);
  const avg_best_score = best_scores.reduce((a, b) => a + b, 0) / best_scores.length;
  
  const total_experiments = runs.reduce((sum, r) => sum + r.total_experiments_run, 0);
  const avg_experiments = total_experiments / runs.length;
  
  const converged = runs.filter(r => r.convergence_achieved).length;
  const convergence_rate = completed.length > 0 ? converged / completed.length : 0;
  
  const last_run_timestamp = Math.max(...runs.map(r => r.run_started_at));
  
  return {
    total_runs: runs.length,
    completed_runs: completed.length,
    best_score_ever,
    avg_best_score,
    total_experiments,
    avg_experiments_per_run: avg_experiments,
    convergence_rate,
    last_run_timestamp,
  };
}

/**
 * Get optimization stats for system
 * 
 * Returns comprehensive statistics for a system's optimization history:
 * - Total runs completed
 * - Best score achieved
 * - Average scores
 * - Total experiments run
 * - Convergence rate
 */
export const getSystemOptimizationStats = query({
  args: {
    system_name: v.string(),
  },
  returns: v.object({
    total_runs: v.number(),
    completed_runs: v.number(),
    best_score_ever: v.number(),
    avg_best_score: v.number(),
    total_experiments: v.number(),
    avg_experiments_per_run: v.number(),
    convergence_rate: v.number(),
    last_run_timestamp: v.union(v.number(), v.null()),
  }),
  handler: getSystemOptimizationStatsHandler,
});

/**
 * Master query for flexible storage retrieval
 * 
 * Unified interface for all storage queries with operation-based routing.
 * 
 * @example
 * ```typescript
 * // Get RL data
 * const data = await queryStorage({
 *   operation: "get_rl_by_key",
 *   rl_key: "episode:agent_1:001"
 * });
 * 
 * // Get experiments
 * const experiments = await queryStorage({
 *   operation: "get_experiments_for_run",
 *   run_id: "run_abc123"
 * });
 * ```
 */
export const queryStorage = query({
  args: {
    operation: v.union(
      v.literal("get_rl_by_key"),
      v.literal("query_rl_episodes"),
      v.literal("get_top_rl_performers"),
      v.literal("get_experiments_for_run"),
      v.literal("get_experiments_by_system"),
      v.literal("get_optimization_run"),
      v.literal("get_runs_for_system"),
      v.literal("get_system_stats")
    ),
    rl_key: v.optional(v.string()),
    agent_id: v.optional(v.string()),
    record_type: v.optional(rlRecordTypeValidator),
    optimization_run_id: v.optional(v.string()),
    system_name: v.optional(v.string()),
    run_id: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { operation } = args;
    
    switch (operation) {
      case "get_rl_by_key":
        if (!args.rl_key) throw new Error("rl_key required");
        return await getRLDataByKeyHandler(ctx, { rl_key: args.rl_key });
      
      case "query_rl_episodes":
        if (!args.agent_id) throw new Error("agent_id required");
        return await queryRLEpisodesForTrainingHandler(ctx, {
          agent_id: args.agent_id,
          record_type: args.record_type,
          limit: args.limit,
        });
      
      case "get_top_rl_performers":
        if (!args.agent_id) throw new Error("agent_id required");
        return await getTopRLPerformersHandler(ctx, {
          agent_id: args.agent_id,
          limit: args.limit,
        });
      
      case "get_experiments_for_run":
        if (!args.optimization_run_id) throw new Error("optimization_run_id required");
        return await getExperimentsForRunHandler(ctx, {
          optimization_run_id: args.optimization_run_id,
          limit: args.limit,
        });
      
      case "get_experiments_by_system":
        if (!args.system_name) throw new Error("system_name required");
        return await getExperimentsBySystemHandler(ctx, {
          system_name: args.system_name,
          limit: args.limit,
        });
      
      case "get_optimization_run":
        if (!args.run_id) throw new Error("run_id required");
        return await getOptimizationRunHandler(ctx, { run_id: args.run_id });
      
      case "get_runs_for_system":
        if (!args.system_name) throw new Error("system_name required");
        return await getRunsForSystemHandler(ctx, {
          system_name: args.system_name,
          limit: args.limit,
        });
      
      case "get_system_stats":
        if (!args.system_name) throw new Error("system_name required");
        return await getSystemOptimizationStatsHandler(ctx, { system_name: args.system_name });
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
});

