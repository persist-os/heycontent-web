import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Only keep this for Stripe/Backend updates
export const updateSubscriptionFromStripe = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    data: v.object({
      status: v.optional(v.union(
        v.literal("active"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("unpaid"),
        v.literal("dev"),
        v.literal("tester"),
        v.literal("incomplete"),
        v.literal("incomplete_expired")
      )),
      current_period_start: v.optional(v.number()),
      current_period_end: v.optional(v.number()),
      cancel_at_period_end: v.optional(v.boolean()),
      canceled_at: v.optional(v.union(v.number(), v.null())),
      plan: v.optional(v.union(
        v.literal("monthly_basic"),
        v.literal("monthly_pro"),
        v.literal("yearly_basic"),
        v.literal("yearly_pro")
      )),
      price_id: v.optional(v.string()),
      metered_price_id: v.optional(v.string()),
      interval: v.optional(v.union(v.literal("month"), v.literal("year"))),
      included_requests: v.optional(v.number()),
      used_requests: v.optional(v.number()),
      subscription_item_id: v.optional(v.string()),
    })
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("stripeSubscriptionId"), args.stripeSubscriptionId))
      .first();
    if (!user) return { success: false, error: "User not found for this Stripe subscription ID" };
    if (!user.subscription) return { success: false, error: "User has no subscription object" };

    // Map snake_case to camelCase and only update fields that exist in the schema
    const updates: any = {};
    if (args.data.status) updates.status = args.data.status;
    if (args.data.current_period_start !== undefined) updates.currentPeriodStart = args.data.current_period_start;
    if (args.data.current_period_end !== undefined) updates.currentPeriodEnd = args.data.current_period_end;
    if (args.data.cancel_at_period_end !== undefined) updates.cancelAtPeriodEnd = args.data.cancel_at_period_end;
    if (args.data.canceled_at !== undefined) updates.canceledAt = args.data.canceled_at;
    if (args.data.plan) updates.plan = args.data.plan;
    if (args.data.price_id) updates.priceId = args.data.price_id;
    if (args.data.metered_price_id) updates.meteredPriceId = args.data.metered_price_id;
    if (args.data.interval) updates.interval = args.data.interval;
    if (args.data.included_requests !== undefined) updates.includedRequests = args.data.included_requests;
    if (args.data.used_requests !== undefined) updates.usedRequests = args.data.used_requests;
    if (args.data.subscription_item_id) updates.subscriptionItemId = args.data.subscription_item_id;
    updates.lastSyncedAt = Date.now();

    const updatedSubscription = {
      ...user.subscription,
      ...updates,
    };

    await ctx.db.patch(user._id, {
      subscription: updatedSubscription,
      updatedAt: Date.now()
    });
    return { success: true };
  }
});
