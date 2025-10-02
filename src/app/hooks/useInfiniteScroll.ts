import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { PlatformContentData } from '@/types/content';
import { useContentStore } from '@/store/content-store';
import { useContentResolver } from '../dashboard/thinking_lab/lib/content-resolver';

// Intersection observer hook for detecting when user approaches end of content
export function useIntersectionObserver(
  targetRef: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {},
  onIntersect?: () => void
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting;
        setIsIntersecting(intersecting);
        
        if (intersecting && !hasIntersected) {
          setHasIntersected(true);
          onIntersect?.();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options,
      }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [targetRef, options, onIntersect, hasIntersected]);

  return { isIntersecting, hasIntersected };
}

// Debounced scroll velocity tracker
export function useScrollVelocity(delay: number = 100) {
  const [velocity, setVelocity] = useState(0);
  const lastScrollY = useRef(0);
  const lastTimestamp = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const updateVelocity = useCallback(() => {
    const currentScrollY = window.scrollY;
    const currentTimestamp = Date.now();
    
    if (lastTimestamp.current > 0) {
      const deltaY = Math.abs(currentScrollY - lastScrollY.current);
      const deltaTime = currentTimestamp - lastTimestamp.current;
      const currentVelocity = deltaTime > 0 ? deltaY / deltaTime : 0;
      setVelocity(currentVelocity);
    }
    
    lastScrollY.current = currentScrollY;
    lastTimestamp.current = currentTimestamp;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      updateVelocity();
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set velocity to 0 after delay
      timeoutRef.current = setTimeout(() => {
        setVelocity(0);
      }, delay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [updateVelocity, delay]);

  return velocity;
}

// Smart preloading based on scroll position and velocity
export function useSmartPreloading(
  platform: keyof PlatformContentData,
  userId: string | undefined,
  options: {
    threshold?: number; // Percentage of content scrolled before preloading
    velocityThreshold?: number; // Minimum velocity to trigger aggressive preloading
    debounceMs?: number;
  } = {}
) {
  const {
    threshold = 0.8,
    velocityThreshold = 0.5,
    debounceMs = 300,
  } = options;

  const { loadMoreContent, getPlatformScrollState } = useContentResolver(userId);
  const scrollVelocity = useScrollVelocity(debounceMs);
  const platformState = getPlatformScrollState(platform);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const shouldPreload = useMemo(() => {
    if (!platformState.hasMore || platformState.isLoadingMore) {
      return false;
    }

    // Fast scrolling = aggressive preloading
    const isScrollingFast = scrollVelocity > velocityThreshold;
    const effectiveThreshold = isScrollingFast ? threshold * 0.6 : threshold;

    // Calculate scroll progress (simplified)
    const scrollProgress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    
    return scrollProgress >= effectiveThreshold;
  }, [scrollVelocity, velocityThreshold, threshold, platformState]);

  useEffect(() => {
    if (shouldPreload) {
      // Debounce preloading to avoid excessive calls
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        loadMoreContent(platform);
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [shouldPreload, loadMoreContent, platform, debounceMs]);

  return { shouldPreload, scrollVelocity };
}

// Main infinite scroll hook for components
export function useInfiniteScroll(
  platform: keyof PlatformContentData,
  userId: string | undefined,
  options: {
    enabled?: boolean;
    threshold?: number;
    rootMargin?: string;
    debounceMs?: number;
    autoPreload?: boolean;
  } = {}
) {
  const {
    enabled = true,
    threshold = 0.1,
    rootMargin = '200px',
    debounceMs = 300,
    autoPreload = true,
  } = options;

  const { loadMoreContent, getPlatformScrollState } = useContentResolver(userId);
  const platformState = getPlatformScrollState(platform);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [isNearEnd, setIsNearEnd] = useState(false);

  // Smart preloading if enabled
  useSmartPreloading(platform, userId, {
    threshold: 0.8,
    velocityThreshold: 0.5,
    debounceMs,
  });

  // Intersection observer for load trigger
  const { isIntersecting } = useIntersectionObserver(
    loadingRef,
    {
      threshold,
      rootMargin,
    },
    useCallback(() => {
      if (enabled && platformState.hasMore && !platformState.isLoadingMore) {
        loadMoreContent(platform);
      }
    }, [enabled, platformState.hasMore, platformState.isLoadingMore, loadMoreContent, platform])
  );

  // Track when user is near the end
  useEffect(() => {
    setIsNearEnd(isIntersecting && platformState.hasMore);
  }, [isIntersecting, platformState.hasMore]);

  // Manual load more function
  const loadMore = useCallback(() => {
    if (platformState.hasMore && !platformState.isLoadingMore) {
      loadMoreContent(platform);
    }
  }, [platformState.hasMore, platformState.isLoadingMore, loadMoreContent, platform]);

  return {
    // Content data
    items: platformState.items,
    hasMore: platformState.hasMore,
    isLoading: platformState.isLoadingMore,
    error: platformState.error,
    totalLoaded: platformState.totalLoaded,
    
    // Scroll state
    isNearEnd,
    loadingRef,
    
    // Actions
    loadMore,
    
    // Stats
    loadedPages: platformState.loadedPages,
    lastLoadTime: platformState.lastLoadTime,
  };
}

// Hook for infinite content with all platforms
export function useInfiniteContent(
  userId: string | undefined,
  options: {
    platforms?: Array<keyof PlatformContentData>;
    autoInitialize?: boolean;
  } = {}
) {
  const {
    platforms = ['notes', 'youtube', 'instagram', 'gmail', 'insights', 'conversations'],
    autoInitialize = true,
  } = options;

  const contentResolver = useContentResolver(userId);
  const [activePlatform, setActivePlatform] = useState<keyof PlatformContentData>('notes');

  // Initialize content if needed
  useEffect(() => {
    if (autoInitialize && userId && !contentResolver.isInitialized) {
      // Content resolver already handles initialization
    }
  }, [autoInitialize, userId, contentResolver.isInitialized]);

  const platformStates = useMemo(() => {
    const states: Record<keyof PlatformContentData, any> = {} as any;
    platforms.forEach(platform => {
      states[platform] = contentResolver.getPlatformScrollState(platform);
    });
    return states;
  }, [platforms, contentResolver]);

  const loadMoreForPlatform = useCallback((platform: keyof PlatformContentData) => {
    return contentResolver.loadMoreContent(platform);
  }, [contentResolver]);

  const resetPlatform = useCallback((platform: keyof PlatformContentData) => {
    return contentResolver.resetPlatformScroll(platform);
  }, [contentResolver]);

  return {
    // Global state
    allContent: contentResolver.allContent,
    isInitialized: contentResolver.isInitialized,
    isLoading: contentResolver.isLoading,
    
    // Platform states
    platformStates,
    activePlatform,
    setActivePlatform,
    
    // Actions
    loadMoreForPlatform,
    resetPlatform,
    refreshAll: contentResolver.refreshContent,
    
    // Utilities
    findContentById: contentResolver.findContentById,
    getContentByPlatform: contentResolver.getContentByPlatform,
  };
}

// Hook for virtual scrolling calculations
export function useVirtualScroll(
  totalItems: number,
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      totalItems
    );
    
    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex,
      visibleItems: endIndex - Math.max(0, startIndex - overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, totalItems]);

  const scrollElementProps = useMemo(() => ({
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
    style: {
      height: containerHeight,
      overflow: 'auto',
    },
  }), [containerHeight]);

  const innerElementProps = useMemo(() => ({
    style: {
      height: totalItems * itemHeight,
      position: 'relative' as const,
    },
  }), [totalItems, itemHeight]);

  return {
    visibleRange,
    scrollElementProps,
    innerElementProps,
    scrollTop,
  };
}

// Optimized list renderer for virtual scrolling
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  renderItem: (item: T, index: number) => React.ReactNode,
  keyExtractor: (item: T, index: number) => string,
  overscan: number = 5
) {
  const { visibleRange, scrollElementProps, innerElementProps, scrollTop } = useVirtualScroll(
    items.length,
    itemHeight,
    containerHeight,
    overscan
  );

  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      key: keyExtractor(item, startIndex + index),
    }));
  }, [items, visibleRange, keyExtractor]);

  const renderList = useCallback(() => {
    return {
      scrollElementProps,
      innerElementProps,
      visibleItems: visibleItems.map(({ item, index, key }) => ({
        key,
        style: {
          position: 'absolute' as const,
          top: index * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
        content: renderItem(item, index),
      })),
    };
  }, [visibleItems, renderItem, itemHeight, scrollElementProps, innerElementProps]);

  return {
    renderList,
    visibleRange,
    scrollTop,
    visibleItems,
  };
} 