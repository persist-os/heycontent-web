// @ts-nocheck
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Status constants for consistent return values
const STATUS_SKIPPED_NO_CHANGE = "skipped_no_change";
const STATUS_UPDATED = "updated";
const STATUS_CREATED = "created";
const STATUS_SUCCESS = "success";

// Data size limits to prevent memory issues
const MAX_CAPTION_SIZE = 5 * 1024 * 1024; // 5MB per caption track
const MAX_COMMENTS_COUNT = 1000; // Max comments to store per video
const MAX_DESCRIPTION_LENGTH = 50000; // Max description length
const MAX_BULK_VIDEOS = 100; // Max videos to process in bulk operations
const LARGE_DATASET_THRESHOLD = 200; // When to warn about large datasets

/**
 * Helper function to calculate differences between old and new documents
 * Optimized for large documents with size-aware comparison
 * @param oldDoc - The existing document
 * @param newDoc - The new document to compare
 * @param excludeFields - Fields to exclude from comparison
 * @returns Object with changed fields and current values, or null if no changes
 */
function calculateDiff(oldDoc, newDoc, excludeFields = []) {
  const changedFields = [];
  const current = {};
  
  for (const key of Object.keys(newDoc)) {
    if (excludeFields.includes(key)) continue;
    
    // For large fields, use size-aware comparison
    if (key === 'captions' || key === 'comments') {
      const oldSize = JSON.stringify(oldDoc?.[key] || {}).length;
      const newSize = JSON.stringify(newDoc[key] || {}).length;
      
      // If sizes are significantly different, consider it changed
      if (Math.abs(oldSize - newSize) > 1000) {
        changedFields.push(key);
        current[key] = `Changed (${Math.round(newSize / 1024)}KB)`;
      }
    } else {
      // Standard comparison for smaller fields
      if (JSON.stringify(oldDoc?.[key]) !== JSON.stringify(newDoc[key])) {
        changedFields.push(key);
        current[key] = newDoc[key];
      }
    }
  }
  
  return changedFields.length > 0
    ? { changedFields, current }
    : null;
}

/**
 * Validate and sanitize video data for large dataset handling
 * @param videoData - Raw video data from API
 * @returns Sanitized video data with size limits applied
 */
function sanitizeVideoData(videoData: any) {
  const sanitized = { ...videoData };
  const warnings = [];

  // Limit caption size
  if (sanitized.captions?.caption_track?.text) {
    const captionSize = sanitized.captions.caption_track.text.length;
    if (captionSize > MAX_CAPTION_SIZE) {
      sanitized.captions.caption_track.text = sanitized.captions.caption_track.text.substring(0, MAX_CAPTION_SIZE);
      warnings.push(`Caption truncated from ${Math.round(captionSize / 1024)}KB to ${Math.round(MAX_CAPTION_SIZE / 1024)}KB`);
    }
  }

  // Limit comments count
  if (sanitized.comments?.comments && Array.isArray(sanitized.comments.comments)) {
    if (sanitized.comments.comments.length > MAX_COMMENTS_COUNT) {
      sanitized.comments.comments = sanitized.comments.comments.slice(0, MAX_COMMENTS_COUNT);
      warnings.push(`Comments limited to ${MAX_COMMENTS_COUNT} entries`);
    }
  }

  // Limit description length
  if (sanitized.snippet?.description && sanitized.snippet.description.length > MAX_DESCRIPTION_LENGTH) {
    sanitized.snippet.description = sanitized.snippet.description.substring(0, MAX_DESCRIPTION_LENGTH);
    warnings.push(`Description truncated to ${MAX_DESCRIPTION_LENGTH} characters`);
  }

  // Add warnings to the data
  if (warnings.length > 0) {
    sanitized._dataWarnings = warnings;
  }

  return sanitized;
}

// ===== VIDEO DATA MANAGEMENT =====

/**
 * Store or update YouTube video data with intelligent diff tracking
 * Handles large datasets with size limits and memory optimization
 * Conditionally includes captions based on existing data state
 * Tracks all changes with timestamps and change types
 */
export const storeVideoData = mutation({
  args: {
    userId: v.string(),
    videoId: v.string(),
    videoData: v.any(),
  },
  returns: v.object({
    status: v.string(),
    videoId: v.id("youtubeVideos"),
    warnings: v.optional(v.array(v.string()))
  }),
  handler: async (ctx, args) => {
    const { userId, videoId } = args;
    const now = Date.now();
    
    // Sanitize and validate data for large datasets
    const sanitizedVideoData = sanitizeVideoData(args.videoData);
    const warnings = sanitizedVideoData._dataWarnings || [];
    delete sanitizedVideoData._dataWarnings;
    
    // Find existing video
    const video = await ctx.db
      .query("youtubeVideos")
      .withIndex("by_videoId", q => q.eq("videoId", videoId))
      .filter(q => q.eq(q.field("userId"), userId))
      .first();
    
    // Determine caption inclusion strategy
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
    
    // Prepare data with conditional caption exclusion
    let patchData;
    if (shouldIncludeCaptions) {
      patchData = { ...sanitizedVideoData };
    } else {
      const { captions, ...videoDataNoCaptions } = sanitizedVideoData;
      patchData = { ...videoDataNoCaptions };
    }

    // Normalize statistics structure
    if (sanitizedVideoData.public_stats && sanitizedVideoData.public_stats.statistics) {
      patchData.statistics = sanitizedVideoData.public_stats.statistics;
    } else if (sanitizedVideoData.statistics) {
      patchData.statistics = sanitizedVideoData.statistics;
    }

    // Handle comment fetch errors
    if (
      patchData.comments &&
      typeof patchData.comments === 'object' &&
      patchData.comments.status === 'error'
    ) {
      delete patchData.comments;
    }

    // Enhanced diff logic with special handling for large data
    function cleanDiff(oldDoc, newDoc, excludeFields = []) {
      const changedFields = [];
      const current = {};
      
      for (const key of Object.keys(newDoc)) {
        if (excludeFields.includes(key)) continue;
        
        if (key === 'comments' && oldDoc?.comments && newDoc.comments) {
          // Special handling for comments: only show count changes for large datasets
          const oldComments = Array.isArray(oldDoc.comments.comments) ? oldDoc.comments.comments : [];
          const newComments = Array.isArray(newDoc.comments.comments) ? newDoc.comments.comments : [];
          
          if (oldComments.length !== newComments.length) {
            changedFields.push(key);
            current[key] = { 
              countChanged: true, 
              oldCount: oldComments.length, 
              newCount: newComments.length 
            };
          }
        } else if (key === 'captions' && oldDoc?.captions && newDoc.captions) {
          // Special handling for captions: check size rather than content
          const oldSize = JSON.stringify(oldDoc.captions).length;
          const newSize = JSON.stringify(newDoc.captions).length;
          
          if (Math.abs(oldSize - newSize) > 1000) {
            changedFields.push(key);
            current[key] = { 
              sizeChanged: true, 
              oldSize: Math.round(oldSize / 1024), 
              newSize: Math.round(newSize / 1024) 
            };
          }
        } else {
          // Standard comparison for other fields
          if (JSON.stringify(oldDoc?.[key]) !== JSON.stringify(newDoc[key])) {
            changedFields.push(key);
            current[key] = newDoc[key];
          }
        }
      }
      
      return changedFields.length > 0
        ? { changedFields, current }
        : null;
    }

    if (video) {
      // Update existing video
      const excludeFields = shouldIncludeCaptions ? [] : ["captions"];
      const diff = cleanDiff(video, patchData, excludeFields);
      if (!diff) {
        return { 
          status: STATUS_SKIPPED_NO_CHANGE, 
          videoId: video._id,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      }
      
      const newDiff = {
        changedAt: now,
        changedFields: diff.changedFields,
        current: diff.current,
        changeType: "update"
      };
      
      // Limit diff history to prevent unbounded growth
      const existingDiffs = Array.isArray(video.diffs) ? video.diffs : [];
      const diffs = [...existingDiffs.slice(-50), newDiff]; // Keep last 50 diffs
      
      await ctx.db.patch(video._id, {
        ...patchData,
        updatedAt: now,
        diffs
      });
      return { 
        status: STATUS_UPDATED, 
        videoId: video._id,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } else {
      // Create new video
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
      return { 
        status: STATUS_CREATED, 
        videoId: id,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }
  },
});

/**
 * Store video analysis data (markdown or JSON format)
 * Creates minimal video record if video doesn't exist
 * Handles large analysis documents efficiently
 */
export const storeVideoAnalysis = mutation({
  args: {
    userId: v.string(),
    videoId: v.string(),
    analysisData: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    status: v.string(),
    videoId: v.id("youtubeVideos"),
    warnings: v.optional(v.array(v.string()))
  }),
  handler: async (ctx, args) => {
    const { userId, videoId, analysisData } = args;
    const now = Date.now();
    const warnings = [];
    
    // Find existing video
    const existing = await ctx.db
      .query("youtubeVideos")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .take(100); // Limit search to prevent memory issues
    const video = existing.find(v => v.videoId === videoId);
    
    // Validate analysis data size
    let processedAnalysisData = analysisData;
    if (analysisData && typeof analysisData === 'object' && analysisData.markdown) {
      if (analysisData.markdown.length > 1024 * 1024) { // 1MB limit
        warnings.push('Analysis markdown truncated due to size limit');
        processedAnalysisData = {
          ...analysisData,
          markdown: analysisData.markdown.substring(0, 1024 * 1024)
        };
      }
    } else if (typeof analysisData === 'string' && analysisData.length > 1024 * 1024) {
      warnings.push('Analysis content truncated due to size limit');
      processedAnalysisData = analysisData.substring(0, 1024 * 1024);
    }
    
    // Determine analysis field and format
    let updateFields = {};
    let changedField = null;
    if (processedAnalysisData && typeof processedAnalysisData === 'object' && processedAnalysisData.markdown) {
      updateFields = { analysisMarkdown: processedAnalysisData.markdown };
      changedField = "analysisMarkdown";
    } else {
      updateFields = { analysis: processedAnalysisData };
      changedField = "analysis";
    }
    
    if (video) {
      // Update existing video analysis
      const diff = calculateDiff(video, updateFields);
      if (!diff) {
        return { 
          success: true, 
          status: STATUS_SKIPPED_NO_CHANGE, 
          videoId: video._id,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      }
      
      const newDiff = {
        changedAt: now,
        changedFields: [changedField],
        current: { [changedField]: "changed" },
        changeType: "analysis"
      };
      
      // Limit diff history
      const existingDiffs = Array.isArray(video.diffs) ? video.diffs : [];
      const diffs = [...existingDiffs.slice(-20), newDiff]; // Keep last 20 diffs for analysis
      
      await ctx.db.patch(video._id, {
        ...updateFields,
        updatedAt: now,
        diffs
      });
      return { 
        success: true, 
        status: STATUS_UPDATED, 
        videoId: video._id,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } else {
      // Create minimal video record with analysis
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
      return { 
        success: true, 
        status: STATUS_CREATED, 
        videoId: videoId_internal,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }
  },
});

// ===== CHANNEL DATA MANAGEMENT =====

/**
 * Save YouTube channel data with diff tracking
 * Updates existing channel or creates new one
 * Handles large channel descriptions and metadata
 */
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
    channelId: v.id("youtubeChannels"),
    warnings: v.optional(v.array(v.string()))
  }),
  handler: async (ctx, args) => {
    const { userId, channelId, title, customUrl, thumbnails, statistics, updatedAt } = args;
    let { description } = args;
    const warnings = [];
    
    // Limit description size
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      description = description.substring(0, MAX_DESCRIPTION_LENGTH);
      warnings.push(`Channel description truncated to ${MAX_DESCRIPTION_LENGTH} characters`);
    }
    
    // Find existing channel
    const existing = await ctx.db
      .query("youtubeChannels")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .collect();
    const channel = existing.find(c => c.id === channelId);
    
    // Prepare channel data
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
      // Update existing channel
      const diff = calculateDiff(channel, newChannelData);
      if (!diff) {
        return { 
          status: STATUS_SKIPPED_NO_CHANGE, 
          channelId: channel._id,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      }
      
      const newDiff = {
        changedAt: updatedAt,
        changedFields: diff.changedFields,
        current: diff.current,
        changeType: "update"
      };
      
      // Limit diff history
      const existingDiffs = Array.isArray(channel.diffs) ? channel.diffs : [];
      const diffs = [...existingDiffs.slice(-20), newDiff];
      
      await ctx.db.patch(channel._id, {
        ...newChannelData,
        diffs
      });
      return { 
        status: STATUS_UPDATED, 
        channelId: channel._id,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } else {
      // Create new channel
      const channelDoc = {
        ...newChannelData,
        createdAt: updatedAt,
        diffs: []
      };
      const id = await ctx.db.insert("youtubeChannels", channelDoc);
      return { 
        status: STATUS_CREATED, 
        channelId: id,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }
  },
});

// ===== BULK OPERATIONS =====

/**
 * Store complete YouTube profile data (channel + videos)
 * Optimized for large datasets with batching and progress tracking
 * Orchestrates saving of channel and all videos with result tracking
 */
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
      warnings: v.number(),
    }),
    status: v.string(),
    warnings: v.optional(v.array(v.string()))
  }),
  handler: async (ctx, args) => {
    const { userId, channel } = args;
    let { videos } = args;
    const timestamp = Date.now();
    let globalWarnings = [];
    
    try {
      // Validate channel data
      if (!channel || !channel.id) {
        throw new Error("Invalid channel data: missing required channel ID");
      }

      // Limit video batch size for memory management
      if (videos.length > MAX_BULK_VIDEOS) {
        globalWarnings.push(`Video batch limited to ${MAX_BULK_VIDEOS} videos (provided ${videos.length})`);
        videos = videos.slice(0, MAX_BULK_VIDEOS);
      }

      // Warn about large datasets
      if (videos.length > LARGE_DATASET_THRESHOLD) {
        globalWarnings.push(`Large dataset detected (${videos.length} videos). Consider processing in smaller batches.`);
      }
      
      // Save channel data
      const channelResult = await ctx.runMutation(api.youtubeMutations.saveChannelData, {
        userId,
        channelId: channel.id,
        title: channel.snippet?.title || "",
        description: channel.snippet?.description || "",
        customUrl: channel.snippet?.customUrl || "",
        thumbnails: channel.snippet?.thumbnails || {},
        statistics: channel.statistics || {},
        updatedAt: timestamp,
      });

      if (channelResult.warnings) {
        globalWarnings.push(...channelResult.warnings);
      }

      // Process videos in smaller batches to prevent timeout
      const BATCH_SIZE = 20;
      const results = {
        processed: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        warnings: 0,
      };
      
      for (let i = 0; i < videos.length; i += BATCH_SIZE) {
        const batch = videos.slice(i, i + BATCH_SIZE);
        
        for (const video of batch) {
          results.processed++;
          const videoId = video.videoId || video.id;
          if (!videoId) {
            results.skipped++;
            continue;
          }
          
          try {
            const resp = await ctx.runMutation(api.youtubeMutations.storeVideoData, {
              userId,
              videoId,
              videoData: video,
            });
            
            if (resp.warnings) {
              results.warnings++;
            }
            
            if (resp.status === STATUS_CREATED) {
              results.inserted++;
            } else if (resp.status === STATUS_UPDATED) {
              results.updated++;
            } else {
              results.skipped++;
            }
          } catch (error) {
            console.error(`Error processing video ${videoId}:`, error);
            results.skipped++;
          }
        }
        
        // Brief pause between batches to prevent overwhelming the system
        if (i + BATCH_SIZE < videos.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return {
        channelId: channel.id,
        videoResults: results,
        status: STATUS_SUCCESS,
        warnings: globalWarnings.length > 0 ? globalWarnings : undefined
      };
    } catch (error) {
      console.error('Error storing YouTube full profile:', error);
      throw new Error(`Failed to store YouTube profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// ===== AUTHENTICATION & TOKENS =====

/**
 * Store YouTube authentication tokens
 * Always creates new token entry for audit trail
 */
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
    // Always insert new token entry for audit trail
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

// ===== BATCH ANALYSIS =====

/**
 * Store YouTube batch analysis insights
 * Always creates new analysis entry with timestamp
 * Handles large analysis datasets
 */
export const storeYoutubeBatchAnalysis = mutation({
  args: {
    userId: v.string(),
    channelId: v.string(),
    insights: v.any(),
  },
  returns: v.object({
    status: v.string(),
    analysisId: v.id("youtubeBatchAnalysis"),
    warnings: v.optional(v.array(v.string()))
  }),
  handler: async (ctx, args) => {
    const { userId, channelId } = args;
    let { insights } = args;
    const now = Date.now();
    let warnings = [];

    try {
      // Validate insights size
      const insightsSize = JSON.stringify(insights).length;
      if (insightsSize > 2 * 1024 * 1024) { // 2MB limit
        warnings.push(`Insights data truncated due to size limit (${Math.round(insightsSize / 1024)}KB)`);
        // Truncate insights if too large (simplified truncation)
        if (typeof insights === 'object' && insights.analysis) {
          insights.analysis = insights.analysis.substring(0, 1024 * 1024);
        }
      }

      const id = await ctx.db.insert("youtubeBatchAnalysis", {
        userId,
        channelId,
        insights,
        analysisType: "batch",
        createdAt: now,
        updatedAt: now,
      });
      return { 
        status: STATUS_CREATED, 
        analysisId: id,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      console.error(`Error storing YouTube batch analysis for user ${userId}:`, error);
      throw new Error(`Failed to store YouTube batch analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Update YouTube batch analysis status for async processing
 * Tracks processing progress and completion states
 * Handles large status updates efficiently
 */
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
    analysisId: v.id("youtubeBatchAnalysis"),
    warnings: v.optional(v.array(v.string()))
  }),
  handler: async (ctx, args) => {
    const { userId, channelId, statusUpdate } = args;
    let { insights } = args;
    const now = Date.now();
    let warnings = [];

    try {
      const insertData: any = {
        userId,
        channelId,
        status: statusUpdate,
        analysisType: "batch",
        createdAt: now,
        updatedAt: now,
      };
      
      // Add insights if provided (with size validation)
      if (insights !== null && insights !== undefined) {
        const insightsSize = JSON.stringify(insights).length;
        if (insightsSize > 2 * 1024 * 1024) { // 2MB limit
          warnings.push(`Insights data truncated due to size limit`);
          // Simplified truncation for status updates
          if (typeof insights === 'string') {
            insights = insights.substring(0, 1024 * 1024);
          }
        }
        insertData.insights = insights;
      }
      
      const id = await ctx.db.insert("youtubeBatchAnalysis", insertData);
      return { 
        status: STATUS_CREATED, 
        analysisId: id,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      console.error(`Error updating YouTube batch analysis status for user ${userId}:`, error);
      throw new Error(`Failed to update YouTube batch analysis status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// ===== DATA CLEANUP =====

/**
 * Clean up all YouTube data when user disconnects
 * Removes channels, videos, analyses, and tokens with detailed logging
 * Optimized for large datasets with batched deletion
 */
export const disconnectYouTube = mutation({
  args: { userId: v.string() },
  returns: v.object({
    success: v.boolean(),
    results: v.object({
      dataDeleted: v.number(),
      tokensDeleted: v.number(),
      batchAnalysisDeleted: v.number()
    }),
    warnings: v.optional(v.array(v.string()))
  }),
  handler: async (ctx, args) => {
    const { userId } = args;
    let warnings = [];
    
    try {
      const results = {
        dataDeleted: 0,
        tokensDeleted: 0,
        batchAnalysisDeleted: 0
      };
      
      // Delete YouTube channel data
      const youtubeChannels = await ctx.db
        .query("youtubeChannels")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      
      if (youtubeChannels.length > LARGE_DATASET_THRESHOLD) {
        warnings.push(`Large channel dataset detected (${youtubeChannels.length} records). Deletion may take longer.`);
      }
      
      for (const channel of youtubeChannels) {
        await ctx.db.delete(channel._id);
        results.dataDeleted++;
      }

      // Delete YouTube video data (in batches for large datasets)
      const youtubeVideos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      
      if (youtubeVideos.length > LARGE_DATASET_THRESHOLD) {
        warnings.push(`Large video dataset detected (${youtubeVideos.length} records). Processing in batches.`);
      }
      
      // Process videos in batches to prevent timeout
      const VIDEO_BATCH_SIZE = 50;
      for (let i = 0; i < youtubeVideos.length; i += VIDEO_BATCH_SIZE) {
        const batch = youtubeVideos.slice(i, i + VIDEO_BATCH_SIZE);
        for (const video of batch) {
          await ctx.db.delete(video._id);
          results.dataDeleted++;
        }
        
        // Brief pause between batches
        if (i + VIDEO_BATCH_SIZE < youtubeVideos.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Delete batch analysis data
      const batchAnalyses = await ctx.db
        .query("youtubeBatchAnalysis")
        .withIndex("by_user_channel", (q) => q.eq("userId", userId))
        .collect();
      
      for (const analysis of batchAnalyses) {
        await ctx.db.delete(analysis._id);
        results.batchAnalysisDeleted++;
      }

      // Delete authentication tokens
      const tokens = await ctx.db
        .query("youtubeTokens")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      
      for (const token of tokens) {
        await ctx.db.delete(token._id);
        results.tokensDeleted++;
      }

      console.log(`Successfully disconnected YouTube for user ${userId}. Deleted ${results.dataDeleted} data records, ${results.tokensDeleted} tokens, and ${results.batchAnalysisDeleted} batch analyses.`);
      
      return { 
        success: true,
        results,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      console.error('Error disconnecting YouTube:', error);
      throw new Error(`Failed to disconnect YouTube: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}); 