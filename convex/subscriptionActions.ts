import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Stripe Subscription Management - Convex Side
 * 
 * This mutation handles subscription updates from the backend Stripe integration.
 * It processes subscription lifecycle events and maintains user subscription state.
 * 
 * Flow: Stripe Webhook → Backend Handler → This Mutation → Database Update
 * 
 * The backend converts Stripe's field format to match Convex's schema before calling this.
 */
export const updateSubscriptionFromStripe = mutation({
  args: {
    stripeSubscriptionId: v.string(), // Stripe subscription ID to identify the user
    data: v.object({
      // Subscription data fields - backend converts Stripe format to match this schema
      status: v.optional(v.union(
        v.literal("active"),        // Active subscription
        v.literal("past_due"),      // Payment failed, subscription active
        v.literal("canceled"),      // Canceled subscription
        v.literal("unpaid"),        // Payment failed, subscription inactive
        v.literal("dev"),           // Development account
        v.literal("tester"),        // Tester account
        v.literal("incomplete"),    // Incomplete subscription
        v.literal("incomplete_expired") // Expired incomplete subscription
      )),
      currentPeriodStart: v.optional(v.number()), // Billing period start timestamp
      currentPeriodEnd: v.optional(v.number()),   // Billing period end timestamp
      cancelAtPeriodEnd: v.optional(v.boolean()), // Cancel at period end flag
      canceledAt: v.optional(v.union(v.number(), v.null())), // Cancellation timestamp
      plan: v.optional(v.union(
        v.literal("monthly_basic"), // Monthly basic plan
        v.literal("monthly_pro"),   // Monthly pro plan
        v.literal("yearly_basic"),  // Yearly basic plan
        v.literal("yearly_pro")     // Yearly pro plan
      )),
      priceId: v.optional(v.string()),        // Stripe price ID
      meteredPriceId: v.optional(v.string()), // Usage-based billing price ID
      interval: v.optional(v.union(
        v.literal("month"),    // Monthly billing
        v.literal("year"),     // Yearly billing
        v.literal("monthly"),  // Legacy monthly format
        v.literal("yearly")    // Legacy yearly format
      )),
      includedRequests: v.optional(v.number()),    // Plan request allowance
      usedRequests: v.optional(v.number()),        // Current period usage
      subscriptionItemId: v.optional(v.string()),  // Stripe subscription item ID
    })
  },
  handler: async (ctx, args) => {
    // Normalize interval values for consistency
    if (args.data?.interval) {
      if (args.data.interval === "monthly") args.data.interval = "month";
      if (args.data.interval === "yearly") args.data.interval = "year";
    }
    
    // Find user by Stripe subscription ID
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("stripeSubscriptionId"), args.stripeSubscriptionId))
      .first();
    
    if (!user) return { success: false, error: "User not found for this Stripe subscription ID" };
    if (!user.subscription) return { success: false, error: "User has no subscription object" };

    // Build update object with provided fields
    const updates: any = {};
    
    // Map subscription fields
    if (args.data.status) updates.status = args.data.status;
    if (args.data.currentPeriodStart !== undefined) updates.currentPeriodStart = args.data.currentPeriodStart;
    if (args.data.currentPeriodEnd !== undefined) updates.currentPeriodEnd = args.data.currentPeriodEnd;
    if (args.data.cancelAtPeriodEnd !== undefined) updates.cancelAtPeriodEnd = args.data.cancelAtPeriodEnd;
    if (args.data.canceledAt !== undefined) updates.canceledAt = args.data.canceledAt;
    if (args.data.plan) updates.plan = args.data.plan;
    if (args.data.priceId) updates.priceId = args.data.priceId;
    if (args.data.meteredPriceId) updates.meteredPriceId = args.data.meteredPriceId;
    if (args.data.interval) updates.interval = args.data.interval;
    if (args.data.includedRequests !== undefined) updates.includedRequests = args.data.includedRequests;
    if (args.data.usedRequests !== undefined) updates.usedRequests = args.data.usedRequests;
    if (args.data.subscriptionItemId) updates.subscriptionItemId = args.data.subscriptionItemId;
    
    // Track sync timestamp
    updates.lastSyncedAt = Date.now();

    // Apply updates to existing subscription
    const updatedSubscription = {
      ...user.subscription,
      ...updates,
    };

    // Save to database
    await ctx.db.patch(user._id, {
      subscription: updatedSubscription,
      updatedAt: Date.now()
    });
    
    return { success: true };
  }
});
