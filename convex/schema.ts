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
    userId: v.optional(v.string()),
    creatorId: v.string(),
    platform: v.string(),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    tokenType: v.optional(v.string()),
    scope: v.optional(v.string()),
    profileUrl: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
    isConnected: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    lastScraped: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
  .index("by_user_platform", ["userId", "platform"])
  .index("by_creator_platform", ["creatorId", "platform"])
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
    tags: v.array(v.string()),
    references: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_creation", ["createdAt"]),
}); 