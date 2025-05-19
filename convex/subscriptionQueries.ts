import { v } from "convex/values";
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Types for subscription status
type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "unpaid";
type PlanType = "basic_monthly" | "pro_monthly" | "basic_yearly" | "pro_yearly";

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

// Update user with Stripe customer ID and/or subscription ID
export const updateUser = mutation({
  args: {
    userId: v.string(),
    updates: v.object({
      stripeCustomerId: v.optional(v.string()),
      stripeSubscriptionId: v.optional(v.string()),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
    })
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (!user) throw new Error("User not found");
    const updates = {
      ...args.updates,
      updatedAt: Date.now()
    };
    await ctx.db.patch(user._id, updates);
    return { success: true, userId: user._id };
  },
});

// Save subscription data
export const saveSubscription = mutation({
  args: {
    userId: v.string(),
    planId: v.string(),
    priceId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("trialing"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid")
    ),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    includedRequests: v.number(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (!user) throw new Error("User not found");
    const updates = {
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
      subscription: {
        status: args.status,
        plan: args.planId as PlanType,
        priceId: args.priceId,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        includedRequests: args.includedRequests,
        usedRequests: 0,
        lastSyncedAt: Date.now()
      },
      updatedAt: Date.now()
    };
    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

// Update subscription quantity
export const updateSubscriptionQuantity = mutation({
  args: {
    subscriptionId: v.id("users"),
    quantity: v.number()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.subscriptionId);
    if (!user || !user.subscription) throw new Error("Subscription not found");
    const updates = {
      subscription: {
        ...user.subscription,
        includedRequests: args.quantity,
        lastSyncedAt: Date.now()
      },
      updatedAt: Date.now()
    };
    await ctx.db.patch(args.subscriptionId, updates);
    return true;
  },
});

// Update subscription cancelAtPeriodEnd
export const updateSubscription = mutation({
  args: {
    subscriptionId: v.id("users"),
    cancelAtPeriodEnd: v.boolean()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.subscriptionId);
    if (!user || !user.subscription) throw new Error("Subscription not found");
    const updates = {
      subscription: {
        ...user.subscription,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        lastSyncedAt: Date.now()
      },
      updatedAt: Date.now()
    };
    await ctx.db.patch(args.subscriptionId, updates);
    return true;
  },
});

// Update subscription details (status, period, etc)
export const updateSubscriptionDetails = mutation({
  args: {
    subscriptionId: v.id("users"),
    updates: v.object({
      status: v.optional(v.union(
        v.literal("active"),
        v.literal("trialing"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("unpaid")
      )),
      currentPeriodStart: v.optional(v.number()),
      currentPeriodEnd: v.optional(v.number())
    })
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.subscriptionId);
    if (!user || !user.subscription) throw new Error("Subscription not found");
    const updates = {
      subscription: {
        ...user.subscription,
        ...args.updates,
        lastSyncedAt: Date.now()
      },
      updatedAt: Date.now()
    };
    await ctx.db.patch(args.subscriptionId, updates);
    return true;
  },
});


// Get user by Stripe customer ID
export const getUserByStripeCustomerId = query({
  args: { customerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("stripeCustomerId"), args.customerId))
      .first();
  },
});

// Update user's subscription
export const updateUserSubscription = mutation({
  args: {
    userId: v.string(),
    subscription: v.optional(v.object({
      status: v.union(
        v.literal("active"),
        v.literal("trialing"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("unpaid")
      ),
      plan: v.union(v.literal("basic"), v.literal("pro")),
      priceId: v.string(),
      currentPeriodEnd: v.number(),
      cancelAtPeriodEnd: v.boolean(),
      interval: v.union(v.literal("month"), v.literal("year")),
      includedRequests: v.number(),
      usedRequests: v.number(),
      subscriptionItemId: v.optional(v.string()),
      lastSyncedAt: v.optional(v.number())
    })),
    paymentMethod: v.optional(v.object({
      brand: v.string(),
      last4: v.string(),
      expMonth: v.number(),
      expYear: v.number()
    })),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) throw new Error("User not found");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.subscription) {
      updates.subscription = {
        ...(user.subscription || {}),
        ...args.subscription,
        lastSyncedAt: Date.now(),
      };
    }


    if (args.paymentMethod) {
      updates.paymentMethod = args.paymentMethod;
    }

    if (args.stripeCustomerId) {
      updates.stripeCustomerId = args.stripeCustomerId;
    }

    if (args.stripeSubscriptionId) {
      updates.stripeSubscriptionId = args.stripeSubscriptionId;
    }

    await ctx.db.patch(user._id, updates);
    return true;
  },
});

// Update subscription usage
export const updateSubscriptionUsage = mutation({
  args: {
    userId: v.string(),
    usedRequests: v.number(),
    totalRequests: v.number(),
    overageRequests: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user || !user.subscription) {
      throw new Error("User or subscription not found");
    }

    const now = Date.now();
    const periodStart = user.usage?.periodStart || now;
    const periodEnd = user.subscription.currentPeriodEnd * 1000; // Convert from seconds to ms
    
    // Archive current usage if period has changed
    if (user.usage && (now > periodEnd || now < periodStart)) {
      await ctx.db.insert("usageHistory", {
        userId: user._id,
        periodStart: user.usage.periodStart,
        periodEnd: periodEnd,
        totalRequests: user.usage.totalRequests,
        includedRequests: user.usage.includedRequests,
        overageRequests: user.usage.overageRequests,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Update current usage
    const updates: any = {
      updatedAt: now,
      subscription: {
        ...user.subscription,
        usedRequests: args.usedRequests,
      },
      usage: {
        periodStart: periodStart,
        periodEnd: periodEnd,
        totalRequests: args.totalRequests,
        includedRequests: user.subscription.includedRequests,
        overageRequests: args.overageRequests,
        lastUpdated: now,
      },
    };

    await ctx.db.patch(user._id, updates);
    return true;
  },
});

// Get usage history
export const getUsageHistory = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("usageHistory")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(args.limit || 12);
  },
});
