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
    const timestamp = Date.now();

    try {
      // Store channel data in youtubeData table
      const youtubeDataId = await ctx.db.insert("youtubeData", {
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
        timestamp,
        videoCount: Number(channelData.statistics?.videoCount) || 0,
        subscriberCount: Number(channelData.statistics?.subscriberCount) || 0,
        viewCount: Number(channelData.statistics?.viewCount) || 0,
      });

      // Extract channel information
      const channelId = channelData.id;
      const title = channelData.snippet?.title || "";
      const description = channelData.snippet?.description || "";
      const subscribers = Number(channelData.statistics?.subscriberCount) || 0;
      const videos = Number(channelData.statistics?.videoCount) || 0;
      const views = Number(channelData.statistics?.viewCount) || 0;

      // Save to socialAccounts for consistent retrieval
      const existingAccount = await ctx.db
        .query("socialAccounts")
        .filter((q) =>
          q.eq(q.field("userId"), userId) &&
          q.eq(q.field("platform"), "youtube")
        )
        .first();

      const accountData = {
        username: title,
        metadata: {
          subscribers,
          videos,
          views,
          channelId,
          title,
          description,
          profileUrl: `https://youtube.com/channel/${channelId}`,
          avatarUrl: channelData.snippet?.thumbnails?.default?.url,
        },
        isConnected: true,
        updatedAt: timestamp
      };

      if (existingAccount) {
        // Update existing account
        await ctx.db.patch(existingAccount._id, accountData);
      } else {
        // Create new account
        await ctx.db.insert("socialAccounts", {
          userId,
          platform: "youtube",
          ...accountData
        });
      }

      // Update connection status
      const status = await ctx.db
        .query("socialConnectionStatus")
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();

      if (status) {
        await ctx.db.patch(status._id, {
          connections: {
            ...status.connections,
            youtube: true,
          },
          lastChecked: timestamp,
        });
      } else {
        // Initialize with all platforms set to false except YouTube
        await ctx.db.insert("socialConnectionStatus", {
          userId,
          connections: {
            gmail: false,
            youtube: true,
            instagram: false,
            tiktok: false
          },
          lastChecked: timestamp,
        });
      }

      return youtubeDataId;
    } catch (error) {
      console.error('Error storing YouTube data:', error);
      throw new Error(`Failed to store YouTube data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

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

      // Also get the social account data for consistency
      const socialAccount = await ctx.db
        .query("socialAccounts")
        .filter((q) =>
          q.eq(q.field("userId"), args.userId) &&
          q.eq(q.field("platform"), "youtube")
        )
        .first();

      return {
        ...youtubeData,
        socialAccount: socialAccount || null
      };
    } catch (error) {
      console.error('Error getting YouTube data:', error);
      throw new Error(`Failed to get YouTube data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

// Save YouTube channel data
export const saveChannelData = mutation({
  args: {
    userId: v.string(),
    channelId: v.string(),
    title: v.string(),
    description: v.string(),
    customUrl: v.string(),
    thumbnails: v.any(),
    statistics: v.object({
      subscribers: v.number(),
      videos: v.number(),
      views: v.number()
    }),
    updatedAt: v.number()
  },
  handler: async (ctx, args) => {
    const { userId, channelId, title, description, customUrl, thumbnails, statistics, updatedAt } = args;

    // Store channel data
    const youtubeDataId = await ctx.db.insert("youtubeData", {
      userId,
      resourceType: "channel",
      data: {
        id: channelId,
        snippet: {
          title,
          description,
          customUrl,
          thumbnails
        },
        statistics
      },
      timestamp: updatedAt,
      videoCount: statistics.videos,
      subscriberCount: statistics.subscribers,
      viewCount: statistics.views
    });

    // Also save to socialAccounts for consistent retrieval
    const existingAccount = await ctx.db
      .query("socialAccounts")
      .filter((q) =>
        q.eq(q.field("userId"), userId) &&
        q.eq(q.field("platform"), "youtube")
      )
      .first();

    if (existingAccount) {
      // Update existing account
      await ctx.db.patch(existingAccount._id, {
        username: title,
        metadata: {
          subscribers: statistics.subscribers,
          videos: statistics.videos,
          views: statistics.views,
          channelId: channelId,
          title: title,
          description: description
        },
        isConnected: true,
        updatedAt
      });
    } else {
      // Create new account
      await ctx.db.insert("socialAccounts", {
        userId,
        platform: "youtube",
        username: title,
        metadata: {
          subscribers: statistics.subscribers,
          videos: statistics.videos,
          views: statistics.views,
          channelId: channelId,
          title: title,
          description: description
        },
        isConnected: true,
        updatedAt
      });
    }

    // Update connection status
    const status = await ctx.db
      .query("socialConnectionStatus")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (status) {
      await ctx.db.patch(status._id, {
        connections: {
          ...status.connections,
          youtube: true,
        },
        lastChecked: updatedAt,
      });
    } else {
      // Initialize with all platforms set to false except YouTube
      await ctx.db.insert("socialConnectionStatus", {
        userId,
        connections: {
          gmail: false,
          youtube: true,
          instagram: false,
          tiktok: false
        },
        lastChecked: updatedAt,
      });
    }

    return youtubeDataId;
  },
});