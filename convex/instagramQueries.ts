import { v } from "convex/values";
import { query } from "./_generated/server";

// Get all Instagram accounts for a user
export const getInstagramAccount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .first();
    return accounts;
  },
});

// Get a single Instagram post by userId and postId
export const getInstagramPost = query({
  args: { userId: v.string(), postId: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("instagramPosts")
      .withIndex("by_userId_postId", q => 
        q.eq("userId", args.userId)
         .eq("postId", args.postId)
      )
      .first();
    return post;
  },
});

// Get all Instagram posts for a user
export const getAllInstagramPosts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("instagramPosts")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
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

// Get all Instagram tokens for a user
export const getInstagramTokens = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const tokens = await ctx.db
        .query("instagramTokens")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();
      return tokens;
    } catch (error) {
      console.error('Error getting Instagram tokens:', error);
      throw new Error(`Failed to get Instagram tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

