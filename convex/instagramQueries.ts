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
      accountId: accounts.accountId
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
      .withIndex("by_accountId", q => q.eq("accountId", account.accountId))
      .order("desc")
      .collect();
    return posts;
  },
});

// Get all Instagram posts for an accountId
export const getInstagramPostsByAccount = query({
  args: { accountId: v.string() },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("instagramPosts")
      .withIndex("by_accountId", q => q.eq("accountId", args.accountId))
      .order("desc")
      .collect();
    return posts;
  },
});

// Get all Instagram posts for a user within a time range
export const getInstagramPostsByTimeRange = query({
  args: { userId: v.string(), start: v.number(), end: v.number() },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("instagramPosts")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
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
    const post = await ctx.db
      .query("instagramPosts")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .order("desc")
      .first();
    return post;
  },
});

// Get posts by username
export const getInstagramPostsByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("instagramPosts")
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
    accountId: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, accountId } = args;

    try {
      const insights = await ctx.db
        .query("instagramProfileInsights")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("accountId"), accountId))
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
    accountId: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, accountId } = args;

    try {
      const stories = await ctx.db
        .query("instagramStories")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("accountId"), accountId))
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

