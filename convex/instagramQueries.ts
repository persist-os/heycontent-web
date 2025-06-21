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
  args: { userId: v.string() },
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
        .withIndex("by_instagramAccountId", q => q.eq("instagramAccountId", account.instagramAccountId))
        .filter(q => q.eq(q.field("userId"), args.userId))
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
      .withIndex("by_instagramAccountId", q => q.eq("instagramAccountId", args.instagramAccountId))
      .filter(q => q.eq(q.field("userId"), args.userId))
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
      .withIndex("by_instagramAccountId", q => q.eq("instagramAccountId", account.instagramAccountId))
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.gte(q.field("data.timestamp"), args.start))
      .filter(q => q.lte(q.field("data.timestamp"), args.end))
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
      .withIndex("by_instagramAccountId", q => q.eq("instagramAccountId", account.instagramAccountId))
      .filter(q => q.eq(q.field("userId"), args.userId))
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
      .withIndex("by_instagramAccountId", q => q.eq("instagramAccountId", account.instagramAccountId))
      .filter(q => q.eq(q.field("userId"), args.userId))
      .filter(q => q.eq(q.field("data.username"), args.username))
      .order("desc")
      .collect();
    return posts;
  },
});

// Get Instagram profile insights
export const getProfileInsights = query({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId } = args;

    try {
      const insights = await ctx.db
        .query("instagramProfileInsights")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("instagramAccountId"), String(instagramAccountId)))
        .first();

      return insights?.data || null;
    } catch (error) {
      console.error(`Error fetching profile insights for user ${userId}:`, error);
      throw new Error(`Failed to fetch profile insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Instagram stories
export const getStories = query({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId } = args;

    try {
      const stories = await ctx.db
        .query("instagramStories")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("instagramAccountId"), String(instagramAccountId)))
        .first();

      return stories?.data || null;
    } catch (error) {
      console.error(`Error fetching stories for user ${userId}:`, error);
      throw new Error(`Failed to fetch stories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Instagram post insights
export const getPostInsights = query({
  args: {
    userId: v.string(),
    postId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, postId } = args;

    try {
      // First get the post to verify ownership
      const post = await ctx.db
        .query("instagramPosts")
        .withIndex("by_postId", q => q.eq("postId", postId))
        .filter(q => q.eq(q.field("userId"), userId))
        .first();

      if (!post) {
        return null;
      }

      const insights = await ctx.db
        .query("instagramPostInsights")
        .withIndex("by_postId", q => q.eq("postId", postId))
        .filter(q => q.eq(q.field("userId"), userId))
        .first();

      return insights?.data || null;
    } catch (error) {
      console.error(`Error fetching post insights for post ${postId}:`, error);
      throw new Error(`Failed to fetch post insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Instagram post comments
export const getPostComments = query({
  args: {
    userId: v.string(),
    postId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, postId } = args;

    try {
      // First get the post to verify ownership
      const post = await ctx.db
        .query("instagramPosts")
        .withIndex("by_postId", q => q.eq("postId", postId))
        .filter(q => q.eq(q.field("userId"), userId))
        .first();

      if (!post) {
        return null;
      }

      const comments = await ctx.db
        .query("instagramPostComments")
        .withIndex("by_postId", q => q.eq("postId", postId))
        .filter(q => q.eq(q.field("userId"), userId))
        .first();

      return comments?.data || null;
    } catch (error) {
      console.error(`Error fetching post comments for post ${postId}:`, error);
      throw new Error(`Failed to fetch post comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Instagram tokens
export const getInstagramTokens = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    try {
      const tokens = await ctx.db
        .query("instagramTokens")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .first();

      return tokens || null;
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

// Get all Instagram post insights for a user
export const getAllPostInsights = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    try {
      const insights = await ctx.db
        .query("instagramPostInsights")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .collect();

      return insights;
    } catch (error) {
      console.error(`Error fetching post insights for user ${userId}:`, error);
      throw new Error(`Failed to fetch post insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
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