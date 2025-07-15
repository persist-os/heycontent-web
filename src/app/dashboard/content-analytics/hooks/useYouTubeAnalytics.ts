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

  // Use the same query as the UI for consistency
  const youtubeVideos = useQuery(
    api.youtubeQueries.getYouTubeVideos,
    userId ? { userId, limit: 100 } : "skip"
  );

  const loading = youtubeVideos === undefined;

  // Map YouTube items using the raw Convex document structure
  const mappedYouTubeItems: YouTubeContentItem[] = useMemo(() => {
    if (youtubeVideos && youtubeVideos.videos && Array.isArray(youtubeVideos.videos)) {
      return youtubeVideos.videos.map((video: any): YouTubeContentItem => {
        return {
          id: video.videoId || video.id || '',
          platform: 'youtube' as const,
          publishedAt: video.snippet?.published_at || (video.createdAt ? new Date(video.createdAt).toISOString() : new Date().toISOString()),
          content: {
            title: video.snippet?.title || 'Untitled Video',
            description: video.snippet?.description || '',
            thumbnailUrl: video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.medium || '',
            videoUrl: video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
            channelTitle: video.snippet?.channel?.title || '',
          },
          metrics: {
            views: Number(video.statistics?.views || 0),
            likes: Number(video.statistics?.likes || 0),
            dislikes: Number(video.statistics?.dislikes || 0),
            comments: Number(video.statistics?.comments || 0),
          },
          // Include the full Convex document for complete data access (like Instagram and Gmail)
          convexData: video,
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