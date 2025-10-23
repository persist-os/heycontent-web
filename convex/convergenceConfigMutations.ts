import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new convergence config (winning configuration from optimization)
 */
export const createConvergenceConfig = mutation({
  args: {
    system_name: v.string(),
    config_type: v.string(),
    params: v.any(),
    contextTag: v.optional(v.string()),
    embedding: v.optional(v.array(v.number())),
    score: v.number(),
    rank: v.number(),
    test_cases_passed: v.number(),
    test_cases_total: v.number(),
    optimization_run_id: v.string(),
    algorithm_used: v.string(),
    version: v.string(),
    generation: v.optional(v.number()),
    metrics: v.optional(v.any()),
    status: v.optional(v.string()),
    deployed_at: v.optional(v.number()),
    archived_at: v.optional(v.number()),
    usage_count: v.optional(v.number()),
    success_rate: v.optional(v.number()),
    last_used: v.optional(v.number()),
    replaces_config_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const config = {
      ...args,
      createdAt: now,
      updatedAt: now,
    };
    
    return await ctx.db.insert("convergence_configs", config);
  },
});

/**
 * Update convergence config status
 */
export const updateConvergenceConfigStatus = mutation({
  args: {
    configId: v.id("convergence_configs"),
    status: v.string(),
    deployed_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { configId, status, deployed_at } = args;
    
    await ctx.db.patch(configId, {
      status,
      deployed_at,
      updatedAt: Date.now(),
    });
    
    return configId;
  },
});

/**
 * Update convergence config usage tracking
 */
export const updateConvergenceConfigUsage = mutation({
  args: {
    configId: v.id("convergence_configs"),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { configId, success } = args;
    
    // Get current config
    const config = await ctx.db.get(configId);
    if (!config) {
      throw new Error("Config not found");
    }
    
    // Update usage tracking
    const newUsageCount = (config.usage_count || 0) + 1;
    const newSuccessCount = success ? (config.success_rate || 0) * (config.usage_count || 0) + 1 : (config.success_rate || 0) * (config.usage_count || 0);
    const newSuccessRate = newSuccessCount / newUsageCount;
    
    await ctx.db.patch(configId, {
      usage_count: newUsageCount,
      success_rate: newSuccessRate,
      last_used: Date.now(),
      updatedAt: Date.now(),
    });
    
    return configId;
  },
});
