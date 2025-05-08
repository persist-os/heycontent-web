import { v } from "convex/values";
import { query } from "./_generated/server";

// Get Instagram data for a user
export const getInstagramData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const instagramData = await ctx.db
        .query("instagramData")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .first();

      if (!instagramData) {
        return null;
      }
      return {
        ...instagramData,
      };
    } catch (error) {
      console.error('Error getting Instagram data:', error);
      throw new Error(`Failed to get Instagram data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

// Get profile data
export const getProfileData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("instagramData")
      .withIndex("by_user_resource", (q) =>
        q.eq("userId", args.userId).eq("resourceType", "profile")
      )
      .order("desc")
      .first();

    return data;
  },
});

// Get post data
export const getPostData = query({
  args: { userId: v.string(), postId: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("instagramData")
      .withIndex("by_user_resource", (q) =>
        q.eq("userId", args.userId).eq("resourceType", "post")
      )
      .filter((q) => q.eq(q.field("data.id"), args.postId))
      .order("desc")
      .first();

    return data;
  },
});

// Get story data
export const getStoryData = query({
  args: { userId: v.string(), storyId: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("instagramData")
      .withIndex("by_user_resource", (q) =>
        q.eq("userId", args.userId).eq("resourceType", "story")
      )
      .filter((q) => q.eq(q.field("data.id"), args.storyId))
      .order("desc")
      .first();

    return data;
  },
});

// Get reel data
export const getReelData = query({
  args: { userId: v.string(), reelId: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("instagramData")
      .withIndex("by_user_resource", (q) =>
        q.eq("userId", args.userId).eq("resourceType", "reel")
      )
      .filter((q) => q.eq(q.field("data.id"), args.reelId))
      .order("desc")
      .first();

    return data;
  },
});

// Get all posts for a user
export const getAllPosts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("instagramData")
      .withIndex("by_user_resource", (q) =>
        q.eq("userId", args.userId).eq("resourceType", "post")
      )
      .order("desc")
      .collect();

    return posts;
  },
});
