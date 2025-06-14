import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ambientInsights: defineTable({
    createdAt: v.float64(),
    data: v.array(
      v.object({
        category: v.string(),
        content: v.string(),
        recommendation: v.string(),
        title: v.string(),
      })
    ),
    updatedAt: v.float64(),
    userId: v.string(),
  }).index("by_userId", ["userId"]),
  api_keys: defineTable({
    created_at: v.float64(),
    hashed_key: v.string(),
    rate_tier: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
    user_id: v.string(),
  }),
  conversations: defineTable({
    createdAt: v.float64(),
    messages: v.array(
      v.object({
        content: v.string(),
        role: v.string(),
        timestamp: v.optional(v.float64()),
      })
    ),
    starred: v.boolean(),
    title: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_creation", ["createdAt"])
    .index("by_user", ["userId"]),
  gmailAccounts: defineTable({
    createdAt: v.float64(),
    data: v.optional(v.any()),
    email: v.string(),
    historyId: v.optional(v.string()),
    labelsTotal: v.optional(v.union(v.float64(), v.null())),
    messagesTotal: v.optional(v.float64()),
    threadsTotal: v.optional(v.float64()),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_userId", ["userId"]),
  gmailHistory: defineTable({
    createdAt: v.float64(),
    data: v.optional(v.any()),
    email: v.string(),
    historyId: v.string(),
    timestamp: v.optional(v.float64()),
    userId: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_historyId", ["historyId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_userId", ["userId"]),
  gmailMessages: defineTable({
    createdAt: v.float64(),
    data: v.optional(v.any()),
    email: v.string(),
    from: v.optional(v.string()),
    historyId: v.optional(v.string()),
    internalDate: v.optional(v.string()),
    labelIds: v.optional(v.array(v.string())),
    messageId: v.string(),
    reviewedAt: v.optional(v.float64()),
    reviewedByUser: v.optional(v.boolean()),
    sizeEstimate: v.optional(v.float64()),
    snippet: v.optional(v.string()),
    spamScore: v.optional(v.float64()),
    spamStatus: v.optional(
      v.union(
        v.literal("unreviewed"),
        v.literal("flagged"),
        v.literal("confirmed_spam"),
        v.literal("not_spam")
      )
    ),
    subject: v.optional(v.string()),
    threadId: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_messageId", ["messageId"])
    .index("by_threadId", ["threadId"])
    .index("by_userId", ["userId"])
    .index("by_user_email", ["userId", "email"]),
  gmailThreads: defineTable({
    analysis: v.optional(v.any()),
    createdAt: v.float64(),
    data: v.optional(v.any()),
    email: v.string(),
    from: v.optional(v.string()),
    message_count: v.optional(v.float64()),
    messages: v.optional(
      v.array(
        v.object({
          from: v.optional(v.string()),
          id: v.string(),
          label_ids: v.optional(v.array(v.string())),
          snippet: v.optional(v.string()),
          subject: v.optional(v.string()),
        })
      )
    ),
    reviewedAt: v.optional(v.float64()),
    reviewedByUser: v.optional(v.boolean()),
    snippet: v.optional(v.string()),
    spamScore: v.optional(v.float64()),
    spamStatus: v.optional(
      v.union(
        v.literal("unreviewed"),
        v.literal("flagged"),
        v.literal("confirmed_spam"),
        v.literal("not_spam")
      )
    ),
    subject: v.optional(v.string()),
    threadId: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_threadId", ["threadId"])
    .index("by_userId", ["userId"])
    .index("by_user_email", ["userId", "email"]),
  gmailTokens: defineTable({
    accessToken: v.string(),
    expiryDate: v.float64(),
    lastRefreshed: v.float64(),
    refreshToken: v.string(),
    scope: v.string(),
    tokenType: v.string(),
    userId: v.string(),
  }).index("by_userId", ["userId"]),
  instagramAccounts: defineTable({
    createdAt: v.float64(),
    instagramAccountId: v.string(),
    profileData: v.object({
      account_type: v.any(),
      followers_count: v.any(),
      follows_count: v.any(),
      id: v.string(),
      media_count: v.any(),
      profile_picture_url: v.any(),
      username: v.string(),
    }),
    updatedAt: v.float64(),
    userId: v.string(),
    username: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"]),
  instagramPostComments: defineTable({
    createdAt: v.float64(),
    data: v.array(
      v.object({
        id: v.string(),
        replies: v.optional(
          v.object({
            data: v.array(
              v.object({
                id: v.string(),
                text: v.string(),
                timestamp: v.float64(),
                username: v.string(),
              })
            ),
            paging: v.optional(
              v.object({
                cursors: v.object({
                  after: v.string(),
                  before: v.string(),
                }),
              })
            ),
          })
        ),
        text: v.string(),
        timestamp: v.float64(),
        username: v.string(),
      })
    ),
    postId: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_postId", ["postId"])
    .index("by_userId", ["userId"]),
  instagramPostInsights: defineTable({
    createdAt: v.float64(),
    data: v.object({
      comments: v.optional(v.float64()),
      follows: v.optional(v.float64()),
      impressions: v.optional(v.float64()),
      likes: v.optional(v.float64()),
      period: v.string(),
      profile_activity: v.optional(v.float64()),
      profile_visits: v.optional(v.float64()),
      reach: v.optional(v.float64()),
      saved: v.optional(v.float64()),
      shares: v.optional(v.float64()),
      timestamp: v.float64(),
      total_interactions: v.optional(v.float64()),
      views: v.optional(v.float64()),
    }),
    postId: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_postId", ["postId"])
    .index("by_timestamp", ["data.timestamp"])
    .index("by_userId", ["userId"]),
  instagramPosts: defineTable({
    analysis: v.optional(v.any()),
    analysisMarkdown: v.optional(v.string()),
    createdAt: v.float64(),
    data: v.object({
      caption: v.string(),
      children: v.optional(
        v.array(
          v.object({
            id: v.string(),
            media_type: v.string(),
            media_url: v.string(),
            thumbnail_url: v.optional(v.string()),
          })
        )
      ),
      comments: v.optional(v.any()),
      comments_count: v.optional(v.float64()),
      id: v.string(),
      like_count: v.optional(v.float64()),
      media_type: v.union(
        v.literal("IMAGE"),
        v.literal("VIDEO"),
        v.literal("CAROUSEL_ALBUM")
      ),
      media_url: v.string(),
      permalink: v.string(),
      thumbnail_url: v.optional(v.string()),
      timestamp: v.optional(v.float64()),
      username: v.string(),
    }),
    instagramAccountId: v.string(),
    postId: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_instagramAccountId", ["instagramAccountId"])
    .index("by_postId", ["postId"])
    .index("by_timestamp", ["data.timestamp"])
    .index("by_userId", ["userId"]),
  instagramProfileInsights: defineTable({
    createdAt: v.float64(),
    data: v.object({
      engagement_rate: v.optional(v.float64()),
      follower_count: v.optional(v.float64()),
      follows_count: v.optional(v.float64()),
      impressions: v.optional(v.float64()),
      media_count: v.optional(v.float64()),
      period: v.string(),
      profile_views: v.optional(v.float64()),
      reach: v.optional(v.float64()),
      saved_count: v.optional(v.float64()),
      timestamp: v.float64(),
      website_clicks: v.optional(v.float64()),
    }),
    instagramAccountId: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_instagramAccountId", ["instagramAccountId"])
    .index("by_timestamp", ["data.timestamp"])
    .index("by_userId", ["userId"]),
  instagramStories: defineTable({
    createdAt: v.float64(),
    data: v.array(
      v.object({
        id: v.string(),
        insights: v.optional(
          v.object({
            exits: v.optional(v.float64()),
            impressions: v.optional(v.float64()),
            navigation: v.optional(
              v.object({
                back: v.optional(v.float64()),
                exit: v.optional(v.float64()),
                next: v.optional(v.float64()),
              })
            ),
            reach: v.optional(v.float64()),
            replies: v.optional(v.float64()),
            taps_back: v.optional(v.float64()),
            taps_forward: v.optional(v.float64()),
          })
        ),
        media_type: v.string(),
        media_url: v.string(),
        permalink: v.string(),
        timestamp: v.float64(),
      })
    ),
    instagramAccountId: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_instagramAccountId", ["instagramAccountId"])
    .index("by_userId", ["userId"]),
  instagramTokens: defineTable({
    accessToken: v.string(),
    expiryDate: v.float64(),
    instagramAccountId: v.string(),
    lastRefreshed: v.float64(),
    refreshToken: v.string(),
    scope: v.string(),
    userId: v.string(),
  }).index("by_userId", ["userId"]),
  instagramTracker: defineTable({
    analysis: v.any(),
    createdAt: v.float64(),
    instagramAccountId: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_instagramAccountId", ["instagramAccountId"])
    .index("by_userId", ["userId"])
    .index("by_user_account", [
      "userId",
      "instagramAccountId",
    ]),
  instagramTrackerAnalysis: defineTable({
    analysis: v.any(),
    createdAt: v.float64(),
    instagramAccountId: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_account", ["instagramAccountId"])
    .index("by_userId", ["userId"])
    .index("by_user_account", [
      "userId",
      "instagramAccountId",
    ]),
  instagramBatchAnalysis: defineTable({
    insights: v.any(),
    createdAt: v.float64(),
    instagramAccountId: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
    analysisType: v.literal("batch"),
  })
    .index("by_account", ["instagramAccountId"])
    .index("by_userId", ["userId"])
    .index("by_user_account", [
      "userId",
      "instagramAccountId",
    ]),
  notes: defineTable({
    analysis: v.optional(v.string()),
    content: v.optional(v.string()),
    createdAt: v.float64(),
    important: v.optional(v.boolean()),
    platform: v.optional(v.string()),
    references: v.optional(v.array(v.string())),
    tags: v.array(v.string()),
    title: v.string(),
    titleGenerated: v.optional(v.boolean()),
    type: v.optional(
      v.union(
        v.literal("ai_insight"),
        v.literal("conversation"),
        v.literal("idea"),
        v.literal("url"),
        v.literal("date"),
        v.literal("brainstorm"),
        v.literal("click")
      )
    ),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_creation", ["createdAt"])
    .index("by_type", ["type"])
    .index("by_user", ["userId"]),
  personas: defineTable({
    audience_type: v.string(),
    content_formats: v.array(v.string()),
    content_pillars: v.array(v.string()),
    content_tone: v.string(),
    content_voice: v.string(),
    createdAt: v.float64(),
    current_description: v.string(),
    current_name: v.string(),
    desired_impact: v.string(),
    engagement_style: v.array(v.string()),
    experience_level: v.string(),
    future_description: v.string(),
    future_name: v.string(),
    goals: v.array(v.string()),
    isActive: v.boolean(),
    primary_topics: v.array(v.string()),
    secondary_topics: v.array(v.string()),
    style_descriptors: v.array(v.string()),
    tone_descriptors: v.array(v.string()),
    unique_value: v.string(),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_active", ["isActive"])
    .index("by_userId", ["userId"]),
  rate_limits: defineTable({
    lastUpdated: v.float64(),
    resource: v.string(),
    timestamps: v.array(v.float64()),
    user_id: v.string(),
  }).index("by_user_resource", ["user_id", "resource"]),
  usageEvents: defineTable({
    endpoint: v.optional(v.string()),
    ip: v.optional(v.string()),
    method: v.optional(v.string()),
    model: v.string(),
    path: v.optional(v.string()),
    qty: v.float64(),
    requestId: v.optional(v.string()),
    status: v.string(),
    statusCode: v.optional(v.float64()),
    timestamp: v.float64(),
    userAgent: v.optional(v.string()),
    userId: v.string(),
  })
    .index("by_endpoint", ["endpoint"])
    .index("by_status", ["status"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user", ["userId"]),
  users: defineTable({
    createdAt: v.float64(),
    email: v.string(),
    image: v.optional(v.string()),
    name: v.string(),
    paymentMethod: v.optional(
      v.object({
        brand: v.string(),
        expMonth: v.float64(),
        expYear: v.float64(),
        last4: v.string(),
      })
    ),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscription: v.optional(
      v.object({
        cancelAtPeriodEnd: v.boolean(),
        cancel_at: v.optional(v.float64()),
        canceledAt: v.optional(v.float64()),
        currentPeriodEnd: v.float64(),
        currentPeriodStart: v.float64(),
        customer: v.optional(v.string()),
        includedRequests: v.float64(),
        interval: v.optional(
          v.union(v.literal("month"), v.literal("year"))
        ),
        items: v.optional(v.any()),
        lastSyncedAt: v.optional(v.float64()),
        meteredPriceId: v.optional(v.string()),
        plan: v.union(
          v.literal("monthly_basic"),
          v.literal("monthly_pro"),
          v.literal("yearly_basic"),
          v.literal("yearly_pro")
        ),
        priceId: v.string(),
        quantity: v.optional(v.float64()),
        start_date: v.optional(v.float64()),
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
          v.literal("unknown")
        ),
        subscriptionItemId: v.optional(v.string()),
        usedRequests: v.float64(),
      })
    ),
    updatedAt: v.float64(),
    userId: v.string(),
    username: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_referralCode", ["referralCode"])
    .index("by_stripeCustomerId", ["stripeCustomerId"])
    .index("by_userId", ["userId"])
    .index("by_username", ["username"]),
  waitlist: defineTable({
    email: v.string(),
    name: v.string(),
    status: v.string(),
    timestamp: v.float64(),
  }).index("by_email", ["email"]),
  youtubeChannels: defineTable({
    analysis: v.optional(v.any()),
    createdAt: v.float64(),
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
    ),
    updatedAt: v.float64(),
    userId: v.string(),
  })
    .index("by_channelId", ["id"])
    .index("by_publishedAt", ["snippet.publishedAt"])
    .index("by_userId", ["userId"]),
  youtubeTokens: defineTable({
    accessToken: v.string(),
    expiryDate: v.float64(),
    lastRefreshed: v.float64(),
    refreshToken: v.string(),
    scope: v.string(),
    userId: v.string(),
  }).index("by_userId", ["userId"]),
  youtubeVideos: defineTable({
    analysis: v.optional(v.any()),
    analysisMarkdown: v.optional(v.string()),
    captions: v.optional(
      v.object({
        caption_track: v.optional(
          v.object({
            format: v.optional(v.string()),
            id: v.optional(v.string()),
            language: v.optional(v.string()),
            name: v.optional(v.string()),
            text: v.optional(v.string()),
          })
        ),
        data: v.optional(v.any()),
        message: v.optional(v.string()),
        status: v.optional(v.string()),
        video_url: v.optional(v.string()),
      })
    ),
    channelId: v.optional(v.string()),
    comments: v.optional(
      v.object({
        comments: v.optional(
          v.array(
            v.object({
              author: v.optional(
                v.object({
                  channel_id: v.optional(v.string()),
                  display_name: v.optional(v.string()),
                  profile_image: v.optional(v.string()),
                })
              ),
              id: v.optional(v.string()),
              is_reply: v.optional(v.boolean()),
              likes: v.optional(v.float64()),
              published_at: v.optional(v.string()),
              replies: v.optional(v.float64()),
              text: v.optional(v.string()),
            })
          )
        ),
        message: v.optional(v.string()),
        status: v.optional(v.string()),
        top_level_comments: v.optional(v.float64()),
        total_comments: v.optional(v.float64()),
        video_url: v.optional(v.string()),
      })
    ),
    content_details: v.optional(
      v.object({
        definition: v.optional(v.string()),
        dimension: v.optional(v.string()),
        duration: v.optional(v.string()),
        has_captions: v.optional(v.boolean()),
        is_live: v.optional(v.boolean()),
      })
    ),
    createdAt: v.optional(v.float64()),
    id: v.optional(v.string()),
    snippet: v.optional(
      v.object({
        channel: v.optional(
          v.object({
            id: v.optional(v.union(v.string(), v.null())),
            title: v.optional(
              v.union(v.string(), v.null())
            ),
          })
        ),
        description: v.optional(v.string()),
        published_at: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        thumbnails: v.optional(
          v.object({
            default: v.optional(
              v.union(v.string(), v.null())
            ),
            high: v.optional(v.union(v.string(), v.null())),
            maxres: v.optional(
              v.union(v.string(), v.null())
            ),
            medium: v.optional(
              v.union(v.string(), v.null())
            ),
            standard: v.optional(
              v.union(v.string(), v.null())
            ),
          })
        ),
        title: v.optional(v.string()),
      })
    ),
    statistics: v.optional(
      v.object({
        comments: v.optional(v.float64()),
        dislikes: v.optional(v.float64()),
        likes: v.optional(v.float64()),
        views: v.optional(v.float64()),
      })
    ),
    status: v.optional(
      v.object({
        embeddable: v.optional(v.boolean()),
        license: v.optional(v.string()),
        madeForKids: v.optional(v.boolean()),
        privacyStatus: v.optional(v.string()),
        publicStatsViewable: v.optional(v.boolean()),
        selfDeclaredMadeForKids: v.optional(v.boolean()),
        uploadStatus: v.optional(v.string()),
      })
    ),
    updatedAt: v.optional(v.float64()),
    url: v.optional(v.string()),
    userId: v.string(),
    videoId: v.string(),
  })
    .index("by_channelId", ["snippet.channel.id"])
    .index("by_likes", ["statistics.likes"])
    .index("by_publishedAt", ["snippet.published_at"])
    .index("by_userId", ["userId"])
    .index("by_videoId", ["videoId"])
    .index("by_views", ["statistics.views"]),
});