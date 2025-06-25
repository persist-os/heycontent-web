import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { MutationCtx, ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";

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
        like_count: v.optional(v.number()),
        replies: v.optional(v.array(v.object({
          id: v.string(),
          text: v.string(),
          timestamp: v.number(),
          username: v.optional(v.string())
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
          // Update existing post
          await ctx.db.patch(existingPost._id, {
            mediaType: post.media_type,
            data: processedData,
            updatedAt: now,
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
          });
          results.push({ status: "created", postId: post.id, internalId });
        }
      } catch (error) {
        console.error(`Error storing Instagram post ${post.id}:`, error);
        results.push({ 
          status: "error", 
          postId: post.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
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
        // Update existing post
        await ctx.db.patch(existingPost._id, {
          mediaType: mediaType,
          data: processedData,
          updatedAt: now,
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
        });
        return { status: "created", postId: internalId };
      }
    } catch (error) {
      console.error(`Error storing Instagram post ${postId}:`, error);
      throw new Error(`Failed to store Instagram post: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, username, profileData, token, profileInsights, createdAt, updatedAt } = args;
    try {
      // Check if account already exists
      const existingAccount = await ctx.db
        .query("instagramAccounts")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      
      const accountData = {
        username,
        instagramAccountId: String(instagramAccountId),
        profileData,
        updatedAt,
        ...(token && { token }),
        ...(profileInsights && { profileInsights }),
      };

      if (existingAccount) {
        await ctx.db.patch(existingAccount._id, accountData);
        return { status: "updated", instagramAccountId: String(instagramAccountId) };
      } else {
        const id = await ctx.db.insert("instagramAccounts", {
          userId,
          ...accountData,
          createdAt,
        });
        return { status: "created", instagramAccountId: String(instagramAccountId) };
      }
    } catch (error) {
      console.error(`Error storing Instagram account for user ${userId}:`, error);
      throw new Error(`Failed to store Instagram account: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to disconnect Instagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    const post = await ctx.db
      .query("instagramPosts")
      .withIndex("by_postId", (q) => q.eq("postId", postId))
      .first();

    if (!post) {
      // Create a minimal post record if it doesn't exist
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

      await ctx.db.patch(postId_internal, updateData);
      return { success: true, status: "created", postId: postId_internal };
    }

    // Update existing post with analysis
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

    await ctx.db.patch(post._id, updateData);
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
        await ctx.db.patch(existingAnalysis._id, {
          analysis,
          updatedAt: now,
        });
        return { status: "updated", analysisId: existingAnalysis._id };
      } else {
        const id = await ctx.db.insert("instagramTrackerAnalysis", {
          userId,
          instagramAccountId,
          analysis,
          createdAt: now,
          updatedAt: now,
        });
        return { status: "created", analysisId: id };
      }
    } catch (error) {
      console.error(`Error storing Instagram tracker analysis for user ${userId}:`, error);
      throw new Error(`Failed to store Instagram tracker analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to store Instagram batch analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to update Instagram batch analysis status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});