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
    if (!user || !user.subscription) return { total: 0, included: 0, overage: 0 };
    const { currentPeriodStart, currentPeriodEnd, includedRequests } = user.subscription;
    // Sum all usageEvents in the current period
    const events = await ctx.db
      .query("usageEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const filteredEvents = events.filter((event) => event.timestamp >= currentPeriodStart && event.timestamp < currentPeriodEnd);
    const total = filteredEvents.reduce((sum, e) => sum + (e.qty || 0), 0);
    const overage = Math.max(0, total - includedRequests);
    return { total, included: includedRequests, overage };
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
        usage: {
          periodStart: args.periodStart,
          periodEnd: args.periodEnd,
          totalRequests: 0,
          includedRequests: args.includedRequests,
          overageRequests: 0,
          lastUpdated: Date.now(),
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
    if (!user || !user.subscription) return { success: false };
    const { currentPeriodStart, currentPeriodEnd, includedRequests } = user.subscription;
    // Get current usage
    let usage = user.usage || {
      periodStart: currentPeriodStart,
      periodEnd: currentPeriodEnd,
      totalRequests: 0,
      includedRequests,
      overageRequests: 0,
      lastUpdated: Date.now(),
    };
    // If period changed, reset
    if (usage.periodStart !== currentPeriodStart || usage.periodEnd !== currentPeriodEnd) {
      usage = {
        periodStart: currentPeriodStart,
        periodEnd: currentPeriodEnd,
        totalRequests: 0,
        includedRequests,
        overageRequests: 0,
        lastUpdated: Date.now(),
      };
    }
    usage.totalRequests += args.qty;
    usage.overageRequests = Math.max(0, usage.totalRequests - includedRequests);
    usage.lastUpdated = Date.now();
    await ctx.db.patch(user._id, { usage });
    return { success: true, usage };
  },
}); 