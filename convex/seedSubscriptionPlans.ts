"use node";

import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Action to seed subscription plans
export const seedSubscriptionPlans = action({
  handler: async (ctx) => {
    const plans = [
      {
        name: "Hobby",
        price: 0,
        interval: "month" as const,
        features: [
          "Pro two-week trial",
          "2000 completions",
          "50 slow requests"
        ],
        isActive: true,
        isPerSeat: false,
        stripePriceId: "placeholder",
        stripeProductId: "placeholder",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        name: "Pro",
        price: 20,
        interval: "month" as const,
        features: [
          "Everything in Hobby, plus",
          "Unlimited completions",
          "500 requests per month",
          "Unlimited slow requests",
          "Max mode"
        ],
        isActive: true,
        isPerSeat: false,
        stripePriceId: "placeholder",
        stripeProductId: "placeholder",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        name: "Business",
        price: 40,
        interval: "month" as const,
        features: [
          "Everything in Pro, plus",
          "Enforce privacy mode org-wide",
          "Centralized team billing",
          "Admin dashboard with usage stats",
          "SAML/OIDC SSO"
        ],
        isActive: true,
        isPerSeat: true,
        stripePriceId: "placeholder",
        stripeProductId: "placeholder",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    ];

    // Insert each plan
    for (const plan of plans) {
      await ctx.runMutation(internal.subscriptionQueries.savePlan, plan);
    }

    return "Subscription plans seeded successfully";
  },
}); 