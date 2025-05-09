import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Helper function to extract thumbnail URL from YouTube video data
function getThumbnailUrl(video: any): string {
  // Check each possible thumbnail location in order of preference
  const thumbnails = video.snippet?.thumbnails;
  if (!thumbnails) return '';
  
  // Try high quality first
  if (thumbnails.high?.url) return thumbnails.high.url;
  if (typeof thumbnails.high === 'string') return thumbnails.high;
  
  // Try standard quality
  if (thumbnails.standard?.url) return thumbnails.standard.url;
  if (typeof thumbnails.standard === 'string') return thumbnails.standard;
  
  // Try maxres quality
  if (thumbnails.maxres?.url) return thumbnails.maxres.url;
  if (typeof thumbnails.maxres === 'string') return thumbnails.maxres;
  
  // Try medium quality
  if (thumbnails.medium?.url) return thumbnails.medium.url;
  if (typeof thumbnails.medium === 'string') return thumbnails.medium;
  
  // Try default quality
  if (thumbnails.default?.url) return thumbnails.default.url;
  if (typeof thumbnails.default === 'string') return thumbnails.default;
  
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
