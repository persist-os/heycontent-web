import { v } from "convex/values";
import { mutation, action, query } from "./_generated/server";
import { MutationCtx, ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";

// Utility: cleanDiff (adapted from YouTube logic)
function cleanDiff(oldDoc, newDoc, excludeFields = []) {
  const changedFields = [];
  const current = {};
  for (const key of Object.keys(newDoc)) {
    if (excludeFields.includes(key)) continue;
    if (JSON.stringify(oldDoc?.[key]) !== JSON.stringify(newDoc[key])) {
      changedFields.push(key);
      current[key] = newDoc[key];
    }
  }
  return changedFields.length > 0
    ? { changedFields, current }
    : null;
}

// Store unified Instagram post data (all media types with insights and comments)
export const storeUnifiedPostData = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    posts: v.array(v.object({
      id: v.string(),
      caption: v.string(),
      media_type: v.union(
        v.literal("IMAGE"),
        v.literal("VIDEO"),
        v.literal("CAROUSEL_ALBUM"),
        v.literal("REELS")
      ),
      media_url: v.string(),
      permalink: v.string(),
      timestamp: v.number(),
      username: v.string(),
      like_count: v.optional(v.number()),
      comments_count: v.optional(v.number()),
      thumbnail_url: v.optional(v.union(v.string(), v.null())),
      children: v.optional(v.union(v.array(v.object({
        id: v.string(),
        media_url: v.string(),
        media_type: v.string(),
        thumbnail_url: v.optional(v.union(v.string(), v.null()))
      })), v.null())),
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
        ig_reels_avg_watch_time: v.optional(v.number()),
        ig_reels_video_view_total_time: v.optional(v.number()),
        period: v.optional(v.string()),
        timestamp: v.optional(v.number())
      })),
      comments: v.optional(v.array(v.object({
        id: v.string(),
        text: v.string(),
        timestamp: v.number(),
        username: v.string(),
        like_count: v.optional(v.union(v.number(), v.null())),
        replies: v.optional(v.array(v.object({
          id: v.string(),
          text: v.string(),
          timestamp: v.number(),
          username: v.optional(v.string()),
          like_count: v.optional(v.union(v.number(), v.null()))
        })))
      })))
    }))
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, posts } = args;
    const now = Date.now();
    const results = [];

    for (const post of posts) {
      try {
        // Check if post already exists
        const existingPost = await ctx.db
          .query("instagramPosts")
          .withIndex("by_postId", q => q.eq("postId", post.id))
          .first();

        const processedData = {
          id: post.id,
          caption: post.caption,
          media_url: post.media_url,
          permalink: post.permalink,
          timestamp: post.timestamp,
          username: post.username,
          like_count: post.like_count,
          comments_count: post.comments_count,
          thumbnail_url: post.thumbnail_url,
          children: post.children,
          insights: post.insights,
          comments: post.comments
        };

        if (existingPost) {
          // Calculate diff (exclude createdAt, updatedAt, diffs)
          const diff = cleanDiff(existingPost, {
            mediaType: post.media_type,
            data: processedData,
          }, ["createdAt", "updatedAt", "diffs", "userId", "instagramAccountId", "postId"]);
          if (!diff) {
            results.push({ status: "skipped_no_change", postId: post.id, internalId: existingPost._id });
            continue;
          }
          const newDiff = {
            changedAt: now,
            changedFields: diff.changedFields,
            current: diff.current,
            changeType: "update"
          };
          const diffs = Array.isArray(existingPost.diffs) ? [...existingPost.diffs, newDiff] : [newDiff];
          await ctx.db.patch(existingPost._id, {
            mediaType: post.media_type,
            data: processedData,
            updatedAt: now,
            diffs
          });
          results.push({ status: "updated", postId: post.id, internalId: existingPost._id });
        } else {
          // Insert new post
          const internalId = await ctx.db.insert("instagramPosts", {
            userId,
            instagramAccountId,
            postId: post.id,
            mediaType: post.media_type,
            data: processedData,
            createdAt: now,
            updatedAt: now,
            diffs: []
          });
          results.push({ status: "created", postId: post.id, internalId });
        }
      } catch (error) {
              console.error(`Error storing Instagram post ${post.id}:`, error);
      results.push({ 
        status: "error", 
        postId: post.id, 
        error: 'Your Instagram post is taking a moment to save. Thanks for your patience—great content is worth waiting for!' 
      });
      }
    }

    return {
      success: true,
      processed: results.length,
      results
    };
  },
});

// Legacy support - Store single Instagram post data
export const storePostData = mutation({
  args: {
    userId: v.string(),
    postId: v.string(),
    instagramAccountId: v.string(),
    postData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, postId, instagramAccountId, postData } = args;
    const now = Date.now();

    try {
      // Convert to unified format
      const mediaType = (postData.media_type || "IMAGE") as "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";
      
      const processedData = {
        id: postData.id || postId,
        caption: postData.caption || "",
        media_url: postData.media_url || "",
        permalink: postData.permalink || "",
        timestamp: postData.timestamp ? new Date(postData.timestamp).getTime() : now,
        username: postData.username || "",
        like_count: postData.like_count,
        comments_count: postData.comments_count,
        thumbnail_url: postData.thumbnail_url,
        children: postData.children?.data || postData.children,
        insights: postData.insights,
        comments: postData.comments
      };

      // Check if post already exists
      const existingPost = await ctx.db
        .query("instagramPosts")
        .withIndex("by_postId", q => q.eq("postId", postId))
        .first();

      if (existingPost) {
        const diff = cleanDiff(existingPost, {
          mediaType: mediaType,
          data: processedData,
        }, ["createdAt", "updatedAt", "diffs", "userId", "instagramAccountId", "postId"]);
        if (!diff) {
          return { status: "skipped_no_change", postId: existingPost._id };
        }
        const newDiff = {
          changedAt: now,
          changedFields: diff.changedFields,
          current: diff.current,
          changeType: "update"
        };
        const diffs = Array.isArray(existingPost.diffs) ? [...existingPost.diffs, newDiff] : [newDiff];
        await ctx.db.patch(existingPost._id, {
          mediaType: mediaType,
          data: processedData,
          updatedAt: now,
          diffs
        });
        return { status: "updated", postId: existingPost._id };
      } else {
        // Insert new post
        const internalId = await ctx.db.insert("instagramPosts", {
          userId,
          instagramAccountId,
          postId,
          mediaType: mediaType,
          data: processedData,
          createdAt: now,
          updatedAt: now,
          diffs: []
        });
        return { status: "created", postId: internalId };
      }
    } catch (error) {
      console.error(`Error storing Instagram post ${postId}:`, error);
      throw new Error('Your Instagram post is taking a moment to save. Thanks for your patience—great content is worth waiting for!');
    }
  },
});

// Save Instagram profile data (updated for consolidated schema)
export const storeProfileData = mutation({
  args: {
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
    token: v.optional(v.object({
      accessToken: v.string(),
      expiryDate: v.number(),
      scope: v.string(),
      lastRefreshed: v.number(),
    })),
    age_breakdown: v.optional(v.array(v.object({ metric: v.string(), values: v.any() }))),
    city_breakdown: v.optional(v.array(v.object({ metric: v.string(), values: v.any() }))),
    contact_button_type_breakdown: v.optional(v.array(v.object({ metric: v.string(), values: v.any() }))),
    country_breakdown: v.optional(v.array(v.object({ metric: v.string(), values: v.any() }))),
    follow_type_breakdown: v.optional(v.array(v.object({ metric: v.string(), values: v.any() }))),
    gender_breakdown: v.optional(v.array(v.object({ metric: v.string(), values: v.any() }))),
    media_product_type_breakdown: v.optional(v.array(v.object({ metric: v.string(), values: v.any() }))),
    insights: v.optional(v.any()),
    pagination: v.optional(v.object({
      hasMorePosts: v.boolean(),
      lastFetchedAt: v.number(),
      nextUrl: v.optional(v.union(v.string(), v.null())),
      totalPostsFetched: v.number(),
    })),
    diffs: v.optional(v.array(v.object({
      changeType: v.optional(v.string()),
      changedAt: v.number(),
      changedFields: v.array(v.string()),
      current: v.any(),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    console.log("[storeProfileData] Starting mutation with args:", {
      userId: args.userId,
      instagramAccountId: args.instagramAccountId,
      username: args.username,
      hasProfileData: !!args.profileData,
      hasToken: !!args.token,
      hasBreakdowns: {
        age: !!args.age_breakdown,
        city: !!args.city_breakdown,
        country: !!args.country_breakdown,
        gender: !!args.gender_breakdown
      }
    });

    const {
      userId,
      instagramAccountId,
      username,
      profileData,
      token,
      age_breakdown,
      city_breakdown,
      contact_button_type_breakdown,
      country_breakdown,
      follow_type_breakdown,
      gender_breakdown,
      media_product_type_breakdown,
      insights,
      pagination,
      diffs,
      createdAt,
      updatedAt,
    } = args;

    // Find existing account
    const existingAccount = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    console.log("[storeProfileData] Existing account found:", !!existingAccount);

    const accountData = {
      userId,
      instagramAccountId: String(instagramAccountId),
      username,
      profileData,
      token,
      age_breakdown,
      city_breakdown,
      contact_button_type_breakdown,
      country_breakdown,
      follow_type_breakdown,
      gender_breakdown,
      media_product_type_breakdown,
      insights,
      pagination,
      diffs: diffs || [],
      createdAt,
      updatedAt,
    };

    if (existingAccount) {
      console.log("[storeProfileData] Updating existing account:", existingAccount._id);
      // Only update fields that are present in args (partial update)
      const patchData = { ...accountData };
      Object.keys(patchData).forEach((key) => {
        if (patchData[key] === undefined) delete patchData[key];
      });
      console.log("[storeProfileData] Patch data:", Object.keys(patchData));
      await ctx.db.patch(existingAccount._id, patchData);
      console.log("[storeProfileData] Account updated successfully");
      return { status: "updated", instagramAccountId: String(instagramAccountId) };
    } else {
      console.log("[storeProfileData] Creating new account");
      const newId = await ctx.db.insert("instagramAccounts", accountData);
      console.log("[storeProfileData] Account created successfully with ID:", newId);
      return { status: "created", instagramAccountId: String(instagramAccountId) };
    }
  },
});

// Update Instagram token (now stored in instagramAccounts)
export const updateInstagramToken = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    accessToken: v.string(),
    expiresAt: v.number(),
    scope: v.array(v.string())
  },
  handler: async (ctx, args) => {
    // Update token in the instagramAccounts table
    const existing = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    const tokenData = {
      accessToken: args.accessToken,
      expiryDate: args.expiresAt,
      scope: args.scope.join(" "),
      lastRefreshed: Date.now()
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        instagramAccountId: String(args.instagramAccountId),
        token: tokenData,
        updatedAt: Date.now()
      });
    } else {
      // Create new account record with token
      await ctx.db.insert("instagramAccounts", {
        instagramAccountId: String(args.instagramAccountId),
        userId: args.userId,
        username: "unknown", // Will be updated when profile data is stored
        profileData: {
          id: String(args.instagramAccountId),
          username: "unknown",
          account_type: "unknown",
          followers_count: 0,
          follows_count: 0,
          media_count: 0,
        },
        token: tokenData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  },
});

// Clean up Instagram data when disconnecting
export const disconnectInstagram = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { userId } = args;

    try {
      const results = {
        tokensDeleted: 0,
        accountsDeleted: 0,
        postsDeleted: 0,
        trackerAnalysesDeleted: 0,
        batchAnalysesDeleted: 0
      };

      // Instagram tokens are now part of instagramAccounts, so no separate deletion needed
      results.tokensDeleted = 0; // Tokens will be deleted with accounts

      // Delete Instagram accounts
      const accounts = await ctx.db
        .query("instagramAccounts")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      for (const account of accounts) {
        await ctx.db.delete(account._id);
        results.accountsDeleted++;
      }

      // Delete unified Instagram posts
      const posts = await ctx.db
        .query("instagramPosts")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      for (const post of posts) {
        await ctx.db.delete(post._id);
        results.postsDeleted++;
      }

      // Delete Instagram tracker analysis
      const trackerAnalyses = await ctx.db
        .query("instagramTrackerAnalysis")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      for (const trackerAnalysis of trackerAnalyses) {
        await ctx.db.delete(trackerAnalysis._id);
        results.trackerAnalysesDeleted++;
      }

      // Delete Instagram batch analysis
      const batchAnalyses = await ctx.db
        .query("instagramBatchAnalysis")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      for (const batchAnalysis of batchAnalyses) {
        await ctx.db.delete(batchAnalysis._id);
        results.batchAnalysesDeleted++;
      }

      console.log(`Successfully disconnected Instagram for user ${userId}:`, results);
      return { success: true };
    } catch (error) {
      console.error('Error disconnecting Instagram:', error);
      throw new Error('Your Instagram disconnection is taking a moment to process. Thanks for your patience—we\'ll have you sorted out soon!');
    }
  },
});

// Store Instagram post analysis data directly in instagramPosts table
export const storePostAnalysis = mutation({
  args: {
    userId: v.string(),
    postId: v.string(),
    analysisData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, postId, analysisData } = args;
    const now = Date.now();

    console.log('[storePostAnalysis] Called with:', {
      userId,
      postId,
      analysisData,
      timestamp: new Date().toISOString()
    });

    const post = await ctx.db
      .query("instagramPosts")
      .withIndex("by_postId", (q) => q.eq("postId", postId))
      .first();

    console.log('[storePostAnalysis] Found existing post:', post ? post._id : 'none');

    if (!post) {
      // Create a minimal post record if it doesn't exist
      console.log('[storePostAnalysis] Creating new post record');
      const postId_internal = await ctx.db.insert("instagramPosts", {
        userId,
        instagramAccountId: "unknown",
        postId,
        mediaType: "IMAGE",
        data: {
          id: postId,
          caption: "Instagram Post",
          media_url: "",
          permalink: "",
          username: "",
          timestamp: now,
        },
        createdAt: now,
        updatedAt: now,
      });

      const updateData: any = { updatedAt: now };
      if (analysisData && typeof analysisData === 'object') {
        if (analysisData.markdown) {
          updateData.analysisMarkdown = analysisData.markdown;
        }
        if (analysisData.analysis) {
          updateData.analysis = analysisData.analysis;
        }
        if (!analysisData.markdown && !analysisData.analysis && typeof analysisData === 'string') {
          updateData.analysisMarkdown = analysisData;
        }
      } else {
        updateData.analysis = analysisData;
      }

      console.log('[storePostAnalysis] Updating new post with data:', updateData);
      await ctx.db.patch(postId_internal, updateData);
      console.log('[storePostAnalysis] Successfully created and updated post');
      return { success: true, status: "created", postId: postId_internal };
    }

    // Update existing post with analysis
    console.log('[storePostAnalysis] Updating existing post');
    const updateData: any = { updatedAt: now };
    if (analysisData && typeof analysisData === 'object') {
      if (analysisData.markdown) {
        updateData.analysisMarkdown = analysisData.markdown;
      }
      if (analysisData.analysis) {
        updateData.analysis = analysisData.analysis;
      }
      if (!analysisData.markdown && !analysisData.analysis && typeof analysisData === 'string') {
        updateData.analysisMarkdown = analysisData;
      }
    } else {
      updateData.analysis = analysisData;
    }

    console.log('[storePostAnalysis] Updating existing post with data:', updateData);
    await ctx.db.patch(post._id, updateData);
    console.log('[storePostAnalysis] Successfully updated existing post');
    return { success: true, status: "updated", postId: post._id };
  },
});

// Store Instagram tracker analysis
export const storeInstagramTrackerAnalysis = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    analysis: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, analysis } = args;
    const now = Date.now();

    try {
      const existingAnalysis = await ctx.db
        .query("instagramTrackerAnalysis")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("instagramAccountId"), instagramAccountId))
        .first();

      if (existingAnalysis) {
        const diff = cleanDiff(existingAnalysis, { analysis }, ["createdAt", "updatedAt", "diffs", "userId", "instagramAccountId"]);
        if (!diff) {
          return { status: "skipped_no_change", analysisId: existingAnalysis._id };
        }
        const newDiff = {
          changedAt: now,
          changedFields: diff.changedFields,
          current: { analysis: "changed" },
          changeType: "analysis"
        };
        const diffs = Array.isArray(existingAnalysis.diffs) ? [...existingAnalysis.diffs, newDiff] : [newDiff];
        await ctx.db.patch(existingAnalysis._id, {
          analysis,
          updatedAt: now,
          diffs
        });
        return { status: "updated", analysisId: existingAnalysis._id };
      } else {
        const id = await ctx.db.insert("instagramTrackerAnalysis", {
          userId,
          instagramAccountId,
          analysis,
          createdAt: now,
          updatedAt: now,
          diffs: []
        });
        return { status: "created", analysisId: id };
      }
    } catch (error) {
      console.error(`Error storing Instagram tracker analysis for user ${userId}:`, error);
      throw new Error('Your Instagram analysis is taking a moment to save. Thanks for your patience—great insights are worth waiting for!');
    }
  },
});

// Store Instagram batch analysis insights
export const storeInstagramBatchAnalysis = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    insights: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, insights } = args;
    const now = Date.now();

    try {
      const existingAnalysis = await ctx.db
        .query("instagramBatchAnalysis")
        .withIndex("by_user_account", q => 
          q.eq("userId", userId)
           .eq("instagramAccountId", instagramAccountId)
        )
        .first();

      if (existingAnalysis) {
        await ctx.db.patch(existingAnalysis._id, {
          insights,
          updatedAt: now,
        });
        return { status: "updated", analysisId: existingAnalysis._id };
      } else {
        const id = await ctx.db.insert("instagramBatchAnalysis", {
          userId,
          instagramAccountId,
          insights,
          analysisType: "batch" as const,
          createdAt: now,
          updatedAt: now,
        });
        return { status: "created", analysisId: id };
      }
    } catch (error) {
      console.error(`Error storing Instagram batch analysis for user ${userId}:`, error);
      throw new Error('Your Instagram batch analysis is taking a moment to save. Thanks for your patience—great insights are worth waiting for!');
    }
  },
});

// Update Instagram batch analysis status for async tasks
export const updateInstagramBatchAnalysisStatus = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    statusUpdate: v.object({
      status: v.string(),
      task_id: v.string(),
      started_at: v.optional(v.string()),
      completed_at: v.optional(v.string()),
      progress: v.optional(v.number()),
      error: v.optional(v.string()),
    }),
    insights: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, statusUpdate, insights } = args;
    const now = Date.now();

    console.log('[updateInstagramBatchAnalysisStatus] Called with:', {
      userId,
      instagramAccountId,
      statusUpdate,
      hasInsights: !!insights
    });

    try {
      const existingAnalysis = await ctx.db
        .query("instagramBatchAnalysis")
        .withIndex("by_user_account", q => 
          q.eq("userId", userId)
           .eq("instagramAccountId", instagramAccountId)
        )
        .first();

      if (existingAnalysis) {
        const updateData: any = {
          status: statusUpdate,
          updatedAt: now,
        };
        
        if (insights !== null && insights !== undefined) {
          updateData.insights = insights;
        }
        
        await ctx.db.patch(existingAnalysis._id, updateData);
        console.log('[updateInstagramBatchAnalysisStatus] Updated existing record:', existingAnalysis._id);
        return { status: "updated", analysisId: existingAnalysis._id };
      } else {
        const insertData: any = {
          userId,
          instagramAccountId,
          status: statusUpdate,
          analysisType: "batch" as const,
          createdAt: now,
          updatedAt: now,
        };
        
        if (insights !== null && insights !== undefined) {
          insertData.insights = insights;
        }
        
        const id = await ctx.db.insert("instagramBatchAnalysis", insertData);
        console.log('[updateInstagramBatchAnalysisStatus] Created new record:', id);
        return { status: "created", analysisId: id };
      }
    } catch (error) {
      console.error(`Error updating Instagram batch analysis status for user ${userId}:`, error);
      throw new Error('Your Instagram analysis status is taking a moment to update. Thanks for your patience—great insights are worth waiting for!');
    }
  },
});

// Store Instagram webhook events
export const storeInstagramWebhookEvent = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    eventType: v.string(),
    eventData: v.any(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, eventType, eventData, timestamp } = args;
    const now = Date.now();

    try {
      const id = await ctx.db.insert("instagramWebhookEvents", {
        userId,
        instagramAccountId,
        eventType,
        eventData,
        timestamp,
        processed: false,
        createdAt: now,
        updatedAt: now,
      });
      
      console.log(`Stored Instagram webhook event: ${eventType} for user ${userId}`);
      return { success: true, eventId: id };
    } catch (error) {
      console.error(`Error storing Instagram webhook event: ${error}`);
      throw new Error('Your Instagram webhook event is taking a moment to save. Thanks for your patience—great things take time!');
    }
  },
});

// Mark webhook event as processed
export const markWebhookEventProcessed = mutation({
  args: {
    eventId: v.id("instagramWebhookEvents"),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.eventId, {
        processed: true,
        processedAt: Date.now(),
      });
      return { success: true };
    } catch (error) {
      console.error(`Error marking webhook event as processed: ${error}`);
      throw new Error('Your Instagram webhook event is taking a moment to process. Thanks for your patience—great things take time!');
    }
  },
});

// Store webhook subscription status
export const storeWebhookSubscription = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    subscribedFields: v.array(v.string()),
    subscriptionStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, subscribedFields, subscriptionStatus } = args;
    const now = Date.now();

    try {
      // Check if subscription record already exists
      const existingSubscription = await ctx.db
        .query("instagramWebhookSubscriptions")
        .withIndex("by_user_account", q => 
          q.eq("userId", userId)
           .eq("instagramAccountId", instagramAccountId)
        )
        .first();

      if (existingSubscription) {
        await ctx.db.patch(existingSubscription._id, {
          subscribedFields,
          subscriptionStatus,
          updatedAt: now,
        });
        return { success: true, subscriptionId: existingSubscription._id, status: "updated" };
      } else {
        const id = await ctx.db.insert("instagramWebhookSubscriptions", {
          userId,
          instagramAccountId,
          subscribedFields,
          subscriptionStatus,
          createdAt: now,
          updatedAt: now,
        });
        return { success: true, subscriptionId: id, status: "created" };
      }
    } catch (error) {
      console.error(`Error storing webhook subscription: ${error}`);
      throw new Error('Your Instagram webhook subscription is taking a moment to save. Thanks for your patience—great things take time!');
    }
  },
});

// Store Instagram story insights
export const storeInstagramStoryInsights = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    mediaId: v.string(),
    insights: v.any(),
    webhookTimestamp: v.number(),
    storyData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, mediaId, insights, webhookTimestamp, storyData } = args;
    const now = Date.now();

    try {
      // Check if insights already exist for this story
      const existingInsights = await ctx.db
        .query("instagramStoryInsights")
        .withIndex("by_mediaId", q => q.eq("mediaId", mediaId))
        .filter(q => q.eq(q.field("userId"), userId))
        .first();

      if (existingInsights) {
        // Update existing insights
        await ctx.db.patch(existingInsights._id, {
          insights,
          webhookTimestamp,
          ...(storyData && { storyData }),
          updatedAt: now,
        });
        return { success: true, insightsId: existingInsights._id, status: "updated" };
      } else {
        // Create new insights record
        const id = await ctx.db.insert("instagramStoryInsights", {
          userId,
          instagramAccountId,
          mediaId,
          insights,
          webhookTimestamp,
          ...(storyData && { storyData }),
          createdAt: now,
          updatedAt: now,
        });
        return { success: true, insightsId: id, status: "created" };
      }
    } catch (error) {
      console.error(`Error storing story insights: ${error}`);
      throw new Error('Your Instagram story insights are taking a moment to save. Thanks for your patience—great insights are worth waiting for!');
    }
  },
});

// Update Instagram post with new comment from webhook
export const updateInstagramPostComments = mutation({
  args: {
    userId: v.string(),
    mediaId: v.string(),
    newComment: v.object({
      id: v.string(),
      text: v.string(),
      timestamp: v.number(),
      username: v.string(),
      from_user_id: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { userId, mediaId, newComment } = args;
    const now = Date.now();

    try {
      // Find the post by postId (mediaId) using the indexed field for better performance
      const post = await ctx.db
        .query("instagramPosts")
        .withIndex("by_postId", q => q.eq("postId", mediaId))
        .first();

      if (!post) {
        console.log(`Post not found for postId ${mediaId}, user ${userId}`);
        return { success: false, error: "Your Instagram post is taking a moment to load. Thanks for your patience—great content is worth waiting for!" };
      }

      // Verify this post belongs to the user for security
      if (post.userId !== userId) {
        console.log(`Post ${mediaId} does not belong to user ${userId}`);
        return { success: false, error: "We need to know it's you to keep your content safe! Please log in again and let's get back to creating amazing things together." };
      }

      // Get current comments or initialize empty array
      const currentComments = post.data?.comments || [];
      
      // Check if comment already exists (avoid duplicates)
      const commentExists = currentComments.some((comment: any) => comment.id === newComment.id);
      if (commentExists) {
        console.log(`Comment ${newComment.id} already exists for post ${mediaId}`);
        return { success: true, status: "duplicate", postId: post._id };
      }

      // Add the new comment
      const updatedComments = [...currentComments, {
        id: newComment.id,
        text: newComment.text,
        timestamp: newComment.timestamp,
        username: newComment.username,
        like_count: 0, // Will be updated when we fetch full comment data
        replies: [] // Will be populated if there are replies
      }];

      // Update the post data
      const updatedData = {
        ...post.data,
        comments: updatedComments,
        comments_count: (post.data?.comments_count || 0) + 1
      };

      await ctx.db.patch(post._id, {
        data: updatedData,
        updatedAt: now,
      });

      console.log(`Added new comment to post ${mediaId} from @${newComment.username}`);
      return { success: true, status: "updated", postId: post._id, commentId: newComment.id };
    } catch (error) {
      console.error(`Error updating post comments: ${error}`);
      throw new Error('Your Instagram post comments are taking a moment to update. Thanks for your patience—great engagement is worth waiting for!');
    }
  },
});

// Append comment to Instagram post using only media ID (for webhook processing)
export const appendCommentToInstagramPost = mutation({
  args: {
    mediaId: v.string(),
    newComment: v.object({
      id: v.string(),
      text: v.string(),
      timestamp: v.number(),
      username: v.string(),
      from_user_id: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { mediaId, newComment } = args;
    const now = Date.now();

    try {
      console.log(`[appendCommentToInstagramPost] Looking for post with postId: ${mediaId}`);
      
      // Find the post by postId (which matches the mediaId from webhook) using the indexed field
      const post = await ctx.db
        .query("instagramPosts")
        .withIndex("by_postId", q => q.eq("postId", mediaId))
        .first();

      if (!post) {
        console.log(`[appendCommentToInstagramPost] Post not found for postId: ${mediaId}`);
        return { success: false, error: "Your Instagram post is taking a moment to load. Thanks for your patience—great content is worth waiting for!" };
      }

      console.log(`[appendCommentToInstagramPost] Found post: ${post.postId} for user: ${post.userId}`);

      // Get current comments or initialize empty array
      const currentComments = post.data?.comments || [];
      
      // Check if comment already exists (avoid duplicates)
      const commentExists = currentComments.some((comment: any) => comment.id === newComment.id);
      if (commentExists) {
        console.log(`[appendCommentToInstagramPost] Comment ${newComment.id} already exists for post ${mediaId}`);
        return { 
          success: true, 
          status: "duplicate", 
          postId: post._id,
          commentId: newComment.id 
        };
      }

      // Add the new comment
      const updatedComments = [...currentComments, {
        id: newComment.id,
        text: newComment.text,
        timestamp: newComment.timestamp,
        username: newComment.username,
        like_count: 0, // Will be updated when we fetch full comment data
        replies: [] // Will be populated if there are replies
      }];

      // Update the post data
      const updatedData = {
        ...post.data,
        comments: updatedComments,
        comments_count: (post.data?.comments_count || 0) + 1
      };

      await ctx.db.patch(post._id, {
        data: updatedData,
        updatedAt: now,
      });

      console.log(`[appendCommentToInstagramPost] Added new comment to post ${mediaId} from @${newComment.username}`);
      return { 
        success: true, 
        status: "updated", 
        postId: post._id, 
        commentId: newComment.id 
      };
    } catch (error) {
      console.error(`[appendCommentToInstagramPost] Error updating post comments: ${error}`);
      throw new Error('Your Instagram post comments are taking a moment to update. Thanks for your patience—great engagement is worth waiting for!');
    }
  },
});

// Queue operations for lazy loading
export const addPostsToQueue = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    posts: v.array(v.object({
      postId: v.string(),
      mediaType: v.union(v.literal("IMAGE"), v.literal("VIDEO"), v.literal("CAROUSEL_ALBUM"), v.literal("REELS")),
      data: v.any(),
      analysis: v.optional(v.any()),
      analysisMarkdown: v.optional(v.string()),
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Add posts to queue
    const queueIds = [];
    for (const post of args.posts) {
      const queueId = await ctx.db.insert("instagramPostsQueue", {
        userId: args.userId,
        instagramAccountId: args.instagramAccountId,
        postId: post.postId,
        mediaType: post.mediaType,
        data: post.data,
        analysis: post.analysis,
        analysisMarkdown: post.analysisMarkdown,
        createdAt: now,
        updatedAt: now,
      });
      queueIds.push(queueId);
    }
    
    return { success: true, queueIds };
  },
});

export const moveQueuePostsToMain = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all queued posts for this user/account
    const queuedPosts = await ctx.db
      .query("instagramPostsQueue")
      .withIndex("by_user_account", (q) => 
        q.eq("userId", args.userId).eq("instagramAccountId", args.instagramAccountId)
      )
      .collect();
    
    if (queuedPosts.length === 0) {
      return { success: true, movedCount: 0, movedPosts: [] };
    }
    
    const now = Date.now();
    const movedPosts = [];
    
    // Move each queued post to main table
    for (const queuedPost of queuedPosts) {
      // Check if post already exists in main table
      const existing = await ctx.db
        .query("instagramPosts")
        .withIndex("by_postId", (q) => q.eq("postId", queuedPost.postId))
        .first();
      
      if (!existing) {
        // Insert into main table
        const mainId = await ctx.db.insert("instagramPosts", {
          userId: queuedPost.userId,
          instagramAccountId: queuedPost.instagramAccountId,
          postId: queuedPost.postId,
          mediaType: queuedPost.mediaType,
          data: queuedPost.data,
          analysis: queuedPost.analysis,
          analysisMarkdown: queuedPost.analysisMarkdown,
          createdAt: queuedPost.createdAt,
          updatedAt: now,
        });
        
        // Add to moved posts array with the data needed for insights tasks
        movedPosts.push({
          postId: queuedPost.postId,
          id: queuedPost.postId, // Alias for compatibility
          internalId: mainId,
        });
      }
      
      // Delete from queue
      await ctx.db.delete(queuedPost._id);
    }
    
    return { 
      success: true, 
      movedCount: movedPosts.length,
      movedPosts: movedPosts
    };
  },
});

export const updateAccountPagination = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    nextUrl: v.optional(v.union(v.string(), v.null())),
    hasMorePosts: v.boolean(),
    totalPostsFetched: v.number(),
  },
  handler: async (ctx, args) => {
    console.log(`[updateAccountPagination] Updating pagination for user ${args.userId}, account ${args.instagramAccountId}`);
    
    // Find the account using the by_instagramAccountId index for better performance
    const account = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_instagramAccountId", (q) => q.eq("instagramAccountId", args.instagramAccountId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!account) {
      console.error(`[updateAccountPagination] Account not found for user ${args.userId}, account ${args.instagramAccountId}`);
      throw new Error("Your Instagram account is taking a moment to load. Thanks for your patience—great things take time!");
    }
    
    console.log(`[updateAccountPagination] Found account: ${account._id}`);
    
    const now = Date.now();
    
    // Update pagination info
    await ctx.db.patch(account._id, {
      pagination: {
        nextUrl: args.nextUrl,
        hasMorePosts: args.hasMorePosts,
        lastFetchedAt: now,
        totalPostsFetched: args.totalPostsFetched,
      },
      updatedAt: now,
    });
    
    console.log(`[updateAccountPagination] Successfully updated pagination for account ${account._id}`);
    return { success: true };
  },
});

export const patchInstagramAccountFields = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    updateFields: v.any(), // Accept any object for patching
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, updateFields } = args;
    if (!updateFields || typeof updateFields !== "object" || Object.keys(updateFields).length === 0) {
      return { success: false, error: "No update fields provided or invalid format" };
    }
    // Find the instagramAccounts document
    const account = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("instagramAccountId"), instagramAccountId))
      .unique();
    if (!account) {
      return { success: false, error: "Instagram account not found" };
    }
    await ctx.db.patch(account._id, updateFields);
    return { success: true, patchedFields: Object.keys(updateFields) };
  },
});

export const patchInstagramPostFields = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    postId: v.string(),
    updateFields: v.any(), // Accept any object for patching
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, postId, updateFields } = args;
    if (!updateFields || typeof updateFields !== "object" || Object.keys(updateFields).length === 0) {
      return { success: false, error: "No update fields provided or invalid format" };
    }
    
    // Find the instagramPosts document
    const post = await ctx.db
      .query("instagramPosts")
      .withIndex("by_postId", q => q.eq("postId", postId))
      .filter(q => q.eq(q.field("userId"), userId))
      .filter(q => q.eq(q.field("instagramAccountId"), instagramAccountId))
      .unique();
    
    if (!post) {
      return { success: false, error: "Instagram post not found" };
    }

    // Handle special fields that need to be nested under 'data'
    const patchData: any = { updatedAt: Date.now() };
    const dataFields = ["insights", "comments"];
    const topLevelDataFields: any = {};
    const regularFields: any = {};
    
    // Separate fields that go into data vs top-level
    for (const [key, value] of Object.entries(updateFields)) {
      if (dataFields.includes(key)) {
        topLevelDataFields[key] = value;
      } else {
        regularFields[key] = value;
      }
    }
    
    // If we have data fields to update, merge them into the existing data object
    if (Object.keys(topLevelDataFields).length > 0) {
      patchData.data = {
        ...post.data,
        ...topLevelDataFields
      };
    }
    
    // Add any regular fields
    Object.assign(patchData, regularFields);
    
    await ctx.db.patch(post._id, patchData);
    return { success: true, patchedFields: Object.keys(updateFields) };
  },
});
