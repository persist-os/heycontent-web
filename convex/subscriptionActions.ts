"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Action to create a Stripe customer
export const createCustomer = action({
  args: { userId: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const customer = await stripe.customers.create({
      email: args.email,
      metadata: {
        userId: args.userId,
      },
    });

    return customer.id;
  },
});

// Action to create a subscription plan
export const createPlan = action({
  args: {
    name: v.string(),
    price: v.number(),
    interval: v.union(v.literal("month"), v.literal("year")),
    features: v.array(v.string()),
    stripePriceId: v.string(),
    stripeProductId: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const planId = await ctx.runMutation(internal.subscriptionQueries.savePlan, {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return planId;
  },
});

// Action to create a subscription
export const createSubscriptionAction = action({
  args: {
    userId: v.string(),
    planId: v.string(),
    paymentMethodId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the plan
    const plan = await ctx.runQuery(internal.subscriptionQueries.getPlanById, { planId: args.planId });
    if (!plan) throw new Error("Plan not found");

    // Get or create Stripe customer
    let customerId: string;
    const existingSubscription = await ctx.runQuery(internal.subscriptionQueries.getUserSubscription, { userId: args.userId });

    if (existingSubscription) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      const user = await ctx.runQuery(internal.subscriptionQueries.getUser, { userId: args.userId });
      if (!user) throw new Error("User not found");

      customerId = await ctx.runAction(internal.subscriptionActions.createCustomer, {
        userId: args.userId,
        email: user.email,
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(args.paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: args.paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    // Save subscription to database
    const subscriptionId = await ctx.runMutation(internal.subscriptionQueries.saveSubscription, {
      userId: args.userId,
      planId: args.planId,
      status: subscription.status,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    // Save payment method
    const paymentMethod = await stripe.paymentMethods.retrieve(args.paymentMethodId);
    await ctx.runMutation(internal.subscriptionQueries.savePaymentMethod, {
      userId: args.userId,
      stripePaymentMethodId: args.paymentMethodId,
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4 || "",
      brand: paymentMethod.card?.brand || "",
      expMonth: paymentMethod.card?.exp_month || 0,
      expYear: paymentMethod.card?.exp_year || 0,
      isDefault: true,
    });

    return {
      subscriptionId,
      clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret,
    };
  },
});

// Action to cancel subscription
export const cancelSubscriptionAction = action({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.runQuery(internal.subscriptionQueries.getUserSubscription, { userId: args.userId });
    if (!subscription) throw new Error("No active subscription found");

    // Cancel at period end in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update in database
    await ctx.runMutation(internal.subscriptionQueries.updateSubscription, {
      subscriptionId: subscription._id,
      cancelAtPeriodEnd: true,
    });

    return true;
  },
});

// Action to update payment method
export const updatePaymentMethodAction = action({
  args: {
    userId: v.string(),
    paymentMethodId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.runQuery(internal.subscriptionQueries.getUserSubscription, { userId: args.userId });
    if (!subscription) throw new Error("No active subscription found");

    // Update default payment method in Stripe
    await stripe.customers.update(subscription.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: args.paymentMethodId,
      },
    });

    // Update in database
    const paymentMethod = await stripe.paymentMethods.retrieve(args.paymentMethodId);
    await ctx.runMutation(internal.subscriptionQueries.savePaymentMethod, {
      userId: args.userId,
      stripePaymentMethodId: args.paymentMethodId,
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4 || "",
      brand: paymentMethod.card?.brand || "",
      expMonth: paymentMethod.card?.exp_month || 0,
      expYear: paymentMethod.card?.exp_year || 0,
      isDefault: true,
    });

    return true;
  },
});

export const updatePlanQuantity = action({
  args: { userId: v.string(), quantity: v.number() },
  handler: async (ctx, args) => {
    // Find the user's active subscription
    const subscription = await ctx.runQuery(internal.subscriptionQueries.getUserSubscription, { userId: args.userId });
    if (!subscription) throw new Error("No active subscription found");
    if (!subscription.stripeSubscriptionId) throw new Error("No Stripe subscription ID");

    // Update Stripe subscription quantity
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{ id: subscription.stripeSubscriptionItemId, quantity: args.quantity }],
      proration_behavior: "create_prorations",
    });

    // Update in database
    await ctx.runMutation(internal.subscriptionQueries.updateSubscriptionQuantity, {
      subscriptionId: subscription._id,
      quantity: args.quantity,
    });

    return { success: true };
  },
}); 