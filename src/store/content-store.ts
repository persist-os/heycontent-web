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

// Content data per platform
export interface PlatformContentData {
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
  
  // Content resolution helpers
  findContentById: (contentId: string) => UnifiedContent | null;
  getContentByPlatform: (platform: keyof PlatformContentData) => UnifiedContent[];
  getAllLinkableContent: () => UnifiedContent[];
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

const initialContentState = {
  notes: [],
  youtube: [],
  instagram: [],
  gmail: [],
  insights: [],
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

      // Initialize content data with aggressive caching
      initializeContent: async (userId: string, convex: ConvexReactClient) => {
        const state = get();
        const initStartTime = performance.now();
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 [CONTENT STORE] initializeContent called for userId:', userId, 'at:', new Date().toISOString());
        }
        
        // Check if we have valid cached data for this user
        if (state.isInitialized && 
            state.lastFetchedUserId === userId && 
            state.isCacheValid() && 
            state.allContent.length > 0) {
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
                     // Fetch all platform data in parallel
           const [notesData, youtubeData, instagramData, gmailData, insightsData] = await Promise.allSettled([
             // Notes
             convex.query(api.notes.getNotesByUser, { userId }),
             // YouTube
             convex.query(api.youtubeQueries.listUserYouTubeVideos, { userId, limit: 100 }),
             // Instagram
             convex.query(api.instagramQueries.getAllInstagramPosts, { userId }),
             // Gmail
             convex.query(api.gmailQueries.getRecentGmailThreads, { userId, limit: 100 }),
             // Insights (YouTube batch analysis)
             convex.query(api.youtubeQueries.getYoutubeBatchAnalysis, { 
               userId, 
               channelId: '' // We'll need to get this from YouTube account
             }),
           ]);

          // Process and transform data
          const processedContent = {
            notes: processNotesData(notesData),
            youtube: processYouTubeData(youtubeData),
            instagram: processInstagramData(instagramData),
            gmail: processGmailData(gmailData),
            insights: processInsightsData(insightsData),
          };

          // Combine all content
          const allContent = [
            ...processedContent.notes,
            ...processedContent.youtube,
            ...processedContent.instagram,
            ...processedContent.gmail,
            ...processedContent.insights,
          ];

          set({
            content: processedContent,
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
              notes: processedContent.notes.length,
              youtube: processedContent.youtube.length,
              instagram: processedContent.instagram.length,
              gmail: processedContent.gmail.length,
              insights: processedContent.insights.length,
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
        
        set({
          loading: {
            ...state.loading,
            [platform]: true,
          },
          errors: {
            ...state.errors,
            [platform]: null,
          },
        });

        try {
          let newData: UnifiedContent[] = [];
          
                     switch (platform) {
             case 'notes':
               const notesResult = await convex.query(api.notes.getNotesByUser, { userId });
               newData = processNotesData({ status: 'fulfilled', value: notesResult });
               break;
            case 'youtube':
              const youtubeResult = await convex.query(api.youtubeQueries.listUserYouTubeVideos, { userId, limit: 100 });
              newData = processYouTubeData({ status: 'fulfilled', value: youtubeResult });
              break;
            case 'instagram':
              const instagramResult = await convex.query(api.instagramQueries.getAllInstagramPosts, { userId });
              newData = processInstagramData({ status: 'fulfilled', value: instagramResult });
              break;
            case 'gmail':
              const gmailResult = await convex.query(api.gmailQueries.getRecentGmailThreads, { userId, limit: 100 });
              newData = processGmailData({ status: 'fulfilled', value: gmailResult });
              break;
            case 'insights':
              const insightsResult = await convex.query(api.youtubeQueries.getYoutubeBatchAnalysis, { 
                userId, 
                channelId: '' // We'll need to get this from YouTube account
              });
              newData = processInsightsData({ status: 'fulfilled', value: insightsResult });
              break;
          }

          const currentState = get();
          const updatedContent = {
            ...currentState.content,
            [platform]: newData,
          };

          const allContent = [
            ...updatedContent.notes,
            ...updatedContent.youtube,
            ...updatedContent.instagram,
            ...updatedContent.gmail,
            ...updatedContent.insights,
          ];

          set({
            content: updatedContent,
            allContent,
            loading: {
              ...currentState.loading,
              [platform]: false,
            },
            cacheTimestamp: Date.now(), // Update cache timestamp
          });
        } catch (error) {
          const currentState = get();
          set({
            loading: {
              ...currentState.loading,
              [platform]: false,
            },
            errors: {
              ...currentState.errors,
              [platform]: error instanceof Error ? error.message : 'Failed to refresh platform',
            },
          });
        }
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
        return state.content[platform] || [];
      },

      getAllLinkableContent: () => {
        const state = get();
        return state.allContent;
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
    tags: thread.category ? [thread.category] : [],
    analysis: thread.analysis,
    content: thread.snippet || thread.data?.snippet || '',
    from: thread.from || thread.data?.from || 'Unknown Sender',
    messageCount: thread.message_count || thread.data?.message_count || 1,
    category: thread.category || 'none',
  }));
}

function processInsightsData(result: PromiseSettledResult<any>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch insights data:', result.reason);
    return [];
  }

  if (!result.value || !result.value.insights || !result.value.insights.insights) {
    return [];
  }

  return result.value.insights.insights.map((insight: any, index: number) => ({
    id: `insight:${result.value._id}:${index}`,
    title: insight.title || 'Untitled Insight',
    type: 'insight' as const,
    contentType: 'insight',
    platform: 'insights',
    createdAt: result.value.createdAt || Date.now(),
    updatedAt: result.value.updatedAt || Date.now(),
    important: false,
    tags: [],
    analysis: insight,
    content: insight.expectedOutcome || '',
    insights: insight,
  }));
}

// Selector hooks for common use cases
export const useContentData = () => {
  const allContent = useContentStore(state => state.allContent);
  const loading = useContentStore(state => state.loading);
  const errors = useContentStore(state => state.errors);
  const isInitialized = useContentStore(state => state.isInitialized);
  
  return {
    allContent,
    loading,
    errors,
    isInitialized,
    isLoading: Object.values(loading).some(Boolean),
    hasErrors: Object.values(errors).some(Boolean),
  };
};

export const usePlatformContent = (platform: keyof PlatformContentData) => {
  const content = useContentStore(state => state.content[platform]);
  const loading = useContentStore(state => state.loading[platform]);
  const error = useContentStore(state => state.errors[platform]);
  
  return {
    content,
    loading,
    error,
    hasError: !!error,
  };
};

// Content manager hook that uses the centralized store
export const useContentManager = (userId: string | undefined) => {
  const store = useContentStore();
  const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

     useEffect(() => {
     if (userId && !store.isInitialized) {
       store.initializeContent(userId, convex);
     }
   }, [userId, store.isInitialized]);

  return {
    // Data from store
    allContent: store.allContent,
    content: store.content,
    loading: store.loading,
    errors: store.errors,
    isInitialized: store.isInitialized,
    
    // Helper methods
    findContentById: store.findContentById,
    getContentByPlatform: store.getContentByPlatform,
    getAllLinkableContent: store.getAllLinkableContent,
    
    // Actions
    refreshContent: () => userId && store.refreshContent(userId, convex),
    refreshPlatform: (platform: keyof PlatformContentData) => 
      userId && store.refreshPlatform(userId, platform, convex),
    invalidateContent: store.invalidateContent,
  };
}; 