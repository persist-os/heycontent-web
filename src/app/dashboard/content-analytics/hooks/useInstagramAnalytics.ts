import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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

// 1-Hour Lazy Loading Cache Configuration
const CACHE_KEY_PREFIX = 'instagram_analytics_cache_';
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes (1-hour lazy loading cycle)

interface CachedData {
  data: any;
  timestamp: number;
  userId: string;
  instagramAccountId: string;
}

// In-memory cache to persist data across component mounts
const memoryCache = new Map<string, CachedData>();

// Get cache key for a user
const getCacheKey = (userId: string, instagramAccountId: string) => 
  `${CACHE_KEY_PREFIX}${userId}_${instagramAccountId}`;

// Load cached data with 1-hour lazy loading logic
const loadCachedData = (userId: string, instagramAccountId: string): CachedData | null => {
  const cacheKey = getCacheKey(userId, instagramAccountId);
  
  // Check memory cache first
  const memoryData = memoryCache.get(cacheKey);
  if (memoryData && Date.now() - memoryData.timestamp < CACHE_DURATION) {
    console.log('📱 Instagram: Using memory cache (hour 0-59)');
    return memoryData;
  }
  
  // Check localStorage
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsedCache: CachedData = JSON.parse(cached);
      if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
        console.log('📱 Instagram: Using localStorage cache (hour 0-59)');
        // Restore to memory cache
        memoryCache.set(cacheKey, parsedCache);
        return parsedCache;
      } else {
        console.log('📱 Instagram: Cache expired (hour 61+) - will fetch fresh data');
      }
    }
  } catch (error) {
    console.warn('Failed to load cached Instagram data:', error);
  }
  
  return null;
};

// Save data to cache with 1-hour duration
const saveCachedData = (userId: string, instagramAccountId: string, data: any) => {
  const cacheKey = getCacheKey(userId, instagramAccountId);
  const cachedData: CachedData = {
    data,
    timestamp: Date.now(),
    userId,
    instagramAccountId
  };
  
  // Save to memory cache
  memoryCache.set(cacheKey, cachedData);
  
  // Save to localStorage
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cachedData));
    console.log('📱 Instagram: Cached fresh data for next 60 minutes');
  } catch (error) {
    console.warn('Failed to save Instagram data to localStorage:', error);
  }
};

export function useInstagramAnalytics(userId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<InstagramAnalysis | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [refreshTimestamp, setRefreshTimestamp] = useState<number>(Date.now());
  
  // Refs to track if component is mounted and previous userId
  const isMountedRef = useRef(true);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  // Get Instagram account data from Convex
  const instagramAccount = useQuery(
    api.instagramQueries.getInstagramAccount,
    userId ? { userId } : "skip"
  );

  // Get Instagram posts
  const instagramPosts = useQuery(
    api.instagramQueries.getAllInstagramPosts,
    userId ? { userId, refreshTimestamp } : "skip"
  );

  // Get Instagram post insights - REMOVED: This query doesn't exist in the new schema
  // Insights are now embedded within the posts themselves
  // const instagramPostInsights = useQuery(
  //   api.instagramQueries.getAllPostInsights,
  //   { userId: userId || '' }
  // );

  // Memoize the Instagram account ID
  const instagramAccountId = useMemo(() => instagramAccount?.instagramAccountId, [instagramAccount?.instagramAccountId]);

  // FIXED: Only fetch tracker analysis when NO cached data exists OR cache is expired
  const shouldFetchTrackerAnalysis = useMemo(() => {
    if (!userId || !instagramAccountId) return false;
    
    const cached = loadCachedData(userId, instagramAccountId);
    
    // If no cache exists, ALWAYS fetch (first visit)
    if (!cached) {
      console.log('📱 Instagram: No cache found - WILL FETCH from Convex');
      return true;
    }
    
    // If cache exists but is expired, fetch
    const isCacheExpired = (Date.now() - cached.timestamp) >= CACHE_DURATION;
    if (isCacheExpired) {
      console.log('📱 Instagram: Cache expired - WILL FETCH from Convex');
      return true;
    }
    
    // Cache is valid, don't fetch
    console.log('📱 Instagram: Valid cache found - SKIP Convex fetch');
    return false;
  }, [userId, instagramAccountId]);

  // Get Instagram tracker analysis from Convex (fetch when no cache OR cache expired)
  const trackerAnalysis = useQuery(
    api.instagramQueries.getInstagramTrackerAnalysis,
    shouldFetchTrackerAnalysis && instagramAccountId ? {
      userId: userId!,
      instagramAccountId: instagramAccountId
    } : "skip"
  );

  // Map Instagram items with caching - UPDATED for new schema
  const mappedInstagramItems = useMemo(() => {
    console.log('🔄 Instagram: Mapping posts data:', {
      hasPosts: !!instagramPosts,
      postsType: typeof instagramPosts,
      postsLength: Array.isArray(instagramPosts) ? instagramPosts.length : 'not array',
      samplePost: Array.isArray(instagramPosts) && instagramPosts.length > 0 ? {
        id: instagramPosts[0].postId,
        hasInsights: !!instagramPosts[0].data?.insights,
        insightsKeys: instagramPosts[0].data?.insights ? Object.keys(instagramPosts[0].data.insights) : null,
        hasComments: !!instagramPosts[0].data?.comments,
        commentsLength: instagramPosts[0].data?.comments?.length || 0
      } : null
    });
    
    if (Array.isArray(instagramPosts)) {
      return instagramPosts.map((post: any): InstagramContentItem => {
        let mediaUrl = post.data.media_url;
        if (post.mediaType === 'CAROUSEL_ALBUM' && post.data.children?.length > 0) {
          const imageChild = post.data.children.find((c: any) => c.media_type === 'IMAGE');
          mediaUrl = imageChild?.media_url || post.data.children[0]?.media_url || mediaUrl;
        }

        // Extract metrics from post data and embedded insights (new schema)
        const postInsights = post.data?.insights || {};
        const metrics = {
          // From embedded insights data (new schema) - comprehensive metrics
          impressions: postInsights?.impressions,
          reach: postInsights?.reach,
          likes: postInsights?.likes,
          comments: postInsights?.comments,
          saved: postInsights?.saved,
          shares: postInsights?.shares,
          total_interactions: postInsights?.total_interactions,
          profile_visits: postInsights?.profile_visits,
          profile_activity: postInsights?.profile_activity,
          views: postInsights?.views,
          follows: postInsights?.follows,
          ig_reels_avg_watch_time: postInsights?.ig_reels_avg_watch_time,
          ig_reels_video_view_total_time: postInsights?.ig_reels_video_view_total_time,
          // From post data (fallback values)
          like_count: post.data.like_count,
          comments_count: post.data.comments_count
        };

        return {
          id: post.postId || post.data.id,
          platform: 'instagram',
          publishedAt: post.data.timestamp ? new Date(post.data.timestamp).toISOString() : new Date().toISOString(),
          content: {
            text: post.data.caption,
            mediaUrl,
            mediaType: post.mediaType as 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS', // Use actual mediaType from schema
            thumbnailUrl: post.data.thumbnail_url,
            permalink: post.data.permalink,
            timestamp: post.data.timestamp,
          },
          metrics,
          // Include properly typed children array for carousel posts
          children: post.data.children?.map((child: any) => ({
            id: child.id,
            media_url: child.media_url,
            media_type: child.media_type,
            thumbnail_url: child.thumbnail_url
          })) || [],
          // Include analysis data if available
          analysis: post.analysis,
          analysisMarkdown: post.analysisMarkdown,
        };
      });
    }
    return [];
  }, [instagramPosts]);

  // Initialize with cached data on mount only
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // FIXED: Load cached data immediately on mount and set loading state correctly
  useEffect(() => {
    if (userId && instagramAccountId) {
      const cached = loadCachedData(userId, instagramAccountId);
      if (cached) {
        console.log('📱 Instagram: Loading cached data on mount');
        console.log('🔍 Instagram: Cached data content:', cached.data);
        console.log('🔍 Instagram: Cached data structure:', {
          hasData: !!cached.data,
          dataType: typeof cached.data,
          dataKeys: cached.data ? Object.keys(cached.data) : [],
          hasLastPost: cached.data?.last_post,
          hasPostingFreq: cached.data?.posting_frequency,
          hasMediaDist: cached.data?.media_distribution
        });
        setAnalysis(cached.data);
        setLastFetchTime(cached.timestamp);
        
        // Check if cache is still valid (within 60 minutes)
        const dataAge = Date.now() - cached.timestamp;
        if (dataAge < CACHE_DURATION) {
          // Hour 0-59: Instant display with cached data, NO loading
          setLoading(false);
          console.log(`📱 Instagram: Cache valid for ${Math.round((CACHE_DURATION - dataAge) / 60000)} more minutes`);
        } else {
          // Hour 61+: Cache expired, keep loading true and will fetch fresh data
          console.log('📱 Instagram: Cache expired, will fetch fresh data');
        }
        setError(null);
      } else {
        // NO CACHE: First visit - keep loading true and will fetch from Convex
        console.log('📱 Instagram: No cache found, will fetch fresh data from Convex');
        setLoading(true);
      }
    }
  }, [userId, instagramAccountId]);

  // FIXED: Process Convex tracker analysis when it arrives
  useEffect(() => {
    if (trackerAnalysis !== undefined && userId && instagramAccountId) {
      console.log('📊 Instagram: Processing Convex tracker analysis:', trackerAnalysis);
      
      if (trackerAnalysis && Object.keys(trackerAnalysis).length > 0) {
        // Extract the content from the tracker analysis if it's nested
        let analysisToSet = trackerAnalysis;
        if (trackerAnalysis.content && !trackerAnalysis.last_post) {
          analysisToSet = trackerAnalysis.content;
          console.log('🔧 Instagram: Extracted content from nested structure:', analysisToSet);
        }
        
        // Check if we have valid analysis data
        const hasValidData = analysisToSet && (
          analysisToSet.last_post || 
          analysisToSet.posting_frequency || 
          analysisToSet.media_distribution
        );

        if (hasValidData) {
          console.log('✅ Instagram: Using fresh Convex tracker analysis data');
          setAnalysis(analysisToSet);
          setLastFetchTime(Date.now());
          saveCachedData(userId, instagramAccountId, analysisToSet);
          setError(null);
        } else {
          console.log('⚠️ Instagram: Tracker analysis exists but has no valid data');
        }
      } else {
        console.log('⚠️ Instagram: No tracker analysis found in Convex');
      }
      
      // Always set loading to false when trackerAnalysis query completes
      setLoading(false);
    }
  }, [trackerAnalysis, userId, instagramAccountId]);

  // Manual refresh function - only way to trigger expensive backend API calls
  const refresh = useCallback(async () => {
    if (!userId || !instagramAccountId) return;

    setRefreshing(true);
    setError(null);

    try {
      console.log('🔄 Instagram: Manual refresh - calling expensive backend API');

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
      console.log('🔍 Instagram: Backend API Response:', data);
      
      // Process response data
      let analysisToSet = null;
      
      if (data?.status === 'success' && data?.data) {
        if (data.data.content && !data.data.last_post) {
          analysisToSet = data.data.content;
          console.log('✅ Instagram: Using nested content from API response:', analysisToSet);
        } else {
          analysisToSet = data.data;
          console.log('✅ Instagram: Using data from API response:', analysisToSet);
        }
      } else if (data?.analysis) {
        if (data.analysis.content) {
          analysisToSet = data.analysis.content;
          console.log('✅ Instagram: Using analysis.content:', analysisToSet);
        } else {
          analysisToSet = data.analysis;
          console.log('✅ Instagram: Using direct analysis:', analysisToSet);
        }
      }
      
      if (analysisToSet && isMountedRef.current) {
        setAnalysis(analysisToSet);
        setLastFetchTime(Date.now());
        saveCachedData(userId, instagramAccountId, analysisToSet);
        setError(null);
        console.log('✅ Instagram: Successfully cached fresh data from backend API');
        
        // Force refetch of posts by updating the refresh timestamp
        // This will trigger getAllInstagramPosts to refetch with new insights and comments
        console.log('🔄 Instagram: Forcing refetch of posts with new insights and comments');
        setRefreshTimestamp(Date.now());
      } else if (isMountedRef.current) {
        console.warn('⚠️ Instagram: No valid analysis data found in API response');
        setError('No analysis data available');
      }
    } catch (err) {
      console.error('❌ Instagram: Manual refresh failed:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch Instagram analysis');
      }
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [userId, instagramAccountId]);

  // Reset analysis when userId changes
  useEffect(() => {
    // Only reset if userId actually changed (not just on mount or re-renders)
    if (prevUserIdRef.current !== userId && prevUserIdRef.current !== undefined) {
      console.log('🔄 Instagram: Resetting analysis due to userId change:', { 
        prevUserId: prevUserIdRef.current, 
        newUserId: userId 
      });
      setAnalysis(null);
      setError(null);
      setLastFetchTime(null);
    }
    
    // Update the ref to current userId
    prevUserIdRef.current = userId;
  }, [userId]);

  return {
    items: mappedInstagramItems,
    analysis,
    loading: loading || refreshing,
    error,
    isConnected: !!instagramAccount,
    refresh,
    refreshing,
    instagramAccount,
    lastFetchTime: lastFetchTime ? new Date(lastFetchTime) : null,
    isCached: !!lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)
  };
} 