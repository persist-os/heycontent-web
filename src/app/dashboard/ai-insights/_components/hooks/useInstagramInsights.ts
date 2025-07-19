import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';
import { BatchAnalysisHookReturn, InsightCard } from '@/types/batch-analysis';
import { PerformanceTimer, isLargeDataset } from '@/app/lib/utils/performance-utils';

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

  // Memoize the accountId to avoid unnecessary re-renders
  const instagramAccountId = useMemo(
    () => instagramAccount?.instagramAccountId,
    [instagramAccount]
  );

  // Fetch Instagram batch analysis insights
  const instagramInsights = useQuery(
    api.instagramQueries.getInstagramBatchAnalysis,
    userId && instagramAccountId ? { 
      userId, 
      instagramAccountId
    } : "skip"
  );

  // Store Instagram batch analysis mutation
  const storeInstagramAnalysis = useMutation(api.instagramMutations.storeInstagramBatchAnalysis);

  // Extract data - handle both old and new formats during transition
  // Check if insights is the universal format object (with insights, metadata, status)
  const rawInsights = instagramInsights?.insights;
  const isUniversalFormat = rawInsights && typeof rawInsights === 'object' && 'insights' in rawInsights;
  
  // Performance monitoring for data processing
  const insightsList: InsightCard[] = useMemo(() => {
    if (!rawInsights) return [];
    
    const timer = new PerformanceTimer('Instagram insights processing');
    
    const result = isUniversalFormat 
      ? (rawInsights as any).insights || []
      : rawInsights || [];
    
    // Check if dataset is large and log performance
    if (isLargeDataset(result.length)) {
      console.warn(`Large Instagram dataset detected: ${result.length} insights`);
      timer.endWithThreshold(50); // Warn if processing takes more than 50ms
    } else {
      timer.end();
    }
    
    return result;
  }, [rawInsights, isUniversalFormat]);
  
  const metadata = isUniversalFormat 
    ? (rawInsights as any).metadata || null
    : (instagramInsights as any)?.metadata || null;
  const status = isUniversalFormat 
    ? (rawInsights as any).status || null
    : instagramInsights?.status || null;
    
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
        setIsRefreshing(false);
      } else if (databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running') {
        // Database caught up with our refresh request - database now drives the state
      }
    }
  }, [isRefreshing, databaseStatus]);

  const refresh = useCallback(async (selectionMode?: 'auto' | 'manual', selectedPostIds?: string[]) => {
    if (!userId || !instagramAccount?.instagramAccountId) {
      setError('Your Instagram account isn\'t connected yet. No worries—let\'s get you set up so you can unlock those amazing insights! 🚀');
      return;
    }

    // Prevent multiple concurrent refresh attempts
    if (isRefreshing || databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running') {
      return;
    }

    setIsRefreshing(true);
    setError(null);
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Oops! Looks like you need to log in again. No biggie—just refresh and we\'ll get you back to creating amazing content! ✨');
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      // Prepare request body based on selection mode
      const requestBody: any = {
        user_id: userId,
        instagram_account_id: instagramAccount.instagramAccountId,
        include_stories: true,
        include_comments: true,
        force_refresh: false // Don't force refresh to avoid unnecessary API calls
      };

      if (selectionMode === 'manual' && selectedPostIds && selectedPostIds.length > 0) {
        // Manual selection mode
        requestBody.selection_mode = 'manual';
        requestBody.selected_post_ids = selectedPostIds;
        // For manual mode, we don't use max_posts since we're selecting specific posts
      } else {
        // Auto selection mode
        requestBody.selection_mode = 'auto';
        requestBody.max_posts = typeof postLimit === 'number' ? Math.min(postLimit, 20) : 5; // Enforce hard limit of 20
      }
      
      const response = await fetch(`${backendUrl}/api/v1/instagram/account-insights`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || 'Our Instagram insights are taking a quick coffee break ☕. Thanks for your patience—your amazing insights will be back soon!';
        throw new Error(errorMessage);
      }
      
      if (data.status === 'enqueued') {
        // Instagram analysis is now async - the status is tracked in the database
        // The results will be automatically available in the query once completed
      } else if (data.status === 'success') {
        // Log optimization information
        if (data.analysis_summary) {
          const summary = data.analysis_summary;
        }
        
        await storeInstagramAnalysis({
          userId,
          instagramAccountId: instagramAccount.instagramAccountId,
          insights: data.data
        });
        setIsRefreshing(false);
      } else {
        throw new Error(data.error || 'Your Instagram insights are brewing! ☕ Sometimes our AI needs a moment to work its magic. Thanks for your patience—great insights take time!');
      }
    } catch (error: any) {
      console.error('❌ Error refreshing Instagram insights:', error);
      setError(error.message || 'Oops! Even the best creators hit a snag sometimes. Thanks for being awesome and sticking with us. Your insights will be worth the wait! ✨');
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