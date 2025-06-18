import { useState, useCallback } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';

export function useInstagramInsights(userId?: string) {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postLimit, setPostLimit] = useState<number | 'all'>(50);
  const [customPostLimit, setCustomPostLimit] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Add Instagram-specific queries
  const instagramAccount = useQuery(
    api.instagramQueries.getInstagramAccount,
    userId ? { userId } : "skip"
  );

  // Fetch Instagram insights
  const instagramInsights = useQuery(
    api.instagramQueries.getInstagramBatchAnalysis,
    instagramAccount && userId ? { 
      userId, 
      instagramAccountId: instagramAccount.instagramAccountId 
    } : "skip"
  );

  // Store Instagram analysis mutation
  const storeInstagramAnalysis = useMutation(api.instagramMutations.storeInstagramBatchAnalysis);

  // Platform-specific insights
  const insightsList = instagramInsights?.insights?.insights || [];

  const refresh = useCallback(async () => {
    if (!userId || !instagramAccount?.instagramAccountId) {
      setError('Instagram account not connected');
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
      
      console.log(`🔄 Refreshing Instagram insights (requested: ${postLimit === 'all' ? 'all' : postLimit} posts)`);
      
      const response = await fetch(`${backendUrl}/api/v1/instagram/account-insights`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          instagram_account_id: instagramAccount.instagramAccountId,
          max_posts: postLimit === 'all' ? 1000 : postLimit,
          include_stories: true,
          include_comments: true,
          force_refresh: true
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429 && data.error_type === 'rate_limit') {
          const retryMsg = data.retry_after ? ` Try again in ${data.retry_after} seconds.` : '';
          throw new Error(`Instagram API rate limit exceeded.${retryMsg}`);
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.status === 'success') {
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
      } else {
        throw new Error(data.error || 'Failed to refresh Instagram insights');
      }
    } catch (error: any) {
      console.error('❌ Error refreshing Instagram insights:', error);
      setError(error.message || 'Failed to refresh Instagram insights');
    } finally {
      setRefreshing(false);
    }
  }, [userId, instagramAccount?.instagramAccountId, postLimit, storeInstagramAnalysis]);

  const handleCustomSubmit = useCallback(() => {
    const customValue = parseInt(customPostLimit);
    if (customValue && customValue > 0 && customValue <= 1000) {
      setPostLimit(customValue);
      setShowCustomInput(false);
      setCustomPostLimit('');
    }
  }, [customPostLimit]);

  return {
    insights: insightsList,
    loading: instagramInsights === undefined,
    refreshing,
    error,
    isConnected: !!instagramAccount?.instagramAccountId,
    refresh,
    account: instagramAccount,
    // Post limit controls
    postLimit,
    setPostLimit,
    customPostLimit,
    setCustomPostLimit,
    showCustomInput,
    setShowCustomInput,
    handleCustomSubmit
  };
} 