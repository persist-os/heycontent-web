import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { YouTubeContentItem } from '../types';

export function useYouTubeAnalytics(userId?: string) {
  const [error, setError] = useState<string | null>(null);

  // Get YouTube channel data to determine connection status
  const youtubeChannelData = useQuery(
    api.youtubeQueries.getYouTubeChannelData,
    userId ? { userId } : "skip"
  );

  // Use the raw Convex query that returns the exact schema structure
  const youtubeVideos = useQuery(
    api.youtubeQueries.getYouTubeVideos,
    userId ? { userId } : "skip"
  );

  const loading = youtubeVideos === undefined;

  // Map YouTube items using the raw Convex document structure
  const mappedYouTubeItems: YouTubeContentItem[] = useMemo(() => {
    if (youtubeVideos && Array.isArray(youtubeVideos)) {
      return youtubeVideos.map((video: any): YouTubeContentItem => {
        // Extract data according to the Convex schema structure
        const videoId = video.videoId || video.id || '';
        const title = video.snippet?.title || 'Untitled Video';
        const description = video.snippet?.description || '';
        const publishedAt = video.snippet?.published_at || new Date(video.createdAt || Date.now()).toISOString();
        const channelTitle = video.snippet?.channel?.title || '';
        const channelId = video.snippet?.channel?.id || '';
        
        // Get thumbnail URL from the schema structure
        const thumbnailUrl = video.snippet?.thumbnails?.high?.url || 
                           video.snippet?.thumbnails?.medium?.url || 
                           video.snippet?.thumbnails?.default?.url || '';
        
        // Get video URL
        const videoUrl = video.url || `https://www.youtube.com/watch?v=${videoId}`;
        
        // --- Always use canonical statistics field ---
        const stats = video.statistics || {};
        const views = Number(stats.views ?? 0);
        const likes = Number(stats.likes ?? 0);
        const dislikes = Number(stats.dislikes ?? 0);
        const comments = Number(stats.comments ?? 0);
        
        // Get duration from content_details
        const duration = video.content_details?.duration || '';
        
        return {
          id: videoId,
          platform: 'youtube' as const,
          publishedAt: publishedAt,
          content: {
            title: title,
            description: description,
            thumbnailUrl: thumbnailUrl,
            videoUrl: videoUrl,
            channelTitle: channelTitle,
            duration: duration,
          },
          metrics: {
            views: views,
            likes: likes,
            dislikes: dislikes,
            comments: comments,
          },
          analysis: video.analysis || null,
          analysisMarkdown: video.analysisMarkdown || null,
          convexData: video, // Store the complete raw Convex document
        };
      });
    }
    return [];
  }, [youtubeVideos]);

  return {
    items: mappedYouTubeItems,
    loading: loading,
    error,
    isConnected: !!youtubeChannelData,
    rawData: youtubeVideos,
    lastFetchTime: new Date(),
    isCached: false
  };
} 