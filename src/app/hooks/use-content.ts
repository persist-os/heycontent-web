import { useEffect } from 'react';
import { useConvex } from 'convex/react';
import { useContentStore } from '@/store/content-store';
import { PlatformContentData } from '@/types/content';

// Export hooks for backward compatibility and easy consumption

/**
 * Hook to get all content data and store state
 */
export const useContentData = () => {
  const store = useContentStore();
  return {
    allContent: store.allContent,
    content: store.content,
    loading: store.loading,
    errors: store.errors,
    isInitialized: store.isInitialized,
  };
};

/**
 * Hook to get content for a specific platform with infinite scroll support
 */
export const usePlatformContent = (platform: keyof PlatformContentData) => {
  const content = useContentStore(state => state.content[platform]);
  const loading = useContentStore(state => state.loading[platform]);
  const error = useContentStore(state => state.errors[platform]);
  
  return {
    content: content.items,
    loading,
    error,
    hasMore: content.hasMore,
    isLoadingMore: content.isLoadingMore,
    totalLoaded: content.totalLoaded,
    isInitialized: content.isInitialized,
  };
};

/**
 * Hook to manage content operations (refresh, load more, etc.)
 */
export const useContentManager = (userId: string | undefined) => {
  const convex = useConvex();
  const store = useContentStore();
  
  useEffect(() => {
    if (userId && !store.isInitialized) {
      store.initializeContent(userId, convex);
    }
  }, [userId, store.isInitialized]);

  return {
    refreshContent: () => userId && store.refreshContent(userId, convex),
    invalidateContent: store.invalidateContent,
    loadMoreContent: (platform: keyof PlatformContentData) => 
      userId && store.loadMoreContent(userId, platform, convex),
    resetPlatformScroll: store.resetPlatformScroll,
    refreshPlatform: (platform: keyof PlatformContentData) =>
      userId && store.refreshPlatform(userId, platform, convex),
  };
};

/**
 * Hook to get content resolution helpers
 */
export const useContentResolver = () => {
  const store = useContentStore();
  
  return {
    findContentById: store.findContentById,
    getContentByPlatform: store.getContentByPlatform,
    getAllLinkableContent: store.getAllLinkableContent,
    getContentByTab: store.getContentByTab,
    getLegacyContentByPlatform: store.getLegacyContentByPlatform,
  };
};

/**
 * Hook for cache management
 */
export const useContentCache = () => {
  const store = useContentStore();
  
  return {
    isCacheValid: store.isCacheValid,
    invalidateContent: store.invalidateContent,
    cacheTimestamp: store.cacheTimestamp,
    lastFetchedUserId: store.lastFetchedUserId,
  };
};

/**
 * Hook to get content for specific tab (convenience wrapper)
 */
export const useTabContent = (currentTab: string) => {
  const getContentByTab = useContentStore(state => state.getContentByTab);
  const loading = useContentStore(state => state.loading);
  const errors = useContentStore(state => state.errors);
  
  const content = getContentByTab(currentTab);
  
  // Determine loading state based on tab
  const tabLower = currentTab.toLowerCase();
  let isLoading = false;
  let error = null;
  
  switch (tabLower) {
    case 'notes':
    case 'smart-notes':
      isLoading = loading.notes;
      error = errors.notes;
      break;
    case 'youtube':
      isLoading = loading.youtube;
      error = errors.youtube;
      break;
    case 'instagram':
      isLoading = loading.instagram;
      error = errors.instagram;
      break;
    case 'gmail':
      isLoading = loading.gmail;
      error = errors.gmail;
      break;
    case 'insights':
    case 'ai-insights':
      isLoading = loading.insights;
      error = errors.insights;
      break;
    case 'all':
    default:
      // For 'all' tab, check if any platform is loading
      isLoading = Object.values(loading).some(Boolean);
      // For errors, show if there are any errors across platforms
      const allErrors = Object.values(errors).filter(Boolean);
      error = allErrors.length > 0 ? allErrors.join(', ') : null;
      break;
  }
  
  return {
    content,
    loading: isLoading,
    error,
    count: content.length,
  };
};

// Legacy export for backward compatibility
export { useContentStore } from '@/store/content-store'; 