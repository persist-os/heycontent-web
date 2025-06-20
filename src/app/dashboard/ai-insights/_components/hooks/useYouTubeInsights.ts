import { useState, useCallback } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';

export function useYouTubeInsights(userId?: string) {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postLimit, setPostLimit] = useState<number | 'all'>(10);
  const [customPostLimit, setCustomPostLimit] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Fetch YouTube channel data
  const youtubeChannel = useQuery(
    api.youtubeQueries.getYouTubeChannelData,
    userId ? { userId } : "skip"
  );

  // Fetch YouTube insights
  const youtubeInsights = useQuery(
    api.youtubeQueries.getChannelAnalysis,
    youtubeChannel?.id ? { userId, channelId: youtubeChannel.id } : "skip"
  );

  // Store channel analysis mutation
  const storeChannelAnalysis = useMutation(api.youtubeMutations.storeChannelAnalysis);

  // Platform-specific insights
  const insightsList = youtubeInsights?.analysis?.insights || [];

  const refresh = useCallback(async () => {
    if (!userId || !youtubeChannel?.id) {
      setError('YouTube channel not connected');
      return;
    }

    setRefreshing(true);
    setError(null);
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.');
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/api/v1/youtube/channel-insights`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          channel_id: youtubeChannel.id,
          max_videos: postLimit === 'all' ? 1000 : postLimit,
          include_captions: true,
          include_comments: true,
          force_refresh: true
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.status === 'success') {
        await storeChannelAnalysis({
          userId,
          channelId: youtubeChannel.id,
          analysisData: data.data
        });
      } else {
        throw new Error(data.error || 'Failed to refresh YouTube insights');
      }
    } catch (error: any) {
      console.error('Error refreshing YouTube insights:', error);
      setError(error.message || 'Failed to refresh YouTube insights');
    } finally {
      setRefreshing(false);
    }
  }, [userId, youtubeChannel?.id, storeChannelAnalysis, postLimit]);

  const handleCustomSubmit = useCallback(() => {
    const limit = parseInt(customPostLimit, 10);
    if (!isNaN(limit) && limit > 0) {
      setPostLimit(limit);
      setShowCustomInput(false);
    }
  }, [customPostLimit]);

  return {
    insights: insightsList,
    loading: youtubeInsights === undefined,
    refreshing,
    error,
    isConnected: !!youtubeChannel?.id,
    refresh,
    channel: youtubeChannel,
    postLimit,
    setPostLimit,
    customPostLimit,
    setCustomPostLimit,
    showCustomInput,
    setShowCustomInput,
    handleCustomSubmit,
  };
} 