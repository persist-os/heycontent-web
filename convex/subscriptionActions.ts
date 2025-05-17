"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";


// Action to create a Stripe customer
export const createCustomer = action({
  args: { userId: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    // Call the backend API instead of directly using Stripe
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/subscription/customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: args.userId,
        email: args.email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create customer');
    }

    const data = await response.json();
    return data.customer_id;
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
    planId: v.id("subscriptionPlans"),
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

    // Call the backend API to create subscription
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: args.userId,
        plan_id: args.planId,
        payment_method_id: args.paymentMethodId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create subscription');
    }

    const subscriptionData = await response.json();

    // Save subscription to database
    const subscriptionId = await ctx.runMutation(internal.subscriptionQueries.saveSubscription, {
      userId: args.userId,
      planId: args.planId,
      status: subscriptionData.status,
      stripeSubscriptionId: subscriptionData.subscription_id,
      stripeCustomerId: customerId,
      currentPeriodStart: subscriptionData.current_period_start,
      currentPeriodEnd: subscriptionData.current_period_end,
      cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
    });

    // Save payment method info from the response
    await ctx.runMutation(internal.subscriptionQueries.savePaymentMethod, {
      userId: args.userId,
      stripePaymentMethodId: args.paymentMethodId,
      type: subscriptionData.payment_method?.type || 'card',
      last4: subscriptionData.payment_method?.last4 || '',
      brand: subscriptionData.payment_method?.brand || '',
      expMonth: subscriptionData.payment_method?.exp_month || 0,
      expYear: subscriptionData.payment_method?.exp_year || 0,
      isDefault: true,
    });

    return {
      subscriptionId,
      clientSecret: subscriptionData.client_secret,
    };
  },
});

// Action to cancel subscription
export const cancelSubscriptionAction = action({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.runQuery(internal.subscriptionQueries.getUserSubscription, { userId: args.userId });
    if (!subscription) throw new Error("No active subscription found");

    // Call the backend API to cancel subscription
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/subscription/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: args.userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to cancel subscription');
    }

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

    // Call the backend API to update payment method
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/subscription/payment-method`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: args.userId,
        payment_method_id: args.paymentMethodId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update payment method');
    }

    const paymentData = await response.json();

    // Update in database
    await ctx.runMutation(internal.subscriptionQueries.savePaymentMethod, {
      userId: args.userId,
      stripePaymentMethodId: args.paymentMethodId,
      type: paymentData.type || 'card',
      last4: paymentData.last4 || '',
      brand: paymentData.brand || '',
      expMonth: paymentData.exp_month || 0,
      expYear: paymentData.exp_year || 0,
      isDefault: true,
    });

    return true;
  },
});

// Action to create a payment link for Stripe Checkout
export const createPaymentLink = action({
  args: {
    userId: v.string(),
    planId: v.union(v.id("subscriptionPlans"), v.string()),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Map of plan names to Stripe price IDs
    const PLAN_PRICE_MAP: Record<string, string> = {
      "Basic": "price_1RPSD8HUK9gLy34mXfLOgdgB", // Basic plan price ID ($15)
      "Pro": "price_1RPSDCHUK9gLy34mNjjBT53L",   // Pro plan price ID ($25)
    };
    
    let priceId: string;
    
    // Check if the planId is a string that directly matches a price ID
    if (typeof args.planId === 'string' && args.planId.startsWith('price_')) {
      priceId = args.planId;
    } else {
      // Try to get the plan from the database
      try {
        const plan = await ctx.runQuery(internal.subscriptionQueries.getPlanById, { 
          planId: args.planId as any // Type assertion needed due to union type
        });
        
        if (!plan) {
          // If plan is not found, check if planId is a plan name
          if (typeof args.planId === 'string' && PLAN_PRICE_MAP[args.planId]) {
            priceId = PLAN_PRICE_MAP[args.planId];
          } else {
            throw new Error("Plan not found");
          }
        } else {
          // Plan found, map to price ID
          if (PLAN_PRICE_MAP[plan.name]) {
            priceId = PLAN_PRICE_MAP[plan.name];
          } else {
            throw new Error(`Unsupported plan: ${plan.name}`);
          }
        }
      } catch (error) {
        // If there's an error getting the plan or it's not a valid ID,
        // try treating planId as a plan name
        if (typeof args.planId === 'string' && PLAN_PRICE_MAP[args.planId]) {
          priceId = PLAN_PRICE_MAP[args.planId];
        } else {
          throw new Error(`Invalid plan ID or name: ${args.planId}`);
        }
      }
    }

    // Call the backend API to create a payment link
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/subscription/payment-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: args.userId,
        price_id: priceId,
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create payment link');
    }

    const data = await response.json();
    return {
      url: data.url,
    };
  },
});

export const updatePlanQuantity = action({
  args: { userId: v.string(), quantity: v.number() },
  handler: async (ctx, args) => {
    // Find the user's active subscription
    const subscription = await ctx.runQuery(internal.subscriptionQueries.getUserSubscription, { userId: args.userId });
    if (!subscription) throw new Error("No active subscription found");
    if (!subscription.stripeSubscriptionId) throw new Error("No Stripe subscription ID");

    // Call the backend API to update subscription quantity
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/subscription/quantity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: args.userId,
        quantity: args.quantity,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update subscription quantity');
    }

    // Update in database
    await ctx.runMutation(internal.subscriptionQueries.updateSubscriptionQuantity, {
      subscriptionId: subscription._id,
      quantity: args.quantity,
    });

    return true;
  },
}); 