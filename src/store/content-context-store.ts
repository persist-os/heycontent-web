import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { Doc, Id } from '@/convex/_generated/dataModel';

// Type definitions for content context
export interface ContentContextState {
  // Current content context
  currentContext: {
    platform: 'project';
    contentId: string;
    title?: string;
    analysis?: string | null;
    thumbnailUrl?: string;
    publishedAt?: string;
    metrics?: any;
    content?: any;
    type?: string; // For content-hub-insight and other special types
    source?: string; // For backwards compatibility
    // Full Convex document data
    convexData?: any;
    // AI Insights specific fields
    fullInsight?: any;
    actionStep?: string;
    originalPlatform?: 'project';
    additionalContext?: string;
  } | null;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Cache metadata
  cacheTimestamp: number;
  cacheValidDuration: number; // 5 minutes in milliseconds
  
  // Error state
  error: string | null;
  
  // Actions
  setContentContext: (context: ContentContextState['currentContext']) => void;
  clearContentContext: () => void;
  isCacheValid: () => boolean;
}


export const useContentContextStore = create<ContentContextState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      currentContext: null,
      isLoading: false,
      isInitialized: false,
      cacheTimestamp: 0,
      cacheValidDuration: 5 * 60 * 1000, // 5 minutes
      error: null,

      // Check if cache is still valid
      isCacheValid: () => {
        const state = get();
        const now = Date.now();
        return state.cacheTimestamp > 0 && (now - state.cacheTimestamp) < state.cacheValidDuration;
      },

      // Set generic content context
      setContentContext: (context: ContentContextState['currentContext'] | null) => {
        console.log('🔍 [CONTENT CONTEXT STORE] Setting content context:', {
          platform: context?.platform,
          contentId: context?.contentId,
          title: context?.title,
          hasConvexData: !!context?.convexData,
          convexDataKeys: context?.convexData ? Object.keys(context.convexData) : 'none',
          fullContext: context
        });
        
        if (context?.convexData) {
          console.log('🔍 [CONTENT CONTEXT STORE] Convex data details:', {
            hasData: !!context.convexData.data,
            dataKeys: context.convexData.data ? Object.keys(context.convexData.data) : 'none',
            hasComments: !!context.convexData.data?.comments,
            commentsLength: context.convexData.data?.comments?.length || 0,
            commentsSample: context.convexData.data?.comments?.slice(0, 2) || 'none',
            hasInsights: !!context.convexData.data?.insights,
            insightsKeys: context.convexData.data?.insights ? Object.keys(context.convexData.data.insights) : 'none'
          });
        }
        
        set({
          currentContext: context,
          cacheTimestamp: Date.now(),
          error: null
        });
      },

      // Clear content context
      clearContentContext: () => {
        set({
          currentContext: null,
          cacheTimestamp: Date.now(),
          error: null
        });
      },


    })),
    {
      name: 'content-context-store-cache',
      partialize: (state) => ({
        currentContext: state.currentContext,
        isInitialized: state.isInitialized,
        cacheTimestamp: state.cacheTimestamp
      }),
    }
  )
);

// Selector hooks for common use cases
export const useContentContext = () => {
  const currentContext = useContentContextStore(state => state.currentContext);
  const isLoading = useContentContextStore(state => state.isLoading);
  const error = useContentContextStore(state => state.error);
  const isInitialized = useContentContextStore(state => state.isInitialized);
  
  return {
    context: currentContext,
    isLoading,
    isError: !!error,
    isInitialized,
    hasContext: !!currentContext,
    platform: currentContext?.platform,
    contentId: currentContext?.contentId,
    title: currentContext?.title,
    analysis: currentContext?.analysis,
    thumbnailUrl: currentContext?.thumbnailUrl,
    publishedAt: currentContext?.publishedAt,
    metrics: currentContext?.metrics,
    content: currentContext?.content,
    convexData: currentContext?.convexData,
  };
};

// Platform-specific hooks (removed social media platforms)

// Action hooks
export const useContentContextActions = () => {
  const setContentContext = useContentContextStore(state => state.setContentContext);
  const clearContentContext = useContentContextStore(state => state.clearContentContext);

  return {
    setContentContext,
    clearContentContext,
  };
}; 