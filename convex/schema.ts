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
    username: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.string()),
    // Stripe integration
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    // Subscription state
    subscription: v.optional(v.object({
      status: v.union(
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
      ),
      // Plan type with interval
      plan: v.union(
        v.literal("monthly_basic"),
        v.literal("monthly_pro"),
        v.literal("yearly_basic"),
        v.literal("yearly_pro")
      ),
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
      interval: v.optional(v.union(v.literal("month"), v.literal("year"))),
      cancel_at: v.optional(v.number()),
      customer: v.optional(v.string()),
      items: v.optional(v.any()),
      quantity: v.optional(v.number()),
      start_date: v.optional(v.number()),
      ubpEnabled: v.optional(v.boolean()),
      monthlyLimit: v.optional(v.number()),
    })),
    paymentMethod: v.optional(v.object({
      brand: v.string(),
      last4: v.string(),
      expMonth: v.number(),
      expYear: v.number()
    })),
  })
  .index("by_userId", ["userId"])
  .index("by_email", ["email"])
  .index("by_stripeCustomerId", ["stripeCustomerId"])
  .index("by_username", ["username"])
  .index("by_referralCode", ["referralCode"]),

  // Ambient Insights
  ambientInsights: defineTable({
    userId: v.string(),
    data: v.array(v.object({
      title: v.string(),
      content: v.string(),
      category: v.string(),
      recommendation: v.string(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"]),

  // Content Hub Insights
  contentHubInsights: defineTable({
    userId: v.string(),
    insight: v.object({
      remix_insight: v.string(),
      youtube_hook: v.string(),
      youtube_format: v.string(),
      youtube_cta: v.string(),
      instagram_hook: v.string(),
      instagram_format: v.string(),
      instagram_cta: v.string(),
      gmail_hook: v.string(),
      gmail_format: v.string(),
      gmail_cta: v.string(),
      smartnote_summary: v.string(),
      conversation_starter: v.string(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"]),

  // Personas
  personas: defineTable({
    current_name: v.string(),
    current_description: v.string(),
    experience_level: v.string(),
    content_formats: v.array(v.string()),
    content_tone: v.string(),
    content_voice: v.string(),
    content_pillars: v.array(v.string()),
    unique_value: v.string(),
    future_name: v.string(),
    future_description: v.string(),
    goals: v.array(v.string()),
    desired_impact: v.string(),
    primary_topics: v.array(v.string()),
    secondary_topics: v.array(v.string()),
    tone_descriptors: v.array(v.string()),
    style_descriptors: v.array(v.string()),
    audience_type: v.string(),
    engagement_style: v.array(v.string()),
    userId: v.string(),
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
    content: v.optional(v.string()),
    important: v.optional(v.boolean()),
    platform: v.optional(v.string()),
    references: v.optional(v.array(v.string())),
    type: v.optional(v.union(
      v.literal("idea_bank"),
      v.literal("content_script"),
      v.literal("collaboration_note"),
      v.literal("analytics_insight"),
      v.literal("reflection_journal"),
      v.literal("task_checklist")
    )),
    tags: v.array(v.string()),
    analysis: v.optional(v.string()),
    images: v.optional(v.array(v.object({
      url: v.string(),
      filename: v.string(),
      originalFilename: v.optional(v.string()),
      uploadedAt: v.number(),
      size: v.optional(v.number()),
      mimeType: v.optional(v.string()),
      width: v.optional(v.number()),
      height: v.optional(v.number())
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
    titleGenerated: v.optional(v.boolean()),
    typeGenerated: v.optional(v.boolean()),
  })
  .index("by_user", ["userId"])
  .index("by_creation", ["createdAt"])
  .index("by_type", ["type"]),

  // Projects
  projects: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    noteIds: v.optional(v.array(v.string())),
    conversationIds: v.optional(v.array(v.string())),
    instagramPostIds: v.optional(v.array(v.string())),
    youtubeVideoIds: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_creation", ["createdAt"]),

  // API Keys
  api_keys: defineTable({
    user_id: v.string(),
    hashed_key: v.string(),
    created_at: v.number(),
    rate_tier: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
  }),

  // Rate Limits
  rate_limits: defineTable({
    user_id: v.string(),
    resource: v.string(),
    timestamps: v.array(v.number()),
    lastUpdated: v.number(),
  })
  .index("by_user_resource", ["user_id", "resource"]),

  // Gmail Tokens (from third schema)
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
    labelsTotal: v.optional(v.union(v.number(), v.null())),
    data: v.optional(v.any()),
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
    from: v.optional(v.string()),
    subject: v.optional(v.string()),
    snippet: v.optional(v.string()),
    message_count: v.optional(v.number()),
    messages: v.optional(v.array(v.object({
      id: v.string(),
      from: v.optional(v.string()),
      subject: v.optional(v.string()),
      snippet: v.optional(v.string()),
      label_ids: v.optional(v.array(v.string())),
    }))),
    data: v.optional(v.any()),
    analysis: v.optional(v.any()),
    spamStatus: v.optional(v.union(
      v.literal('unreviewed'),
      v.literal('flagged'),
      v.literal('confirmed_spam'),
      v.literal('not_spam')
    )),
    spamScore: v.optional(v.number()),
    reviewedByUser: v.optional(v.boolean()),
    reviewedAt: v.optional(v.number()),
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
    data: v.optional(v.any()),
    spamStatus: v.optional(v.union(
      v.literal('unreviewed'),
      v.literal('flagged'),
      v.literal('confirmed_spam'),
      v.literal('not_spam')
    )),
    spamScore: v.optional(v.number()),
    reviewedByUser: v.optional(v.boolean()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_email", ["email"])
  .index("by_messageId", ["messageId"])
  .index("by_threadId", ["threadId"])
  .index("by_user_email", ["userId", "email"]),

  // Gmail History
  gmailHistory: defineTable({
    userId: v.string(),
    email: v.string(),
    historyId: v.string(),
    timestamp: v.optional(v.number()),
    data: v.optional(v.any()),
    createdAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_email", ["email"])
  .index("by_historyId", ["historyId"])
  .index("by_timestamp", ["timestamp"]),

  // YouTube Tokens
  youtubeTokens: defineTable({
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiryDate: v.number(),
    scope: v.string(),
    lastRefreshed: v.number(),
  }).index("by_userId", ["userId"]),

  // YouTube Channels
  youtubeChannels: defineTable({
    userId: v.string(),
    analysis: v.optional(v.any()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
    id: v.string(),
    snippet: v.optional(
      v.object({
        customUrl: v.optional(v.string()),
        description: v.optional(v.string()),
        localized: v.optional(
          v.object({
            description: v.optional(v.string()),
            title: v.optional(v.string()),
          })
        ),
        publishedAt: v.optional(v.string()),
        thumbnails: v.optional(
          v.object({
            default: v.optional(
              v.object({
                height: v.optional(v.float64()),
                url: v.optional(v.string()),
                width: v.optional(v.float64()),
              })
            ),
            high: v.optional(
              v.object({
                height: v.optional(v.float64()),
                url: v.optional(v.string()),
                width: v.optional(v.float64()),
              })
            ),
            medium: v.optional(
              v.object({
                height: v.optional(v.float64()),
                url: v.optional(v.string()),
                width: v.optional(v.float64()),
              })
            ),
          })
        ),
        title: v.optional(v.string()),
      })
    ),
    statistics: v.optional(
      v.object({
        hiddenSubscriberCount: v.optional(v.boolean()),
        subscriberCount: v.optional(v.string()),
        videoCount: v.optional(v.string()),
        viewCount: v.optional(v.string()),
      })
    )
  })
  .index("by_userId", ["userId"])
  .index("by_channelId", ["id"])
  .index("by_publishedAt", ["snippet.publishedAt"]),

  // YouTube Videos
  youtubeVideos: defineTable({
    userId: v.string(),
    videoId: v.string(),
    channelId: v.optional(v.string()),
    id: v.optional(v.string()),
    url: v.optional(v.string()),
    analysis: v.optional(v.any()),
    analysisMarkdown: v.optional(v.string()),
    analytics: v.optional(v.any()),
    public_stats: v.optional(v.any()),
    snippet: v.optional(v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      published_at: v.optional(v.string()),
      channel: v.optional(v.object({
        id: v.optional(v.union(v.string(), v.null())),
        title: v.optional(v.union(v.string(), v.null())),
      })),
      thumbnails: v.optional(v.object({
        default: v.optional(v.union(v.string(), v.null())),
        medium: v.optional(v.union(v.string(), v.null())),
        high: v.optional(v.union(v.string(), v.null())),
        standard: v.optional(v.union(v.string(), v.null())),
        maxres: v.optional(v.union(v.string(), v.null())),
      })),
      tags: v.optional(v.array(v.string())),
    })),
    content_details: v.optional(v.object({
      duration: v.optional(v.string()),
      dimension: v.optional(v.string()),
      definition: v.optional(v.string()),
      has_captions: v.optional(v.boolean()),
      is_live: v.optional(v.boolean()),
    })),
    statistics: v.optional(v.object({
      views: v.optional(v.float64()),
      likes: v.optional(v.float64()),
      dislikes: v.optional(v.float64()),
      comments: v.optional(v.float64()),
    })),
    status: v.optional(v.object({
      privacyStatus: v.optional(v.string()),
      uploadStatus: v.optional(v.string()),
      embeddable: v.optional(v.boolean()),
      license: v.optional(v.string()),
      madeForKids: v.optional(v.boolean()),
      selfDeclaredMadeForKids: v.optional(v.boolean()),
      publicStatsViewable: v.optional(v.boolean()),
    })),
    captions: v.optional(v.object({
      status: v.optional(v.string()),
      message: v.optional(v.string()),
      video_url: v.optional(v.string()),
      caption_track: v.optional(v.object({
        id: v.optional(v.string()),
        format: v.optional(v.string()),
        language: v.optional(v.string()),
        name: v.optional(v.string()),
        text: v.optional(v.string()),
      })),
      data: v.optional(v.any()),
    })),
    comments: v.optional(v.object({
      status: v.optional(v.string()),
      video_url: v.optional(v.string()),
      message: v.optional(v.string()),
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
    createdAt: v.optional(v.float64()),
    updatedAt: v.optional(v.float64()),
  })
  .index("by_userId", ["userId"])
  .index("by_videoId", ["videoId"])
  .index("by_channelId", ["snippet.channel.id"])
  .index("by_publishedAt", ["snippet.published_at"])
  .index("by_views", ["statistics.views"])
  .index("by_likes", ["statistics.likes"]),

 // Instagram Accounts (consolidated with tokens and insights)
 instagramAccounts: defineTable({
  userId: v.string(),
  instagramAccountId: v.string(),
  username: v.string(),
  profileData: v.object({
    id: v.string(),
    username: v.string(),
    account_type: v.any(),
    profile_picture_url: v.optional(v.any()),
    followers_count: v.any(),
    follows_count: v.any(),
    media_count: v.any(),
    name: v.optional(v.string()),
    biography: v.optional(v.string()),
    website: v.optional(v.string()),
  }),
  // Token data (consolidated from instagramTokens table)
  token: v.optional(v.object({
    accessToken: v.string(),
    expiryDate: v.number(),
    scope: v.string(),
    lastRefreshed: v.number(),
  })),
  // Profile insights data
  profileInsights: v.optional(v.object({
    reach: v.optional(v.number()),
    profile_views: v.optional(v.number()),
    website_clicks: v.optional(v.number()),
    follower_count: v.optional(v.number()),
    period: v.optional(v.string()),
    lastUpdated: v.optional(v.number()),
  })),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_userId", ["userId"])
.index("by_username", ["username"])
.index("by_instagramAccountId", ["instagramAccountId"]),
  // Unified Instagram Posts Table - Handles all media types (IMAGE, VIDEO, CAROUSEL_ALBUM, REELS)
  instagramPosts: defineTable({
    userId: v.string(),
    instagramAccountId: v.string(),
    postId: v.string(),
    mediaType: v.union(
      v.literal("IMAGE"),
      v.literal("VIDEO"), 
      v.literal("CAROUSEL_ALBUM"),
      v.literal("REELS")
    ),
    data: v.object({
      // Core fields (common to all types)
      id: v.string(),
      caption: v.string(),
      media_url: v.string(),
      permalink: v.string(),
      timestamp: v.number(),
      username: v.string(),
      like_count: v.optional(v.number()),
      comments_count: v.optional(v.number()),
      
      // Type-specific fields (made optional since different media types have different fields)
      thumbnail_url: v.optional(v.union(v.string(), v.null())), // For videos/reels only
      children: v.optional(v.union(v.array(v.object({
        id: v.string(),
        media_url: v.string(),
        media_type: v.string(),
        thumbnail_url: v.optional(v.union(v.string(), v.null()))
      })), v.null())), // For carousels only
      
      // Embedded insights (flattened for easy access)
      insights: v.optional(v.object({
        impressions: v.optional(v.number()),
        reach: v.optional(v.number()),
        likes: v.optional(v.number()),
        comments: v.optional(v.number()),
        saved: v.optional(v.number()),
        shares: v.optional(v.number()),
        total_interactions: v.optional(v.number()),
        profile_visits: v.optional(v.number()),
        profile_activity: v.optional(v.number()),
        views: v.optional(v.number()),
        follows: v.optional(v.number()),
        // Reels-specific insights
        ig_reels_avg_watch_time: v.optional(v.number()),
        ig_reels_video_view_total_time: v.optional(v.number()),
        period: v.optional(v.string()),
        timestamp: v.optional(v.number())
      })),
      
      // Embedded comments (for recent/important ones)
      comments: v.optional(v.array(v.object({
        id: v.string(),
        text: v.string(),
        timestamp: v.number(),
        username: v.string(),
        like_count: v.optional(v.number()),
        replies: v.optional(v.array(v.object({
          id: v.string(),
          text: v.string(),
          timestamp: v.number(),
          username: v.optional(v.string())
        })))
      })))
    }),
    
    // Analysis fields
    analysis: v.optional(v.any()),
    analysisMarkdown: v.optional(v.string()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_instagramAccountId", ["instagramAccountId"])
  .index("by_postId", ["postId"])
  .index("by_mediaType", ["mediaType"])
  .index("by_timestamp", ["data.timestamp"])
  .index("by_user_account", ["userId", "instagramAccountId"]),

  // Instagram Analysis Tables (keeping these for backward compatibility and specific analysis tracking)
  instagramTrackerAnalysis: defineTable({
    userId: v.string(),
    instagramAccountId: v.string(),
    analysis: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_account", ["instagramAccountId"]),

  instagramBatchAnalysis: defineTable({
    insights: v.optional(v.any()),
    status: v.optional(v.any()),
    createdAt: v.float64(),
    instagramAccountId: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
    analysisType: v.literal("batch"),
  })
    .index("by_account", ["instagramAccountId"])
    .index("by_userId", ["userId"])
    .index("by_user_account", ["userId", "instagramAccountId"]),

  // Usage Events
  usageEvents: defineTable({
    userId: v.string(),
    timestamp: v.number(),
    model: v.string(),
    status: v.string(),
    qty: v.number(),
    endpoint: v.optional(v.string()),
    method: v.optional(v.string()),
    path: v.optional(v.string()),
    statusCode: v.optional(v.number()),
    userAgent: v.optional(v.string()),
    ip: v.optional(v.string()),
    requestId: v.optional(v.string()),
  })
  .index("by_user", ["userId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_endpoint", ["endpoint"])
  .index("by_status", ["status"]),

  // Waitlist
  waitlist: defineTable({
    name: v.string(),
    email: v.string(),
    timestamp: v.number(),
    status: v.string(),
  })
  .index("by_email", ["email"]),

  // YouTube Batch Analysis
  youtubeBatchAnalysis: defineTable({
    insights: v.optional(v.any()),
    status: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
    userId: v.string(),
    channelId: v.string(),
    analysisType: v.literal("batch"),
  })
    .index("by_userId", ["userId"])
    .index("by_user_channel", ["userId", "channelId"]),

  // Gmail Batch Analysis
  gmailBatchAnalysis: defineTable({
    insights: v.optional(v.any()),
    status: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
    userId: v.string(),
    gmailAccountId: v.string(),
    analysisType: v.literal("batch"),
  })
    .index("by_userId", ["userId"])
    .index("by_user_account", ["userId", "gmailAccountId"]),

  // Vector embeddings for search
  contentEmbeddings: defineTable({
    userId: v.string(),
    contentId: v.string(), // ID of the original content (conversation, post, etc.)
    contentType: v.union(
      v.literal("conversation"),
      v.literal("instagram_post"),
      v.literal("youtube_video"),
      v.literal("gmail_thread"),
      v.literal("note")
    ),
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_contentType", ["contentType"])
  .index("by_user_type", ["userId", "contentType"])
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 768, // text-embedding-004 dimension
    filterFields: ["userId", "contentType"],
  }),
});