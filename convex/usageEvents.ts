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

// Aggregate usage for a user for the current period
export const getUsageSummary = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Find the user and their subscription info
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    // Defensive: handle missing user or missing subscription gracefully
    if (!user || !user.subscription) {
      return { total: 0, included: 0, overage: 0 };
    }
    const { currentPeriodStart, currentPeriodEnd, includedRequests } = user.subscription;
    // Defensive: handle missing fields
    const periodStart = typeof currentPeriodStart === "number" ? currentPeriodStart : 0;
    const periodEnd = typeof currentPeriodEnd === "number" ? currentPeriodEnd : Date.now();
    const included = typeof includedRequests === "number" ? includedRequests : 0;
    // Sum all usageEvents in the current period
    const events = await ctx.db
      .query("usageEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const filteredEvents = events.filter((event) => event.timestamp >= periodStart && event.timestamp < periodEnd);
    const total = filteredEvents.reduce((sum, e) => sum + (e.qty || 0), 0);
    const overage = Math.max(0, total - included);
    return { total, included, overage };
  },
});

// Reset usage for a new period (optionally called by a cron or admin)
export const resetUsageForPeriod = mutation({
  args: { userId: v.string(), periodStart: v.number(), periodEnd: v.number(), includedRequests: v.number() },
  handler: async (ctx, args) => {
    // Optionally archive usageEvents or just update the user's usage field
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!user) return { success: false };
    await ctx.db.patch(
      user._id,
      {
        subscription: {
          ...user.subscription,
          currentPeriodStart: args.periodStart,
          currentPeriodEnd: args.periodEnd,
          includedRequests: args.includedRequests,
          usedRequests: 0,
          lastSyncedAt: Date.now(),
        },
      }
    );
    return { success: true };
  },
});

// Update user's usage field (after logging an event)
export const updateUserUsage = mutation({
  args: { userId: v.string(), qty: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!user) {
      console.warn("updateUserUsage: User not found", args.userId);
      return { success: false, error: "User not found" };
    }
    if (!user.subscription) {
      console.warn("updateUserUsage: User subscription not found", args.userId);
      return { success: false, error: "User subscription not found" };
    }
    const sub = user.subscription;
    const used = sub.usedRequests || 0;
    const quota = sub.includedRequests || 0;
    let overage = 0;
    let newUsed = used + args.qty;
    if (newUsed > quota) {
      overage = newUsed - quota;
      newUsed = quota + overage;
    }
    // Update the user's subscription usage
    await ctx.db.patch(user._id, {
      subscription: {
        ...sub,
        usedRequests: newUsed,
      },
    });
    return {
      success: true,
      used: newUsed,
      quota,
      overage,
    };
  },
}); 