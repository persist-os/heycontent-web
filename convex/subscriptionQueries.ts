import { v } from "convex/values";
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Types for subscription status
type SubscriptionStatus = "active" | "past_due" | "canceled" | "unpaid" | "dev" | "tester" | "incomplete" | "incomplete_expired";
type PlanType = "monthly_basic" | "monthly_pro" | "yearly_basic" | "yearly_pro";

// Query to get user's current subscription
export const getCurrentSubscription = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (!user || !user.subscription) return null;
    return {
      ...user.subscription,
      userId: user._id,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      paymentMethod: user.paymentMethod,
    };
  },
});

// Get user's subscription (for HTTP API compatibility)
export const getUserSubscription = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (!user || !user.subscription) return null;
    return {
      ...user.subscription,
      userId: user._id,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      paymentMethod: user.paymentMethod,
      items: user.subscription.subscriptionItemId ? [
        {
          stripeItemId: user.subscription.subscriptionItemId,
          meterName: "api_requests"
        }
      ] : []
    };
  },
});

// Save subscription data (creation or full update)
export const saveSubscription = mutation({
  args: {
    userId: v.string(),
    plan: v.union(
      v.literal("monthly_basic"),
      v.literal("monthly_pro"),
      v.literal("yearly_basic"),
      v.literal("yearly_pro"),
      v.literal("monthly_free")
    ),
    priceId: v.string(),
    meteredPriceId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid"),
      v.literal("dev"),
      v.literal("tester"),
      v.literal("incomplete"),
      v.literal("incomplete_expired")
    ),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    includedRequests: v.number(),
    usedRequests: v.optional(v.number()),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    subscriptionItemId: v.optional(v.string()),
    canceledAt: v.optional(v.number()),
    interval: v.optional(v.union(v.literal("month"), v.literal("year"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!user) throw new Error("User not found");
    const prevSub = user.subscription ?? {} as any;
    const updates = {
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
      subscription: {
        // Preserve any existing fields first (e.g., ubpEnabled, monthlyLimit)
        ...prevSub,
        // Then overwrite with the latest Stripe-derived fields
        status: args.status,
        plan: args.plan,
        priceId: args.priceId,
        meteredPriceId: args.meteredPriceId,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        includedRequests: args.includedRequests,
        usedRequests: args.usedRequests ?? prevSub.usedRequests ?? 0,
        lastSyncedAt: Date.now(),
        ...(typeof args.subscriptionItemId !== 'undefined'
          ? { subscriptionItemId: args.subscriptionItemId }
          : prevSub?.subscriptionItemId
            ? { subscriptionItemId: prevSub.subscriptionItemId }
            : {}),
        canceledAt: typeof args.canceledAt === 'number'
          ? args.canceledAt * 1000
          : ([
"canceled", "incomplete_expired"].includes(args.status) ? Date.now() : undefined),
        ...(args.interval ? { interval: args.interval } : {}),
      },
      updatedAt: Date.now()
    };
    await ctx.db.patch(user._id, updates);
    return { success: true, userId: user._id.toString() };
  },
});

