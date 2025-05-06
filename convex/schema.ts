"use node";
import { defineSchema, defineTable } from "convex/server"; 
import { v } from "convex/values";

export default defineSchema({
  // User Info
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
  })
  .index("by_userId", ["userId"])
  .index("by_email", ["email"]),

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


  // YouTube Data
  youtubeData: defineTable({
    userId: v.string(),
    resourceType: v.union(v.literal("channel"), v.literal("video"), v.literal("video_analysis")),
    data: v.object({
      id: v.string(),
      snippet: v.optional(v.object({
        title: v.string(),
        description: v.string(),
        customUrl: v.optional(v.string()),
        thumbnails: v.optional(v.object({
          default: v.optional(v.object({
            url: v.string(),
            width: v.number(),
            height: v.number()
          })),
          medium: v.optional(v.object({
            url: v.string(),
            width: v.number(),
            height: v.number()
          })),
          high: v.optional(v.object({
            url: v.string(),
            width: v.number(),
            height: v.number()
          }))
        })),
        publishedAt: v.optional(v.string())
      })),
      statistics: v.optional(v.object({
        viewCount: v.string(),
        subscriberCount: v.string(),
        hiddenSubscriberCount: v.boolean(),
        videoCount: v.string()
      })),
      videoId: v.optional(v.string()),
      analysisData: v.optional(v.any())
    }),
    timestamp: v.number(),
    videoCount: v.optional(v.number()),
    subscriberCount: v.optional(v.number()),
    viewCount: v.optional(v.number()),
  })
  .index("by_user_resource", ["userId", "resourceType"])
  .index("by_timestamp", ["timestamp"]),

  youtubeTokens: defineTable({
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiryDate: v.number(), 
    scope: v.string(),
    lastRefreshed: v.number(),
  }).index("by_userId", ["userId"]),

  // Chat conversations
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

  // Notes
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
        v.literal("date")
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

  // API Keys
  api_keys: defineTable({
    user_id: v.string(), // Firebase UID
    hashed_key: v.string(), // SHA-256 hash of API key
    created_at: v.number(),
    rate_tier: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
  }),

  // Rate Limits
  rate_limits: defineTable({
    user_id: v.string(), // Firebase user ID (same as used in api_keys)
    resource: v.string(), // Resource being rate limited (endpoint, action, etc.)
    timestamps: v.array(v.number()), // Array of Unix timestamps for requests
    lastUpdated: v.number(), // Last updated timestamp
  })
  .index("by_user_resource", ["user_id", "resource"]),
});