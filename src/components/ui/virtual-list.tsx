import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  overscan?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  overscan = 5,
  className,
  loadingComponent,
  emptyComponent,
  onEndReached,
  onEndReachedThreshold = 0.8,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const hasReachedEnd = useRef(false);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    
    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex,
      visibleItems: endIndex - Math.max(0, startIndex - overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      key: keyExtractor(item, startIndex + index),
    }));
  }, [items, visibleRange, keyExtractor]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    // Check if we've reached the end threshold
    if (onEndReached && !hasReachedEnd.current) {
      const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;
      if (scrollPercentage >= onEndReachedThreshold) {
        hasReachedEnd.current = true;
        onEndReached();
      }
    }
  }, [onEndReached, onEndReachedThreshold]);

  // Reset end reached flag when items change
  useEffect(() => {
    hasReachedEnd.current = false;
  }, [items.length]);

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height: containerHeight }}>
        {emptyComponent || <div>No items to display</div>}
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: items.length * itemHeight,
          position: 'relative',
        }}
      >
        {visibleItems.map(({ item, index, key }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Infinite scroll list with virtual scrolling
interface InfiniteVirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  overscan?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  hasMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  loadMoreThreshold?: number;
  error?: string | null;
  onRetry?: () => void;
}

export function InfiniteVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  overscan = 5,
  className,
  loadingComponent,
  emptyComponent,
  hasMore = false,
  isLoading = false,
  onLoadMore,
  loadMoreThreshold = 0.8,
  error,
  onRetry,
}: InfiniteVirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const hasReachedEnd = useRef(false);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    
    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex,
      visibleItems: endIndex - Math.max(0, startIndex - overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      key: keyExtractor(item, startIndex + index),
    }));
  }, [items, visibleRange, keyExtractor]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    // Check if we've reached the load more threshold
    if (onLoadMore && hasMore && !isLoading && !hasReachedEnd.current) {
      const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;
      if (scrollPercentage >= loadMoreThreshold) {
        hasReachedEnd.current = true;
        onLoadMore();
      }
    }
  }, [onLoadMore, hasMore, isLoading, loadMoreThreshold]);

  // Reset end reached flag when items change or loading completes
  useEffect(() => {
    if (!isLoading) {
      hasReachedEnd.current = false;
    }
  }, [items.length, isLoading]);

  // Intersection observer for loading trigger
  useEffect(() => {
    const loadingElement = loadingRef.current;
    if (!loadingElement || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && onLoadMore && !hasReachedEnd.current) {
          hasReachedEnd.current = true;
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observer.observe(loadingElement);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  // Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height: containerHeight }}>
        {emptyComponent || <div>No items to display</div>}
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: items.length * itemHeight + (hasMore ? itemHeight : 0), // Extra space for loading
          position: 'relative',
        }}
      >
        {visibleItems.map(({ item, index, key }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
        
        {/* Loading indicator */}
        {hasMore && (
          <div
            ref={loadingRef}
            style={{
              position: 'absolute',
              top: items.length * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
            className="flex items-center justify-center"
          >
            {error ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Failed to load more</span>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Retry
                  </button>
                )}
              </div>
            ) : isLoading ? (
              loadingComponent || (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">Loading more...</span>
                </div>
              )
            ) : (
              <div className="text-sm text-gray-400">Scroll to load more</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Grid virtual list for uniform grid layouts
interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  itemWidth: number;
  containerHeight: number;
  containerWidth: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  gap?: number;
  className?: string;
  emptyComponent?: React.ReactNode;
}

export function VirtualGrid<T>({
  items,
  itemHeight,
  itemWidth,
  containerHeight,
  containerWidth,
  renderItem,
  keyExtractor,
  gap = 0,
  className,
  emptyComponent,
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate grid dimensions
  const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const totalRows = Math.ceil(items.length / columnsPerRow);
  const rowHeight = itemHeight + gap;

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.min(
      startRow + Math.ceil(containerHeight / rowHeight) + 1,
      totalRows
    );
    
    return {
      startRow: Math.max(0, startRow - 1),
      endRow,
      startIndex: Math.max(0, startRow - 1) * columnsPerRow,
      endIndex: Math.min(endRow * columnsPerRow, items.length),
    };
  }, [scrollTop, rowHeight, containerHeight, totalRows, columnsPerRow, items.length]);

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex).map((item, index) => {
      const actualIndex = startIndex + index;
      const row = Math.floor(actualIndex / columnsPerRow);
      const col = actualIndex % columnsPerRow;
      
      return {
        item,
        index: actualIndex,
        key: keyExtractor(item, actualIndex),
        row,
        col,
      };
    });
  }, [items, visibleRange, keyExtractor, columnsPerRow]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height: containerHeight }}>
        {emptyComponent || <div>No items to display</div>}
      </div>
    );
  }

  return (
    <div
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalRows * rowHeight,
          position: 'relative',
        }}
      >
        {visibleItems.map(({ item, index, key, row, col }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: row * rowHeight,
              left: col * (itemWidth + gap),
              width: itemWidth,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Performance monitoring hook for virtual lists
export function useVirtualListPerformance() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    visibleItems: 0,
    totalItems: 0,
    scrollPosition: 0,
    fps: 0,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartRef = useRef(0);

  const startRender = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  const endRender = useCallback((visibleItems: number, totalItems: number) => {
    const renderTime = performance.now() - renderStartRef.current;
    frameCountRef.current++;
    
    const now = performance.now();
    const deltaTime = now - lastTimeRef.current;
    
    if (deltaTime >= 1000) {
      const fps = (frameCountRef.current * 1000) / deltaTime;
      setMetrics(prev => ({
        ...prev,
        renderTime,
        visibleItems,
        totalItems,
        fps: Math.round(fps),
      }));
      
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  }, []);

  const updateScrollPosition = useCallback((scrollTop: number) => {
    setMetrics(prev => ({
      ...prev,
      scrollPosition: scrollTop,
    }));
  }, []);

  return {
    metrics,
    startRender,
    endRender,
    updateScrollPosition,
  };
} 