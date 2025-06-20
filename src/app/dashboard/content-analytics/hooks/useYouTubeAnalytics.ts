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

  // Convex query for YouTube videos
  const youtubeVideos = useQuery(
    api.youtubeQueries.listUserYouTubeVideos,
    userId ? { userId } : "skip"
  );

  const loading = youtubeVideos === undefined;

  // Map YouTube items
  const mappedYouTubeItems: YouTubeContentItem[] = useMemo(() => {
    if (youtubeVideos && Array.isArray(youtubeVideos)) {
      return youtubeVideos.map((video: any): YouTubeContentItem => ({
        id: video.id || '',
        platform: 'youtube' as const,
        publishedAt: video.publishedAt || new Date().toISOString(),
        content: {
          title: video.content?.title || 'Untitled Video',
          description: video.content?.description || '',
          thumbnailUrl: video.content?.thumbnailUrl || '',
          videoUrl: video.content?.videoUrl || `https://www.youtube.com/watch?v=${video.id}`,
          channelTitle: video.content?.channelTitle || '',
        },
        metrics: {
          views: video.metrics?.views || 0,
          likes: video.metrics?.likes || 0,
          dislikes: video.metrics?.dislikes || 0,
          comments: video.metrics?.comments || 0,
          watchTimeMinutes: video.metrics?.watchTimeMinutes || 0,
          averageViewDurationSeconds: video.metrics?.averageViewDurationSeconds || 0,
        },
        analysis: video.analysis || null,
        aiAnalysis: video.aiAnalysis || null,
      }));
    }
    return [];
  }, [youtubeVideos]);

  return {
    items: mappedYouTubeItems,
    loading: loading,
    error,
    isConnected: !!youtubeChannelData,
    rawData: youtubeVideos,
    lastFetchTime: new Date(), // No longer tracking cache time
    isCached: false // Cache is disabled
  };
} 