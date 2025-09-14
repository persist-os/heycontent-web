import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { ConvexReactClient } from 'convex/react';
import {
  ContentStoreState,
  PlatformContentData,
  UnifiedContent,
  initialContentState,
  initialPlatformLoadingState,
  initialPlatformErrorState,
  createInitialInfiniteScrollState,
  INFINITE_SCROLL_CONFIG
} from '@/types/content';
import { initializePlatform, loadMoreContent } from '@/lib/platform-fetcher';

export const useContentStore = create<ContentStoreState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      content: initialContentState,
      allContent: [],
      loading: initialPlatformLoadingState,
      isInitialized: false,
      lastFetchedUserId: null,
      cacheTimestamp: 0,
      cacheValidDuration: 5 * 60 * 1000, // 5 minutes
      errors: initialPlatformErrorState,

      // Check if cache is still valid
      isCacheValid: () => {
        const state = get();
        const now = Date.now();
        return state.cacheTimestamp > 0 && (now - state.cacheTimestamp) < state.cacheValidDuration;
      },

      // Initialize content data with infinite scroll support
      initializeContent: async (userId: string, convex: ConvexReactClient) => {
        const state = get();
        const initStartTime = performance.now();
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 [CONTENT STORE] initializeContent called for userId:', userId, 'at:', new Date().toISOString());
        }
        
        // Check if we have valid cached data for this user
        if (state.isInitialized && 
            state.lastFetchedUserId === userId && 
            state.isCacheValid()) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 [CONTENT STORE] ⚡ USING CACHED DATA - skipping network request!');
          }
          return;
        }

        // Skip if already loading for this user
        if (Object.values(state.loading).some(Boolean) && state.lastFetchedUserId === userId) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 [CONTENT STORE] Skipping init - already loading for user:', userId);
          }
          return;
        }

        set({ 
          loading: {
            notes: true,
            conversations: true,
          },
          errors: initialPlatformErrorState,
          lastFetchedUserId: userId 
        });

        try {
          // Initialize all platforms in parallel
          await Promise.all([
            get().initializePlatform(userId, 'notes', convex),
            get().initializePlatform(userId, 'conversations', convex),
          ]);

          // Update allContent after all platforms are initialized
          const currentState = get();
          const allContent = [
            ...currentState.content.notes.items,
            ...currentState.content.conversations.items,
          ];

          // Debug logging for content
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 [CONTENT STORE] Content debug:', {
              notesCount: currentState.content.notes.items.length,
              conversationsCount: currentState.content.conversations.items.length,
              totalContent: allContent.length
            });
          }

          set({
            allContent,
            loading: initialPlatformLoadingState,
            isInitialized: true,
            cacheTimestamp: Date.now(),
            errors: initialPlatformErrorState,
          });

          const totalTime = performance.now() - initStartTime;
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 [CONTENT STORE] ⚡ initializeContent COMPLETED in:', Math.round(totalTime), 'ms');
            console.log('🚀 [CONTENT STORE] Content summary:', {
              notes: currentState.content.notes.items.length,
              conversations: currentState.content.conversations.items.length,
              total: allContent.length,
            });
          }
        } catch (error) {
          const errorTime = performance.now();
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ [CONTENT STORE] Failed to initialize content in:', Math.round(errorTime - initStartTime), 'ms, error:', error);
          }
          set({
            loading: initialPlatformLoadingState,
            errors: {
              notes: error instanceof Error ? error.message : 'Failed to load content',
              conversations: error instanceof Error ? error.message : 'Failed to load content',
            },
          });
        }
      },

      // Initialize a specific platform with infinite scroll
      initializePlatform: async (userId: string, platform: keyof PlatformContentData, convex: ConvexReactClient) => {
        const state = get();
        
        // Skip if already initialized
        if (state.content[platform].isInitialized) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 [CONTENT STORE] Platform ${platform} already initialized, skipping`);
          }
          return;
        }

        try {
          // Set platform loading state
          set(state => ({
            content: {
              ...state.content,
              [platform]: {
                ...state.content[platform],
                isLoadingMore: true,
                error: null,
              }
            }
          }));

          const result = await initializePlatform(userId, platform, convex);

          // Update platform state
          set(state => ({
            content: {
              ...state.content,
              [platform]: {
                ...state.content[platform],
                items: result.items,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalLoaded: result.items.length,
                isInitialized: true,
                isLoadingMore: false,
                loadedPages: 1,
                lastLoadTime: Date.now(),
                error: null,
              }
            }
          }));

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load content';
          set(state => ({
            content: {
              ...state.content,
              [platform]: {
                ...state.content[platform],
                isLoadingMore: false,
                error: `${platform}: ${errorMessage}`,
                isInitialized: false,
              }
            },
            errors: {
              ...state.errors,
              [platform]: `${platform}: ${errorMessage}`
            }
          }));
        }
      },

      // Load more content for a specific platform
      loadMoreContent: async (userId: string, platform: keyof PlatformContentData, convex: ConvexReactClient) => {
        const state = get();
        const platformState = state.content[platform];
        
        // Skip if already loading or no more content
        if (platformState.isLoadingMore || !platformState.hasMore) {
          return;
        }

        try {
          // Set loading state
          set(state => ({
            content: {
              ...state.content,
              [platform]: {
                ...state.content[platform],
                isLoadingMore: true,
                error: null,
              }
            }
          }));

          const result = await loadMoreContent(userId, platform, convex, platformState.nextCursor);

          // Apply memory management (sliding window)
          const currentItems = platformState.items;
          const combinedItems = [...currentItems, ...result.items];
          
          let finalItems = combinedItems;
          if (combinedItems.length > INFINITE_SCROLL_CONFIG.MAX_ITEMS_IN_MEMORY) {
            // Remove oldest items to stay within memory limit
            const excessItems = combinedItems.length - INFINITE_SCROLL_CONFIG.MAX_ITEMS_IN_MEMORY;
            finalItems = combinedItems.slice(excessItems);
          }

          // Update platform state
          set(state => ({
            content: {
              ...state.content,
              [platform]: {
                ...state.content[platform],
                items: finalItems,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalLoaded: platformState.totalLoaded + result.items.length,
                isLoadingMore: false,
                loadedPages: platformState.loadedPages + 1,
                lastLoadTime: Date.now(),
                error: null,
              }
            }
          }));

          // Update allContent
          const updatedState = get();
          const allContent = [
            ...updatedState.content.notes.items,
            ...updatedState.content.conversations.items,
          ];

          set({ allContent });

        } catch (error) {
          console.error(`Failed to load more ${platform} content:`, error);
          set(state => ({
            content: {
              ...state.content,
              [platform]: {
                ...state.content[platform],
                isLoadingMore: false,
                error: error instanceof Error ? error.message : 'Failed to load more content',
              }
            }
          }));
        }
      },

      // Reset platform scroll state
      resetPlatformScroll: (platform: keyof PlatformContentData) => {
        set(state => ({
          content: {
            ...state.content,
            [platform]: createInitialInfiniteScrollState(),
          }
        }));
      },

      // Refresh all content data (force refetch)
      refreshContent: async (userId: string, convex: ConvexReactClient) => {
        const refreshStartTime = performance.now();
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 [CONTENT STORE] refreshContent called for userId:', userId, 'at:', new Date().toISOString());
        }
        
        // Force clear cache first for true refresh
        set({ 
          loading: {
            notes: true,
            conversations: true,
          },
          errors: initialPlatformErrorState,
          lastFetchedUserId: userId,
          cacheTimestamp: 0, // Invalidate cache immediately
          content: initialContentState, // Reset all infinite scroll states
        });

        try {
          // Use the same logic as initialize but force refetch
          await get().initializeContent(userId, convex);
          
          const totalRefreshTime = performance.now() - refreshStartTime;
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 [CONTENT STORE] ✅ refreshContent COMPLETED in:', Math.round(totalRefreshTime), 'ms');
          }
        } catch (error) {
          const errorTime = performance.now();
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ [CONTENT STORE] Failed to refresh content in:', Math.round(errorTime - refreshStartTime), 'ms, error:', error);
          }
          set({
            loading: initialPlatformLoadingState,
            errors: {
              notes: error instanceof Error ? error.message : 'Failed to refresh content',
              conversations: error instanceof Error ? error.message : 'Failed to refresh content',
            },
          });
        }
      },

      // Refresh specific platform
      refreshPlatform: async (userId: string, platform: keyof PlatformContentData, convex: ConvexReactClient) => {
        // Reset platform state and reload
        set(state => ({
          content: {
            ...state.content,
            [platform]: createInitialInfiniteScrollState(),
          }
        }));

        await get().initializePlatform(userId, platform, convex);

        // Update allContent
        const updatedState = get();
        const allContent = [
          ...updatedState.content.notes.items,
          ...updatedState.content.conversations.items,
        ];

        set({ allContent, cacheTimestamp: Date.now() });
      },

      // Invalidate data (force next fetch)
      invalidateContent: () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🗑️ [CONTENT STORE] invalidateContent called - clearing all cached data');
        }
        set({
          isInitialized: false,
          lastFetchedUserId: null,
          cacheTimestamp: 0,
          content: initialContentState,
          allContent: [],
          errors: initialPlatformErrorState,
          loading: initialPlatformLoadingState,
        });
      },

      // Content resolution helpers
      findContentById: (contentId: string) => {
        const state = get();
        return state.allContent.find(content => content.id === contentId) || null;
      },

      getContentByPlatform: (platform: keyof PlatformContentData) => {
        const state = get();
        return state.content[platform].items || [];
      },

      getAllLinkableContent: () => {
        const state = get();
        return state.allContent;
      },

      getContentByTab: (currentTab: string) => {
        const state = get();
        
        // Map tab names to content types and platforms
        let result: UnifiedContent[] = [];
        const tabLower = currentTab.toLowerCase();
        
        switch (tabLower) {
          case 'notes':
          case 'smart-notes':
            result = state.content.notes.items;
            break;
          
          case 'conversations':
          case 'chat':
            result = state.content.conversations.items;
            break;
          
          case 'all':
          default:
            // Return all content for 'all' tab or unknown tabs
            result = state.allContent;
            break;
        }
        
        return result;
      },

      // Legacy compatibility
      getLegacyContentByPlatform: (platform: keyof PlatformContentData) => {
        const state = get();
        return state.content[platform].items || [];
      },
    })),
    {
      name: 'content-store-cache',
      partialize: (state) => ({
        content: state.content,
        allContent: state.allContent,
        isInitialized: state.isInitialized,
        lastFetchedUserId: state.lastFetchedUserId,
        cacheTimestamp: state.cacheTimestamp,
      }),
    }
  )
); 