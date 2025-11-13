import { v } from "convex/values";

export const userRoleValidator = v.union(
  v.literal("user"),
  v.literal("developer"),
  v.literal("admin"),
  v.literal("super_admin"),
  v.literal("ambassador"),
  v.literal("affiliate"),
  v.literal("partner"),
  v.literal("blogger")
);

export const subscriptionStatusValidator = v.union(
  v.literal("active"),
  v.literal("past_due"),
  v.literal("canceled"),
  v.literal("unpaid"),
  v.literal("dev"),
  v.literal("tester"),
  v.literal("incomplete"),
  v.literal("incomplete_expired"),
  v.literal("trialing"),
  v.literal("paused"),
  v.literal("deleted"),
  v.literal("unknown"),
);

export const subscriptionPlanValidator = v.union(
  v.literal("monthly_basic"),
  v.literal("monthly_pro"),
  v.literal("yearly_basic"),
  v.literal("yearly_pro"),
  v.literal("monthly_free")
);

export const subscriptionIntervalValidator = v.union(
  v.literal("month"),
  v.literal("year")
);

export const userSchemaFields = {
  name: v.string(),
  email: v.string(),
  image: v.optional(v.string()),
  userId: v.string(),
  username: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  referralCode: v.optional(v.string()),
  referredBy: v.optional(v.string()),
  // Role-based access control
  role: v.optional(userRoleValidator),
  permissions: v.optional(v.array(v.string())),
  // Stripe integration
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  // Subscription state
  subscription: v.optional(v.object({
    status: subscriptionStatusValidator,
    // Plan type with interval
    plan: subscriptionPlanValidator,
    priceId: v.string(),
    meteredPriceId: v.optional(v.string()),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    includedRequests: v.number(),
    usedRequests: v.number(),
    subscriptionItemId: v.optional(v.string()),
    lastSyncedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    interval: v.optional(subscriptionIntervalValidator),
    cancel_at: v.optional(v.number()),
    customer: v.optional(v.string()),
    items: v.optional(v.any()),
    quantity: v.optional(v.number()),
    start_date: v.optional(v.number()),
    monthlyLimit: v.optional(v.number()),
    ubpEnabled: v.optional(v.boolean()),
  })),
  paymentMethod: v.optional(v.object({
    brand: v.string(),
    last4: v.string(),
    expMonth: v.number(),
    expYear: v.number()
  })),
  // Email preferences
  emailUnsubscribed: v.optional(v.boolean()),
  // Referral statistics
  referralStats: v.optional(v.object({
    totalReferred: v.number(),
    firstReferralDate: v.optional(v.number()),
    lastReferralDate: v.optional(v.number())
  })),
};

export const userValidator = v.object(userSchemaFields);
