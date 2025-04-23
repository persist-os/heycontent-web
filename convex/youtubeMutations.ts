import { v } from "convex/values";
import { mutation } from "./_generated/server";
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
      viewCount: v.string(),
      subscriberCount: v.string(),
      hiddenSubscriberCount: v.boolean(),
      videoCount: v.string()
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
      videoCount: Number(statistics.videoCount),
      subscriberCount: Number(statistics.subscriberCount),
      viewCount: Number(statistics.viewCount)
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
          subscribers: Number(statistics.subscriberCount),
          videos: Number(statistics.videoCount),
          views: Number(statistics.viewCount),
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
          subscribers: Number(statistics.subscriberCount),
          videos: Number(statistics.videoCount),
          views: Number(statistics.viewCount),
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

// Update YouTube token
export const update_youtube_token = mutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    tokenType: v.string(),
    scope: v.array(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tokens", {
      userId: args.userId,
      platform: "youtube",
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      tokenType: args.tokenType,
      scope: args.scope,
      lastRefreshed: Date.now()
    });
  },
});

// Store video analysis data
export const storeVideoAnalysis = mutation({
  args: {
    userId: v.string(),
    videoId: v.string(),
    analysisData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, videoId, analysisData } = args;
    const timestamp = Date.now();

    try {
      await ctx.db.insert("youtubeData", {
        userId,
        resourceType: "video_analysis",
        data: {
          id: videoId,
          videoId,
          analysisData,
        },
        timestamp,
      });
      console.log(`Stored analysis for video ${videoId} by user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Error storing video analysis:', error);
      throw new Error(`Failed to store video analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Clean up YouTube data when disconnecting
export const disconnectYouTube = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { userId } = args;
    const timestamp = Date.now();

    try {
      // Delete all YouTube data for the user
      const youtubeData = await ctx.db
        .query("youtubeData")
        .filter((q) => q.eq(q.field("userId"), userId))
        .collect();

      for (const data of youtubeData) {
        await ctx.db.delete(data._id);
      }

      // Update social account to disconnected
      const socialAccount = await ctx.db
        .query("socialAccounts")
        .filter((q) =>
          q.eq(q.field("userId"), userId) &&
          q.eq(q.field("platform"), "youtube")
        )
        .first();

      if (socialAccount) {
        await ctx.db.patch(socialAccount._id, {
          isConnected: false,
          updatedAt: timestamp
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
            youtube: false,
          },
          lastChecked: timestamp,
        });
      }

      // Delete tokens
      const tokens = await ctx.db
        .query("tokens")
        .filter((q) =>
          q.eq(q.field("userId"), userId) &&
          q.eq(q.field("platform"), "youtube")
        )
        .collect();

      for (const token of tokens) {
        await ctx.db.delete(token._id);
      }

      return { success: true };
    } catch (error) {
      console.error('Error disconnecting YouTube:', error);
      throw new Error(`Failed to disconnect YouTube: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}); 