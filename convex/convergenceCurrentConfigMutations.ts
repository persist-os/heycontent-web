import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const setCurrentConfig = mutation({
  args: {
    user_id: v.string(),
    config_id: v.string(),
    preset_id: v.optional(v.string()),
    name: v.string(),
    description: v.string(),
    config: v.any(),
    test_cases: v.any(),
    evaluator_code: v.optional(v.string()),
    system_name: v.string(),
    algorithm: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // First, remove any existing current config for this user
    const existingConfigs = await ctx.db
      .query("convergence_current_config")
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .collect();
    
    for (const existing of existingConfigs) {
      await ctx.db.delete(existing._id);
    }
    
    // Create new current config
    const currentConfig = {
      ...args,
      createdAt: now,
      updatedAt: now,
    };
    
    return await ctx.db.insert("convergence_current_config", currentConfig);
  },
});

export const updateCurrentConfigStatus = mutation({
  args: {
    user_id: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const currentConfig = await ctx.db
      .query("convergence_current_config")
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .first();
    
    if (currentConfig) {
      await ctx.db.patch(currentConfig._id, {
        status: args.status,
        updatedAt: Date.now(),
      });
    }
  },
});

export const clearCurrentConfig = mutation({
  args: {
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const currentConfig = await ctx.db
      .query("convergence_current_config")
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .first();
    
    if (currentConfig) {
      await ctx.db.delete(currentConfig._id);
    }
  },
});
