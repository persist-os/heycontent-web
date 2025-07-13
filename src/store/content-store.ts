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

          let newItems: UnifiedContent[] = [];
          let hasMore = true;
          let nextCursor: string | null = null;

          // Fetch initial batch based on platform
          switch (platform) {
            case 'notes':
              const notesResult = await convex.query(api.notes.getNotesByUser, { userId });
              newItems = processNotesData({ status: 'fulfilled', value: notesResult });
              hasMore = false; // Notes don't have pagination yet
              break;
            
            case 'youtube':
              const youtubeResult = await convex.query(api.youtubeQueries.getYouTubeVideos, { 
                userId, 
                limit: INFINITE_SCROLL_CONFIG.PAGE_SIZE,
                paginationOpts: { numItems: INFINITE_SCROLL_CONFIG.PAGE_SIZE, cursor: null }
              });
              newItems = processYouTubeData({ status: 'fulfilled', value: youtubeResult.videos });
              hasMore = !youtubeResult.isDone;
              nextCursor = youtubeResult.continueCursor;
              break;
            
            case 'instagram':
              const instagramResult = await convex.query(api.instagramQueries.getAllInstagramPosts, { userId });
              newItems = processInstagramData({ status: 'fulfilled', value: instagramResult });
              hasMore = false; // Instagram doesn't have pagination yet
              break;
            
            case 'gmail':
              const gmailResult = await convex.query(api.gmailQueries.getGmailThreadsPaginated, { 
                userId,
                paginationOpts: { numItems: INFINITE_SCROLL_CONFIG.PAGE_SIZE, cursor: null }
              });
              newItems = processGmailData({ status: 'fulfilled', value: gmailResult.page });
              hasMore = !gmailResult.isDone;
              nextCursor = gmailResult.continueCursor;
              break;
            
            case 'insights':
              // Get channelId from user's YouTube account
              const youtubeChannel = await convex.query(api.youtubeQueries.getYouTubeChannelData, { userId });
              const channelId = youtubeChannel?.id;
              
              if (!channelId) {
                // No YouTube channel connected, return empty insights
                newItems = [];
                hasMore = false;
                break;
              }
              
              const insightsResult = await convex.query(api.youtubeQueries.getYoutubeBatchAnalysis, { 
                userId, 
                channelId 
              });
              newItems = processInsightsData({ status: 'fulfilled', value: insightsResult });
              hasMore = false; // Insights don't have pagination yet
              break;
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
          console.error(`Failed to initialize ${platform}:`, error);
          set(state => ({
            content: {
              ...state.content,
              [platform]: {
                ...state.content[platform],
                isLoadingMore: false,
                error: error instanceof Error ? error.message : 'Failed to load content',
              }
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

  return result.value.map(video => ({
    id: `youtube:${video.id}`,
    title: video.content?.title || 'Untitled Video',
    type: 'youtube' as const,
    contentType: 'video',
    platform: 'youtube',
    createdAt: new Date(video.publishedAt || 0).getTime(),
    updatedAt: new Date(video.publishedAt || 0).getTime(),
    important: false,
    tags: [],
    analysis: video.analysis,
    content: video.content?.description || '',
    thumbnailUrl: video.content?.thumbnailUrl,
    statistics: video.metrics,
  }));
}

function processInstagramData(result: PromiseSettledResult<any[]>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch Instagram data:', result.reason);
    return [];
  }

  return result.value.map(post => ({
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
}

function processGmailData(result: PromiseSettledResult<any[]>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch Gmail data:', result.reason);
    return [];
  }

  return result.value.map(thread => ({
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
}

function processInsightsData(result: PromiseSettledResult<any>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch insights data:', result.reason);
    return [];
  }

  const insights = result.value;
  if (!insights || !insights.length) {
    return [];
  }

  return insights.map((insight: any, index: number) => ({
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