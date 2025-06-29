import { v } from "convex/values";
import { query } from "./_generated/server";

// Get all Instagram accounts for a user
export const getInstagramAccount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    console.log('Querying Instagram account for userId:', args.userId);
    
    // First check if we can find any accounts at all
    const allAccounts = await ctx.db
      .query("instagramAccounts")
      .collect();
    console.log('Total Instagram accounts in DB:', allAccounts.length);
    
    // Then try to find the specific account
    const accounts = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .first();
    
    console.log('Found account:', accounts ? {
      userId: accounts.userId,
      username: accounts.username,
      instagramAccountId: accounts.instagramAccountId
    } : 'No account found');
    
    return accounts;
  },
});

// Get a single Instagram post by userId and postId
export const getInstagramPost = query({
  args: { userId: v.string(), postId: v.string() },
  handler: async (ctx, args) => {
    try {
      // First try to find by postId since it's more specific
      const post = await ctx.db
        .query("instagramPosts")
        .withIndex("by_postId", q => q.eq("postId", args.postId))
        .filter(q => q.eq(q.field("userId"), args.userId))
        .first();
      
      // If not found by postId, try data.id
      if (!post) {
        return await ctx.db
          .query("instagramPosts")
          .withIndex("by_userId", q => q.eq("userId", args.userId))
          .filter(q => q.eq(q.field("data.id"), args.postId))
          .first();
      }
      
      return post;
    } catch (error) {
      console.error('Error fetching Instagram post:', error);
      throw new Error(`Failed to fetch Instagram post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get all Instagram posts for a user
export const getAllInstagramPosts = query({
  args: { userId: v.string(), refreshTimestamp: v.optional(v.number()) },
  handler: async (ctx, args) => {
    try {
      // First get the account ID for this user
      const account = await ctx.db
        .query("instagramAccounts")
        .withIndex("by_userId", q => q.eq("userId", args.userId))
        .first();
      
      if (!account) {
        return [];
      }

      // Then get all posts for this account
      const posts = await ctx.db
        .query("instagramPosts")
        .withIndex("by_timestamp")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .filter(q => q.eq(q.field("instagramAccountId"), account.instagramAccountId))
        .order("desc")
        .collect();
      
      return posts;
    } catch (error) {
      console.error("Error fetching all Instagram posts:", error);
      throw new Error("Failed to fetch Instagram posts");
    }
  },
});

// Get all Instagram posts for an instagramAccountId
export const getInstagramPostsByAccount = query({
  args: { userId: v.string(), instagramAccountId: v.string() },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("instagramPosts")
      .withIndex("by_timestamp")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.eq(q.field("instagramAccountId"), args.instagramAccountId))
      .order("desc")
      .collect();
    return posts;
  },
});

// Get all Instagram posts for a user within a time range
export const getInstagramPostsByTimeRange = query({
  args: { userId: v.string(), start: v.number(), end: v.number() },
  handler: async (ctx, args) => {
    // First get the account ID for this user
    const account = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .first();
    
    if (!account) {
      return [];
    }

    const posts = await ctx.db
      .query("instagramPosts")
      .withIndex("by_timestamp")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.eq(q.field("instagramAccountId"), account.instagramAccountId))
      .filter(q => q.gte(q.field("data.timestamp"), args.start))
      .filter(q => q.lte(q.field("data.timestamp"), args.end))
      .order("desc")
      .collect();
    return posts;
  },
});

// Get posts by media type
export const getInstagramPostsByMediaType = query({
  args: { userId: v.string(), mediaType: v.union(v.literal("IMAGE"), v.literal("VIDEO"), v.literal("CAROUSEL_ALBUM"), v.literal("REELS")) },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .first();
    
    if (!account) {
      return [];
    }

    const posts = await ctx.db
      .query("instagramPosts")
      .withIndex("by_mediaType", q => q.eq("mediaType", args.mediaType))
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.eq(q.field("instagramAccountId"), account.instagramAccountId))
      .order("desc")
      .collect();
    return posts;
  },
});

// Get the latest Instagram post for a user
export const getLatestInstagramPost = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // First get the account ID for this user
    const account = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .first();
    
    if (!account) {
      return null;
    }

    const post = await ctx.db
      .query("instagramPosts")
      .withIndex("by_timestamp")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.eq(q.field("instagramAccountId"), account.instagramAccountId))
      .order("desc")
      .first();
    return post;
  },
});

// Get posts by username
export const getInstagramPostsByUsername = query({
  args: { userId: v.string(), username: v.string() },
  handler: async (ctx, args) => {
    // First get the account ID for this user
    const account = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .first();
    
    if (!account) {
      return [];
    }

    const posts = await ctx.db
      .query("instagramPosts")
      .withIndex("by_timestamp")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.eq(q.field("instagramAccountId"), account.instagramAccountId))
      .filter(q => q.eq(q.field("data.username"), args.username))
      .order("desc")
      .collect();
    return posts;
  },
});

// Get posts with insights (posts that have embedded insights data)
export const getInstagramPostsWithInsights = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .first();
    
    if (!account) {
      return [];
    }

    const posts = await ctx.db
      .query("instagramPosts")
      .withIndex("by_timestamp")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.eq(q.field("instagramAccountId"), account.instagramAccountId))
      .filter(q => q.neq(q.field("data.insights"), undefined))
      .order("desc")
      .collect();
    return posts;
  },
});

// Get posts with comments (posts that have embedded comments data)
export const getInstagramPostsWithComments = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .first();
    
    if (!account) {
      return [];
    }

    const posts = await ctx.db
      .query("instagramPosts")
      .withIndex("by_timestamp")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.eq(q.field("instagramAccountId"), account.instagramAccountId))
      .filter(q => q.neq(q.field("data.comments"), undefined))
      .order("desc")
      .collect();
    return posts;
  },
});

// Get Instagram tokens (now from instagramAccounts table)
export const getInstagramTokens = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    try {
      const account = await ctx.db
        .query("instagramAccounts")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .first();

      if (!account || !account.token) {
        return null;
      }

      // Return token data in the expected format for backward compatibility
      return {
        userId: account.userId,
        instagramAccountId: account.instagramAccountId,
        accessToken: account.token.accessToken,
        expiryDate: account.token.expiryDate,
        scope: account.token.scope,
        lastRefreshed: account.token.lastRefreshed,
      };
    } catch (error) {
      console.error(`Error fetching Instagram tokens for user ${userId}:`, error);
      throw new Error(`Failed to fetch Instagram tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Instagram tracker analysis
export const getInstagramTrackerAnalysis = query({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId } = args;

    try {
      console.log('[getInstagramTrackerAnalysis] Querying with:', { userId, instagramAccountId });
      
      // First check if there are any tracker analyses at all
      const allAnalyses = await ctx.db
        .query("instagramTrackerAnalysis")
        .collect();
      console.log('[getInstagramTrackerAnalysis] Total analyses in DB:', allAnalyses.length);
      
      // Log analyses for this user
      const userAnalyses = await ctx.db
        .query("instagramTrackerAnalysis")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .collect();
      console.log('[getInstagramTrackerAnalysis] User analyses:', userAnalyses.length, userAnalyses.map(a => ({
        userId: a.userId,
        instagramAccountId: a.instagramAccountId,
        hasAnalysis: !!a.analysis,
        createdAt: a.createdAt
      })));

      const analysis = await ctx.db
        .query("instagramTrackerAnalysis")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("instagramAccountId"), instagramAccountId))
        .first();

      console.log('[getInstagramTrackerAnalysis] Found analysis:', analysis ? {
        userId: analysis.userId,
        instagramAccountId: analysis.instagramAccountId,
        hasAnalysis: !!analysis.analysis,
        analysisKeys: analysis.analysis ? Object.keys(analysis.analysis) : null,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt
      } : 'No analysis found');

      return analysis?.analysis || null;
    } catch (error) {
      console.error(`Error fetching tracker analysis for user ${userId}:`, error);
      throw new Error(`Failed to fetch tracker analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get analysis for a specific Instagram post
export const getPostAnalysis = query({
  args: { 
    userId: v.string(),
    postId: v.string() 
  },
  handler: async (ctx, args) => {
    const { userId, postId } = args;
    try {
      console.log('[getPostAnalysis] Starting query with params:', { userId, postId });
      
      // Check if the postId is valid
      if (!postId || typeof postId !== 'string') {
        console.error('[getPostAnalysis] Invalid postId:', postId);
        throw new Error(`Invalid postId: ${postId}`);
      }
      
      // Check if the userId is valid
      if (!userId || typeof userId !== 'string') {
        console.error('[getPostAnalysis] Invalid userId:', userId);
        throw new Error(`Invalid userId: ${userId}`);
      }
      
      console.log('[getPostAnalysis] Querying for postId:', postId, 'userId:', userId);
      
      // First, let's check what posts exist for this user
      const userPosts = await ctx.db
        .query("instagramPosts")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      
      console.log('[getPostAnalysis] Found', userPosts.length, 'posts for userId:', userId);
      console.log('[getPostAnalysis] User post IDs:', userPosts.map(p => ({ postId: p.postId, dataId: p.data?.id })));
      
      // Try to find the post by postId first
      let post = await ctx.db
        .query("instagramPosts")
        .withIndex("by_postId", (q) => q.eq("postId", postId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();

      if (!post) {
        console.log(`[getPostAnalysis] No post found by postId=${postId}, trying by data.id...`);
        
        // Try to find by data.id as fallback
        post = await ctx.db
          .query("instagramPosts")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .filter((q) => q.eq(q.field("data.id"), postId))
          .first();
          
        if (!post) {
          console.log(`[getPostAnalysis] No post found by data.id either for postId=${postId} and userId=${userId}`);
          return null;
        } else {
          console.log('[getPostAnalysis] Found post by data.id:', { postId: post.postId, dataId: post.data?.id });
        }
      } else {
        console.log('[getPostAnalysis] Found post by postId:', { postId: post.postId, dataId: post.data?.id });
      }
      
      console.log('[getPostAnalysis] Post object found:', {
        postId: post.postId,
        userId: post.userId,
        _id: post._id,
        hasAnalysisMarkdown: !!post.analysisMarkdown,
        hasAnalysis: !!post.analysis,
      });
      
      if (post.analysisMarkdown || post.analysis) {
        console.log(`[getPostAnalysis] Returning analysis for postId=${postId}`);

        // Prepare the analysis object - prefer markdown over JSON
        let analysisToReturn;
        if (post.analysisMarkdown) {
          // Return markdown as a string directly
          analysisToReturn = post.analysisMarkdown;
          console.log(`[getPostAnalysis] Returning markdown analysis for postId=${postId}`);
        } else if (post.analysis) {
          // Return JSON analysis
          analysisToReturn = post.analysis;
          console.log(`[getPostAnalysis] Returning JSON analysis for postId=${postId}`);
        }

        return {
          _id: post._id,
          postId: post.postId,
          userId: post.userId,
          analysis: analysisToReturn,
          analysisMarkdown: post.analysisMarkdown,
          updatedAt: post.updatedAt || post._creationTime
        };
      }

      console.log(`[getPostAnalysis] No analysis found for postId=${postId}`);
      return null;
    } catch (error) {
      console.error('[getPostAnalysis] Error retrieving Instagram post analysis:', error);
      console.error('[getPostAnalysis] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        postId
      });
      // Re-throw the error so it propagates to the client
      throw new Error(`Failed to get post analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Instagram account insights/analysis (similar to YouTube channel analysis)
export const getInstagramAccountAnalysis = query({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Use the existing tracker analysis functionality
      const analysis = await ctx.db
        .query("instagramTrackerAnalysis")
        .withIndex("by_userId", q => q.eq("userId", args.userId))
        .filter(q => q.eq(q.field("instagramAccountId"), args.instagramAccountId))
        .first();

      if (!analysis) {
        return null;
      }

      return {
        _id: analysis._id,
        userId: analysis.userId,
        instagramAccountId: analysis.instagramAccountId,
        analysis: analysis.analysis,
        updatedAt: analysis.updatedAt || analysis._creationTime
      };
    } catch (error) {
      console.error("Error fetching Instagram account analysis:", error);
      throw new Error("Failed to fetch Instagram account analysis");
    }
  },
});

// Get Instagram batch analysis insights
export const getInstagramBatchAnalysis = query({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log('[getInstagramBatchAnalysis] Querying with:', { userId: args.userId, instagramAccountId: args.instagramAccountId });
      
      const analysis = await ctx.db
        .query("instagramBatchAnalysis")
        .withIndex("by_user_account", q => 
          q.eq("userId", args.userId)
           .eq("instagramAccountId", args.instagramAccountId)
        )
        .first();

      console.log('[getInstagramBatchAnalysis] Found analysis:', analysis ? {
        userId: analysis.userId,
        instagramAccountId: analysis.instagramAccountId,
        hasInsights: !!analysis.insights,
        insightsKeys: analysis.insights ? Object.keys(analysis.insights) : null,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt
      } : 'No analysis found');

      if (!analysis) {
        return null;
      }

      return {
        _id: analysis._id,
        userId: analysis.userId,
        instagramAccountId: analysis.instagramAccountId,
        insights: analysis.insights,
        status: analysis.status,
        updatedAt: analysis.updatedAt || analysis._creationTime
      };
    } catch (error) {
      console.error("Error fetching Instagram batch analysis:", error);
      throw new Error("Failed to fetch Instagram batch analysis");
    }
  },
});

// Get Instagram account by Instagram account ID (for collision detection)
export const getInstagramAccountById = query({
  args: { instagramAccountId: v.string() },
  handler: async (ctx, args) => {
    try {
      console.log('Checking collision for Instagram account ID:', args.instagramAccountId);
      
      const account = await ctx.db
        .query("instagramAccounts")
        .withIndex("by_instagramAccountId", q => q.eq("instagramAccountId", args.instagramAccountId))
        .first();
      
      console.log('Collision check result:', account ? {
        userId: account.userId,
        username: account.username,
        instagramAccountId: account.instagramAccountId
      } : 'No collision found');
      
      return account;
    } catch (error) {
      console.error('Error checking Instagram account collision:', error);
      // Return null to allow connection in case of error
      return null;
    }
  },
});

// Get 3 most recent Instagram posts with analysis for content hub
export const getRecentPostsWithAnalysis = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Get 3 most recent posts
      const posts = await ctx.db
        .query("instagramPosts")
        .withIndex("by_userId", q => q.eq("userId", args.userId))
        .order("desc")
        .take(3);

      // Return posts with their analysis data
      const postsWithAnalysis = posts.map(post => ({
        id: post.postId,
        caption: post.data?.caption || '',
        mediaType: post.mediaType || 'IMAGE',
        mediaUrl: post.data?.media_url || '',
        permalink: post.data?.permalink || '',
        timestamp: post.data?.timestamp || post.createdAt,
        likeCount: post.data?.like_count || 0,
        commentsCount: post.data?.comments_count || 0,
        insights: post.data?.insights || null,
        comments: post.data?.comments || null,
        analysis: post.analysis || null,
        analysisMarkdown: post.analysisMarkdown || null
      }));

      console.log(`[getRecentPostsWithAnalysis] Found ${posts.length} posts for user ${args.userId}`);
      return postsWithAnalysis;
    } catch (error) {
      console.error('Error getting recent posts with analysis:', error);
      return [];
    }
  },
});

// Get Instagram profile insights
export const getInstagramProfileInsights = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const account = await ctx.db
        .query("instagramAccounts")
        .withIndex("by_userId", q => q.eq("userId", args.userId))
        .first();

      if (!account) {
        return null;
      }

      return account.profileInsights || null;
    } catch (error) {
      console.error('Error getting Instagram profile insights:', error);
      throw new Error(`Failed to get Instagram profile insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Instagram webhook events for a user
export const getInstagramWebhookEvents = query({
  args: {
    userId: v.string(),
    instagramAccountId: v.optional(v.string()),
    eventType: v.optional(v.string()),
    processed: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db
        .query("instagramWebhookEvents")
        .withIndex("by_userId", q => q.eq("userId", args.userId));

      if (args.instagramAccountId) {
        query = query.filter(q => q.eq(q.field("instagramAccountId"), args.instagramAccountId));
      }

      if (args.eventType) {
        query = query.filter(q => q.eq(q.field("eventType"), args.eventType));
      }

      if (args.processed !== undefined) {
        query = query.filter(q => q.eq(q.field("processed"), args.processed));
      }

      const events = await query
        .order("desc")
        .take(args.limit || 50);

      return events;
    } catch (error) {
      console.error('Error getting Instagram webhook events:', error);
      throw new Error(`Failed to get webhook events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get unprocessed webhook events
export const getUnprocessedWebhookEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const events = await ctx.db
        .query("instagramWebhookEvents")
        .withIndex("by_processed", q => q.eq("processed", false))
        .order("asc") // Process oldest first
        .take(args.limit || 100);

      return events;
    } catch (error) {
      console.error('Error getting unprocessed webhook events:', error);
      throw new Error(`Failed to get unprocessed events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get webhook subscription status
export const getWebhookSubscription = query({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const subscription = await ctx.db
        .query("instagramWebhookSubscriptions")
        .withIndex("by_user_account", q => 
          q.eq("userId", args.userId)
           .eq("instagramAccountId", args.instagramAccountId)
        )
        .first();

      return subscription;
    } catch (error) {
      console.error('Error getting webhook subscription:', error);
      throw new Error(`Failed to get webhook subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Instagram account by Instagram ID (for webhook processing)
export const getInstagramAccountByInstagramId = query({
  args: {
    instagramAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const account = await ctx.db
        .query("instagramAccounts")
        .withIndex("by_instagramAccountId", q => q.eq("instagramAccountId", args.instagramAccountId))
        .first();

      return account;
    } catch (error) {
      console.error('Error getting Instagram account by Instagram ID:', error);
      return null;
    }
  },
});

// Get Instagram story insights for a user
export const getInstagramStoryInsights = query({
  args: {
    userId: v.string(),
    instagramAccountId: v.optional(v.string()),
    mediaId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db
        .query("instagramStoryInsights")
        .withIndex("by_userId", q => q.eq("userId", args.userId));

      if (args.instagramAccountId) {
        query = query.filter(q => q.eq(q.field("instagramAccountId"), args.instagramAccountId));
      }

      if (args.mediaId) {
        query = query.filter(q => q.eq(q.field("mediaId"), args.mediaId));
      }

      const insights = await query
        .order("desc")
        .take(args.limit || 50);

      return insights;
    } catch (error) {
      console.error('Error getting Instagram story insights:', error);
      throw new Error(`Failed to get story insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get story insights by media ID
export const getStoryInsightsByMediaId = query({
  args: {
    userId: v.string(),
    mediaId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const insights = await ctx.db
        .query("instagramStoryInsights")
        .withIndex("by_mediaId", q => q.eq("mediaId", args.mediaId))
        .filter(q => q.eq(q.field("userId"), args.userId))
        .first();

      return insights;
    } catch (error) {
      console.error('Error getting story insights by media ID:', error);
      throw new Error(`Failed to get story insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get recent story insights (last 7 days)
export const getRecentStoryInsights = query({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const daysBack = args.days || 7;
      const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

      const insights = await ctx.db
        .query("instagramStoryInsights")
        .withIndex("by_user_account", q => 
          q.eq("userId", args.userId)
           .eq("instagramAccountId", args.instagramAccountId)
        )
        .filter(q => q.gte(q.field("webhookTimestamp"), cutoffTime))
        .order("desc")
        .collect();

      return insights;
    } catch (error) {
      console.error('Error getting recent story insights:', error);
      throw new Error(`Failed to get recent story insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Instagram posts with recent comments (from webhooks)
export const getPostsWithRecentComments = query({
  args: {
    userId: v.string(),
    instagramAccountId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db
        .query("instagramPosts")
        .withIndex("by_userId", q => q.eq("userId", args.userId));

      if (args.instagramAccountId) {
        query = query.filter(q => q.eq(q.field("instagramAccountId"), args.instagramAccountId));
      }

      // Get posts that have comments
      const posts = await query
        .filter(q => q.neq(q.field("data.comments"), undefined))
        .filter(q => q.gt(q.field("data.comments_count"), 0))
        .order("desc")
        .take(args.limit || 20);

      // Sort by most recent comment activity
      const postsWithRecentActivity = posts
        .map(post => {
          const comments = post.data?.comments || [];
          const mostRecentComment = comments.length > 0 
            ? Math.max(...comments.map((c: any) => c.timestamp || 0))
            : 0;
          
          return {
            ...post,
            mostRecentCommentTime: mostRecentComment
          };
        })
        .sort((a, b) => b.mostRecentCommentTime - a.mostRecentCommentTime);

      return postsWithRecentActivity;
    } catch (error) {
      console.error('Error getting posts with recent comments:', error);
      throw new Error(`Failed to get posts with recent comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get engagement summary from webhook data
export const getWebhookEngagementSummary = query({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const daysBack = args.days || 7;
      const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

      // Get recent webhook events
      const webhookEvents = await ctx.db
        .query("instagramWebhookEvents")
        .withIndex("by_user_account", q => 
          q.eq("userId", args.userId)
           .eq("instagramAccountId", args.instagramAccountId)
        )
        .filter(q => q.gte(q.field("timestamp"), cutoffTime))
        .collect();

      // Get recent story insights
      const storyInsights = await ctx.db
        .query("instagramStoryInsights")
        .withIndex("by_user_account", q => 
          q.eq("userId", args.userId)
           .eq("instagramAccountId", args.instagramAccountId)
        )
        .filter(q => q.gte(q.field("webhookTimestamp"), cutoffTime))
        .collect();

      // Calculate summary metrics
      const commentEvents = webhookEvents.filter(e => e.eventType === "comments");
      const messageEvents = webhookEvents.filter(e => e.eventType === "messages");
      
      const totalStoryImpressions = storyInsights.reduce((sum, insight) => 
        sum + (insight.insights?.impressions || 0), 0
      );
      
      const totalStoryReach = storyInsights.reduce((sum, insight) => 
        sum + (insight.insights?.reach || 0), 0
      );

      return {
        period: `${daysBack} days`,
        totalComments: commentEvents.length,
        totalMessages: messageEvents.length,
        totalStories: storyInsights.length,
        totalStoryImpressions,
        totalStoryReach,
        avgStoryReach: storyInsights.length > 0 ? Math.round(totalStoryReach / storyInsights.length) : 0,
        recentActivity: {
          comments: commentEvents.slice(-5).map(e => ({
            timestamp: e.timestamp,
            mediaId: e.eventData?.media_id,
            text: e.eventData?.text?.substring(0, 100) + "...",
            username: e.eventData?.from?.username
          })),
          stories: storyInsights.slice(-5).map(s => ({
            mediaId: s.mediaId,
            impressions: s.insights?.impressions,
            reach: s.insights?.reach,
            timestamp: s.webhookTimestamp
          }))
        }
      };
    } catch (error) {
      console.error('Error getting webhook engagement summary:', error);
      throw new Error(`Failed to get engagement summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Instagram post by media ID (for webhook processing)
export const getInstagramPostByMediaId = query({
  args: {
    mediaId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`[getInstagramPostByMediaId] Looking for post with media_id: ${args.mediaId}`);
      
      const post = await ctx.db
        .query("instagramPosts")
        .filter(q => q.eq(q.field("data.id"), args.mediaId))
        .first();

      if (post) {
        console.log(`[getInstagramPostByMediaId] Found post: ${post.postId} for user: ${post.userId}`);
        return { success: true, post };
      } else {
        console.log(`[getInstagramPostByMediaId] Post not found for media_id: ${args.mediaId}`);
        return { success: false, error: "Post not found" };
      }
    } catch (error) {
      console.error(`[getInstagramPostByMediaId] Error getting post by media ID: ${error}`);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
});

// Get all Instagram accounts (for debugging)
export const getAllInstagramAccounts = query({
  args: {},
  handler: async (ctx, args) => {
    try {
      const accounts = await ctx.db
        .query("instagramAccounts")
        .collect();
      
      return accounts.map(account => ({
        userId: account.userId,
        instagramAccountId: account.instagramAccountId,
        username: account.username,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      }));
    } catch (error) {
      console.error('Error getting all Instagram accounts:', error);
      throw new Error(`Failed to get Instagram accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});