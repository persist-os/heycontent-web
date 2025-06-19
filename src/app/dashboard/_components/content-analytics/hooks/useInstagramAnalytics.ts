import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';
import { InstagramContentItem } from '../types';

// Instagram analysis type
interface InstagramAnalysis {
  last_post?: {
    date: string | null;
    type: string | null;
    time_ago: string | null;
  } | null;
  posting_frequency?: {
    average_days_between_posts: number | null;
    has_recent_posts: boolean | null;
    total_posts_last_7_days: string | null;
  } | null;
  media_distribution?: {
    regular_post: string | null;
    carousel: string | null;
    reel: string | null;
    story: string | null;
  } | null;
}

export function useInstagramAnalytics(userId?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<InstagramAnalysis | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get Instagram account data from Convex
  const instagramAccount = useQuery(
    api.instagramQueries.getInstagramAccount,
    userId ? { userId } : "skip"
  );

  // Get Instagram posts
  const instagramPosts = useQuery(
    api.instagramQueries.getAllInstagramPosts,
    userId ? { userId } : "skip"
  );

  // Get Instagram post insights
  const instagramPostInsights = useQuery(
    api.instagramQueries.getAllPostInsights,
    { userId: userId || '' }
  );

  // Get Instagram tracker analysis from Convex
  const trackerAnalysis = useQuery(
    api.instagramQueries.getInstagramTrackerAnalysis,
    instagramAccount?.instagramAccountId ? {
      userId: userId!,
      instagramAccountId: instagramAccount.instagramAccountId
    } : "skip"
  );

  // Memoize the Instagram account ID
  const instagramAccountId = useMemo(() => instagramAccount?.instagramAccountId, [instagramAccount?.instagramAccountId]);
  
  // Memoize tracker analysis
  const memoizedTrackerAnalysis = useMemo(() => trackerAnalysis, [trackerAnalysis]);

  // Map Instagram items
  const mappedInstagramItems = useMemo(() => {
    if (Array.isArray(instagramPosts)) {
      return instagramPosts.map((post: any): InstagramContentItem => {
        let mediaUrl = post.data.media_url;
        if (post.data.media_type === 'CAROUSEL_ALBUM' && post.data.children?.length > 0) {
          const imageChild = post.data.children.find((c: any) => c.media_type === 'IMAGE');
          mediaUrl = imageChild?.media_url || post.data.children[0]?.media_url || mediaUrl;
        }

        // Get insights for this post
        const postId = post.postId || post.data.id;
        const insights = instagramPostInsights?.find(insight => insight?.postId === postId);

        // Extract metrics from both post data and insights
        const metrics = {
          // From insights data
          impressions: insights?.data?.impressions ?? 0,
          reach: insights?.data?.reach ?? 0,
          shares: insights?.data?.shares ?? 0,
          // From post data (these might be more up-to-date)
          likes: post.data.like_count ?? insights?.data?.likes ?? 0,
          comments: post.data.comments_count ?? insights?.data?.comments ?? 0
        };

        return {
          id: postId,
          platform: 'instagram',
          publishedAt: post.data.timestamp ? new Date(post.data.timestamp).toISOString() : new Date().toISOString(),
          content: {
            text: post.data.caption,
            mediaUrl,
            mediaType: post.data.media_type === 'IMAGE' ? 'image' : post.data.media_type === 'VIDEO' ? 'video' : 'carousel',
            thumbnailUrl: post.data.thumbnail_url,
            permalink: post.data.permalink,
          },
          metrics,
          // Include children array for carousel posts
          children: post.data.children || [],
        };
      });
    }
    return [];
  }, [instagramPosts, instagramPostInsights]);

  // Fetch data function with stable dependencies
  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    console.log('🚀 Instagram Analytics fetchData called with:', {
      userId,
      hasInstagramAccount: !!instagramAccountId,
      hasTrackerAnalysis: memoizedTrackerAnalysis !== undefined,
      forceRefresh
    });
    
    // STEP 1: Wait for Instagram account to exist before proceeding
    if (!instagramAccountId) {
      console.log('⚠️ No Instagram account found, skipping analytics fetch');
      setLoading(false);
      setError('No Instagram account connected');
      return;
    }

    // STEP 2: If NOT force refresh, wait for Convex tracker analysis to complete loading
    if (!forceRefresh && memoizedTrackerAnalysis === undefined) {
      console.log('🔄 Tracker analysis still loading from Convex, waiting...');
      setLoading(true); // Keep showing skeleton while waiting
      return;
    }

    setLoading(true);
    setError(null);
    
    // Add minimum loading time to ensure skeleton is visible
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      // STEP 3: Check if we have valid cached data from Convex (unless force refresh)
      if (!forceRefresh && memoizedTrackerAnalysis !== undefined) {
        const hasValidData = memoizedTrackerAnalysis && 
          Object.keys(memoizedTrackerAnalysis).length > 0 &&
          (memoizedTrackerAnalysis.last_post || memoizedTrackerAnalysis.posting_frequency || memoizedTrackerAnalysis.media_distribution ||
           (memoizedTrackerAnalysis.content && (memoizedTrackerAnalysis.content.last_post || memoizedTrackerAnalysis.content.posting_frequency || memoizedTrackerAnalysis.content.media_distribution)));
        
        if (hasValidData) {
          await minLoadingTime; // Ensure skeleton shows for at least 200ms
          console.log('✅ Using cached tracker analysis from Convex:', memoizedTrackerAnalysis);
          
          // Extract the content from the tracker analysis if it's nested
          let analysisToSet = memoizedTrackerAnalysis;
          if (memoizedTrackerAnalysis.content && !memoizedTrackerAnalysis.last_post) {
            analysisToSet = memoizedTrackerAnalysis.content;
            console.log('🔧 Extracted content from nested structure:', analysisToSet);
          }
          
          setAnalysis(analysisToSet);
          setLoading(false);
          return; // ✅ SUCCESS - Using Convex data
        } else {
          console.log('⚠️ Tracker analysis from Convex is null or empty, making backend API call');
        }
      }

      // STEP 4: Make backend API call (only if no valid Convex data OR force refresh)
      console.log('🔄 Making backend API call to refresh Instagram data...', { forceRefresh });

      const response = await fetch(`${window.location.origin}/api/social/instagram/full-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getApiKey()}`,
        },
        body: JSON.stringify({
          user_id: userId,
          instagram_account_id: instagramAccountId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Instagram analysis: ${response.statusText}`);
      }

      const data = await response.json();
      await minLoadingTime; // Ensure skeleton shows for at least 200ms
      
      console.log('🔍 Instagram Analytics API Response:', data);
      
      // Process response data
      let analysisToSet = null;
      
      if (data?.status === 'success' && data?.data) {
        if (data.data.content && !data.data.last_post) {
          analysisToSet = data.data.content;
          console.log('✅ Using nested content from API response:', analysisToSet);
        } else {
          analysisToSet = data.data;
          console.log('✅ Using data from API response:', analysisToSet);
        }
      } else if (data?.analysis) {
        if (data.analysis.content) {
          analysisToSet = data.analysis.content;
          console.log('✅ Using analysis.content:', analysisToSet);
        } else {
          analysisToSet = data.analysis;
          console.log('✅ Using direct analysis:', analysisToSet);
        }
      }
      
      if (analysisToSet) {
        setAnalysis(analysisToSet);
        console.log('✅ Successfully set analysis data from API');
      } else {
        console.warn('⚠️ No valid analysis data found in API response');
        setError('No analysis data available');
      }
    } catch (err) {
      await minLoadingTime; // Ensure skeleton shows even on error
      console.error('❌ Instagram analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Instagram analysis');
    } finally {
      setLoading(false);
    }
  }, [userId, instagramAccountId, memoizedTrackerAnalysis]);

  // Only fetch data when dependencies actually change
  useEffect(() => {
    // Run fetchData when:
    // 1. We have an Instagram account AND
    // 2. Tracker analysis query has completed (either with data or null)
    if (instagramAccountId && memoizedTrackerAnalysis !== undefined) {
      fetchData(false);
    }
  }, [fetchData, instagramAccountId, memoizedTrackerAnalysis]);

  // Reset analysis when userId changes
  useEffect(() => {
    setAnalysis(null);
    setError(null);
  }, [userId]);

  // Refresh function for force refresh
  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true).finally(() => setRefreshing(false));
  }, [fetchData]);

  return {
    items: mappedInstagramItems,
    analysis,
    loading: loading || refreshing,
    error,
    isConnected: !!instagramAccount,
    refresh,
    refreshing,
    instagramAccount
  };
} 