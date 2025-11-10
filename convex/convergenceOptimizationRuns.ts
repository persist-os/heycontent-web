import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Save optimization run history
 * Tracks all runs for a system, filterable by system type
 */
export const saveRunHistory = mutation({
  args: {
    run_id: v.string(),
    system_name: v.string(),
    algorithm: v.string(),
    best_score: v.number(),
    best_config: v.any(),
    total_experiments: v.number(),
    started_at: v.number(),
    completed_at: v.number(),
  },
  handler: async (ctx, args) => {
    // Use existing convergence_optimization_runs table
    return await ctx.db.insert("convergence_optimization_runs", {
      run_id: args.run_id,
      system_name: args.system_name,
      algorithm_name: args.algorithm,
      run_started_at: args.started_at,
      run_completed_at: args.completed_at,
      total_duration_ms: args.completed_at - args.started_at,
      total_experiments_run: args.total_experiments,
      best_experiment_score: args.best_score,
      avg_experiment_score: args.best_score, // Simplified for now
      winning_config_snapshot: args.best_config,
      createdAt: Date.now(),
    });
  },
});
