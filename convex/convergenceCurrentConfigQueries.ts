import { query } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentConfig = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("convergence_current_config")
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .first();
  },
});

export const getAllCurrentConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("convergence_current_config").collect();
  },
});
