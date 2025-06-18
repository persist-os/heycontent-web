import { useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { YouTubeContentItem } from '../types';

export function useYouTubeAnalytics(userId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex query for YouTube videos
  const youtubeVideos = useQuery(
    api.youtubeQueries.listUserYouTubeVideos,
    userId ? { userId } : "skip"
  );

  // Map YouTube items
  const mappedYouTubeItems: YouTubeContentItem[] = useMemo(() => {
    if (youtubeVideos && Array.isArray(youtubeVideos)) {
      return youtubeVideos.map((video: any) => ({
        id: `youtube-${video.id || ''}`,
        platform: 'youtube',
        publishedAt: video.publishedAt || new Date().toISOString(),
        content: {
          title: video.content?.title || 'Untitled Video',
          description: video.content?.description || '',
          thumbnailUrl: video.content?.thumbnailUrl || '',
          videoUrl: video.content?.videoUrl || `https://www.youtube.com/watch?v=${video.id}`,
          channelTitle: video.content?.channelTitle || '',
          channelId: video.content?.channelId || '',
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
    loading: youtubeVideos === undefined,
    error,
    isConnected: !!youtubeVideos,
    rawData: youtubeVideos
  };
} 