import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get best config for a specific system
 */
export const getBestConfig = query({
  args: { system_name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("convergence_best_configs")
      .withIndex("by_system_name", (q) => q.eq("system_name", args.system_name))
      .first();
  },
});

/**
 * Get all best configs (one per system)
 */
export const getAllBestConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("convergence_best_configs").collect();
  },
});

/**
 * Get best configs sorted by score for a specific system
 */
export const getBestConfigsBySystem = query({
  args: { system_name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("convergence_best_configs")
      .withIndex("by_system_name", (q) => q.eq("system_name", args.system_name))
      .order("desc")
      .collect();
  },
});
