import { query } from "./_generated/server";
import { v } from "convex/values";

export const getPresetConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("convergence_preset_configs").collect();
  },
});

export const getPresetConfigById = query({
  args: {
    preset_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("convergence_preset_configs")
      .filter((q) => q.eq(q.field("preset_id"), args.preset_id))
      .first();
  },
});

export const getPresetConfigByConvexId = query({
  args: {
    id: v.id("convergence_preset_configs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
