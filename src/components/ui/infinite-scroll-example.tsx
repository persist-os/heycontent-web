import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInfiniteScroll } from '@/app/hooks/useInfiniteScroll';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { useInfiniteScrollErrorHandler } from '@/lib/error-handler';
import { useMemoryManager } from '@/lib/memory-manager';
import { InfiniteVirtualList } from './virtual-list';
import { UnifiedContent, PlatformContentData } from '@/types/content';
import { cn } from '@/lib/utils';

// Props for the infinite scroll example
interface InfiniteScrollExampleProps {
  platform: keyof PlatformContentData;
  userId: string;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
  enableVirtualization?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableErrorHandling?: boolean;
  enableMemoryManagement?: boolean;
  onItemClick?: (item: UnifiedContent) => void;
}

// Individual item component
const ContentItem: React.FC<{ 
  item: UnifiedContent; 
  index: number; 
  onItemClick?: (item: UnifiedContent) => void;
}> = ({ item, index, onItemClick }) => {
  const handleClick = useCallback(() => {
    onItemClick?.(item);
  }, [item, onItemClick]);

  return (
    <div 
      className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Platform indicator */}
        <div className={cn(
          "w-2 h-2 rounded-full mt-2",
          item.platform === 'smart-notes' && "bg-blue-500",
          item.platform === 'youtube' && "bg-red-500",
          item.platform === 'instagram' && "bg-pink-500",
          item.platform === 'gmail' && "bg-green-500",
          item.platform === 'insights' && "bg-purple-500"
        )} />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {item.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {item.content}
          </p>
          
          {/* Metadata */}
          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
            <span className="capitalize">{item.platform}</span>
            <span>•</span>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            {item.tags.length > 0 && (
              <>
                <span>•</span>
                <span>{item.tags.slice(0, 2).join(', ')}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Thumbnail/media */}
        {(item.thumbnailUrl || item.mediaUrl) && (
          <img 
            src={item.thumbnailUrl || item.mediaUrl} 
            alt={item.title}
            className="w-12 h-12 object-cover rounded"
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
};

// Performance metrics display
const PerformanceMetrics: React.FC<{
  metrics: any;
  summary: any;
}> = ({ metrics, summary }) => {
  if (!metrics || !summary) return null;

  return (
    <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono">
      <div className="grid grid-cols-2 gap-2">
        <div>FPS: {metrics.fps}</div>
        <div>Grade: {summary.performanceGrade}</div>
        <div>Render: {metrics.renderTime}ms</div>
        <div>Memory: {metrics.memoryUsage}MB</div>
        <div>Items: {metrics.itemsRendered}</div>
        <div>Visible: {metrics.itemsInViewport}</div>
      </div>
      {summary.warnings.length > 0 && (
        <div className="mt-2 text-yellow-300">
          ⚠️ {summary.warnings.length} warnings
        </div>
      )}
    </div>
  );
};

// Error display component
const ErrorDisplay: React.FC<{
  error: string | null;
  onRetry: () => void;
}> = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-center">
        <div className="text-red-600 mb-2">⚠️ Error Loading Content</div>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      <span className="text-sm text-gray-600">Loading more content...</span>
    </div>
  </div>
);

// Main infinite scroll example component
export const InfiniteScrollExample: React.FC<InfiniteScrollExampleProps> = ({
  platform,
  userId,
  className,
  itemHeight = 120,
  containerHeight = 600,
  enableVirtualization = true,
  enablePerformanceMonitoring = true,
  enableErrorHandling = true,
  enableMemoryManagement = true,
  onItemClick,
}) => {
  // State
  const [debugMode, setDebugMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousScrollTopRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(Date.now());

  // Core infinite scroll hook
  const {
    items,
    hasMore,
    isLoading,
    error,
    totalLoaded,
    loadingRef,
    loadMore,
    isNearEnd,
  } = useInfiniteScroll(platform, userId, {
    enabled: true,
    threshold: 0.1,
    rootMargin: '200px',
    debounceMs: 100,
    autoPreload: true,
  });

  // Performance monitoring
  const {
    startMonitoring,
    stopMonitoring,
    recordRenderTime,
    updateItemCounts,
    updateScrollVelocity,
    getCurrentMetrics,
    getPerformanceSummary,
  } = usePerformanceMonitor(platform);

  // Error handling
  const {
    handleError,
    getErrorStats,
    resetCircuitBreaker,
    createSafeFunction,
  } = useInfiniteScrollErrorHandler(platform);

  // Memory management
  const {
    addItems,
    getStats: getMemoryStats,
    clear: clearMemory,
  } = useMemoryManager<UnifiedContent>({
    maxItems: 500,
    purgeThreshold: 0.9,
    retentionCount: 300,
  });

  // Performance monitoring lifecycle
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      startMonitoring();
      return () => stopMonitoring();
    }
  }, [enablePerformanceMonitoring, startMonitoring, stopMonitoring]);

  // Memory management for items
  useEffect(() => {
    if (enableMemoryManagement && items.length > 0) {
      addItems(items);
    }
  }, [items, enableMemoryManagement, addItems]);

  // Item renderer with performance tracking
  const renderItem = useCallback((item: UnifiedContent, index: number) => {
    const startTime = performance.now();
    
    const component = (
      <ContentItem 
        item={item} 
        index={index} 
        onItemClick={onItemClick}
      />
    );
    
    if (enablePerformanceMonitoring) {
      const renderTime = performance.now() - startTime;
      recordRenderTime(renderTime);
    }
    
    return component;
  }, [onItemClick, enablePerformanceMonitoring, recordRenderTime]);

  // Key extractor for virtual list
  const keyExtractor = useCallback((item: UnifiedContent, index: number) => {
    return item.id || `item-${index}`;
  }, []);

  // Handle scroll with performance tracking
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const startTime = performance.now();
    const currentTime = Date.now();
    
    // Calculate scroll velocity properly
    const scrollTop = e.currentTarget.scrollTop;
    const scrollHeight = e.currentTarget.scrollHeight;
    const clientHeight = e.currentTarget.clientHeight;
    
    // Calculate actual scroll velocity using previous position and time
    const scrollDelta = Math.abs(scrollTop - previousScrollTopRef.current);
    const timeDelta = currentTime - lastScrollTimeRef.current;
    const scrollVelocity = timeDelta > 0 ? scrollDelta / timeDelta : 0; // pixels per millisecond
    
    // Update refs for next calculation
    previousScrollTopRef.current = scrollTop;
    lastScrollTimeRef.current = currentTime;
    
    if (enablePerformanceMonitoring) {
      updateScrollVelocity(scrollVelocity);
      updateItemCounts(items.length, Math.ceil(clientHeight / itemHeight));
      
      const scrollLatency = performance.now() - startTime;
      // recordScrollLatency(scrollLatency); // Would need to add this to hook
    }
  }, [items.length, itemHeight, enablePerformanceMonitoring, updateScrollVelocity, updateItemCounts]);

  // Safe load more function with error handling
  const safeLoadMore = useCallback(async () => {
    if (enableErrorHandling) {
      try {
        await loadMore();
      } catch (error) {
        console.error('Error loading more content:', error);
      }
    } else {
      loadMore();
    }
  }, [loadMore, enableErrorHandling]);

  // Get current metrics for display
  const currentMetrics = enablePerformanceMonitoring ? getCurrentMetrics() : null;
  const performanceSummary = enablePerformanceMonitoring ? getPerformanceSummary() : null;
  const errorStats = enableErrorHandling ? getErrorStats() : null;
  const memoryStats = enableMemoryManagement ? getMemoryStats() : null;

  // Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height: containerHeight }}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">📭</div>
          <p className="text-sm text-gray-600">No content available</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn("relative border border-gray-200 rounded-lg overflow-hidden", className)}
      style={{ height: containerHeight }}
    >
      {/* Debug toggle */}
      <button
        onClick={() => setDebugMode(!debugMode)}
        className="absolute top-2 left-2 z-10 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
      >
        {debugMode ? '🔍 Hide Debug' : '🔍 Debug'}
      </button>

      {/* Performance metrics overlay */}
      {debugMode && enablePerformanceMonitoring && (
        <PerformanceMetrics metrics={currentMetrics} summary={performanceSummary} />
      )}

      {/* Error display */}
      {error && (
        <ErrorDisplay error={error} onRetry={() => resetCircuitBreaker()} />
      )}

      {/* Content list */}
      {!error && (
        <>
          {enableVirtualization ? (
            <InfiniteVirtualList
              items={items}
              itemHeight={itemHeight}
              containerHeight={containerHeight}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              hasMore={hasMore}
              isLoading={isLoading}
              onLoadMore={safeLoadMore}
              loadingComponent={<LoadingSpinner />}
              className="w-full"
            />
          ) : (
            <div 
              className="overflow-auto h-full"
              onScroll={handleScroll}
            >
              {items.map((item, index) => (
                <div key={keyExtractor(item, index)}>
                  {renderItem(item, index)}
                </div>
              ))}
              
              {/* Loading indicator */}
              {hasMore && (
                <div ref={loadingRef}>
                  <LoadingSpinner />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Debug information */}
      {debugMode && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono max-w-xs">
          <div className="space-y-1">
            <div>Platform: {platform}</div>
            <div>Items: {items.length}</div>
            <div>Total Loaded: {totalLoaded}</div>
            <div>Has More: {hasMore ? 'Yes' : 'No'}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Near End: {isNearEnd ? 'Yes' : 'No'}</div>
            {errorStats && (
              <div>Errors: {errorStats.totalErrors}</div>
            )}
            {memoryStats && (
              <div>Memory: {memoryStats.itemsInMemory} items</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Usage example component
export const InfiniteScrollExampleUsage: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<keyof PlatformContentData>('youtube');
  const [selectedItem, setSelectedItem] = useState<UnifiedContent | null>(null);

  const handleItemClick = useCallback((item: UnifiedContent) => {
    setSelectedItem(item);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Infinite Scroll Example</h1>
      
      {/* Platform selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Platform:</label>
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value as keyof PlatformContentData)}
          className="px-3 py-2 border border-gray-300 rounded-md"
          aria-label="Select platform for infinite scroll demo"
        >
          <option value="notes">Smart Notes</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
          <option value="gmail">Gmail</option>
          <option value="insights">Insights</option>
        </select>
      </div>

      {/* Feature toggles */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked />
          <span className="text-sm">Virtual Scrolling</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked />
          <span className="text-sm">Performance Monitoring</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked />
          <span className="text-sm">Error Handling</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked />
          <span className="text-sm">Memory Management</span>
        </label>
      </div>

      {/* Infinite scroll component */}
      <InfiniteScrollExample
        platform={selectedPlatform}
        userId="demo-user"
        className="shadow-lg"
        itemHeight={120}
        containerHeight={600}
        enableVirtualization={true}
        enablePerformanceMonitoring={true}
        enableErrorHandling={true}
        enableMemoryManagement={true}
        onItemClick={handleItemClick}
      />

      {/* Selected item modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{selectedItem.title}</h3>
            <p className="text-gray-600 mb-4">{selectedItem.content}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollExample; 