import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';

export function useYouTubeInsights(userId?: string) {
  const [error, setError] = useState<string | null>(null);
  const [postLimit, setPostLimit] = useState<number | 'all'>(10);
  const [customPostLimit, setCustomPostLimit] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Fetch YouTube channel data
  const youtubeChannel = useQuery(
    api.youtubeQueries.getYouTubeChannelData,
    userId ? { userId } : "skip"
  );

  // Fetch YouTube batch analysis insights
  const youtubeInsights = useQuery(
    api.youtubeQueries.getYoutubeBatchAnalysis,
    userId ? { userId } : "skip"
  );

  // Store YouTube batch analysis mutation
  const storeYoutubeBatchAnalysis = useMutation(api.youtubeMutations.storeYoutubeBatchAnalysis);

  // Platform-specific insights
  const insightsList = youtubeInsights?.insights?.insights || [];

  // Determine if batch analysis is currently running based on database status
  const isRunning = youtubeInsights?.status?.status === 'processing' || 
                   youtubeInsights?.status?.status === 'enqueued' ||
                   youtubeInsights?.status?.status === 'running';

  // Check if there's an error in the batch analysis
  const batchError = youtubeInsights?.status?.error;

  // Update local error state when batch analysis has an error
  useEffect(() => {
    if (batchError && !error) {
      setError(batchError);
    }
  }, [batchError, error]);

  const refresh = useCallback(async () => {
    if (!userId || !youtubeChannel?.id) {
      setError('YouTube channel not connected');
      return;
    }

    // Clear any existing errors
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
      
      if (data.status === 'enqueued') {
        // YouTube analysis is now async - the status is tracked in the database
        // The results will be automatically available in the query once completed
        console.log(`YouTube analysis enqueued with task ID: ${data.task_id}`);
      } else if (data.status === 'success') {
        // Handle legacy synchronous response (if any)
        await storeYoutubeBatchAnalysis({
          userId,
          insights: data.data
        });
      } else {
        throw new Error(data.error || 'Failed to refresh YouTube insights');
      }
    } catch (error: any) {
      console.error('Error refreshing YouTube insights:', error);
      setError(error.message || 'Failed to refresh YouTube insights');
    }
  }, [userId, youtubeChannel?.id, storeYoutubeBatchAnalysis, postLimit]);

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
    refreshing: isRunning, // Use database status instead of local state
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