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

  // Social Media Data

  // Gmail Tokens
  gmailTokens: defineTable({
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiryDate: v.number(),
    scope: v.string(),
    lastRefreshed: v.number(),
    tokenType: v.string(),
  }).index("by_userId", ["userId"]),

  // PLACEHOLDER Gmail Data - unified table for messages, threads, and accounts (change later, for data collection purposes)
  gmailData: defineTable({
    userId: v.string(),
    email: v.string(),
    resourceType: v.union(v.literal("message"), v.literal("thread"), v.literal("account")),
    resourceId: v.optional(v.any()), // Either messageId, threadId, or email for accounts
    threadId: v.optional(v.any()), // More flexible
    snippet: v.optional(v.any()), // More flexible
    historyId: v.optional(v.any()),
    internalDate: v.optional(v.any()),
    labelIds: v.optional(v.any()),
    messages: v.optional(v.any()), // For threads: array of message IDs
    data: v.any(), // Full message payload, thread data, or account data
    sizeEstimate: v.optional(v.any()),
    timestamp: v.number(), // When this record was created/updated
    // Account specific fields
    messagesTotal: v.optional(v.any()),
    threadsTotal: v.optional(v.any()),
    labelsTotal: v.optional(v.any()),
  })
  .index("by_user", ["userId"])
  .index("by_email", ["userId", "email"])
  .index("by_resource_type", ["resourceType"])
  .index("by_resource_id", ["resourceId"])
  .index("by_thread_id", ["threadId"])
  .index("by_user_resource", ["userId", "resourceType"])
  .index("by_timestamp", ["timestamp"]),

  // YouTube Data (placeholder, used for data collection purposes)
  youtubeData: defineTable({
    userId: v.string(),
    resourceType: v.union(v.literal("channel"), v.literal("video"), v.literal("video_analysis")),
    data: v.any(),
    timestamp: v.number(),
    videoCount: v.optional(v.number()),
    subscriberCount: v.optional(v.number()),
    viewCount: v.optional(v.number()),
  })
  .index("by_user_resource", ["userId", "resourceType"])
  .index("by_timestamp", ["timestamp"])
  .index("by_user", ["userId"])
  .index("by_resource_type", ["resourceType"]),

  youtubeTokens: defineTable({
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiryDate: v.number(), 
    scope: v.string(),
    lastRefreshed: v.number(),
  }).index("by_userId", ["userId"]),

  youtubeChannels: defineTable({
    userId: v.string(),
    etag: v.optional(v.string()),
    id: v.string(),
    kind: v.optional(v.string()),
    snippet: v.optional(v.object({
      customUrl: v.optional(v.string()),
      description: v.optional(v.string()),
      localized: v.optional(v.object({
        description: v.optional(v.string()),
        title: v.optional(v.string()),
      })),
      publishedAt: v.optional(v.string()),
      thumbnails: v.optional(v.object({
        default: v.optional(v.object({
          height: v.optional(v.number()),
          url: v.optional(v.string()),
          width: v.optional(v.number()),
        })),
        high: v.optional(v.object({
          height: v.optional(v.number()),
          url: v.optional(v.string()),
          width: v.optional(v.number()),
        })),
        medium: v.optional(v.object({
          height: v.optional(v.number()),
          url: v.optional(v.string()),
          width: v.optional(v.number()),
        })),
      })),
      title: v.optional(v.string()),
    })),
    statistics: v.optional(v.object({
      hiddenSubscriberCount: v.optional(v.boolean()),
      subscriberCount: v.optional(v.string()),
      videoCount: v.optional(v.string()),
      viewCount: v.optional(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_publishedAt", ["snippet.publishedAt"])
  .index("by_channelId", ["id"]),

  youtubeVideos: defineTable({
    userId: v.string(),
    id: v.optional(v.string()),
    videoId: v.optional(v.string()),
    url: v.optional(v.string()),
    snippet: v.optional(v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      publishedAt: v.optional(v.string()),
      channel: v.optional(v.object({
        id: v.optional(v.string()),
        title: v.optional(v.string()),
      })),
      thumbnails: v.optional(v.any()), // Can be variable structure
      tags: v.optional(v.array(v.string())),
    })),
    contentDetails: v.optional(v.any()), // Can be variable structure
    statistics: v.optional(v.object({
      views: v.optional(v.number()),
      likes: v.optional(v.number()),
      dislikes: v.optional(v.number()),
      comments: v.optional(v.number()),
    })),
    status: v.optional(v.any()), // Allow for any status structure
    captions: v.optional(v.any()),
    comments: v.optional(v.any()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
  .index("by_userId", ["userId"])
  .index("by_videoId", ["videoId"])
  .index("by_channelId", ["snippet.channel.id"])
  .index("by_publishedAt", ["snippet.publishedAt"])
  .index("by_views", ["statistics.views"])
  .index("by_likes", ["statistics.likes"]),


  // Instagram Tokens
  instagramTokens: defineTable({
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiryDate: v.number(),
    scope: v.string(),
    lastRefreshed: v.number(),
  }).index("by_userId", ["userId"]),

  // PLACEHOLDER Instagram Data (edit to fit exact Instagram schema)
  instagramData: defineTable({
    userId: v.string(),
    resourceType: v.union(
      v.literal("profile"), 
      v.literal("post"), 
      v.literal("story"),
      v.literal("reel")
    ),
    resourceId: v.string(),
    data: v.any(),
    timestamp: v.number(),
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    postCount: v.optional(v.number()),
  })
  .index("by_user", ["userId"])
  .index("by_resource_type", ["resourceType"])
  .index("by_resource_id", ["resourceId"])
  .index("by_user_resource", ["userId", "resourceType"])
  .index("by_timestamp", ["timestamp"]),
});