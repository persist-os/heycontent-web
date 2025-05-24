"use node";
import { defineSchema, defineTable } from "convex/server"; 
import { v } from "convex/values";

export default defineSchema({
  notesAnalyses: defineTable({
    noteId: v.string(),
    platform: v.string(),
    output: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
  .index("by_noteId", ["noteId"]),
  // User Info
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
    username: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscription: v.optional(v.any()), // You can use v.object({...}) for stricter validation if needed
  })
  .index("by_userId", ["userId"])
  .index("by_email", ["email"])
  .index("by_username", ["username"]),

  personas: defineTable({
    name: v.string(),
    userId: v.string(),
    currentPersona: v.object({
      description: v.string()
    }),
    futureVision: v.object({
      description: v.string()
    }),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_active", ["isActive"]),
  
  // Chat conversations
  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    messages: v.array(v.object({
      content: v.string(),
      role: v.string(),
      timestamp: v.optional(v.number()),
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
    platform: v.optional(v.string()), // Added to support platform-specific notes
    type: v.optional(v.union(
      v.literal("ai_insight"),
      v.literal("conversation"),
      v.literal("idea"),
      v.literal("url"),
      v.literal("date"),
      v.literal("brainstorm")
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

  // Gmail Account Info
  gmailAccounts: defineTable({
    userId: v.string(),
    email: v.string(),
    historyId: v.optional(v.string()),
    messagesTotal: v.optional(v.number()),
    threadsTotal: v.optional(v.number()),
    labelsTotal: v.optional(v.union(v.number(), v.null())), // Make more flexible to handle null values
    data: v.optional(v.any()), // Any additional account data
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_email", ["email"]),

  // Gmail Threads
  gmailThreads: defineTable({
    userId: v.string(),
    email: v.string(),
    threadId: v.string(),
    message_count: v.optional(v.number()),
    messages: v.optional(v.array(v.object({
      id: v.string(),
      from: v.optional(v.string()),
      subject: v.optional(v.string()),
      snippet: v.optional(v.string()),
      label_ids: v.optional(v.array(v.string())),
    }))),
    snippet: v.optional(v.string()),
    historyId: v.optional(v.string()),
    labelIds: v.optional(v.array(v.string())),
    data: v.optional(v.any()), // Complete thread data
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_email", ["email"])
  .index("by_threadId", ["threadId"])
  .index("by_user_email", ["userId", "email"]),

  // Gmail Messages
  gmailMessages: defineTable({
    userId: v.string(),
    email: v.string(),
    messageId: v.string(),
    threadId: v.string(),
    from: v.optional(v.string()),
    subject: v.optional(v.string()),
    snippet: v.optional(v.string()),
    labelIds: v.optional(v.array(v.string())),
    internalDate: v.optional(v.string()),
    sizeEstimate: v.optional(v.number()),
    historyId: v.optional(v.string()),
    data: v.optional(v.any()), // Complete message data
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_email", ["email"])
  .index("by_messageId", ["messageId"])
  .index("by_threadId", ["threadId"])
  .index("by_user_email", ["userId", "email"]),

  
  // For storing Gmail push notifications history
  gmailHistory: defineTable({
    userId: v.string(),
    email: v.string(),
    historyId: v.string(),
    timestamp: v.optional(v.number()),
    data: v.optional(v.any()), // History data from Gmail API
    createdAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_email", ["email"])
  .index("by_historyId", ["historyId"])
  .index("by_timestamp", ["timestamp"]),
  
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
    id: v.string(),
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
    userId: v.string(), // Required field
    videoId: v.string(), // Required - this is the YouTube video ID
    id: v.optional(v.string()), // For internal IDs if different from videoId
    url: v.optional(v.string()), // Full YouTube URL
    // Optional AI analysis field (for compatibility with prod data and to store analysis data directly with the video)
    analysis: v.optional(v.any()),
    
    // Video metadata from YouTube API
    snippet: v.optional(v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      published_at: v.optional(v.string()),
      channel: v.optional(v.object({
        id: v.optional(v.string()),
        title: v.optional(v.string()),
      })),
      thumbnails: v.optional(v.object({
        default: v.optional(v.string()),
        medium: v.optional(v.string()),
        high: v.optional(v.string()),
        standard: v.optional(v.string()),
        maxres: v.optional(v.string()),
      })),
      tags: v.optional(v.array(v.string())),
    })),
    
    // Technical details of the video
    content_details: v.optional(v.object({
      duration: v.optional(v.string()),
      dimension: v.optional(v.string()),
      definition: v.optional(v.string()),
      has_captions: v.optional(v.boolean()),
      is_live: v.optional(v.boolean()),
    })),
    
    // View/engagement statistics
    statistics: v.optional(v.object({
      views: v.optional(v.float64()),
      likes: v.optional(v.float64()),
      dislikes: v.optional(v.float64()),
      comments: v.optional(v.float64()),
    })),
    
    // Video status information
    status: v.optional(v.object({
      privacyStatus: v.optional(v.string()),
      uploadStatus: v.optional(v.string()),
      embeddable: v.optional(v.boolean()),
      license: v.optional(v.string()),
      madeForKids: v.optional(v.boolean()),
      selfDeclaredMadeForKids: v.optional(v.boolean()),
      publicStatsViewable: v.optional(v.boolean()),
    })),
    
    // Caption information - flexible structure for different responses
    captions: v.optional(v.object({
      status: v.optional(v.string()),
      message: v.optional(v.string()),
      video_url: v.optional(v.string()),
      // Caption track containing actual captions data
      caption_track: v.optional(v.object({
        id: v.optional(v.string()),
        format: v.optional(v.string()),
        language: v.optional(v.string()),
        name: v.optional(v.string()),
        text: v.optional(v.string()),
      })),
      data: v.optional(v.any()), // For storing additional caption data if needed
    })),
    
    // Comment information - flexible structure
    comments: v.optional(v.object({
      status: v.optional(v.string()),
      video_url: v.optional(v.string()),
      message: v.optional(v.string()), // Error message when comments are disabled or not found
      total_comments: v.optional(v.float64()),
      top_level_comments: v.optional(v.float64()),
      comments: v.optional(v.array(v.object({
        id: v.optional(v.string()),
        text: v.optional(v.string()),
        published_at: v.optional(v.string()),
        likes: v.optional(v.float64()),
        replies: v.optional(v.float64()),
        is_reply: v.optional(v.boolean()),
        author: v.optional(v.object({
          channel_id: v.optional(v.string()),
          display_name: v.optional(v.string()),
          profile_image: v.optional(v.string()),
        })),
      }))),
    })),

    // Store channelId redundantly for indexing
    channelId: v.optional(v.string()),
    // Timestamps
    createdAt: v.optional(v.float64()),
    updatedAt: v.optional(v.float64()),
  })
  .index("by_userId", ["userId"])
  .index("by_videoId", ["videoId"])
  .index("by_channelId", ["channelId"])
  .index("by_publishedAt", ["snippet.published_at"])
  .index("by_views", ["statistics.views"])
  .index("by_likes", ["statistics.likes"]),


  // Instagram Tokens
  instagramTokens: defineTable({
    userId: v.string(),
    accountId: v.any(),
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
    timestamp: v.optional(v.number()),
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    postCount: v.optional(v.number()),
  })
  .index("by_user", ["userId"])
  .index("by_resource_type", ["resourceType"])
  .index("by_resource_id", ["resourceId"])
  .index("by_user_resource", ["userId", "resourceType"])
  .index("by_timestamp", ["timestamp"]),

  // Instagram Accounts
  instagramAccounts: defineTable({
    userId: v.string(),
    accountId: v.any(),    
    username: v.string(),
    profileData: v.object({
      id: v.string(),
      username: v.string(),
      account_type: v.any(),
      profile_picture_url: v.any(),
      followers_count: v.any(),
      follows_count: v.any(),
      media_count: v.any(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_username", ["username"]),

  // Instagram Posts
  instagramPosts: defineTable({
    accountId: v.any(),
    userId: v.string(),
    postId: v.string(),
    data: v.object({
      id: v.string(),
      caption: v.string(),
      media_type: v.union(
        v.literal("IMAGE"),
        v.literal("VIDEO"),
        v.literal("CAROUSEL_ALBUM")
      ),
      like_count: v.optional(v.number()),
      media_url: v.string(),
      permalink: v.string(),
      username: v.string(),
      timestamp: v.optional(v.number()),
      comment_count: v.optional(v.number()),
      thumbnail_url: v.optional(v.string()),
      comments: v.optional(v.any()),
      children: v.optional(v.array(v.object({
        id: v.string(),
        media_url: v.string(),
        media_type: v.string()
      })))
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_accountId", ["accountId"])
  .index("by_userId", ["userId"])
  .index("by_postId", ["postId"])
  .index("by_timestamp", ["data.timestamp"]),

});