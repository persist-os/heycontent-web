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

// Initialize free tier subscription (no Stripe required)
export const initializeFreeTier = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (!user) {
      // User doesn't exist yet or was deleted - this is OK for auto-fix scenarios
      console.warn(`[initializeFreeTier] User ${args.userId} not found, skipping init`);
      return { 
        success: false, 
        message: "User not found - may not be created yet or was deleted", 
        userId: args.userId 
      };
    }
    
    const now = Date.now();
    
    // Check if already has valid subscription (includedRequests > 0)
    if (user.subscription?.includedRequests && user.subscription.includedRequests > 0) {
      console.log(`User ${args.userId} already has valid subscription, skipping free tier init`);
      return { success: true, message: "Subscription already exists", userId: user._id.toString() };
    }
    
    // Initialize or fix free tier - NO STRIPE DATA NEEDED
    await ctx.db.patch(user._id, {
      subscription: {
        ...(user.subscription || {}),  // Preserve any existing Stripe data if present
        status: "active",
        plan: "monthly_free",
        priceId: user.subscription?.priceId || "free",  // Keep existing price ID if Stripe subscription
        currentPeriodStart: user.subscription?.currentPeriodStart || now,
        currentPeriodEnd: user.subscription?.currentPeriodEnd || (now + (30 * 24 * 60 * 60 * 1000)),
        cancelAtPeriodEnd: false,
        includedRequests: 50,  // Always set to 50 for free tier
        usedRequests: user.subscription?.usedRequests || 0,
        ubpEnabled: false,
        monthlyLimit: 0,
        lastSyncedAt: now,
      },
      updatedAt: now
    });
    
    console.log(`Free tier initialized/fixed for user ${args.userId}`);
    return { success: true, message: "Free tier initialized", userId: user._id.toString() };
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

