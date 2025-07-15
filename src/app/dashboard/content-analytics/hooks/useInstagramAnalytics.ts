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
    return memoryData;
  }
  
  // Check localStorage
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsedCache: CachedData = JSON.parse(cached);
      if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
        // Restore to memory cache
        memoryCache.set(cacheKey, parsedCache);
        return parsedCache;
      }
    }
  } catch (error) {
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
  } catch (error) {
  }
};

export function useInstagramAnalytics(userId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<InstagramAnalysis | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // New separate refresh states
  const [refreshingPosts, setRefreshingPosts] = useState(false);
  const [refreshingTracker, setRefreshingTracker] = useState(false);
  const [refreshPostsSuccess, setRefreshPostsSuccess] = useState(false);
  const [refreshTrackerSuccess, setRefreshTrackerSuccess] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  
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
    userId ? { userId } : "skip"
  );

  // Get pagination info
  const paginationInfo = useQuery(
    api.instagramQueries.getAccountPagination,
    userId && instagramAccount?.instagramAccountId ? {
      userId,
      instagramAccountId: instagramAccount.instagramAccountId
    } : "skip"
  );

  // Get queue status
  const queueStatus = useQuery(
    api.instagramQueries.getQueueStatus,
    userId && instagramAccount?.instagramAccountId ? {
      userId,
      instagramAccountId: instagramAccount.instagramAccountId
    } : "skip"
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
      return true;
    }
    
    // If cache exists but is expired, fetch
    const isCacheExpired = (Date.now() - cached.timestamp) >= CACHE_DURATION;
    if (isCacheExpired) {
      return true;
    }
    
    // Cache is valid, don't fetch
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
            comments: post.data.comments || [], // Include comments from the Convex schema
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
          // Include the full Convex document for complete data access
          convexData: post,
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
        setAnalysis(cached.data);
        setLastFetchTime(cached.timestamp);
        
        // Check if cache is still valid (within 60 minutes)
        const dataAge = Date.now() - cached.timestamp;
        if (dataAge < CACHE_DURATION) {
          // Hour 0-59: Instant display with cached data, NO loading
          setLoading(false);
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
      if (trackerAnalysis && Object.keys(trackerAnalysis).length > 0) {
        // Extract the content from the tracker analysis if it's nested
        let analysisToSet = trackerAnalysis;
        if (trackerAnalysis.content && !trackerAnalysis.last_post) {
          analysisToSet = trackerAnalysis.content;
        }
        
        // Check if we have valid analysis data
        const hasValidData = analysisToSet && (
          analysisToSet.last_post || 
          analysisToSet.posting_frequency || 
          analysisToSet.media_distribution
        );

        if (hasValidData) {
          setAnalysis(analysisToSet);
          setLastFetchTime(Date.now());
          saveCachedData(userId, instagramAccountId, analysisToSet);
          setError(null);
        }
      }
      
      // Always set loading to false when trackerAnalysis query completes
      setLoading(false);
    }
  }, [trackerAnalysis, userId, instagramAccountId]);

  // Separate refresh functions for posts and tracker
  const refreshPosts = useCallback(async () => {
    if (!userId || !instagramAccountId) return;

    setRefreshingPosts(true);
    setError(null);
    setRefreshPostsSuccess(false);

    try {
      const response = await fetch(`${window.location.origin}/api/social/instagram/refresh-posts`, {
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

      if (response.ok) {
        setRefreshPostsSuccess(true);
        setTimeout(() => setRefreshPostsSuccess(false), 3000);
      }
    } catch (err) {
      console.error('❌ Instagram: Posts refresh failed:', err);
    } finally {
      setRefreshingPosts(false);
    }
  }, [userId, instagramAccountId]);

  const refreshTracker = useCallback(async () => {
    if (!userId || !instagramAccountId) return;

    setRefreshingTracker(true);
    setError(null);
    setRefreshTrackerSuccess(false);

    try {
      const response = await fetch(`${window.location.origin}/api/social/instagram/refresh-tracker`, {
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

      if (response.ok) {
        setRefreshTrackerSuccess(true);
        setTimeout(() => setRefreshTrackerSuccess(false), 3000);
      }
    } catch (err) {
      console.error('❌ Instagram: Tracker refresh failed:', err);
    } finally {
      setRefreshingTracker(false);
    }
  }, [userId, instagramAccountId]);

  // Load more posts function
  const loadMore = useCallback(async () => {
    if (!userId || !instagramAccountId || loadingMore) return;

    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      console.log('📄 Instagram: Loading more posts...');

      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('We need to know it\'s you to keep your content safe! Please log in again and let\'s get back to creating amazing things together.');
      }

      const response = await fetch(`${window.location.origin}/api/social/instagram/load-more`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          userId,
          instagramAccountId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to load more posts: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Instagram: Load more response:', data);
      
      if (data.success) {
        console.log('✅ Instagram: Successfully loaded more posts');
        console.log('📊 Instagram: Load more response data:', data);
        
        // The posts will automatically update via the Convex query
        // No need to manually update state - Convex will handle it
      } else {
        throw new Error('Your Instagram posts are taking a moment to load. Thanks for your patience—great content is worth waiting for!');
      }
    } catch (err) {
      console.error('❌ Instagram: Load more failed:', err);
      if (isMountedRef.current) {
        setLoadMoreError('Your Instagram posts are taking a moment to load. Thanks for your patience—great content is worth waiting for!');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [userId, instagramAccountId, loadingMore]);

  // Reset analysis when userId changes
  useEffect(() => {
    // Only reset if userId actually changed (not just on mount or re-renders)
    if (prevUserIdRef.current !== userId && prevUserIdRef.current !== undefined) {
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
    loading: loading || refreshingPosts || refreshingTracker,
    error,
    isConnected: !!instagramAccount,
    instagramAccount,
    lastFetchTime: lastFetchTime ? new Date(lastFetchTime) : null,
    isCached: !!lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION),
    // Load more functionality
    loadMore,
    loadingMore,
    loadMoreError,
    hasMorePosts: (paginationInfo?.hasMorePosts || false) || (queueStatus?.queueCount || 0) > 0,
    queueCount: queueStatus?.queueCount || 0,
    totalPostsFetched: paginationInfo?.totalPostsFetched || 0,
    // New separate refresh functions
    refreshPosts,
    refreshTracker,
    refreshingPosts,
    refreshingTracker,
    refreshPostsSuccess,
    refreshTrackerSuccess,
  };
} 