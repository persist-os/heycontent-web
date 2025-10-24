import { v } from "convex/values";

export const planIntervalValidator = v.union(
  v.literal("month"),
  v.literal("year")
);

export const subscriptionPlanSchemaFields = {
  // Plan identification
  planKey: v.string(),              // "free", "basic", "pro"
  planName: v.string(),             // "Free", "Basic", "Pro"
  
  // Interval-specific pricing
  interval: planIntervalValidator,
  
  // Stripe integration
  priceId: v.string(),              // Stripe price ID (flat fee)
  productId: v.string(),            // Stripe product ID
  meteredPriceId: v.optional(v.string()), // Stripe metered price ID (usage-based)
  
  // Pricing
  amount: v.number(),               // Price in cents
  currency: v.string(),             // "usd", "eur", etc.
  
  // Usage limits
  includedRequests: v.number(),     // Included API requests per period
  overage: v.number(),              // Overage price per request (0 for free tier)
  
  // Features
  features: v.array(v.string()),    // List of feature descriptions
  
  // Metering configuration
  isMetered: v.boolean(),           // Whether this plan has usage-based billing
  
  // Metadata
  active: v.boolean(),              // Whether this plan is available for signup
  sortOrder: v.number(),            // Display order (0 = first)
  
  createdAt: v.number(),
  updatedAt: v.number(),
  lastSyncedAt: v.number(),         // When plan was last synced from backend
};

export const subscriptionPlanValidator = v.object(subscriptionPlanSchemaFields);

