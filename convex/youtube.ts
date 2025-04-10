import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Store YouTube channel data
export const storeYouTubeData = mutation({
  args: {
    userId: v.string(),
    channelData: v.any(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    tokenType: v.string(),
    scope: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, channelData, accessToken, refreshToken, expiresAt, tokenType, scope } = args;

    // Store channel data
    await ctx.db.insert("youtubeData", {
      userId,
      resourceType: "channel",
      data: {
        ...channelData,
        accessToken,
        refreshToken,
        expiresAt,
        tokenType,
        scope,
      },
      timestamp: Date.now(),
      videoCount: Number(channelData.statistics?.videoCount) || 0,
      subscriberCount: Number(channelData.statistics?.subscriberCount) || 0,
      viewCount: Number(channelData.statistics?.viewCount) || 0,
    });

    // Update connection status
    await ctx.db.insert("socialConnectionStatus", {
      userId,
      connections: {
        gmail: false,
        youtube: true,
      },
      lastChecked: Date.now(),
    });
  },
});

// Get YouTube channel data
export const getYouTubeData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("youtubeData")
      .withIndex("by_user_resource", (q) =>
        q.eq("userId", args.userId).eq("resourceType", "channel")
      )
      .order("desc")
      .first();

    return data;
  },
});

// Check YouTube connection status
export const getYouTubeConnectionStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const status = await ctx.db
      .query("socialConnectionStatus")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return status?.connections.youtube ?? false;
  },
});

// Store video data
export const storeVideoData = mutation({
  args: {
    userId: v.string(),
    videoId: v.string(),
    videoData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, videoId, videoData } = args;

    await ctx.db.insert("youtubeData", {
      userId,
      resourceType: "video",
      data: {
        videoId,
        ...videoData,
      },
      timestamp: Date.now(),
    });
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