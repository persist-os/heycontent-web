import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createPresetConfig = mutation({
  args: {
    preset_id: v.string(),
    name: v.string(),
    description: v.string(),
    config: v.any(),
    test_cases: v.any(),
    evaluator_code: v.optional(v.string()),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("convergence_preset_configs", {
      preset_id: args.preset_id,
      name: args.name,
      description: args.description,
      config: args.config,
      test_cases: args.test_cases,
      evaluator_code: args.evaluator_code,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePresetConfig = mutation({
  args: {
    id: v.id("convergence_preset_configs"),
    preset_id: v.optional(v.string()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    config: v.optional(v.any()),
    test_cases: v.optional(v.any()),
    evaluator_code: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deletePresetConfig = mutation({
  args: {
    id: v.id("convergence_preset_configs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
