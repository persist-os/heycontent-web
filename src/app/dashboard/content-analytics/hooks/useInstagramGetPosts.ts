import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { InstagramContentItem } from '../types';
import { getApiKey } from '@/app/lib/api-helpers';

export function useInstagramGetPosts(userId?: string) {
  const [refreshingPosts, setRefreshingPosts] = useState(false);
  const [refreshPostsSuccess, setRefreshPostsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  
  // Refs to track if component is mounted
  const isMountedRef = useRef(true);

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

  // Get pagination info for load more functionality
  const paginationInfo = useQuery(
    api.instagramQueries.getAccountPagination,
    userId && instagramAccount?.instagramAccountId ? { 
      userId, 
      instagramAccountId: instagramAccount.instagramAccountId 
    } : "skip"
  );

  // Map Instagram items for compatibility
  const mappedInstagramItems = useMemo(() => {
    if (Array.isArray(instagramPosts)) {
      return instagramPosts.map((post: any): InstagramContentItem => {
        let mediaUrl = post.data.media_url;
        if (post.mediaType === 'CAROUSEL_ALBUM' && post.data.children?.length > 0) {
          const imageChild = post.data.children.find((c: any) => c.media_type === 'IMAGE');
          mediaUrl = imageChild?.media_url || post.data.children[0]?.media_url || mediaUrl;
        }

        // Extract metrics from post data and embedded insights
        const postInsights = post.data?.insights || {};
        const metrics = {
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
            mediaType: post.mediaType as 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS',
            thumbnailUrl: post.data.thumbnail_url,
            permalink: post.data.permalink,
            timestamp: post.data.timestamp,
            comments: post.data.comments || [],
          },
          metrics,
          children: post.data.children?.map((child: any) => ({
            id: child.id,
            media_url: child.media_url,
            media_type: child.media_type,
            thumbnail_url: child.thumbnail_url
          })) || [],
          analysis: post.analysis,
          analysisMarkdown: post.analysisMarkdown,
          convexData: post,
        };
      });
    }
    return [];
  }, [instagramPosts]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load more function that calls the API route
  const loadMore = useCallback(async () => {
    if (!userId || !instagramAccount?.instagramAccountId) return;

    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch(`${window.location.origin}/api/social/instagram/load-more`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          userId,
          instagramAccountId: instagramAccount.instagramAccountId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Success - the backend will have updated the Convex data
          // The component will re-render with new data from the queries
          console.log('✅ Instagram: Load more successful');
        } else {
          throw new Error(data.error || 'Failed to load more posts');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Instagram: Load more failed:', err);
      if (isMountedRef.current) {
        setLoadMoreError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [userId, instagramAccount?.instagramAccountId]);

  // Refresh posts function
  const refreshPosts = useCallback(async () => {
    if (!userId || !instagramAccount?.instagramAccountId) return;

    setRefreshingPosts(true);
    setError(null);
    setRefreshPostsSuccess(false);

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch(`${window.location.origin}/api/social/instagram/refresh-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          user_id: userId,
          instagram_account_id: instagramAccount.instagramAccountId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRefreshPostsSuccess(true);
          setTimeout(() => setRefreshPostsSuccess(false), 3000);
        } else {
          throw new Error(data.error || 'Failed to refresh posts');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Instagram: Posts refresh failed:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setRefreshingPosts(false);
      }
    }
  }, [userId, instagramAccount?.instagramAccountId]);

  // Dummy function for compatibility with old interface
  const refreshTracker = useCallback(async () => {
    // Not implemented in new version - posts only
  }, []);

  // Extract pagination info for load more functionality
  const hasMorePosts = paginationInfo?.hasMorePosts || false;
  const queueCount = paginationInfo?.totalPostsFetched || 0;
  const totalPostsFetched = mappedInstagramItems.length;

  return {
    // Main data - compatible with old interface
    items: mappedInstagramItems,
    analysis: null, // Not implemented in posts-only version
    loading: instagramPosts === undefined,
    error,
    isConnected: !!instagramAccount,
    instagramAccount,
    
    // Load more functionality - now properly implemented
    loadMore,
    loadingMore,
    loadMoreError,
    hasMorePosts,
    queueCount,
    totalPostsFetched,
    
    // Refresh functionality - only refreshPosts is implemented
    refreshPosts,
    refreshTracker, // Stub for compatibility
    refreshingPosts,
    refreshingTracker: false, // Not implemented
    refreshPostsSuccess,
    refreshTrackerSuccess: false, // Not implemented
  };
} 