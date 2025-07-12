import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

function calculateDiff(oldDoc, newDoc, excludeFields = []) {
  const changedFields = [];
  const current = {};
  for (const key of Object.keys(newDoc)) {
    if (excludeFields.includes(key)) continue;
    if (JSON.stringify(oldDoc?.[key]) !== JSON.stringify(newDoc[key])) {
      changedFields.push(key);
      current[key] = newDoc[key];
    }
  }
  return changedFields.length > 0
    ? { changedFields, current }
    : null;
}

// Store video data - update or insert, conditionally store captions, track diffs
export const storeVideoData = mutation({
  args: {
    userId: v.string(),
    videoId: v.string(),
    videoData: v.any(),
  },
  returns: v.object({
    status: v.string(),
    videoId: v.id("youtubeVideos")
  }),
  handler: async (ctx, args) => {
    const { userId, videoId, videoData } = args;
    const now = Date.now();
    // Find existing video
    const video = await ctx.db
      .query("youtubeVideos")
      .withIndex("by_videoId", q => q.eq("videoId", videoId))
      .filter(q => q.eq(q.field("userId"), userId))
      .first();
    
    // Determine if we should include captions
    let shouldIncludeCaptions = false;
    if (!video) {
      // New video - include captions if provided
      shouldIncludeCaptions = true;
    } else if (video && !video.captions) {
      // Existing video without captions - include captions if provided
      shouldIncludeCaptions = true;
    } else if (video && video.captions && video.captions.status === 'error') {
      // Existing video with failed captions - include captions if provided
      shouldIncludeCaptions = true;
    }
    
    // Conditionally exclude captions from update/diff
    let patchData;
    if (shouldIncludeCaptions) {
      patchData = { ...videoData };
    } else {
      const { captions, ...videoDataNoCaptions } = videoData;
      patchData = { ...videoDataNoCaptions };
    }

    // --- Always update statistics from backend refresh ---
    // Always assign statistics under 'statistics', not under 'public_stats'
    if (videoData.public_stats && videoData.public_stats.statistics) {
      patchData.statistics = videoData.public_stats.statistics;
    } else if (videoData.statistics) {
      patchData.statistics = videoData.statistics;
    }

    // --- Only write comments if fetch was successful ---
    if (
      patchData.comments &&
      typeof patchData.comments === 'object' &&
      patchData.comments.status === 'error'
    ) {
      // Remove comments field if fetch failed
      delete patchData.comments;
    }
    // Do NOT overwrite statistics.comments with array length

    // --- Clean diff logic: only changed field names and current values ---
    function cleanDiff(oldDoc, newDoc, excludeFields = []) {
      const changedFields = [];
      const current = {};
      for (const key of Object.keys(newDoc)) {
        if (excludeFields.includes(key)) continue;
        if (JSON.stringify(oldDoc?.[key]) !== JSON.stringify(newDoc[key])) {
          changedFields.push(key);
          // Special handling for comments: only show new/changed comments
          if (key === 'comments' && oldDoc?.comments && newDoc.comments) {
            // Find new/changed comments by id
            const oldComments = Array.isArray(oldDoc.comments.comments) ? oldDoc.comments.comments : [];
            const newComments = Array.isArray(newDoc.comments.comments) ? newDoc.comments.comments : [];
            const oldIds = new Set(oldComments.map(c => c.id));
            const added = newComments.filter(c => !oldIds.has(c.id));
            current[key] = { added, count: newComments.length };
          } else {
            current[key] = newDoc[key];
          }
        }
      }
      return changedFields.length > 0
        ? { changedFields, current }
        : null;
    }

    if (video) {
      // Calculate clean diff (excluding captions only if we're not including them)
      const excludeFields = shouldIncludeCaptions ? [] : ["captions"];
      const diff = cleanDiff(video, patchData, excludeFields);
      if (!diff) {
        // No changes to store
        return { status: "skipped_no_change", videoId: video._id };
      }
      // Update doc, append clean diff
      const newDiff = {
        changedAt: now,
        changedFields: diff.changedFields,
        current: diff.current,
        changeType: "update"
      };
      const diffs = Array.isArray(video.diffs) ? [...video.diffs, newDiff] : [newDiff];
      await ctx.db.patch(video._id, {
        ...patchData,
        updatedAt: now,
        diffs
      });
      return { status: "updated", videoId: video._id };
    } else {
      // Insert new doc, initialize diffs as []
      const videoDoc = {
        userId,
        id: videoId,
        videoId,
        ...patchData,
        updatedAt: now,
        createdAt: now,
        diffs: []
      };
      const id = await ctx.db.insert("youtubeVideos", videoDoc);
      return { status: "created", videoId: id };
    }
  },
});

// Save YouTube channel data - update or insert, never update captions, track diffs
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
  returns: v.object({
    status: v.string(),
    channelId: v.id("youtubeChannels")
  }),
  handler: async (ctx, args) => {
    const { userId, channelId, title, description, customUrl, thumbnails, statistics, updatedAt } = args;
    // Find existing channel
    const existing = await ctx.db
      .query("youtubeChannels")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .collect();
    const channel = existing.find(c => c.id === channelId);
    // Prepare new channel data (no captions field in channel)
    const newChannelData = {
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
    };
    if (channel) {
      const diff = calculateDiff(channel, newChannelData);
      if (!diff) {
        return { status: "skipped_no_change", channelId: channel._id };
      }
      const newDiff = {
        changedAt: updatedAt,
        changedFields: diff.changedFields,
        current: diff.current,
        changeType: "update"
      };
      const diffs = Array.isArray(channel.diffs) ? [...channel.diffs, newDiff] : [newDiff];
      await ctx.db.patch(channel._id, {
        ...newChannelData,
        diffs
      });
      return { status: "updated", channelId: channel._id };
    } else {
      const channelDoc = {
        ...newChannelData,
        createdAt: updatedAt,
        diffs: []
      };
      const id = await ctx.db.insert("youtubeChannels", channelDoc);
      return { status: "created", channelId: id };
    }
  },
});

// Store video analysis data - update or insert, never update captions, track diffs
export const storeVideoAnalysis = mutation({
  args: {
    userId: v.string(),
    videoId: v.string(),
    analysisData: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    status: v.string(),
    videoId: v.id("youtubeVideos")
  }),
  handler: async (ctx, args) => {
    const { userId, videoId, analysisData } = args;
    const now = Date.now();
    // Find existing video
    const existing = await ctx.db
      .query("youtubeVideos")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .collect();
    const video = existing.find(v => v.videoId === videoId);
    // Only update analysis/analysisMarkdown, never captions
    let updateFields = {};
    let changedField = null;
    if (analysisData && typeof analysisData === 'object' && analysisData.markdown) {
      updateFields = { analysisMarkdown: analysisData.markdown };
      changedField = "analysisMarkdown";
    } else {
      updateFields = { analysis: analysisData };
      changedField = "analysis";
    }
    if (video) {
      // Calculate diff for analysis fields only, but do not store full content
      const diff = calculateDiff(video, updateFields);
      if (!diff) {
        return { success: true, status: "skipped_no_change", videoId: video._id };
      }
      // Only log that the analysis field changed, not the full content
      const newDiff = {
        changedAt: now,
        changedFields: [changedField],
        current: { [changedField]: "changed" },
        changeType: "analysis"
      };
      const diffs = Array.isArray(video.diffs) ? [...video.diffs, newDiff] : [newDiff];
      await ctx.db.patch(video._id, {
        ...updateFields,
        updatedAt: now,
        diffs
      });
      return { success: true, status: "updated", videoId: video._id };
    } else {
      // Insert new doc, initialize diffs as []
      const videoDoc: any = {
        userId,
        id: videoId,
        videoId,
        createdAt: now,
        updatedAt: now,
        snippet: {
          title: "YouTube Video",
          description: "",
          published_at: new Date(now).toISOString(),
          thumbnails: {}
        },
        statistics: {
          views: 0,
          likes: 0,
          comments: 0
        },
        ...updateFields,
        diffs: []
      };
      const videoId_internal = await ctx.db.insert("youtubeVideos", videoDoc);
      return { success: true, status: "created", videoId: videoId_internal };
    }
  },
});

// Store channel analysis data - update or insert, track diffs
export const storeChannelAnalysis = mutation({
  args: {
    userId: v.string(),
    channelId: v.string(),
    analysisData: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    status: v.string(),
    channelId: v.id("youtubeChannels"),
    timestamp: v.number()
  }),
  handler: async (ctx, args) => {
    const { userId, channelId, analysisData } = args;
    const now = Date.now();
    // Find existing channel
    const existing = await ctx.db
      .query("youtubeChannels")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .collect();
    const channel = existing.find(c => c.id === channelId);
    const updateFields = { analysis: analysisData };
    if (channel) {
      const diff = calculateDiff(channel, updateFields);
      if (!diff) {
        return { success: true, status: "skipped_no_change", channelId: channel._id, timestamp: now };
      }
      // Only log that the analysis field changed, not the full content
      const newDiff = {
        changedAt: now,
        changedFields: ["analysis"],
        current: { analysis: "changed" },
        changeType: "analysis"
      };
      const diffs = Array.isArray(channel.diffs) ? [...channel.diffs, newDiff] : [newDiff];
      await ctx.db.patch(channel._id, {
        ...updateFields,
        updatedAt: now,
        diffs
      });
      return { success: true, status: "updated", channelId: channel._id, timestamp: now };
    } else {
      const channelDoc = {
        userId,
        id: channelId,
        snippet: {
          title: "YouTube Channel",
          description: "",
          customUrl: "",
          thumbnails: {}
        },
        statistics: {
          viewCount: "0",
          subscriberCount: "0",
          hiddenSubscriberCount: false,
          videoCount: "0"
        },
        analysis: analysisData,
        createdAt: now,
        updatedAt: now,
        diffs: []
      };
      const id = await ctx.db.insert("youtubeChannels", channelDoc);
      return { success: true, status: "created", channelId: id, timestamp: now };
    }
  },
});

// Store full YouTube profile data in appropriate tables
export const storeYoutubeFullProfile = mutation({
  args: {
    userId: v.string(),
    channel: v.any(),
    videos: v.array(v.any()),
  },
  returns: v.object({
    channelId: v.string(),
    videoResults: v.object({
      processed: v.number(),
      inserted: v.number(),
      updated: v.number(),
      skipped: v.number(),
    }),
    status: v.string(),
  }),
  handler: async (ctx, args) => {
    const { userId, channel, videos } = args;
    const timestamp = Date.now();
    try {
      // Validate channel object
      if (!channel || !channel.id) {
        throw new Error("Invalid channel data: missing required channel ID");
      }
      // Save channel using saveChannelData (will update or insert)
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

      // Save each video using storeVideoData (will update or insert)
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
        } else {
          results.skipped++;
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
  returns: v.null(),
  handler: async (ctx, args) => {
          // Always insert new token entry - never overwrite
      await ctx.db.insert("youtubeTokens", {
        userId: args.userId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiryDate: args.expiresAt,
        scope: args.scope.join(" "),
        lastRefreshed: Date.now(),
      });
    return null;
  },
});

// Store YouTube batch analysis insights - always insert new entries
export const storeYoutubeBatchAnalysis = mutation({
  args: {
    userId: v.string(),
    channelId: v.string(),
    insights: v.any(),
  },
  returns: v.object({
    status: v.string(),
    analysisId: v.id("youtubeBatchAnalysis")
  }),
  handler: async (ctx, args) => {
    const { userId, channelId, insights } = args;
    const now = Date.now();

    try {
              // Always insert new batch analysis entry
        const id = await ctx.db.insert("youtubeBatchAnalysis", {
          userId,
          channelId,
          insights,
          analysisType: "batch",
          createdAt: now,
          updatedAt: now,
        });
      return { status: "created", analysisId: id };
    } catch (error) {
      console.error(`Error storing YouTube batch analysis for user ${userId}:`, error);
      throw new Error(`Failed to store YouTube batch analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Update YouTube batch analysis status for the async task system - always insert new entries
export const updateYoutubeBatchAnalysisStatus = mutation({
  args: {
    userId: v.string(),
    channelId: v.string(),
    statusUpdate: v.object({
      status: v.string(),
      task_id: v.string(),
      started_at: v.optional(v.string()),
      completed_at: v.optional(v.string()),
      progress: v.optional(v.number()),
      error: v.optional(v.string()),
    }),
    insights: v.optional(v.any()),
  },
  returns: v.object({
    status: v.string(),
    analysisId: v.id("youtubeBatchAnalysis")
  }),
  handler: async (ctx, args) => {
    const { userId, channelId, statusUpdate, insights } = args;
    const now = Date.now();

    try {
              // Always insert new batch analysis with status
        const insertData: any = {
          userId,
          channelId,
          status: statusUpdate,
          analysisType: "batch",
          createdAt: now,
          updatedAt: now,
        };
      
      // Add insights if provided
      if (insights !== null && insights !== undefined) {
        insertData.insights = insights;
      }
      
      const id = await ctx.db.insert("youtubeBatchAnalysis", insertData);
      return { status: "created", analysisId: id };
    } catch (error) {
      console.error(`Error updating YouTube batch analysis status for user ${userId}:`, error);
      throw new Error(`Failed to update YouTube batch analysis status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Clean up YouTube data when disconnecting
export const disconnectYouTube = mutation({
  args: { userId: v.string() },
  returns: v.object({
    success: v.boolean(),
    results: v.object({
      dataDeleted: v.number(),
      tokensDeleted: v.number()
    })
  }),
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

      // Delete all YouTube video data for the user (including analysis)
      const youtubeVideos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      console.log(`Found ${youtubeVideos.length} YouTube video records (including analyses) to delete for user ${userId}`);
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