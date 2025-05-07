import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

interface YouTubeToken {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
  scope: string[];
}

interface TokenDocument {
  _id: Id<"youtubeTokens">;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
  scope: string[];
  lastRefreshed?: number;
}

// Get YouTube data for a user
export const getYouTubeData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const youtubeData = await ctx.db
        .query("youtubeData")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .first();

      if (!youtubeData) {
        return null;
      }
      return {
        ...youtubeData,
      };
    } catch (error) {
      console.error('Error getting YouTube data:', error);
      throw new Error(`Failed to get YouTube data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get all YouTube tokens for a user
export const getYouTubeTokens = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const tokens = await ctx.db
        .query("youtubeTokens")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();
      return tokens;
    } catch (error) {
      console.error('Error getting YouTube tokens:', error);
      throw new Error(`Failed to get YouTube tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});


// Get video data
export const getVideoData = query({
  args: { userId: v.string(), videoId: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("youtubeData")
      .withIndex("by_user_resource", (q) =>
        q.eq("userId", args.userId).eq("resourceType", "video")
      )
      .filter((q) => q.eq(q.field("data.videoId"), args.videoId))
      .order("desc")
      .first();

    return data;
  },
});
