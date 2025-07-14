import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

// Default limits for preventing memory issues
const DEFAULT_VIDEO_LIMIT = 100;
const DEFAULT_CONTENT_HUB_LIMIT = 3;
const MAX_QUERY_LIMIT = 500;

/**
 * Helper function to extract the best available thumbnail URL from YouTube video data
 * @param video - YouTube video object containing thumbnail data
 * @returns Best quality thumbnail URL or empty string
 */
function getThumbnailUrl(video: any): string {
  const thumbnails = video.snippet?.thumbnails;
  if (!thumbnails) return '';
  
  // Prefer higher quality thumbnails
  if (thumbnails.high) return thumbnails.high;
  if (thumbnails.maxres) return thumbnails.maxres;
  if (thumbnails.standard) return thumbnails.standard;
  if (thumbnails.medium) return thumbnails.medium;
  if (thumbnails.default) return thumbnails.default;
  
  // Fallback: check if thumbnails is a string itself
  if (typeof thumbnails === 'string') return thumbnails;
  
  return '';
}

/**
 * Efficiently deduplicate videos by keeping only the most recent version
 * Works with limited datasets for better performance
 * @param videos - Array of video documents
 * @returns Deduplicated array with most recent versions only
 */
function deduplicateVideos(videos: any[]): any[] {
  const videoMap = new Map();
  for (const video of videos) {
    const videoId = video.videoId || video.id;
    if (!videoId) continue;
    
    const existing = videoMap.get(videoId);
    if (!existing || (video.updatedAt || video._creationTime) > (existing.updatedAt || existing._creationTime)) {
      videoMap.set(videoId, video);
    }
  }
  return Array.from(videoMap.values());
}

// ===== CHANNEL DATA QUERIES =====

/**
 * Get the most recent YouTube channel data for a user
 * Returns null if no channel data exists
 */
export const getYouTubeChannelData = query({
  args: { userId: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    try {
      const channelData = await ctx.db
        .query("youtubeChannels")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc") // Get most recent first
        .first();

      return channelData || null;
    } catch (error) {
      console.error('Error getting YouTube channel data:', error);
      throw new Error(`Failed to get YouTube channel data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Get YouTube channel by ID for collision detection
 * Used to prevent multiple users from connecting the same channel
 */
export const getYouTubeChannelById = query({
  args: { channelId: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    try {
      const channel = await ctx.db
        .query("youtubeChannels")
        .withIndex("by_channelId", q => q.eq("id", args.channelId))
        .order("desc") // Most recent first
        .first();
      
      return channel;
    } catch (error) {
      console.error('Error checking YouTube channel collision:', error);
      // Return null to allow connection in case of error
      return null;
    }
  },
});

// ===== VIDEO DATA QUERIES (SCALABLE) =====

/**
 * Get paginated YouTube videos for a user with efficient deduplication
 * Handles large datasets with proper pagination and limits
 */
export const getYouTubeVideos = query({
  args: { 
    userId: v.string(), 
    limit: v.optional(v.number()),
    paginationOpts: v.optional(paginationOptsValidator)
  },
  returns: v.object({
    videos: v.array(v.any()),
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null())
  }),
  handler: async (ctx, args) => {
    try {
      // Enforce reasonable limits to prevent memory issues
      const effectiveLimit = Math.min(args.limit || DEFAULT_VIDEO_LIMIT, MAX_QUERY_LIMIT);
      
      const queryBuilder = ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc"); // Most recent first

      // Handle pagination if provided
      if (args.paginationOpts) {
        const paginatedResults = await queryBuilder.paginate(args.paginationOpts);
        const deduplicatedVideos = deduplicateVideos(paginatedResults.page);
        
        return {
          videos: deduplicatedVideos, // For backward compatibility
          page: deduplicatedVideos,
          isDone: paginatedResults.isDone,
          continueCursor: paginatedResults.continueCursor
        };
      } else {
        // Non-paginated query with limit
        const videos = await queryBuilder.take(effectiveLimit);
        const deduplicatedVideos = deduplicateVideos(videos);
        
        return {
          videos: deduplicatedVideos, // For backward compatibility
          page: deduplicatedVideos,
          isDone: videos.length < effectiveLimit,
          continueCursor: null
        };
      }
    } catch (error) {
      console.error('Error getting YouTube videos:', error);
      throw new Error(`Failed to get YouTube videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Get videos for a specific channel with pagination support
 * Optimized for large channel datasets
 */
export const getVideosByChannel = query({
  args: { 
    userId: v.string(), 
    channelId: v.string(), 
    limit: v.optional(v.number()),
    paginationOpts: v.optional(paginationOptsValidator)
  },
  returns: v.object({
    videos: v.array(v.any()),
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null())
  }),
  handler: async (ctx, args) => {
    try {
      const effectiveLimit = Math.min(args.limit || DEFAULT_VIDEO_LIMIT, MAX_QUERY_LIMIT);
      
      const queryBuilder = ctx.db
        .query("youtubeVideos")
        .withIndex("by_channelId", (q) => q.eq("snippet.channel.id", args.channelId))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc");

      if (args.paginationOpts) {
        const paginatedResults = await queryBuilder.paginate(args.paginationOpts);
        const deduplicatedVideos = deduplicateVideos(paginatedResults.page);
        
        return {
          videos: deduplicatedVideos,
          page: deduplicatedVideos,
          isDone: paginatedResults.isDone,
          continueCursor: paginatedResults.continueCursor
        };
      } else {
        const videos = await queryBuilder.take(effectiveLimit);
        const deduplicatedVideos = deduplicateVideos(videos);
        
        return {
          videos: deduplicatedVideos,
          page: deduplicatedVideos,
          isDone: videos.length < effectiveLimit,
          continueCursor: null
        };
      }
    } catch (error) {
      console.error('Error getting channel videos:', error);
      throw new Error(`Failed to get channel videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Get YouTube videos for a user with full Convex document access
 * Returns videos with complete data for chat context
 */
export const listUserYouTubeVideos = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number())
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    try {
      // Use reasonable limit to prevent memory issues
      const effectiveLimit = Math.min(args.limit || DEFAULT_VIDEO_LIMIT, MAX_QUERY_LIMIT);
      
      // Fetch limited set of recent videos instead of all videos
      const recentVideos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(effectiveLimit * 2); // Get extra to account for deduplication
      
      const uniqueVideos = deduplicateVideos(recentVideos).slice(0, effectiveLimit);
      
      // Transform videos to match the YouTubeContentItem format for UI
      // BUT include the full Convex document as convexData
      return uniqueVideos.map(video => ({
        id: video.videoId || video.id || '',
        platform: 'youtube' as const,
        publishedAt: video.snippet?.published_at || (video.createdAt ? new Date(video.createdAt).toISOString() : new Date().toISOString()),
        content: {
          title: video.snippet?.title || 'Untitled Video',
          description: video.snippet?.description || '',
          thumbnailUrl: getThumbnailUrl(video),
          videoUrl: video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
          channelTitle: video.snippet?.channel?.title || '',
          channelId: video.snippet?.channel?.id || '',
        },
        metrics: {
          views: Number(video.statistics?.views || 0),
          likes: Number(video.statistics?.likes || 0),
          dislikes: Number(video.statistics?.dislikes || 0),
          comments: Number(video.statistics?.comments || 0),
        },
        // Include the full Convex document for complete data access (like Instagram and Gmail)
        convexData: video,
      }));
    } catch (error) {
      console.error('Error listing YouTube videos:', error);
      throw new Error(`Failed to list YouTube videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Get full video details including analysis data
 * Optimized for single video lookups
 */
export const getFullVideoDetails = query({
  args: { userId: v.string(), videoId: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    try {
      const video = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc") // Most recent first
        .first();

      return video;
    } catch (error) {
      console.error('Error getting full video details:', error);
      throw new Error(`Failed to get full video details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Get recent YouTube videos with analysis for content hub
 * Optimized for dashboard display with small, fixed limit
 */
export const getRecentVideosWithAnalysis = query({
  args: { userId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    try {
      // Use a small, fixed limit for dashboard performance
      const videos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(DEFAULT_CONTENT_HUB_LIMIT * 3); // Get extra for deduplication

      const uniqueVideos = deduplicateVideos(videos).slice(0, DEFAULT_CONTENT_HUB_LIMIT);

      // Return videos with their analysis data
      return uniqueVideos.map(video => ({
        id: video.videoId,
        title: video.snippet?.title || 'Untitled Video',
        description: video.snippet?.description || '',
        publishedAt: video.snippet?.published_at || video.createdAt,
        thumbnail: video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.medium || '',
        statistics: video.statistics || {},
        analysis: video.analysis || null,
        analysisMarkdown: video.analysisMarkdown || null
      }));
    } catch (error) {
      console.error('Error getting recent videos with analysis:', error);
      return [];
    }
  },
});

// ===== ANALYSIS DATA QUERIES =====

/**
 * Get analysis for a specific YouTube video
 * Optimized single video lookup
 */
export const getVideoAnalysis = query({
  args: { 
    userId: v.string(),
    videoId: v.string() 
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const { userId, videoId } = args;
    try {
      // Efficient single video lookup
      const video = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_videoId", (q) => q.eq("videoId", videoId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .order("desc") // Most recent first
        .first();

      if (!video || (!video.analysisMarkdown && !video.analysis)) {
        return null;
      }
      
      // Prepare the analysis object - prefer markdown over JSON
      let analysisToReturn;
      if (video.analysisMarkdown) {
        analysisToReturn = video.analysisMarkdown;
      } else if (video.analysis) {
        analysisToReturn = video.analysis;
      }

      return {
        _id: video._id,
        videoId: video.videoId,
        userId: video.userId,
        analysis: analysisToReturn,
        analysisMarkdown: video.analysisMarkdown,
        updatedAt: video.updatedAt || video._creationTime
      };
    } catch (error) {
      console.error('Error retrieving video analysis:', error);
      return null;
    }
  },
});

/**
 * Get video analyses for a user with pagination support
 * Optimized for large analysis datasets
 */
export const getVideoAnalyses = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
    paginationOpts: v.optional(paginationOptsValidator)
  },
  returns: v.object({
    analyses: v.array(v.any()),
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null())
  }),
  handler: async (ctx, args) => {
    try {
      const effectiveLimit = Math.min(args.limit || DEFAULT_VIDEO_LIMIT, MAX_QUERY_LIMIT);
      
      const queryBuilder = ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => q.or(
          q.neq(q.field("analysis"), null),
          q.neq(q.field("analysisMarkdown"), null)
        ))
        .order("desc");

      let results;
      if (args.paginationOpts) {
        results = await queryBuilder.paginate(args.paginationOpts);
      } else {
        const videos = await queryBuilder.take(effectiveLimit);
        results = {
          page: videos,
          isDone: videos.length < effectiveLimit,
          continueCursor: null
        };
      }

      const deduplicatedVideos = deduplicateVideos(results.page);

      // Transform videos to include only necessary analysis data
      const transformedAnalyses = deduplicatedVideos.map(video => ({
        id: video.videoId,
        title: video.snippet?.title || 'Untitled Video',
        publishedAt: video.snippet?.published_at || video.createdAt,
        analysis: video.analysis,
        analysisMarkdown: video.analysisMarkdown,
        statistics: video.statistics || {}
      }));

      return {
        analyses: transformedAnalyses, // For backward compatibility
        page: transformedAnalyses,
        isDone: results.isDone,
        continueCursor: results.continueCursor
      };
    } catch (error) {
      console.error('Error getting video analyses:', error);
      throw new Error(`Failed to get video analyses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Get YouTube batch analysis insights for a specific channel
 * Optimized single analysis lookup
 */
export const getYoutubeBatchAnalysis = query({
  args: {
    userId: v.string(),
    channelId: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    try {
      // Validate inputs
      if (!args.userId?.trim() || !args.channelId?.trim()) {
        return null;
      }
      
      const analysis = await ctx.db
        .query("youtubeBatchAnalysis")
        .withIndex("by_user_channel", q => 
          q.eq("userId", args.userId)
           .eq("channelId", args.channelId)
        )
        .order("desc") // Most recent first
        .first();

      if (!analysis) {
        return null;
      }

      return {
        _id: analysis._id,
        userId: analysis.userId,
        channelId: analysis.channelId,
        insights: analysis.insights,
        status: analysis.status,
        updatedAt: analysis.updatedAt || analysis._creationTime
      };
    } catch (error) {
      console.error("Error fetching YouTube batch analysis:", error);
      return null;
    }
  },
});

// ===== AUTHENTICATION & TOKENS =====

/**
 * Get YouTube authentication tokens for a user
 * Returns the most recent token entry only
 */
export const getYouTubeTokens = query({
  args: { userId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    try {
      // Get most recent token for the user
      const token = await ctx.db
        .query("youtubeTokens")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc") // Most recent first
        .first();
      
      return token ? [token] : [];
    } catch (error) {
      console.error('Error getting YouTube tokens:', error);
      throw new Error(`Failed to get YouTube tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// ===== PERFORMANCE & MONITORING =====

/**
 * Get video count and basic stats for monitoring large datasets
 * Used for performance monitoring and user data insights
 */
export const getVideoDataStats = query({
  args: { userId: v.string() },
  returns: v.object({
    totalVideos: v.number(),
    uniqueVideos: v.number(),
    hasLargeDataset: v.boolean(),
    recommendPagination: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      // Get total count (limited to prevent performance issues)
      const videos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(1000); // Limit to prevent memory issues

      const totalVideos = videos.length;
      const uniqueVideos = deduplicateVideos(videos).length;
      const hasLargeDataset = totalVideos > 200;
      const recommendPagination = totalVideos > 100;

      return {
        totalVideos,
        uniqueVideos,
        hasLargeDataset,
        recommendPagination
      };
    } catch (error) {
      console.error('Error getting video stats:', error);
      return {
        totalVideos: 0,
        uniqueVideos: 0,
        hasLargeDataset: false,
        recommendPagination: false
      };
    }
  },
});
