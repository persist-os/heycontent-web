import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { YouTubeContentItem } from '../types';

// 1-Hour Lazy Loading Cache Configuration
const CACHE_KEY_PREFIX = 'youtube_analytics_cache_';
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes (1-hour lazy loading cycle)

interface CachedData {
  data: YouTubeContentItem[];
  timestamp: number;
  userId: string;
}

// In-memory cache to persist data across component mounts
const memoryCache = new Map<string, CachedData>();

// Get cache key for a user
const getCacheKey = (userId: string) => `${CACHE_KEY_PREFIX}${userId}`;

// Load cached data with 1-hour lazy loading logic
const loadCachedData = (userId: string): CachedData | null => {
  const cacheKey = getCacheKey(userId);
  
  // Check memory cache first
  const memoryData = memoryCache.get(cacheKey);
  if (memoryData && Date.now() - memoryData.timestamp < CACHE_DURATION) {
    console.log('📺 YouTube: Using memory cache (hour 0-59)');
    return memoryData;
  }
  
  // Check localStorage
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsedCache: CachedData = JSON.parse(cached);
      if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
        console.log('📺 YouTube: Using localStorage cache (hour 0-59)');
        // Restore to memory cache
        memoryCache.set(cacheKey, parsedCache);
        return parsedCache;
      } else {
        console.log('📺 YouTube: Cache expired (hour 61+) - will fetch fresh data');
      }
    }
  } catch (error) {
    console.warn('Failed to load cached YouTube data:', error);
  }
  
  return null;
};

// Save data to cache with 1-hour duration
const saveCachedData = (userId: string, data: YouTubeContentItem[]) => {
  const cacheKey = getCacheKey(userId);
  const cachedData: CachedData = {
    data,
    timestamp: Date.now(),
    userId
  };
  
  // Save to memory cache
  memoryCache.set(cacheKey, cachedData);
  
  // Save to localStorage
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cachedData));
    console.log('📺 YouTube: Cached fresh data for next 60 minutes');
  } catch (error) {
    console.warn('Failed to save YouTube data to localStorage:', error);
  }
};

export function useYouTubeAnalytics(userId?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedItems, setCachedItems] = useState<YouTubeContentItem[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  
  // Refs to track if component is mounted
  const isMountedRef = useRef(true);

  // 1-Hour Lazy Loading: Only fetch when cache is expired or doesn't exist
  const shouldFetchFromConvex = useMemo(() => {
    if (!userId) return false;
    
    const cached = loadCachedData(userId);
    const isCacheValid = cached && (Date.now() - cached.timestamp < CACHE_DURATION);
    
    // FIXED: Also fetch if cache is valid but empty (no data)
    const hasValidData = cached && cached.data && cached.data.length > 0;
    
    // Only fetch if cache is invalid/expired OR if cache is empty
    return !isCacheValid || !hasValidData;
  }, [userId]);

  // FIXED: Query for YouTube channel data to check connection status
  const youtubeChannel = useQuery(
    api.youtubeQueries.getYouTubeChannelData,
    userId ? { userId } : "skip"
  );

  // Convex query for YouTube videos (only when cache expired)
  const youtubeVideos = useQuery(
    api.youtubeQueries.listUserYouTubeVideos,
    shouldFetchFromConvex && userId ? { userId } : "skip"
  );

  // Map YouTube items with caching
  const mappedYouTubeItems: YouTubeContentItem[] = useMemo(() => {
    if (youtubeVideos && Array.isArray(youtubeVideos)) {
      const mapped = youtubeVideos.map((video: any): YouTubeContentItem => ({
        id: video.id || '',
        platform: 'youtube' as const,
        publishedAt: video.publishedAt || new Date().toISOString(),
        content: {
          title: video.content?.title || 'Untitled Video',
          description: video.content?.description || '',
          thumbnailUrl: video.content?.thumbnailUrl || '',
          videoUrl: video.content?.videoUrl || `https://www.youtube.com/watch?v=${video.id}`,
          channelTitle: video.content?.channelTitle || '',
        },
        metrics: {
          views: video.metrics?.views || 0,
          likes: video.metrics?.likes || 0,
          dislikes: video.metrics?.dislikes || 0,
          comments: video.metrics?.comments || 0,
          watchTimeMinutes: video.metrics?.watchTimeMinutes || 0,
          averageViewDurationSeconds: video.metrics?.averageViewDurationSeconds || 0,
        },
        analysis: video.analysis || null,
        aiAnalysis: video.aiAnalysis || null,
      }));
      
      // Cache the data when it's loaded from Convex
      if (userId && mapped.length > 0) {
        saveCachedData(userId, mapped);
        setLastFetchTime(Date.now());
        console.log('📺 YouTube: Fresh data fetched from Convex and cached');
      }
      
      return mapped;
    }
    return cachedItems; // Return cached items if Convex data is not available
  }, [youtubeVideos, cachedItems, userId]);

  // Initialize with cached data on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 1-Hour Lazy Loading: Load cached data immediately on mount
  useEffect(() => {
    if (userId) {
      const cached = loadCachedData(userId);
      if (cached && cached.data.length > 0) {
        console.log('📺 YouTube: Loading cached data on mount');
        setCachedItems(cached.data);
        setLastFetchTime(cached.timestamp);
        
        // Check if cache is still valid (within 60 minutes)
        const dataAge = Date.now() - cached.timestamp;
        if (dataAge < CACHE_DURATION) {
          // Hour 0-59: Instant display with cached data
          setLoading(false);
          console.log(`📺 YouTube: Cache valid for ${Math.round((CACHE_DURATION - dataAge) / 60000)} more minutes`);
        } else {
          // Hour 61+: Cache expired, will fetch fresh data
          console.log('📺 YouTube: Cache expired, will fetch fresh data');
        }
        setError(null);
      } else {
        console.log('📺 YouTube: No cache found, will fetch fresh data');
      }
    }
  }, [userId]);

  // Handle loading state for when Convex query is skipped due to valid cache
  useEffect(() => {
    if (userId && !shouldFetchFromConvex) {
      // If we're not fetching from Convex because cache is valid, ensure loading is false
      const cached = loadCachedData(userId);
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        setLoading(false);
      }
    }
  }, [userId, shouldFetchFromConvex]);

  // Handle Convex data processing
  useEffect(() => {
    if (youtubeVideos !== undefined && userId) {
      console.log('📺 YouTube: Processing fresh Convex data');
      setLoading(false);
    }
  }, [youtubeVideos, userId]);

  // Reset cache when userId changes
  useEffect(() => {
    // Don't reset cache - let the cache loading effect handle it
    // This was causing the cache to be cleared immediately after loading
  }, [userId]);

  return {
    items: mappedYouTubeItems,
    loading: loading,
    error,
    isConnected: !!youtubeChannel?.id,
    rawData: youtubeVideos,
    lastFetchTime: lastFetchTime ? new Date(lastFetchTime) : null,
    isCached: !!lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)
  };
} 