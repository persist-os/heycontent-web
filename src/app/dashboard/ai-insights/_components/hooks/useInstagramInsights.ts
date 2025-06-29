import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';
import { BatchAnalysisHookReturn, InsightCard } from '@/types/batch-analysis';

export function useInstagramInsights(userId?: string): BatchAnalysisHookReturn {
  const [error, setError] = useState<string | null>(null);
  const [postLimit, setPostLimit] = useState<number | 'all'>(5);
  const [customPostLimit, setCustomPostLimit] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add Instagram-specific queries
  const instagramAccount = useQuery(
    api.instagramQueries.getInstagramAccount,
    userId ? { userId } : "skip"
  );

  // Fetch Instagram batch analysis insights
  const instagramInsights = useQuery(
    api.instagramQueries.getInstagramBatchAnalysis,
    userId && instagramAccount?.instagramAccountId ? { 
      userId, 
      instagramAccountId: instagramAccount.instagramAccountId 
    } : "skip"
  );

  // Store Instagram batch analysis mutation
  const storeInstagramAnalysis = useMutation(api.instagramMutations.storeInstagramBatchAnalysis);

  // Extract data - handle both old and new formats during transition
  console.log('[useInstagramInsights] Raw Convex data:', instagramInsights);
  console.log('[useInstagramInsights] instagramInsights?.insights:', instagramInsights?.insights);
  console.log('[useInstagramInsights] Type of instagramInsights?.insights:', typeof instagramInsights?.insights);
  console.log('[useInstagramInsights] Is array?', Array.isArray(instagramInsights?.insights));
  
  // Check if insights is the universal format object (with insights, metadata, status)
  const rawInsights = instagramInsights?.insights;
  const isUniversalFormat = rawInsights && typeof rawInsights === 'object' && 'insights' in rawInsights;
  
  console.log('[useInstagramInsights] Is universal format?', isUniversalFormat);
  
  const insightsList: InsightCard[] = isUniversalFormat 
    ? (rawInsights as any).insights || []
    : rawInsights || [];
  const metadata = isUniversalFormat 
    ? (rawInsights as any).metadata || null
    : (instagramInsights as any)?.metadata || null;
  const status = isUniversalFormat 
    ? (rawInsights as any).status || null
    : instagramInsights?.status || null;
    
  console.log('[useInstagramInsights] Extracted insightsList:', insightsList);
  console.log('[useInstagramInsights] Extracted metadata:', metadata);
  console.log('[useInstagramInsights] Extracted status:', status);

  // Only show as running if we're actively refreshing AND status is processing/enqueued
  // Don't auto-show loading for old stuck statuses
  // Check both root-level status (updated by mutations) and nested status (from insights)
  const rootStatus = instagramInsights?.status?.status;
  const nestedStatus = status?.status;
  const databaseStatus = rootStatus || nestedStatus;
  
  // Extract progress from the correct status object
  // Priority: root-level status (current) > nested status (cached)
  const currentProgress = instagramInsights?.status?.progress !== undefined 
    ? instagramInsights.status.progress 
    : status?.progress || 0;
  
  // Fix: Handle race condition between local refresh state and database updates
  // When user clicks refresh, show refreshing state immediately, even if database hasn't updated yet
  // Once database status updates to processing/enqueued, continue showing refreshing state
  const isActuallyRunning = isRefreshing || databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running';
  
  console.log('[useInstagramInsights] Refresh state debug:', {
    localIsRefreshing: isRefreshing,
    rootStatus,
    nestedStatus,
    databaseStatus,
    isActuallyRunning,
    status: status,
    rootStatusObject: instagramInsights?.status,
    currentProgress,
    rootProgress: instagramInsights?.status?.progress,
    nestedProgress: status?.progress,
    hasAccount: !!instagramAccount?.instagramAccountId,
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
        console.log('[useInstagramInsights] Task completed/failed, clearing local refresh state');
        setIsRefreshing(false);
      } else if (databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running') {
        // Database caught up with our refresh request - database now drives the state
        console.log('[useInstagramInsights] Database status updated to active, local state can continue');
      }
    }
  }, [isRefreshing, databaseStatus]);

  const refresh = useCallback(async () => {
    if (!userId || !instagramAccount?.instagramAccountId) {
      setError('Instagram account not connected');
      return;
    }

    // Prevent multiple concurrent refresh attempts
    if (isRefreshing || databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running') {
      console.log('[useInstagramInsights] Refresh already in progress, ignoring click', {
        isRefreshing,
        databaseStatus,
        currentTime: new Date().toISOString()
      });
      return;
    }

    console.log('[useInstagramInsights] Starting refresh...', {
      userId,
      hasAccount: !!instagramAccount?.instagramAccountId,
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
      
      const response = await fetch(`${backendUrl}/api/v1/instagram/account-insights`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          instagram_account_id: instagramAccount.instagramAccountId,
          max_posts: typeof postLimit === 'number' ? Math.min(postLimit, 20) : 5, // Enforce hard limit of 20
          include_stories: true,
          include_comments: true,
          force_refresh: false // Don't force refresh to avoid unnecessary API calls
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.status === 'enqueued') {
        // Instagram analysis is now async - the status is tracked in the database
        // The results will be automatically available in the query once completed
        console.log(`✅ Instagram analysis enqueued with task ID: ${data.task_id}`);
        console.log('[useInstagramInsights] Task enqueued, keeping local refresh state until database updates');
        // Keep refreshing state until task completes - database will update via real-time subscription
      } else if (data.status === 'success') {
        // Log optimization information
        if (data.analysis_summary) {
          const summary = data.analysis_summary;
          console.log('📊 Instagram Insights Analysis Summary:', {
            requestedPosts: summary.requested_posts,
            actualPostsAnalyzed: summary.actual_posts_analyzed || summary.total_posts,
            cachedPostsAvailable: summary.cached_posts_available,
            optimizedApiUsage: summary.optimized_api_usage,
            rateLimited: summary.rate_limited,
            fallbackToCache: summary.fallback_to_cache
          });
          
          // Show user-friendly message about optimization
          if (summary.optimized_api_usage) {
            console.log(`✅ API optimization: Used cached data instead of making unnecessary Instagram API calls`);
          } else if (summary.rate_limited) {
            console.log(`⚠️ Rate limited: Used cached data (${summary.cached_posts_available} posts available)`);
          }
        }
        
        if (data.note || data.warning) {
          console.log(`💡 Backend note: ${data.note || data.warning}`);
        }
        
        await storeInstagramAnalysis({
          userId,
          instagramAccountId: instagramAccount.instagramAccountId,
          insights: data.data
        });
        setIsRefreshing(false);
      } else {
        throw new Error(data.error || 'Failed to refresh Instagram insights');
      }
    } catch (error: any) {
      console.error('❌ Error refreshing Instagram insights:', error);
      setError(error.message || 'Failed to refresh Instagram insights');
      setIsRefreshing(false);
    }
  }, [userId, instagramAccount?.instagramAccountId, storeInstagramAnalysis, postLimit]);

  const handleCustomSubmit = useCallback(() => {
    const limit = parseInt(customPostLimit, 10);
    // Enforce hard limit of 20 posts
    if (!isNaN(limit) && limit > 0 && limit <= 20) {
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
    loading: instagramInsights === undefined,
    refreshing: isActuallyRunning, // Use combined local + database state
    error,
    isConnected: !!instagramAccount?.instagramAccountId,
    refresh,
    account: instagramAccount,
    postLimit,
    setPostLimit,
    customPostLimit,
    setCustomPostLimit,
    showCustomInput,
    setShowCustomInput,
    handleCustomSubmit,
  };
} 