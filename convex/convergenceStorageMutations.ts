/**
 * Convergence Storage Mutations - Write operations for Convergence storage system
 * 
 * Provides mutations for:
 * - Optimization experiments (config testing and evolution)
 * - Optimization runs (high-level run metadata)
 * 
 * Used by The Convergence framework to store:
 * - Experiment results from optimization runs
 * - Run summaries and winner promotions
 * 
 * STORAGE FLOW:
 * 1. Start run → save to convergence_optimization_runs
 * 2. Run experiments → save to convergence_optimization_experiments
 * 3. Complete run → update run with results, promote winners to convergence_best_configs
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  optimizationExperimentValidator,
  optimizationRunValidator,
} from "./types/convergenceStorage";

// ============================================================================
// OPTIMIZATION EXPERIMENT MUTATIONS
// ============================================================================

async function saveExperimentHandler(ctx: any, args: any) {
  const now = Date.now();
  
  const id = await ctx.db.insert("convergence_optimization_experiments", {
    ...args,
    createdAt: now,
  });
  
  return id;
}

/**
 * Save optimization experiment result
 * 
 * Records the result of testing a single config on a single test case.
 * Part of the optimization run's audit trail.
 */
export const saveExperiment = mutation({
  args: optimizationExperimentValidator,
  returns: v.id("convergence_optimization_experiments"),
  handler: saveExperimentHandler,
});

async function batchSaveExperimentsHandler(ctx: any, args: { experiments: any[] }) {
  const experiment_ids: Id<"convergence_optimization_experiments">[] = [];
  
  for (const experiment of args.experiments) {
    const id = await saveExperimentHandler(ctx, experiment);
    experiment_ids.push(id);
  }
  
  return {
    success: true,
    experiment_ids,
    count: experiment_ids.length,
  };
}

/**
 * Batch save experiments (for optimization runs)
 * 
 * Efficiently saves multiple experiment results from a single optimization run.
 * Much faster than individual saves when processing many experiments.
 */
export const batchSaveExperiments = mutation({
  args: {
    experiments: v.array(optimizationExperimentValidator),
  },
  returns: v.object({
    success: v.boolean(),
    experiment_ids: v.array(v.id("convergence_optimization_experiments")),
    count: v.number(),
  }),
  handler: batchSaveExperimentsHandler,
});

// ============================================================================
// OPTIMIZATION RUN MUTATIONS
// ============================================================================

async function startOptimizationRunHandler(ctx: any, args: {
  run_id: string;
  system_name: string;
  algorithm_name: string;
}) {
  const now = Date.now();
  
  const id = await ctx.db.insert("convergence_optimization_runs", {
    run_id: args.run_id,
    system_name: args.system_name,
    algorithm_name: args.algorithm_name,
    run_started_at: now,
    total_experiments_run: 0,
    best_experiment_score: 0,
    avg_experiment_score: 0,
    createdAt: now,
  });
  
  return id;
}

/**
 * Start optimization run
 * 
 * Creates a new optimization run record with initial state.
 * Call this at the beginning of an optimization session.
 */
export const startOptimizationRun = mutation({
  args: {
    run_id: v.string(),
    system_name: v.string(),
    algorithm_name: v.string(),
  },
  returns: v.id("convergence_optimization_runs"),
  handler: startOptimizationRunHandler,
});

async function completeOptimizationRunHandler(ctx: any, args: {
  run_id: string;
  winning_config_snapshot?: any;
  total_generations?: number;
  convergence_achieved?: boolean;
}) {
  const now = Date.now();
  
  const run = await ctx.db
    .query("convergence_optimization_runs")
    .withIndex("by_run_id", q => q.eq("run_id", args.run_id))
    .first();
  
  if (!run) {
    throw new Error(`Run ${args.run_id} not found`);
  }
  
  const experiments = await ctx.db
    .query("convergence_optimization_experiments")
    .withIndex("by_run", q => q.eq("optimization_run_id", args.run_id))
    .collect();
  
  const total_experiments = experiments.length;
  const best_score = total_experiments > 0
    ? Math.max(...experiments.map(e => e.experiment_score))
    : 0;
  const avg_score = total_experiments > 0
    ? experiments.reduce((sum, e) => sum + e.experiment_score, 0) / total_experiments
    : 0;
  
  const byGeneration: Record<number, any[]> = {};
  experiments.forEach(exp => {
    const gen = exp.generation_number ?? 0;
    if (!byGeneration[gen]) byGeneration[gen] = [];
    byGeneration[gen].push(exp);
  });
  
  const experiments_by_generation = Object.entries(byGeneration).map(([gen, exps]) => ({
    generation: parseInt(gen),
    count: exps.length,
    best_score: Math.max(...exps.map(e => e.experiment_score)),
    avg_score: exps.reduce((sum, e) => sum + e.experiment_score, 0) / exps.length,
  }));
  
  await ctx.db.patch(run._id, {
    run_completed_at: now,
    total_duration_ms: now - run.run_started_at,
    total_experiments_run: total_experiments,
    best_experiment_score: best_score,
    avg_experiment_score: avg_score,
    experiments_by_generation,
    winning_config_snapshot: args.winning_config_snapshot,
    total_generations: args.total_generations,
    convergence_achieved: args.convergence_achieved,
  });
  
  return run._id;
}

/**
 * Complete optimization run
 * 
 * Updates run with final results and winning config snapshot.
 * Automatically calculates duration and aggregates experiment stats.
 */
export const completeOptimizationRun = mutation({
  args: {
    run_id: v.string(),
    winning_config_snapshot: v.optional(v.any()),
    total_generations: v.optional(v.number()),
    convergence_achieved: v.optional(v.boolean()),
  },
  returns: v.id("convergence_optimization_runs"),
  handler: completeOptimizationRunHandler,
});

async function updateOptimizationRunProgressHandler(ctx: any, args: {
  run_id: string;
  experiments_completed: number;
  current_best_score: number;
}) {
  const run = await ctx.db
    .query("convergence_optimization_runs")
    .withIndex("by_run_id", q => q.eq("run_id", args.run_id))
    .first();
  
  if (!run) {
    throw new Error(`Run ${args.run_id} not found`);
  }
  
  await ctx.db.patch(run._id, {
    total_experiments_run: args.experiments_completed,
    best_experiment_score: Math.max(run.best_experiment_score, args.current_best_score),
  });
  
  return run._id;
}

/**
 * Update optimization run progress
 * 
 * Updates run stats during execution (for long-running optimizations).
 * Call periodically to track progress.
 */
export const updateOptimizationRunProgress = mutation({
  args: {
    run_id: v.string(),
    experiments_completed: v.number(),
    current_best_score: v.number(),
  },
  returns: v.id("convergence_optimization_runs"),
  handler: updateOptimizationRunProgressHandler,
});

/**
 * Master mutation for flexible storage operations
 * 
 * Unified interface for all storage mutations with operation-based routing.
 * 
 * @example
 * ```typescript
 * // Save experiment
 * await mutateStorage({
 *   operation: "save_experiment",
 *   data: { experiment_id: "exp_1", ... }
 * });
 * 
 * // Start run
 * await mutateStorage({
 *   operation: "start_run",
 *   data: { run_id: "run_123", ... }
 * });
 * ```
 */
export const mutateStorage = mutation({
  args: {
    operation: v.union(
      v.literal("save_experiment"),
      v.literal("start_run"),
      v.literal("complete_run"),
      v.literal("update_run_progress")
    ),
    data: v.optional(v.any()),
    run_id: v.optional(v.string()),
    experiments_completed: v.optional(v.number()),
    current_best_score: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { operation } = args;
    
    switch (operation) {
      case "save_experiment":
        if (!args.data) throw new Error("data required for save_experiment");
        return await saveExperimentHandler(ctx, args.data);
      
      case "start_run":
        if (!args.data) throw new Error("data required for start_run");
        return await startOptimizationRunHandler(ctx, args.data);
      
      case "complete_run":
        if (!args.run_id) throw new Error("run_id required for complete_run");
        return await completeOptimizationRunHandler(ctx, {
          run_id: args.run_id,
          winning_config_snapshot: args.data,
        });
      
      case "update_run_progress":
        if (!args.run_id || args.experiments_completed === undefined || args.current_best_score === undefined) {
          throw new Error("run_id, experiments_completed, and current_best_score required");
        }
        return await updateOptimizationRunProgressHandler(ctx, {
          run_id: args.run_id,
          experiments_completed: args.experiments_completed,
          current_best_score: args.current_best_score,
        });
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
});

