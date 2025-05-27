import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Function to update subscription details
export const updateSubscriptionDetails = mutation({
  args: {
    subscriptionId: v.id("users"),
    updates: v.object({
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
      canceledAt: v.optional(v.number()),
    })
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.subscriptionId);
    if (!user || !user.subscription) {
      throw new Error("Subscription not found");
    }
    // If status is being set to canceled/incomplete_expired and canceledAt is not set, set it now
    const status = args.updates.status;
    const canceledAt = args.updates.canceledAt ?? ((status && ["canceled", "incomplete_expired"].includes(status)) ? Date.now() : user.subscription.canceledAt);
    // Create updated subscription object
    const updatedSubscription = {
      ...user.subscription,
      ...args.updates,
      canceledAt,
      lastSyncedAt: Date.now()
    };
    // Update the user record
    await ctx.db.patch(args.subscriptionId, {
      subscription: updatedSubscription,
      updatedAt: Date.now()
    });
    return { success: true };
  }
});

// Function to update subscription from Stripe webhook data
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
    })
  },
  handler: async (ctx, args) => {
    try {
      // Find the user with this subscription ID
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("stripeSubscriptionId"), args.stripeSubscriptionId))
        .first();
      if (!user) {
        console.error(`User with subscription ID not found: ${args.stripeSubscriptionId}`);
        return { success: false, error: "User not found" };
      }
      // Map backend field names to Convex field names
      const updates: {
        status?: "active" | "past_due" | "canceled" | "unpaid" | "dev" | "tester" | "incomplete" | "incomplete_expired";
        currentPeriodStart?: number;
        currentPeriodEnd?: number;
        cancelAtPeriodEnd?: boolean;
        canceledAt?: number;
      } = {};
      if (args.data.status) {
        updates.status = args.data.status;
      }
      if (args.data.current_period_start) {
        updates.currentPeriodStart = args.data.current_period_start;
      }
      if (args.data.current_period_end) {
        updates.currentPeriodEnd = args.data.current_period_end;
      }
      if (args.data.cancel_at_period_end !== undefined) {
        updates.cancelAtPeriodEnd = args.data.cancel_at_period_end;
      }
      // Set canceledAt if provided or if status is canceled/incomplete_expired
      updates.canceledAt = args.data.canceled_at ?? ((updates.status && ["canceled", "incomplete_expired"].includes(updates.status)) ? Date.now() : user.subscription.canceledAt);
      // Create updated subscription object
      const updatedSubscription = {
        ...user.subscription,
        ...updates,
        lastSyncedAt: Date.now()
      };
      // Update the user record
      await ctx.db.patch(user._id, {
        subscription: updatedSubscription,
        updatedAt: Date.now()
      });
      return { success: true };
    } catch (error) {
      console.error(`Error updating subscription from Stripe: ${error}`);
      return { success: false, error: String(error) };
    }
  }
});

// Function to handle HTTP API requests for subscription updates
export const handleSubscriptionUpdate = query({
  args: {
    stripeSubscriptionId: v.string(),
    data: v.object({
      status: v.optional(v.union(
        v.literal("active"),
        v.literal("canceled"),
        v.literal("past_due"),
        v.literal("dev"),
        v.literal("tester"),
        v.literal("unpaid"),
        v.literal("incomplete"),
        v.literal("incomplete_expired")
      )),
      current_period_start: v.optional(v.number()),
      current_period_end: v.optional(v.number()),
      cancel_at_period_end: v.optional(v.boolean()),
      canceled_at: v.optional(v.union(v.number(), v.null())),
      quantity: v.optional(v.number())
    })
  },
  handler: async (ctx, args) => {
    try {
      // This is a query that returns instructions for the HTTP endpoint
      // It doesn't actually modify data, just returns what actions should be taken
      // Find the user with this subscription ID
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("stripeSubscriptionId"), args.stripeSubscriptionId))
        .first();
      if (!user) {
        return {
          success: false,
          error: "User not found",
          statusCode: 404
        };
      }
      // Map backend field names to Convex field names
      const updates: {
        status?: "active" | "canceled" | "past_due" | "dev" | "tester" | "unpaid" | "incomplete" | "incomplete_expired";
        currentPeriodStart?: number;
        currentPeriodEnd?: number;
        cancelAtPeriodEnd?: boolean;
        canceledAt?: number;
      } = {};
      if (args.data.status) {
        updates.status = args.data.status;
      }
      if (args.data.current_period_start) {
        updates.currentPeriodStart = args.data.current_period_start;
      }
      if (args.data.current_period_end) {
        updates.currentPeriodEnd = args.data.current_period_end;
      }
      if (args.data.cancel_at_period_end !== undefined) {
        updates.cancelAtPeriodEnd = args.data.cancel_at_period_end;
      }
      // Set canceledAt if provided or if status is canceled/incomplete_expired
      updates.canceledAt = args.data.canceled_at ?? ((updates.status && ["canceled", "incomplete_expired"].includes(updates.status)) ? Date.now() : user.subscription.canceledAt);
      // Return instructions for the HTTP endpoint
      return {
        success: true,
        userId: user._id,
        updates,
        quantity: args.data.quantity
      };
    } catch (error) {
      console.error(`Error handling subscription update: ${error}`);
      return {
        success: false,
        error: String(error),
        statusCode: 500
      };
    }
  }
});
