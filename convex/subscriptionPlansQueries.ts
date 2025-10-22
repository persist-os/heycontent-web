import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Subscription Plans Queries
 * 
 * Queries for fetching cached subscription plan data from Convex.
 * Plans are static data synced from Stripe via backend, cached here for instant frontend access.
 * 
 * Flow:
 * 1. Backend fetches plans from Stripe on startup
 * 2. Backend syncs plans to Convex via HTTP endpoint
 * 3. Frontend queries cached plans directly from Convex (instant, no backend calls)
 * 4. Backend updates plans only when pricing changes (rare)
 */

/**
 * Get all active subscription plans
 * 
 * Returns all plans organized by plan key (free, basic, pro) with all intervals
 * This is the primary query for displaying pricing pages and upgrade modals
 */
export const getAllPlans = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all active plans, sorted by display order
    const plans = await ctx.db
      .query("subscription_plans")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    
    // Organize plans by key and interval for easy frontend consumption
    // Structure: { free: { monthly: {...}, yearly: {...} }, basic: {...}, pro: {...} }
    const organized: Record<string, any> = {};
    
    for (const plan of plans) {
      if (!organized[plan.planKey]) {
        organized[plan.planKey] = {
          name: plan.planName,
          monthly: null,
          yearly: null
        };
      }
      
      const intervalKey = plan.interval === "month" ? "monthly" : "yearly";
      organized[plan.planKey][intervalKey] = {
        price_id: plan.priceId,
        product_id: plan.productId,
        currency: plan.currency,
        interval: plan.interval,
        amount: plan.amount,
        included_requests: plan.includedRequests,
        overage: plan.overage,
        features: plan.features,
        flat_price_id: plan.priceId,
        metered_price_id: plan.meteredPriceId || null,
        is_metered: plan.isMetered
      };
    }
    
    return organized;
  },
});

/**
 * Get a specific plan by price ID
 * 
 * Used for looking up plan details when user has a Stripe price ID
 */
export const getPlanByPriceId = query({
  args: { priceId: v.string() },
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("subscription_plans")
      .withIndex("by_price_id", (q) => q.eq("priceId", args.priceId))
      .first();
    
    if (!plan) return null;
    
    return {
      planKey: plan.planKey,
      planName: plan.planName,
      interval: plan.interval,
      priceId: plan.priceId,
      productId: plan.productId,
      meteredPriceId: plan.meteredPriceId,
      amount: plan.amount,
      currency: plan.currency,
      includedRequests: plan.includedRequests,
      overage: plan.overage,
      features: plan.features,
      isMetered: plan.isMetered
    };
  },
});

/**
 * Get plans for a specific plan key (e.g., "basic", "pro")
 * 
 * Returns all intervals (monthly, yearly) for a specific plan tier
 */
export const getPlansByKey = query({
  args: { planKey: v.string() },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("subscription_plans")
      .withIndex("by_plan_key", (q) => q.eq("planKey", args.planKey))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
    
    const result: Record<string, any> = {
      name: plans[0]?.planName || args.planKey,
      monthly: null,
      yearly: null
    };
    
    for (const plan of plans) {
      const intervalKey = plan.interval === "month" ? "monthly" : "yearly";
      result[intervalKey] = {
        price_id: plan.priceId,
        product_id: plan.productId,
        currency: plan.currency,
        interval: plan.interval,
        amount: plan.amount,
        included_requests: plan.includedRequests,
        overage: plan.overage,
        features: plan.features,
        flat_price_id: plan.priceId,
        metered_price_id: plan.meteredPriceId || null,
        is_metered: plan.isMetered
      };
    }
    
    return result;
  },
});

/**
 * Check if plans cache is populated
 * 
 * Used for health checks and initialization verification
 */
export const arePlansInitialized = query({
  args: {},
  handler: async (ctx) => {
    const count = await ctx.db
      .query("subscription_plans")
      .filter((q) => q.eq(q.field("active"), true))
      .collect()
      .then(plans => plans.length);
    
    return {
      initialized: count > 0,
      planCount: count,
      timestamp: Date.now()
    };
  },
});

