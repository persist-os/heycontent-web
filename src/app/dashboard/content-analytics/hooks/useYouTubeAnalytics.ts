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
    api.youtubeQueries.listUserYouTubeVideos,
    userId ? { userId } : "skip"
  );

  const loading = youtubeVideos === undefined;

  // Map YouTube items using the raw Convex document structure
  const mappedYouTubeItems: YouTubeContentItem[] = useMemo(() => {
    if (youtubeVideos && Array.isArray(youtubeVideos)) {
      return youtubeVideos.map((video: any): YouTubeContentItem => {
        // Already formatted by the backend for UI
        return {
          ...video,
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