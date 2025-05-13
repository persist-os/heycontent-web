import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUbpSettings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ubpSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const setUbpSettings = mutation({
  args: {
    userId: v.string(),
    enabled: v.boolean(),
    premiumEnabled: v.boolean(),
    monthlyLimit: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ubpSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        enabled: args.enabled,
        premiumEnabled: args.premiumEnabled,
        monthlyLimit: args.monthlyLimit,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("ubpSettings", {
        userId: args.userId,
        enabled: args.enabled,
        premiumEnabled: args.premiumEnabled,
        monthlyLimit: args.monthlyLimit,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
}); 