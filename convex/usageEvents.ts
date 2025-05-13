import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const logUsageEvent = mutation({
  args: {
    userId: v.string(),
    timestamp: v.number(),
    model: v.string(),
    status: v.string(),
    qty: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("usageEvents", args);
  },
});

export const listUsageEvents = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 500;
    return await ctx.db
      .query("usageEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
}); 