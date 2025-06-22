import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Helper function to extract thumbnail URL from YouTube video data
function getThumbnailUrl(video: any): string {
  // Check each possible thumbnail location in order of preference
  const thumbnails = video.snippet?.thumbnails;
  if (!thumbnails) return '';
  
  // Based on your data format, thumbnails are direct strings, not objects with .url property
  // Try high quality first
  if (thumbnails.high) return thumbnails.high;
  
  // Try maxres quality
  if (thumbnails.maxres) return thumbnails.maxres;
  
  // Try standard quality
  if (thumbnails.standard) return thumbnails.standard;
  
  // Try medium quality
  if (thumbnails.medium) return thumbnails.medium;
  
  // Try default quality
  if (thumbnails.default) return thumbnails.default;
  
  // Last resort: check if thumbnails is a string itself
  if (typeof thumbnails === 'string') return thumbnails;
  
  return '';
}

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

// Get YouTube channel data for a user
export const getYouTubeChannelData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const channelData = await ctx.db
        .query("youtubeChannels")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();

      if (!channelData) {
        return null;
      }
      return channelData;
    } catch (error) {
      console.error('Error getting YouTube channel data:', error);
      throw new Error(`Failed to get YouTube channel data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get YouTube videos for a user
export const getYouTubeVideos = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    try {
      const query = ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId));
      
      // Apply sorting by published date (newest first)
      const sortedQuery = query.order("desc");
      
      // Apply limit if provided
      const videos = await (args.limit 
        ? sortedQuery.take(args.limit) 
        : sortedQuery.collect());

      return videos;
    } catch (error) {
      console.error('Error getting YouTube videos:', error);
      throw new Error(`Failed to get YouTube videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// List YouTube videos for content analytics page - compatible with UI components
export const listUserYouTubeVideos = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Fetch videos from the youtubeVideos table
      const videos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
      
      // Transform videos to match the YouTubeContentItem format for UI
      return videos.map(video => ({
        id: video.videoId || video.id || '',
        platform: 'youtube' as const, // Use const assertion to ensure this is a literal type
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
          watchTimeMinutes: 0, // Not available in standard YouTube API data
          averageViewDurationSeconds: 0, // Not available in standard YouTube API data
        }
      }));
    } catch (error) {
      console.error('Error listing YouTube videos:', error);
      throw new Error(`Failed to list YouTube videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
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


// Get specific video data by videoId
export const getVideoById = query({
  args: { userId: v.string(), videoId: v.string() },
  handler: async (ctx, args) => {
    try {
      const video = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();

      return video;
    } catch (error) {
      console.error('Error getting video data:', error);
      throw new Error(`Failed to get video data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get videos for a specific channel
export const getVideosByChannel = query({
  args: { userId: v.string(), channelId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    try {
      const query = ctx.db
        .query("youtubeVideos")
        .withIndex("by_channelId", (q) => q.eq("snippet.channel.id", args.channelId))
        .filter((q) => q.eq(q.field("userId"), args.userId));
      
      // Sort by published date
      const sortedQuery = query.order("desc");
      
      // Apply limit if provided
      const videos = await (args.limit 
        ? sortedQuery.take(args.limit) 
        : sortedQuery.collect());

      return videos;
    } catch (error) {
      console.error('Error getting channel videos:', error);
      throw new Error(`Failed to get channel videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get analysis for a specific YouTube video
export const getVideoAnalysis = query({
  args: { 
    userId: v.string(),
    videoId: v.string() 
  },
  handler: async (ctx, args) => {
    const { userId, videoId } = args;
    try {
      console.log('[getVideoAnalysis] Querying for videoId:', videoId, 'userId:', userId);
      // Find the video with the given videoId and userId
      const video = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_videoId", (q) => q.eq("videoId", videoId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();

      if (!video) {
        console.log(`[getVideoAnalysis] No video found for videoId=${videoId} and userId=${userId}`);
        return null;
      }
      console.log('[getVideoAnalysis] Video object found:', {
        videoId: video.videoId,
        userId: video.userId,
        _id: video._id,
        hasAnalysisMarkdown: !!video.analysisMarkdown,
        hasAnalysis: !!video.analysis,
      });
      if (video.analysisMarkdown || video.analysis) {
        console.log(`[getVideoAnalysis] Returning analysis for videoId=${videoId}`);

        // Prepare the analysis object - prefer markdown over JSON
        let analysisToReturn;
        if (video.analysisMarkdown) {
          // Return markdown as a string directly
          analysisToReturn = video.analysisMarkdown;
          console.log(`[getVideoAnalysis] Returning markdown analysis for videoId=${videoId}`);
        } else if (video.analysis) {
          // Return JSON analysis
          analysisToReturn = video.analysis;
          console.log(`[getVideoAnalysis] Returning JSON analysis for videoId=${videoId}`);
        }

        return {
          _id: video._id,
          videoId: video.videoId,
          userId: video.userId,
          analysis: analysisToReturn,
          analysisMarkdown: video.analysisMarkdown,
          updatedAt: video.updatedAt || video._creationTime
        };
      }

      console.log(`[getVideoAnalysis] No analysis found for videoId=${videoId}`);
      return null;
    } catch (error) {
      console.error('Error retrieving video analysis:', error);
      return null;
    }
  },
});

// Get videos statistics summary for a user
export const getVideoStatsSummary = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const videos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();

      // Calculate aggregated stats
      const totalViews = videos.reduce((sum, video) => sum + (video.statistics?.views || 0), 0);
      const totalLikes = videos.reduce((sum, video) => sum + (video.statistics?.likes || 0), 0);
      const totalComments = videos.reduce((sum, video) => sum + (video.statistics?.comments || 0), 0);
      const videoCount = videos.length;

      return {
        totalViews,
        totalLikes,
        totalComments,
        videoCount,
        averageViewsPerVideo: videoCount > 0 ? totalViews / videoCount : 0,
        videos: videos
          .sort((a, b) => new Date(b.snippet?.published_at || '').getTime() - new Date(a.snippet?.published_at || '').getTime())
          .slice(0, 5), // Return 5 most recent videos
      };
    } catch (error) {
      console.error('Error getting video stats summary:', error);
      throw new Error(`Failed to get video stats summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get analysis for a specific YouTube channel
export const getChannelAnalysis = query({
  args: {
    userId: v.string(),
    channelId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const channel = await ctx.db
        .query("youtubeChannels")
        .withIndex("by_channelId", (q) => q.eq("id", args.channelId))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();

      if (!channel) {
        return null;
      }

      return {
        _id: channel._id,
        userId: channel.userId,
        channelId: channel.id,
        analysis: channel.analysis,
        updatedAt: channel.updatedAt || channel._creationTime
      };
    } catch (error) {
      console.error("Error fetching channel analysis:", error);
      throw new Error("Failed to fetch channel analysis");
    }
  },
});

// Get all video analyses for a user
export const getVideoAnalyses = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const videos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => q.neq(q.field("analysis"), null))
        .order("desc")
        .collect();

      // Transform videos to include only necessary analysis data
      return videos.map(video => ({
        id: video.videoId,
        title: video.snippet?.title || 'Untitled Video',
        publishedAt: video.snippet?.published_at || video.createdAt,
        analysis: video.analysis,
        statistics: video.statistics || {}
      }));
    } catch (error) {
      console.error('Error getting video analyses:', error);
      throw new Error(`Failed to get video analyses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Query: Get full video details by userId and videoId, including analysis
export const getFullVideoDetails = query({
  args: { userId: v.string(), videoId: v.string() },
  handler: async (ctx, args) => {
    try {
      const video = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();

      if (!video) return null;
      // Return the full video object, including any analysis fields
      return video;
    } catch (error) {
      console.error('Error getting full video details:', error);
      throw new Error(`Failed to get full video details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get YouTube channel by channel ID (for collision detection)
export const getYouTubeChannelById = query({
  args: { channelId: v.string() },
  handler: async (ctx, args) => {
    try {
      console.log('Checking collision for YouTube channel ID:', args.channelId);
      
      const channel = await ctx.db
        .query("youtubeChannels")
        .withIndex("by_channelId", q => q.eq("id", args.channelId))
        .first();
      
      console.log('Collision check result:', channel ? {
        userId: channel.userId,
        channelTitle: channel.snippet?.title,
        channelId: channel.id
      } : 'No collision found');
      
      return channel;
    } catch (error) {
      console.error('Error checking YouTube channel collision:', error);
      // Return null to allow connection in case of error
      return null;
    }
  },
});

// Get 3 most recent YouTube videos with analysis for content hub
export const getRecentVideosWithAnalysis = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Get 3 most recent videos
      const videos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(3);

      // Return videos with their analysis data
      const videosWithAnalysis = videos.map(video => ({
        id: video.videoId,
        title: video.snippet?.title || 'Untitled Video',
        description: video.snippet?.description || '',
        publishedAt: video.snippet?.published_at || video.createdAt,
        thumbnail: video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.medium || '',
        statistics: video.statistics || {},
        analysis: video.analysis || null,
        analysisMarkdown: video.analysisMarkdown || null
      }));

      console.log(`[getRecentVideosWithAnalysis] Found ${videos.length} videos for user ${args.userId}`);
      return videosWithAnalysis;
    } catch (error) {
      console.error('Error getting recent videos with analysis:', error);
      return [];
    }
  },
});

// Get YouTube batch analysis insights
export const getYoutubeBatchAnalysis = query({
  args: {
    userId: v.string(),
    channelId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Validate inputs
      if (!args.userId || typeof args.userId !== 'string' || args.userId.trim() === '') {
        console.log('[getYoutubeBatchAnalysis] Invalid userId provided:', args.userId);
        return null;
      }

      if (!args.channelId || typeof args.channelId !== 'string' || args.channelId.trim() === '') {
        console.log('[getYoutubeBatchAnalysis] Invalid channelId provided:', args.channelId);
        return null;
      }

      console.log('[getYoutubeBatchAnalysis] Querying with:', { 
        userId: args.userId,
        channelId: args.channelId
      });
      
      const analysis = await ctx.db
        .query("youtubeBatchAnalysis")
        .withIndex("by_user_channel", q => 
          q.eq("userId", args.userId)
           .eq("channelId", args.channelId)
        )
        .first();

      console.log('[getYoutubeBatchAnalysis] Found analysis:', analysis ? {
        userId: analysis.userId,
        channelId: analysis.channelId,
        hasInsights: !!analysis.insights,
        insightsKeys: analysis.insights ? Object.keys(analysis.insights) : null,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt
      } : 'No analysis found');

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
      // Return null instead of throwing to prevent frontend crashes
      return null;
    }
  },
});
