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
      currentPeriodStart: v.optional(v.number()),
      currentPeriodEnd: v.optional(v.number()),
      cancelAtPeriodEnd: v.optional(v.boolean()),
      canceledAt: v.optional(v.union(v.number(), v.null())),
      plan: v.optional(v.union(
        v.literal("monthly_basic"),
        v.literal("monthly_pro"),
        v.literal("yearly_basic"),
        v.literal("yearly_pro")
      )),
      priceId: v.optional(v.string()),
      meteredPriceId: v.optional(v.string()),
      interval: v.optional(v.union(
        v.literal("month"), 
        v.literal("year"),
        v.literal("monthly"),  // Support both formats
        v.literal("yearly")    // Support both formats
      )),
      includedRequests: v.optional(v.number()),
      usedRequests: v.optional(v.number()),
      subscriptionItemId: v.optional(v.string()),
    })
  },
  handler: async (ctx, args) => {
    // Normalize interval values
    if (args.data?.interval) {
      if (args.data.interval === "monthly") args.data.interval = "month";
      if (args.data.interval === "yearly") args.data.interval = "year";
    }
    
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("stripeSubscriptionId"), args.stripeSubscriptionId))
      .first();
    if (!user) return { success: false, error: "User not found for this Stripe subscription ID" };
    if (!user.subscription) return { success: false, error: "User has no subscription object" };

    // Update fields that exist in the schema (expecting camelCase from backend)
    const updates: any = {};
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
