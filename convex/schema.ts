"use node";

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
  })
  .index("by_userId", ["userId"])
  .index("by_email", ["email"]),

  posts: defineTable({
    title: v.string(),
    content: v.string(),
    published: v.boolean(),
    authorId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_author", ["authorId"])
  .index("by_creation", ["createdAt"]),

  socialAccounts: defineTable({
    userId: v.string(),
    platform: v.string(),
    username: v.string(),
    metadata: v.any(),
    isConnected: v.boolean(),
    updatedAt: v.number(),
  })
  .index("by_user_platform", ["userId", "platform"])
  .index("by_platform", ["platform"]),

  platformMetrics: defineTable({
    userId: v.string(),
    platform: v.string(),
    metrics: v.object({}),
    lastSyncDate: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user_platform", ["userId", "platform"])
  .index("by_sync_date", ["lastSyncDate"]),

  environment: defineTable({
    // OAuth client IDs and secrets
    googleClientId: v.optional(v.string()),
    googleClientSecret: v.optional(v.string()),
    instagramClientId: v.optional(v.string()),
    instagramClientSecret: v.optional(v.string()),
    tiktokClientId: v.optional(v.string()),
    tiktokClientSecret: v.optional(v.string()),

    // Webhook verification tokens
    facebookVerifyToken: v.optional(v.string()),
    instagramVerifyToken: v.optional(v.string()),

    // Application settings
    appScheme: v.optional(v.string()),
    apiBaseUrl: v.optional(v.string()),

    // Metadata
    updatedAt: v.number(),
  }),

  // Enhanced tables for Clerk-based OAuth integration
  gmailData: defineTable({
    userId: v.string(),
    data: v.any(),
    timestamp: v.number(),
    messageCount: v.optional(v.number()),
    query: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
  })
  .index("by_user", ["userId"])
  .index("by_timestamp", ["timestamp"]),

  youtubeData: defineTable({
    userId: v.string(),
    resourceType: v.string(),
    data: v.any(),
    timestamp: v.number(),
    videoCount: v.optional(v.number()),
    subscriberCount: v.optional(v.number()),
    viewCount: v.optional(v.number()),
  })
  .index("by_user_resource", ["userId", "resourceType"])
  .index("by_timestamp", ["timestamp"]),

  socialConnectionStatus: defineTable({
    userId: v.string(),
    connections: v.object({
      gmail: v.boolean(),
      youtube: v.boolean(),
      instagram: v.optional(v.boolean()),
      tiktok: v.optional(v.boolean()),
      facebook: v.optional(v.boolean())
    }),
    lastChecked: v.number(),
  })
  .index("by_user", ["userId"]),

  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    messages: v.array(v.object({
      content: v.string(),
      role: v.string(),
      timestamp: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
    starred: v.boolean(),
  })
  .index("by_user", ["userId"])
  .index("by_creation", ["createdAt"]),

  personas: defineTable({
    name: v.string(),
    creatorId: v.string(),
    currentState: v.object({
      description: v.string()
    }),
    currentActivities: v.object({
      description: v.string()
    }),
    aspirations: v.object({
      description: v.string()
    }),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["creatorId"])
  .index("by_active", ["isActive"]),

  notes: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    important: v.boolean(),
    type: v.optional(v.union(
      v.literal("ai_insight"),
      v.literal("conversation"),
      v.literal("idea"),
      v.literal("url"),
      v.literal("date")
    )),
    tags: v.array(v.string()),
    references: v.array(v.object({
      type: v.union(
        v.literal("ai_insight"),
        v.literal("conversation"),
        v.literal("idea"),
        v.literal("url"),
        v.literal("date"),
        v.literal("screen"),
        v.literal("component"),
        v.literal("section"),
        v.literal("feature"),
        v.literal("workflow")
      ),
      content: v.string(),
      isLoading: v.optional(v.boolean()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_creation", ["createdAt"])
  .index("by_type", ["type"]),

  tokens: defineTable({
    userId: v.string(),
    platform: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    scope: v.optional(v.string()),
  })
  .index("by_user_platform", ["userId", "platform"]),

  subscriptionPlans: defineTable({
    name: v.string(),
    price: v.number(),
    interval: v.union(v.literal("month"), v.literal("year")),
    features: v.array(v.string()),
    stripePriceId: v.string(),
    stripeProductId: v.string(),
    isActive: v.boolean(),
    isPerSeat: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_active", ["isActive"])
  .index("by_stripe", ["stripePriceId"]),

  userSubscriptions: defineTable({
    userId: v.string(),
    planId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    teamId: v.optional(v.string()),
    trialEndDate: v.optional(v.number()),
    quantity: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_stripe", ["stripeSubscriptionId"]),

  paymentMethods: defineTable({
    userId: v.string(),
    stripePaymentMethodId: v.string(),
    type: v.string(),
    last4: v.string(),
    brand: v.string(),
    expMonth: v.number(),
    expYear: v.number(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_stripe", ["stripePaymentMethodId"]),

  usage: defineTable({
    userId: v.string(),
    month: v.string(),
    completions: v.number(),
    fastRequests: v.number(),
    slowRequests: v.number(),
    overageCharges: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user_month", ["userId", "month"]),

  sessions: defineTable({
    userId: v.string(),
    type: v.union(v.literal("desktop"), v.literal("web")),
    createdAt: v.number(),
    lastActive: v.number(),
    revoked: v.boolean(),
  })
  .index("by_user", ["userId"]),

  usageEvents: defineTable({
    userId: v.string(),
    timestamp: v.number(),
    model: v.string(),
    status: v.string(),
    qty: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_timestamp", ["timestamp"]),

  ubpSettings: defineTable({
    userId: v.string(),
    enabled: v.boolean(),
    premiumEnabled: v.boolean(),
    monthlyLimit: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"]),
});