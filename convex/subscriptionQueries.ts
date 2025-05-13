import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all active subscription plans
export const getPlans = query({
  handler: async (ctx) => {
    const plans = await ctx.db
      .query("subscriptionPlans")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return plans;
  },
});

// Query to get user's current subscription
export const getCurrentSubscription = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!subscription) return null;

    const plan = await ctx.db
      .query("subscriptionPlans")
      .filter((q) => q.eq(q.field("_id"), subscription.planId))
      .first();

    return {
      ...subscription,
      plan,
    };
  },
});

// Query to get user's payment methods
export const getPaymentMethods = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const paymentMethods = await ctx.db
      .query("paymentMethods")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    return paymentMethods;
  },
});

// Internal queries
export const getPlanById = query({
  args: { planId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.planId);
  },
});

export const getUserSubscription = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSubscriptions")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
  },
});

export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
  },
});

// Internal mutations
export const savePlan = mutation({
  args: {
    name: v.string(),
    price: v.number(),
    interval: v.union(v.literal("month"), v.literal("year")),
    features: v.array(v.string()),
    stripePriceId: v.string(),
    stripeProductId: v.string(),
    isActive: v.boolean(),
    isPerSeat: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subscriptionPlans", args);
  },
});

export const saveSubscription = mutation({
  args: {
    userId: v.string(),
    planId: v.string(),
    status: v.string(),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userSubscriptions", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const savePaymentMethod = mutation({
  args: {
    userId: v.string(),
    stripePaymentMethodId: v.string(),
    type: v.string(),
    last4: v.string(),
    brand: v.string(),
    expMonth: v.number(),
    expYear: v.number(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("paymentMethods", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateSubscription = mutation({
  args: {
    subscriptionId: v.id("userSubscriptions"),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      updatedAt: Date.now(),
    });
  },
});

export const updateSubscriptionQuantity = mutation({
  args: {
    subscriptionId: v.id("userSubscriptions"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      quantity: args.quantity,
      updatedAt: Date.now(),
    });
  },
}); 