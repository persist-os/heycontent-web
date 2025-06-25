import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';
import { BatchAnalysisHookReturn, BatchAnalysisData, InsightCard } from '@/types/batch-analysis';

export function useYouTubeInsights(userId?: string): BatchAnalysisHookReturn {
  const [error, setError] = useState<string | null>(null);
  const [postLimit, setPostLimit] = useState<number | 'all'>(10);
  const [customPostLimit, setCustomPostLimit] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch YouTube channel data
  const youtubeChannel = useQuery(
    api.youtubeQueries.getYouTubeChannelData,
    userId ? { userId } : "skip"
  );

  // Fetch YouTube batch analysis insights (will be migrated to universal format)
  const youtubeInsights = useQuery(
    api.youtubeQueries.getYoutubeBatchAnalysis,
    userId && youtubeChannel?.id ? { 
      userId, 
      channelId: youtubeChannel.id 
    } : "skip"
  );

  // Store YouTube batch analysis mutation
  const storeYoutubeBatchAnalysis = useMutation(api.youtubeMutations.storeYoutubeBatchAnalysis);

  // Extract data - handle both old and new formats during transition
  console.log('[useYouTubeInsights] Raw Convex data:', youtubeInsights);
  console.log('[useYouTubeInsights] youtubeInsights?.insights:', youtubeInsights?.insights);
  console.log('[useYouTubeInsights] Type of youtubeInsights?.insights:', typeof youtubeInsights?.insights);
  console.log('[useYouTubeInsights] Is array?', Array.isArray(youtubeInsights?.insights));
  
  // Check if insights is the universal format object (with insights, metadata, status)
  const rawInsights = youtubeInsights?.insights;
  const isUniversalFormat = rawInsights && typeof rawInsights === 'object' && 'insights' in rawInsights;
  
  console.log('[useYouTubeInsights] Is universal format?', isUniversalFormat);
  
  const insightsList: InsightCard[] = isUniversalFormat 
    ? (rawInsights as any).insights || []
    : rawInsights || [];
  const metadata = isUniversalFormat 
    ? (rawInsights as any).metadata || null
    : (youtubeInsights as any)?.metadata || null;
  const status = isUniversalFormat 
    ? (rawInsights as any).status || null
    : youtubeInsights?.status || null;
    
  console.log('[useYouTubeInsights] Extracted insightsList:', insightsList);
  console.log('[useYouTubeInsights] Extracted metadata:', metadata);
  console.log('[useYouTubeInsights] Extracted status:', status);

  // Only show as running if we're actively refreshing AND status is processing/enqueued
  // Don't auto-show loading for old stuck statuses
  // Check both root-level status (updated by mutations) and nested status (from insights)
  const rootStatus = youtubeInsights?.status?.status;
  const nestedStatus = status?.status;
  const databaseStatus = rootStatus || nestedStatus;
  
  // Extract progress from the correct status object
  // Priority: root-level status (current) > nested status (cached)
  const currentProgress = youtubeInsights?.status?.progress !== undefined 
    ? youtubeInsights.status.progress 
    : status?.progress || 0;
  
  // Fix: Handle race condition between local refresh state and database updates
  // When user clicks refresh, show refreshing state immediately, even if database hasn't updated yet
  // Once database status updates to processing/enqueued, continue showing refreshing state
  const isActuallyRunning = isRefreshing || databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running';
  
  console.log('[useYouTubeInsights] Refresh state debug:', {
    localIsRefreshing: isRefreshing,
    rootStatus,
    nestedStatus,
    databaseStatus,
    isActuallyRunning,
    status: status,
    rootStatusObject: youtubeInsights?.status,
    currentProgress,
    rootProgress: youtubeInsights?.status?.progress,
    nestedProgress: status?.progress,
    hasChannel: !!youtubeChannel?.id,
    hasInsights: !!insightsList?.length
  });

  // Check if there's an error in the batch analysis
  const batchError = status?.error;

  // Update local error state when batch analysis has an error
  useEffect(() => {
    if (batchError && !error) {
      setError(batchError);
    }
  }, [batchError, error]);

  // Reset local refreshing state when task completes or database state becomes definitive
  useEffect(() => {
    if (isRefreshing && databaseStatus) {
      if (databaseStatus === 'completed' || databaseStatus === 'failed') {
        // Task definitively finished - clear local state
        console.log('[useYouTubeInsights] Task completed/failed, clearing local refresh state');
        setIsRefreshing(false);
      } else if (databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running') {
        // Database caught up with our refresh request - database now drives the state
        console.log('[useYouTubeInsights] Database status updated to active, local state can continue');
      }
    }
  }, [isRefreshing, databaseStatus]);

  const refresh = useCallback(async () => {
    if (!userId || !youtubeChannel?.id) {
      setError('YouTube channel not connected');
      return;
    }

    // Prevent multiple concurrent refresh attempts
    if (isRefreshing || databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running') {
      console.log('[useYouTubeInsights] Refresh already in progress, ignoring click', {
        isRefreshing,
        databaseStatus,
        currentTime: new Date().toISOString()
      });
      return;
    }

    console.log('[useYouTubeInsights] Starting refresh...', {
      userId,
      hasChannel: !!youtubeChannel?.id,
      postLimit,
      currentTime: new Date().toISOString()
    });

    // Set local refreshing state
    setIsRefreshing(true);
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
          force_refresh: false // Changed to false to match other platforms and avoid unnecessary API calls
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.status === 'enqueued') {
        // YouTube analysis is now async - the status is tracked in the database
        // The results will be automatically available in the query once completed
        console.log(`✅ YouTube analysis enqueued with task ID: ${data.task_id}`);
        console.log('[useYouTubeInsights] Task enqueued, keeping local refresh state until database updates');
        // Keep refreshing state until task completes - database will update via real-time subscription
      } else if (data.status === 'success') {
        // Handle legacy synchronous response (if any)
        await storeYoutubeBatchAnalysis({
          userId,
          channelId: youtubeChannel.id,
          insights: data.data
        });
        setIsRefreshing(false);
      } else {
        throw new Error(data.error || 'Failed to refresh YouTube insights');
      }
    } catch (error: any) {
      console.error('Error refreshing YouTube insights:', error);
      setError(error.message || 'Failed to refresh YouTube insights');
      setIsRefreshing(false);
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
    metadata,
    status: {
      ...status,
      progress: currentProgress // Use the correct progress value
    },
    loading: youtubeInsights === undefined,
    refreshing: isActuallyRunning, // Use combined local + database state
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