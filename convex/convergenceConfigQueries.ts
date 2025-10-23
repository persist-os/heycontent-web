import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get convergence configs by system name
 */
export const getConvergenceConfigsBySystem = query({
  args: {
    system_name: v.string(),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { system_name, status, limit = 10 } = args;
    
    let query = ctx.db
      .query("convergence_configs")
      .filter((q) => q.eq(q.field("system_name"), system_name));
    
    if (status) {
      query = query.filter((q) => q.eq(q.field("status"), status));
    }
    
    // Order by rank (best first)
    query = query.order("asc", "rank");
    
    if (limit) {
      return await query.take(limit);
    }
    
    return await query.collect();
  },
});

/**
 * Get convergence config by ID
 */
export const getConvergenceConfigById = query({
  args: {
    configId: v.id("convergence_configs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.configId);
  },
});

/**
 * Get best convergence config for a system
 */
export const getBestConvergenceConfig = query({
  args: {
    system_name: v.string(),
  },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("convergence_configs")
      .filter((q) => q.eq(q.field("system_name"), args.system_name))
      .filter((q) => q.eq(q.field("rank"), 1)) // Best rank
      .order("desc", "score") // Highest score first
      .take(1);
    
    return configs[0] || null;
  },
});

/**
 * Get convergence configs by optimization run
 */
export const getConvergenceConfigsByRun = query({
  args: {
    optimization_run_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("convergence_configs")
      .filter((q) => q.eq(q.field("optimization_run_id"), args.optimization_run_id))
      .order("asc", "rank")
      .collect();
  },
});

/**
 * Get all convergence configs (for admin view)
 */
export const getAllConvergenceConfigs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 50 } = args;
    
    return await ctx.db
      .query("convergence_configs")
      .order("desc", "createdAt")
      .take(limit);
  },
});
