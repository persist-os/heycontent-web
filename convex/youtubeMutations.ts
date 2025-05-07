import { v } from "convex/values";
import { mutation } from "./_generated/server";


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
    return youtubeDataId;
  },
});

// Update YouTube token
export const update_youtube_token = mutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    tokenType: v.string(),
    scope: v.array(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("youtubeTokens", {
      userId: args.userId,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiryDate: args.expiresAt,
      scope: args.scope.join(" "),
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

// Upsert full YouTube profile (channel + videos)
export const upsertYoutubeFullProfile = mutation({
  args: {
    userId: v.string(),
    channel: v.any(),
    videos: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("youtube_full_profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        channel: args.channel,
        videos: args.videos,
        createdAt: now,
      });
      return { status: "updated" };
    } else {
      await ctx.db.insert("youtube_full_profiles", {
        userId: args.userId,
        channel: args.channel,
        videos: args.videos,
        createdAt: now,
      });
      return { status: "created" };
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
     
      // Delete tokens
      const tokens = await ctx.db
        .query("youtubeTokens")
        .filter((q) =>
          q.eq(q.field("userId"), userId)
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