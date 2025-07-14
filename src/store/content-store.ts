import { useEffect } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { ConvexReactClient, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';

// Unified content interface for all platforms
export interface UnifiedContent {
  id: string;
  title: string;
  type: 'note' | 'youtube' | 'instagram' | 'gmail' | 'insight';
  contentType: string;
  platform: string;
  createdAt: number;
  updatedAt: number;
  important: boolean;
  tags: string[];
  analysis?: any;
  content?: string;
  // YouTube specific
  thumbnailUrl?: string;
  statistics?: any;
  // Instagram specific
  mediaUrl?: string;
  insights?: any;
  // Gmail specific
  from?: string;
  messageCount?: number;
  category?: string;
}

// Infinite scroll state per platform
export interface InfiniteScrollState {
  items: UnifiedContent[];
  hasMore: boolean;
  isLoadingMore: boolean;
  nextCursor: string | null;
  totalLoaded: number;
  isInitialized: boolean;
  error: string | null;
  // Memory management
  maxItems: number;
  loadedPages: number;
  // Performance tracking
  lastLoadTime: number;
  scrollVelocity: number;
}

// Loading states per platform
export interface PlatformLoadingState {
  notes: boolean;
  youtube: boolean;
  instagram: boolean;
  gmail: boolean;
  insights: boolean;
}

// Error states per platform
export interface PlatformErrorState {
  notes: string | null;
  youtube: string | null;
  instagram: string | null;
  gmail: string | null;
  insights: string | null;
}

// Content data per platform with infinite scroll support
export interface PlatformContentData {
  notes: InfiniteScrollState;
  youtube: InfiniteScrollState;
  instagram: InfiniteScrollState;
  gmail: InfiniteScrollState;
  insights: InfiniteScrollState;
}

// Legacy flat content arrays for backward compatibility
export interface LegacyPlatformContentData {
  notes: UnifiedContent[];
  youtube: UnifiedContent[];
  instagram: UnifiedContent[];
  gmail: UnifiedContent[];
  insights: UnifiedContent[];
}

export interface ContentStoreState {
  // Data
  content: PlatformContentData;
  allContent: UnifiedContent[];
  
  // Loading states
  loading: PlatformLoadingState;
  isInitialized: boolean;
  lastFetchedUserId: string | null;
  
  // Cache metadata
  cacheTimestamp: number;
  cacheValidDuration: number; // 5 minutes in milliseconds
  
  // Error states
  errors: PlatformErrorState;
  
  // Actions
  initializeContent: (userId: string, convex: ConvexReactClient) => Promise<void>;
  refreshContent: (userId: string, convex: ConvexReactClient) => Promise<void>;
  refreshPlatform: (userId: string, platform: keyof PlatformContentData, convex: ConvexReactClient) => Promise<void>;
  invalidateContent: () => void;
  isCacheValid: () => boolean;
  
  // Infinite scroll actions
  loadMoreContent: (userId: string, platform: keyof PlatformContentData, convex: ConvexReactClient) => Promise<void>;
  initializePlatform: (userId: string, platform: keyof PlatformContentData, convex: ConvexReactClient) => Promise<void>;
  resetPlatformScroll: (platform: keyof PlatformContentData) => void;
  
  // Content resolution helpers
  findContentById: (contentId: string) => UnifiedContent | null;
  getContentByPlatform: (platform: keyof PlatformContentData) => UnifiedContent[];
  getAllLinkableContent: () => UnifiedContent[];
  getContentByTab: (currentTab: string) => UnifiedContent[];
  
  // Legacy compatibility
  getLegacyContentByPlatform: (platform: keyof PlatformContentData) => UnifiedContent[];
}

const initialPlatformState = {
  notes: false,
  youtube: false,
  instagram: false,
  gmail: false,
  insights: false,
};

const initialErrorState = {
  notes: null,
  youtube: null,
  instagram: null,
  gmail: null,
  insights: null,
};

// Configuration for infinite scroll
const INFINITE_SCROLL_CONFIG = {
  PAGE_SIZE: 20,
  PRELOAD_THRESHOLD: 0.8, // Load more when 80% scrolled
  MAX_ITEMS_IN_MEMORY: 500,
  VIEWPORT_BUFFER: 50, // Items to render outside viewport
  SCROLL_DEBOUNCE_MS: 100,
};

const createInitialInfiniteScrollState = (): InfiniteScrollState => ({
  items: [],
  hasMore: true,
  isLoadingMore: false,
  nextCursor: null,
  totalLoaded: 0,
  isInitialized: false,
  error: null,
  maxItems: INFINITE_SCROLL_CONFIG.MAX_ITEMS_IN_MEMORY, // Use single constant reference
  loadedPages: 0,
  lastLoadTime: 0,
  scrollVelocity: 0,
});

const initialContentState: PlatformContentData = {
  notes: createInitialInfiniteScrollState(),
  youtube: createInitialInfiniteScrollState(),
  instagram: createInitialInfiniteScrollState(),
  gmail: createInitialInfiniteScrollState(),
  insights: createInitialInfiniteScrollState(),
};

export const useContentStore = create<ContentStoreState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      content: initialContentState,
      allContent: [],
      loading: initialPlatformState,
      isInitialized: false,
      lastFetchedUserId: null,
      cacheTimestamp: 0,
      cacheValidDuration: 5 * 60 * 1000, // 5 minutes
      errors: initialErrorState,

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
            youtube: true,
            instagram: true,
            gmail: true,
            insights: true,
          },
          errors: initialErrorState,
          lastFetchedUserId: userId 
        });

        try {
          // Initialize all platforms in parallel
          await Promise.all([
            get().initializePlatform(userId, 'notes', convex),
            get().initializePlatform(userId, 'youtube', convex),
            get().initializePlatform(userId, 'instagram', convex),
            get().initializePlatform(userId, 'gmail', convex),
            get().initializePlatform(userId, 'insights', convex),
          ]);

          // Update allContent after all platforms are initialized
          const currentState = get();
          const allContent = [
            ...currentState.content.notes.items,
            ...currentState.content.youtube.items,
            ...currentState.content.instagram.items,
            ...currentState.content.gmail.items,
            ...currentState.content.insights.items,
          ];

          set({
            allContent,
            loading: initialPlatformState,
            isInitialized: true,
            cacheTimestamp: Date.now(),
            errors: initialErrorState,
          });

          const totalTime = performance.now() - initStartTime;
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 [CONTENT STORE] ⚡ initializeContent COMPLETED in:', Math.round(totalTime), 'ms');
            console.log('🚀 [CONTENT STORE] Content summary:', {
              notes: currentState.content.notes.items.length,
              youtube: currentState.content.youtube.items.length,
              instagram: currentState.content.instagram.items.length,
              gmail: currentState.content.gmail.items.length,
              insights: currentState.content.insights.items.length,
              total: allContent.length,
            });
          }
        } catch (error) {
          const errorTime = performance.now();
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ [CONTENT STORE] Failed to initialize content in:', Math.round(errorTime - initStartTime), 'ms, error:', error);
          }
          set({
            loading: initialPlatformState,
            errors: {
              notes: error instanceof Error ? error.message : 'Failed to load content',
              youtube: error instanceof Error ? error.message : 'Failed to load content',
              instagram: error instanceof Error ? error.message : 'Failed to load content',
              gmail: error instanceof Error ? error.message : 'Failed to load content',
              insights: error instanceof Error ? error.message : 'Failed to load content',
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
          if (process.env.NODE_ENV === 'development') {
            console.log(`🚀 [CONTENT STORE] Initializing platform: ${platform} for user: ${userId}`);
          }

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

          let newItems: UnifiedContent[] = [];
          let hasMore = true;
          let nextCursor: string | null = null;

          // Fetch initial batch based on platform
          switch (platform) {
            case 'notes':
              if (process.env.NODE_ENV === 'development') {
                console.log(`📝 [CONTENT STORE] Fetching notes for user: ${userId}`);
              }
              const notesResult = await convex.query(api.notes.getNotesByUser, { userId });
              if (process.env.NODE_ENV === 'development') {
                console.log(`📝 [CONTENT STORE] Notes raw result:`, { count: notesResult?.length, sample: notesResult?.slice(0, 2) });
              }
              newItems = processNotesData({ status: 'fulfilled', value: notesResult });
              hasMore = false; // Notes don't have pagination yet
              break;
            
            case 'youtube':
              if (process.env.NODE_ENV === 'development') {
                console.log(`🎥 [CONTENT STORE] Fetching YouTube videos for user: ${userId}`);
              }
              const youtubeResult = await convex.query(api.youtubeQueries.getYouTubeVideos, { 
                userId, 
                limit: INFINITE_SCROLL_CONFIG.PAGE_SIZE,
                paginationOpts: { numItems: INFINITE_SCROLL_CONFIG.PAGE_SIZE, cursor: null }
              });
              if (process.env.NODE_ENV === 'development') {
                console.log(`🎥 [CONTENT STORE] YouTube raw result:`, { 
                  videosCount: youtubeResult?.videos?.length || 0, 
                  pageCount: youtubeResult?.page?.length || 0,
                  isDone: youtubeResult?.isDone,
                  sample: youtubeResult?.videos?.slice(0, 2) || youtubeResult?.page?.slice(0, 2)
                });
              }
              newItems = processYouTubeData({ status: 'fulfilled', value: youtubeResult.videos || youtubeResult.page });
              hasMore = !youtubeResult.isDone;
              nextCursor = youtubeResult.continueCursor;
              break;
            
            case 'instagram':
              if (process.env.NODE_ENV === 'development') {
                console.log(`📸 [CONTENT STORE] Fetching Instagram posts for user: ${userId}`);
              }
              const instagramResult = await convex.query(api.instagramQueries.getAllInstagramPosts, { userId });
              if (process.env.NODE_ENV === 'development') {
                console.log(`📸 [CONTENT STORE] Instagram raw result:`, { count: instagramResult?.length, sample: instagramResult?.slice(0, 2) });
              }
              newItems = processInstagramData({ status: 'fulfilled', value: instagramResult });
              hasMore = false; // Instagram doesn't have pagination yet
              break;
            
            case 'gmail':
              if (process.env.NODE_ENV === 'development') {
                console.log(`📧 [CONTENT STORE] Fetching Gmail threads for user: ${userId}`);
              }
              const gmailResult = await convex.query(api.gmailQueries.getGmailThreadsPaginated, { 
                userId,
                paginationOpts: { numItems: INFINITE_SCROLL_CONFIG.PAGE_SIZE, cursor: null }
              });
              if (process.env.NODE_ENV === 'development') {
                console.log(`📧 [CONTENT STORE] Gmail raw result:`, { 
                  pageCount: gmailResult?.page?.length || 0,
                  isDone: gmailResult?.isDone,
                  sample: gmailResult?.page?.slice(0, 2)
                });
              }
              newItems = processGmailData({ status: 'fulfilled', value: gmailResult.page });
              hasMore = !gmailResult.isDone;
              nextCursor = gmailResult.continueCursor;
              break;
            
            case 'insights':
              if (process.env.NODE_ENV === 'development') {
                console.log(`💡 [CONTENT STORE] Fetching insights for user: ${userId}`);
              }
              
              // Fetch insights from platform analyses only (excluding ambient insights)
              const [youtubeBatchAnalysis, instagramBatchAnalysis, gmailBatchAnalysis] = await Promise.allSettled([
                // Get YouTube batch analysis if channel exists
                (async () => {
                  const youtubeChannel = await convex.query(api.youtubeQueries.getYouTubeChannelData, { userId });
                  if (youtubeChannel) {
                    return await convex.query(api.youtubeQueries.getVideoAnalyses, { userId });
                  }
                  return null;
                })(),
                // Get Instagram batch analysis if account exists
                (async () => {
                  const instagramAccount = await convex.query(api.instagramQueries.getInstagramAccount, { userId });
                  if (instagramAccount?.instagramAccountId) {
                    return await convex.query(api.instagramQueries.getInstagramBatchAnalysis, { userId, instagramAccountId: instagramAccount.instagramAccountId });
                  }
                  return null;
                })(),
                // Get Gmail batch analysis if account exists
                (async () => {
                  const gmailAccounts = await convex.query(api.gmailQueries.getGmailAccounts, { userId });
                  if (gmailAccounts.length > 0) {
                    return await convex.query(api.gmailQueries.getGmailBatchAnalysis, { userId, gmailAccountId: gmailAccounts[0]._id });
                  }
                  return null;
                })()
              ]);
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`💡 [CONTENT STORE] Insights results:`, { 
                  youtubeBatchAnalysis: youtubeBatchAnalysis.status === 'fulfilled' ? 
                    { hasValue: !!youtubeBatchAnalysis.value, hasAnalyses: !!youtubeBatchAnalysis.value?.analyses, analysesCount: youtubeBatchAnalysis.value?.analyses?.length } : 
                    youtubeBatchAnalysis.status,
                  instagramBatchAnalysis: instagramBatchAnalysis.status === 'fulfilled' ? 
                    { hasValue: !!instagramBatchAnalysis.value, hasInsights: !!instagramBatchAnalysis.value?.insights, insightsType: typeof instagramBatchAnalysis.value?.insights } : 
                    instagramBatchAnalysis.status,
                  gmailBatchAnalysis: gmailBatchAnalysis.status === 'fulfilled' ? !!gmailBatchAnalysis.value : gmailBatchAnalysis.status
                });
                
                // Additional debug for failed fetches
                if (youtubeBatchAnalysis.status === 'rejected') {
                  console.error('💡 [CONTENT STORE] YouTube batch analysis error:', youtubeBatchAnalysis.reason);
                }
                if (instagramBatchAnalysis.status === 'rejected') {
                  console.error('💡 [CONTENT STORE] Instagram batch analysis error:', instagramBatchAnalysis.reason);
                }
                if (gmailBatchAnalysis.status === 'rejected') {
                  console.error('💡 [CONTENT STORE] Gmail batch analysis error:', gmailBatchAnalysis.reason);
                }
              }
              
              newItems = processAllInsightsData({
                youtubeBatchAnalysis,
                instagramBatchAnalysis,
                gmailBatchAnalysis
              });
              
              console.log(`💡 [CONTENT STORE] Final processed insights:`, {
                totalInsights: newItems.length,
                insightsByType: {
                  youtube: newItems.filter(i => i.contentType === 'youtube_analysis').length,
                  instagram: newItems.filter(i => i.contentType === 'instagram_analysis').length,
                  gmail: newItems.filter(i => i.contentType === 'gmail_insight').length,
                },
                sampleInsights: newItems.slice(0, 3).map(i => ({ 
                  id: i.id, 
                  title: i.title, 
                  type: i.type, 
                  platform: i.platform,
                  contentType: i.contentType 
                }))
              });
              
              hasMore = false; // Insights don't have pagination yet
              break;
          }

          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ [CONTENT STORE] Platform ${platform} initialized successfully:`, {
              itemsCount: newItems.length,
              hasMore,
              nextCursor: !!nextCursor,
              sampleItems: newItems.slice(0, 3).map(item => ({ id: item.id, title: item.title, platform: item.platform }))
            });
          }

          // Update platform state
          set(state => ({
            content: {
              ...state.content,
              [platform]: {
                ...state.content[platform],
                items: newItems,
                hasMore,
                nextCursor,
                totalLoaded: newItems.length,
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
          if (process.env.NODE_ENV === 'development') {
            console.error(`❌ [CONTENT STORE] Failed to initialize ${platform}:`, {
              error: errorMessage,
              userId,
              stack: error instanceof Error ? error.stack : undefined,
              fullError: error
            });
          } else {
            console.error(`Failed to initialize ${platform}:`, errorMessage);
          }
          
          set(state => ({
            content: {
              ...state.content,
              [platform]: {
                ...state.content[platform],
                isLoadingMore: false,
                error: `${platform}: ${errorMessage}`,
                isInitialized: false, // Ensure it's marked as not initialized on error
              }
            },
            // Also update the errors state for easier debugging
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

          let newItems: UnifiedContent[] = [];
          let hasMore = true;
          let nextCursor: string | null = null;

          // Fetch next batch based on platform
          switch (platform) {
            case 'youtube':
              const youtubeResult = await convex.query(api.youtubeQueries.getYouTubeVideos, { 
                userId, 
                limit: INFINITE_SCROLL_CONFIG.PAGE_SIZE,
                paginationOpts: { numItems: INFINITE_SCROLL_CONFIG.PAGE_SIZE, cursor: platformState.nextCursor }
              });
              newItems = processYouTubeData({ status: 'fulfilled', value: youtubeResult.videos });
              hasMore = !youtubeResult.isDone;
              nextCursor = youtubeResult.continueCursor;
              break;
            
            case 'gmail':
              const gmailResult = await convex.query(api.gmailQueries.getGmailThreadsPaginated, { 
                userId,
                paginationOpts: { numItems: INFINITE_SCROLL_CONFIG.PAGE_SIZE, cursor: platformState.nextCursor }
              });
              newItems = processGmailData({ status: 'fulfilled', value: gmailResult.page });
              hasMore = !gmailResult.isDone;
              nextCursor = gmailResult.continueCursor;
              break;
            
            default:
              // Other platforms don't support pagination yet
              return;
          }

          // Apply memory management (sliding window)
          const currentItems = platformState.items;
          const combinedItems = [...currentItems, ...newItems];
          
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
                hasMore,
                nextCursor,
                totalLoaded: platformState.totalLoaded + newItems.length,
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
            ...updatedState.content.youtube.items,
            ...updatedState.content.instagram.items,
            ...updatedState.content.gmail.items,
            ...updatedState.content.insights.items,
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
            youtube: true,
            instagram: true,
            gmail: true,
            insights: true,
          },
          errors: initialErrorState,
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
            loading: initialPlatformState,
            errors: {
              notes: error instanceof Error ? error.message : 'Failed to refresh content',
              youtube: error instanceof Error ? error.message : 'Failed to refresh content',
              instagram: error instanceof Error ? error.message : 'Failed to refresh content',
              gmail: error instanceof Error ? error.message : 'Failed to refresh content',
              insights: error instanceof Error ? error.message : 'Failed to refresh content',
            },
          });
        }
      },

      // Refresh specific platform
      refreshPlatform: async (userId: string, platform: keyof PlatformContentData, convex: ConvexReactClient) => {
        const state = get();
        
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
          ...updatedState.content.youtube.items,
          ...updatedState.content.instagram.items,
          ...updatedState.content.gmail.items,
          ...updatedState.content.insights.items,
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
          errors: initialErrorState,
          loading: initialPlatformState,
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
          
          case 'youtube':
            result = state.content.youtube.items;
            break;
          
          case 'instagram':
            result = state.content.instagram.items;
            break;
          
          case 'gmail':
            result = state.content.gmail.items;
            break;
          
          case 'insights':
          case 'ai-insights':
            result = state.content.insights.items;
            break;
          
          case 'all':
          default:
            // Return all content for 'all' tab or unknown tabs
            result = state.allContent;
            break;
        }
        
        // Debug logging
        console.log('[ContentStore] getContentByTab:', {
          currentTab,
          tabLower,
          resultCount: result.length,
          contentCounts: {
            notes: state.content.notes.items.length,
            youtube: state.content.youtube.items.length,
            instagram: state.content.instagram.items.length,
            gmail: state.content.gmail.items.length,
            insights: state.content.insights.items.length,
            allContent: state.allContent.length
          },
          sampleResult: result.slice(0, 3).map(item => ({ id: item.id, title: item.title, platform: item.platform }))
        });
        
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

// Data transformation helpers
function processNotesData(result: PromiseSettledResult<Doc<'notes'>[]>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch notes:', result.reason);
    return [];
  }

  return result.value.map(note => ({
    id: String(note._id),
    title: note.title || 'Untitled Note',
    type: 'note' as const,
    contentType: note.type || 'idea_bank',
    platform: 'smart-notes',
    createdAt: note.createdAt || Date.now(),
    updatedAt: note.updatedAt || Date.now(),
    important: note.important || false,
    tags: note.tags || [],
    analysis: note.analysis,
    content: note.content || '',
  }));
}

function processYouTubeData(result: PromiseSettledResult<any[]>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch YouTube data:', result.reason);
    return [];
  }

  if (!Array.isArray(result.value)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🎥 [CONTENT STORE] processYouTubeData: Expected array but got:', typeof result.value, result.value);
    }
    return [];
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🎥 [CONTENT STORE] processYouTubeData: Processing', result.value.length, 'videos');
  }

  const processed = result.value.map(video => ({
    id: `youtube:${video.id || video.videoId}`,
    title: video.content?.title || video.snippet?.title || 'Untitled Video',
    type: 'youtube' as const,
    contentType: 'video',
    platform: 'youtube',
    createdAt: new Date(video.publishedAt || video.snippet?.published_at || 0).getTime(),
    updatedAt: new Date(video.publishedAt || video.snippet?.published_at || 0).getTime(),
    important: false,
    tags: video.snippet?.tags || [],
    analysis: video.analysis,
    content: video.content?.description || video.snippet?.description || '',
    thumbnailUrl: video.content?.thumbnailUrl || video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.medium,
    statistics: video.metrics || video.statistics,
  }));

  if (process.env.NODE_ENV === 'development') {
    console.log('🎥 [CONTENT STORE] processYouTubeData: Processed', processed.length, 'videos successfully');
  }

  return processed;
}

function processInstagramData(result: PromiseSettledResult<any[]>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch Instagram data:', result.reason);
    return [];
  }

  if (!Array.isArray(result.value)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('📸 [CONTENT STORE] processInstagramData: Expected array but got:', typeof result.value, result.value);
    }
    return [];
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📸 [CONTENT STORE] processInstagramData: Processing', result.value.length, 'posts');
  }

  const processed = result.value.map(post => ({
    id: `instagram:${post.postId}`,
    title: post.data?.caption?.substring(0, 100) || 'Instagram Post',
    type: 'instagram' as const,
    contentType: post.mediaType?.toLowerCase() || 'image',
    platform: 'instagram',
    createdAt: post.data?.timestamp || post.createdAt || Date.now(),
    updatedAt: post.updatedAt || post.createdAt || Date.now(),
    important: false,
    tags: [],
    analysis: post.analysis,
    content: post.data?.caption || '',
    mediaUrl: post.data?.media_url,
    thumbnailUrl: post.data?.thumbnail_url,
    insights: post.data?.insights,
    statistics: {
      likes: post.data?.insights?.likes || post.data?.like_count || 0,
      comments: post.data?.insights?.comments || post.data?.comments_count || 0,
      reach: post.data?.insights?.reach || 0,
      impressions: post.data?.insights?.impressions || 0,
      saved: post.data?.insights?.saved || 0,
      shares: post.data?.insights?.shares || 0,
    },
  }));

  if (process.env.NODE_ENV === 'development') {
    console.log('📸 [CONTENT STORE] processInstagramData: Processed', processed.length, 'posts successfully');
  }

  return processed;
}

function processGmailData(result: PromiseSettledResult<any[]>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch Gmail data:', result.reason);
    return [];
  }

  if (!Array.isArray(result.value)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('📧 [CONTENT STORE] processGmailData: Expected array but got:', typeof result.value, result.value);
    }
    return [];
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 [CONTENT STORE] processGmailData: Processing', result.value.length, 'threads');
  }

  const processed = result.value.map(thread => ({
    id: `gmail:${thread.threadId}`,
    title: thread.subject || thread.data?.subject || 'No Subject',
    type: 'gmail' as const,
    contentType: 'email',
    platform: 'gmail',
    createdAt: thread.createdAt || Date.now(),
    updatedAt: thread.updatedAt || Date.now(),
    important: false,
    tags: [],
    analysis: thread.analysis,
    content: thread.snippet || thread.data?.snippet || '',
    from: thread.from || thread.data?.from || 'Unknown Sender',
    messageCount: thread.message_count || thread.data?.message_count || 1,
    category: thread.category,
  }));

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 [CONTENT STORE] processGmailData: Processed', processed.length, 'threads successfully');
  }

  return processed;
}

// New function to handle all insight sources
function processAllInsightsData(results: {
  youtubeBatchAnalysis: PromiseSettledResult<any>;
  instagramBatchAnalysis: PromiseSettledResult<any>;
  gmailBatchAnalysis: PromiseSettledResult<any>;
}): UnifiedContent[] {
  const allInsights: UnifiedContent[] = [];

  // Process YouTube Video Analyses
  if (results.youtubeBatchAnalysis.status === 'fulfilled' && results.youtubeBatchAnalysis.value?.analyses) {
    const ytAnalyses = results.youtubeBatchAnalysis.value.analyses;
    if (Array.isArray(ytAnalyses)) {
      ytAnalyses.forEach((video: any, index: number) => {
        if (video.analysis || video.analysisMarkdown) {
          allInsights.push({
            id: `insight:youtube:${video.id}:${index}`,
            title: `${video.title} - Analysis`,
            type: 'insight' as const,
            contentType: 'youtube_analysis',
            platform: 'insights',
            createdAt: new Date(video.publishedAt || Date.now()).getTime(),
            updatedAt: new Date(video.publishedAt || Date.now()).getTime(),
            important: false,
            tags: ['youtube', 'analysis'],
            analysis: video.analysis,
            content: video.analysisMarkdown || video.analysis?.summary || 'YouTube video analysis'
          });
        }
      });
    }
  }

  // Process Instagram Batch Analysis
  if (results.instagramBatchAnalysis.status === 'fulfilled' && results.instagramBatchAnalysis.value?.insights) {
    const igAnalysis = results.instagramBatchAnalysis.value;
    
    // Handle different insight structures
    let insightArray: any[] = [];
    if (igAnalysis.insights.insights && Array.isArray(igAnalysis.insights.insights)) {
      insightArray = igAnalysis.insights.insights;
    } else if (Array.isArray(igAnalysis.insights)) {
      insightArray = igAnalysis.insights;
    } else if (igAnalysis.insights.content && Array.isArray(igAnalysis.insights.content)) {
      insightArray = igAnalysis.insights.content;
    }
    
    if (insightArray.length > 0) {
      insightArray.forEach((insight: any, index: number) => {
        allInsights.push({
          id: `insight:instagram:${igAnalysis._id}:${index}`,
          title: insight.title || insight.heading || 'Instagram Insight',
          type: 'insight' as const,
          contentType: 'instagram_analysis',
          platform: 'insights',
          createdAt: igAnalysis.updatedAt || Date.now(),
          updatedAt: igAnalysis.updatedAt || Date.now(),
          important: false,
          tags: ['instagram', insight.category || 'engagement'],
          analysis: insight,
          content: insight.analysis || insight.content || insight.description || 'Instagram batch analysis insight'
        });
      });
    } else {
      // If no structured insights, create a single insight from the batch analysis
      allInsights.push({
        id: `insight:instagram:${igAnalysis._id}:batch`,
        title: 'Instagram Batch Analysis',
        type: 'insight' as const,
        contentType: 'instagram_analysis',
        platform: 'insights',
        createdAt: igAnalysis.updatedAt || Date.now(),
        updatedAt: igAnalysis.updatedAt || Date.now(),
        important: false,
        tags: ['instagram', 'batch-analysis'],
        analysis: igAnalysis.insights,
        content: JSON.stringify(igAnalysis.insights, null, 2)
      });
    }
  }

  // Process Gmail Batch Analysis
  if (results.gmailBatchAnalysis.status === 'fulfilled' && results.gmailBatchAnalysis.value?.insights) {
    const gmailAnalysis = results.gmailBatchAnalysis.value;
    if (gmailAnalysis.insights.insights && Array.isArray(gmailAnalysis.insights.insights)) {
      gmailAnalysis.insights.insights.forEach((insight: any, index: number) => {
        allInsights.push({
          id: `insight:gmail:${gmailAnalysis._id}:${index}`,
          title: insight.title || 'Gmail Insight',
          type: 'insight' as const,
          contentType: 'gmail_insight',
          platform: 'insights',
          createdAt: gmailAnalysis.updatedAt || Date.now(),
          updatedAt: gmailAnalysis.updatedAt || Date.now(),
          important: false,
          tags: ['gmail', insight.category || 'communication'],
          analysis: insight,
          content: insight.analysis || insight.content || ''
        });
      });
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('💡 [CONTENT STORE] processAllInsightsData: Processed', allInsights.length, 'total insights');
    console.log('💡 [CONTENT STORE] processAllInsightsData: Breakdown by source:', {
      youtubeAnalyses: allInsights.filter(i => i.contentType === 'youtube_analysis').length,
      instagramAnalyses: allInsights.filter(i => i.contentType === 'instagram_analysis').length,
      gmailAnalyses: allInsights.filter(i => i.contentType === 'gmail_insight').length,
      sampleTitles: allInsights.slice(0, 5).map(i => i.title)
    });
  }

  // Sort by creation time (most recent first)
  return allInsights.sort((a, b) => b.createdAt - a.createdAt);
}

// Legacy function for backward compatibility
function processInsightsData(result: PromiseSettledResult<any>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch insights data:', result.reason);
    return [];
  }

  const insights = result.value;
  if (process.env.NODE_ENV === 'development') {
    console.log('💡 [CONTENT STORE] processInsightsData: Raw insights data:', insights);
  }

  if (!insights) {
    if (process.env.NODE_ENV === 'development') {
      console.log('💡 [CONTENT STORE] processInsightsData: No insights data found');
    }
    return [];
  }

  // Handle different insight data structures
  let insightArray: any[] = [];
  if (Array.isArray(insights)) {
    insightArray = insights;
  } else if (insights.insights && Array.isArray(insights.insights)) {
    insightArray = insights.insights;
  } else if (insights.insights && insights.insights.insights && Array.isArray(insights.insights.insights)) {
    insightArray = insights.insights.insights;
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn('💡 [CONTENT STORE] processInsightsData: Unexpected insights structure:', insights);
    }
    return [];
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('💡 [CONTENT STORE] processInsightsData: Processing', insightArray.length, 'insights');
  }

  const processed = insightArray.map((insight: any, index: number) => ({
    id: `insight:${insight.id || index}`,
    title: insight.title || 'Content Insight',
    type: 'insight' as const,
    contentType: 'analysis',
    platform: 'insights',
    createdAt: insight.createdAt || Date.now(),
    updatedAt: insight.updatedAt || Date.now(),
    important: false,
    tags: [],
    analysis: insight,
    content: insight.description || insight.summary || '',
  }));

  if (process.env.NODE_ENV === 'development') {
    console.log('💡 [CONTENT STORE] processInsightsData: Processed', processed.length, 'insights successfully');
  }

  return processed;
}

// Export hooks for backward compatibility
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
  };
};

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
  };
}; 