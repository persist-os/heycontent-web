import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Save or update best config for a system
 * Replaces existing config if new score is higher
 */
export const saveBestConfig = mutation({
  args: {
    system_name: v.string(),
    config_params: v.any(),
    score: v.number(),
    optimization_run_id: v.string(),
  },
  handler: async (ctx, args) => {
    const { system_name, config_params, score, optimization_run_id } = args;
    
    // Check if best config exists for this system
    const existing = await ctx.db
      .query("convergence_best_configs")
      .withIndex("by_system_name", (q) => q.eq("system_name", system_name))
      .first();
    
    const now = Date.now();
    
    if (existing) {
      // Update existing if new score is better
      if (score > existing.score) {
        return await ctx.db.patch(existing._id, {
          config_params,
          score,
          optimization_run_id,
          updated_at: now,
        });
      }
      // New score not better, return existing
      return existing._id;
    } else {
      // No existing config, create new
      return await ctx.db.insert("convergence_best_configs", {
        system_name,
        config_params,
        score,
        optimization_run_id,
        created_at: now,
        updated_at: now,
      });
    }
  },
});
