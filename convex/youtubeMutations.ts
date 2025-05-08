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
    const now = Date.now();

    try {
      // Check if video already exists in youtubeVideos
      const existingVideo = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_videoId", (q) => q.eq("videoId", videoId))
        .first();

      // Prepare video doc for flexible schema
      const videoDoc = {
        userId,
        id: videoId,
        videoId,
        ...videoData,
        updatedAt: now,
        createdAt: videoData.createdAt || now,
      };

      if (existingVideo) {
        await ctx.db.patch(existingVideo._id, videoDoc);
        return { status: "updated", videoId: existingVideo._id };
      } else {
        const id = await ctx.db.insert("youtubeVideos", videoDoc);
        return { status: "created", videoId: id };
      }
    } catch (error) {
      console.error(`Error storing video data for ${videoId}:`, error);
      throw new Error(`Failed to store video data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

    try {
      // Check if channel already exists in youtubeChannels
      const existingChannel = await ctx.db
        .query("youtubeChannels")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("id"), channelId))
        .first();

      // Prepare channel doc for flexible schema
      const channelDoc = {
        userId,
        id: channelId,
        snippet: {
          title,
          description,
          customUrl,
          thumbnails
        },
        statistics,
        updatedAt,
        createdAt: updatedAt,
      };

      if (existingChannel) {
        await ctx.db.patch(existingChannel._id, channelDoc);
        return { status: "updated", channelId: existingChannel._id };
      } else {
        const id = await ctx.db.insert("youtubeChannels", channelDoc);
        return { status: "created", channelId: id };
      }
    } catch (error) {
      console.error(`Error storing channel data for ${channelId}:`, error);
      throw new Error(`Failed to store channel data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    // Upsert logic: patch if exists, insert if not
    const existing = await ctx.db
      .query("youtubeTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiryDate: args.expiresAt,
        scope: args.scope.join(" "),
        lastRefreshed: Date.now()
      });
    } else {
      await ctx.db.insert("youtubeTokens", {
        userId: args.userId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiryDate: args.expiresAt,
        scope: args.scope.join(" "),
        lastRefreshed: Date.now()
      });
    }
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
      // Check if analysis already exists
      const existingAnalysis = await ctx.db
        .query("youtubeData")
        .withIndex("by_user_resource", (q) => 
          q.eq("userId", userId).eq("resourceType", "video_analysis")
        )
        .filter((q) => q.eq(q.field("data.videoId"), videoId))
        .first();

      if (existingAnalysis) {
        // Update existing analysis
        await ctx.db.patch(existingAnalysis._id, {
          data: {
            id: videoId,
            videoId,
            analysisData,
          },
          timestamp,
        });
        console.log(`Updated analysis for video ${videoId} by user ${userId}`);
        return { success: true, status: "updated" };
      } else {
        // Insert new analysis
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
        console.log(`Stored new analysis for video ${videoId} by user ${userId}`);
        return { success: true, status: "created" };
      }
    } catch (error) {
      console.error('Error storing video analysis:', error);
      throw new Error(`Failed to store video analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store full YouTube profile data in appropriate tables
import { api } from "./_generated/api";

export const storeYoutubeFullProfile = mutation({
  args: {
    userId: v.string(),
    channel: v.any(),
    videos: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const { userId, channel, videos } = args;
    const timestamp = Date.now();
    try {
      // Validate channel object
      if (!channel || !channel.id) {
        throw new Error("Invalid channel data: missing required channel ID");
      }
      // Save channel using saveChannelData
      await ctx.runMutation(api.youtubeMutations.saveChannelData, {
        userId,
        channelId: channel.id,
        title: channel.snippet?.title || "",
        description: channel.snippet?.description || "",
        customUrl: channel.snippet?.customUrl || "",
        thumbnails: channel.snippet?.thumbnails || {},
        statistics: channel.statistics || {},
        updatedAt: timestamp,
      });

      // Save each video using storeVideoData
      const results = {
        processed: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
      };
      for (const video of videos) {
        results.processed++;
        const videoId = video.videoId || video.id;
        if (!videoId) {
          results.skipped++;
          continue;
        }
        const resp = await ctx.runMutation(api.youtubeMutations.storeVideoData, {
          userId,
          videoId,
          videoData: video,
        });
        if (resp.status === "created") {
          results.inserted++;
        } else if (resp.status === "updated") {
          results.updated++;
        }
      }
      return {
        channelId: channel.id,
        videoResults: results,
        status: "success",
      };
    } catch (error) {
      console.error('Error storing YouTube full profile:', error);
      throw new Error(`Failed to store YouTube profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

});


// Clean up YouTube data when disconnecting
export const disconnectYouTube = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    try {
      const results = {
        dataDeleted: 0,
        tokensDeleted: 0
      };
      
      // Delete all YouTube channel data for the user
      const youtubeChannels = await ctx.db
        .query("youtubeChannels")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      console.log(`Found ${youtubeChannels.length} YouTube channel records to delete for user ${userId}`);
      for (const channel of youtubeChannels) {
        await ctx.db.delete(channel._id);
        results.dataDeleted++;
      }

      // Delete all YouTube video data for the user
      const youtubeVideos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      console.log(`Found ${youtubeVideos.length} YouTube video records to delete for user ${userId}`);
      for (const video of youtubeVideos) {
        await ctx.db.delete(video._id);
        results.dataDeleted++;
      }

      // Delete tokens using the by_userId index
      const tokens = await ctx.db
        .query("youtubeTokens")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();

      console.log(`Found ${tokens.length} YouTube tokens to delete for user ${userId}`);
      
      for (const token of tokens) {
        await ctx.db.delete(token._id);
        results.tokensDeleted++;
      }

      console.log(`Successfully disconnected YouTube for user ${userId}. Deleted ${results.dataDeleted} data records and ${results.tokensDeleted} tokens.`);
      
      return { 
        success: true,
        results
      };
    } catch (error) {
      console.error('Error disconnecting YouTube:', error);
      throw new Error(`Failed to disconnect YouTube: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}); 