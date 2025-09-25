import { ConvexReactClient } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  UnifiedContent, 
  PlatformContentData, 
  INFINITE_SCROLL_CONFIG 
} from '@/types/content';
import {
  processNotesData
} from './content-processors';

// Platform fetching logic - handles API calls and data fetching

export async function initializePlatform(
  userId: string, 
  platform: keyof PlatformContentData, 
  convex: ConvexReactClient
): Promise<{
  items: UnifiedContent[];
  hasMore: boolean;
  nextCursor: string | null;
}> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [PLATFORM FETCHER] Initializing platform: ${platform} for user: ${userId}`);
    }

    let newItems: UnifiedContent[] = [];
    let hasMore = true;
    let nextCursor: string | null = null;

    // Fetch initial batch based on platform
    switch (platform) {
      case 'notes':
        if (process.env.NODE_ENV === 'development') {
          console.log(`📝 [PLATFORM FETCHER] Fetching notes for user: ${userId}`);
        }
        const notesResult = await convex.query(api.noteQueries.getUserNotes, { userId, numItems: 1000 });
        if (process.env.NODE_ENV === 'development') {
          console.log(`📝 [PLATFORM FETCHER] Notes raw result:`, { count: notesResult?.page?.length, sample: notesResult?.page?.slice(0, 2) });
        }
        newItems = processNotesData({ status: 'fulfilled', value: notesResult.page });
        hasMore = !notesResult.isDone; // Check if there are more pages
        break;
      
      case 'conversations':
        if (process.env.NODE_ENV === 'development') {
          console.log(`💬 [PLATFORM FETCHER] Fetching conversations for user: ${userId}`);
        }
        
        const conversationsResult = await convex.query(api.chatQueries.getHistory, { userId, limit: 100 });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`💬 [PLATFORM FETCHER] Conversations raw result:`, { 
            count: conversationsResult?.length || 0, 
            sample: conversationsResult?.slice(0, 2) 
          });
        }
        
        // Process conversations data
        newItems = (conversationsResult || []).map(conv => ({
          id: `conversations:${conv._id}`,
          type: 'conversation' as const,
          platform: 'conversations',
          contentType: 'conversation',
          title: conv.title || 'Untitled Conversation',
          createdAt: conv.createdAt || Date.now(),
          updatedAt: conv.updatedAt || Date.now(),
          important: false,
          tags: conv.tags || [],
          analysis: conv.analysis,
          content: `${conv.title || ''}\n\n${(conv.messages || [])
            .map((m: any) => `${m.role || 'unknown'}: ${m.content || ''}`)
            .join('\n')}`,
          messages: conv.messages,
          recommendations: conv.recommendations,
        }));
        
        hasMore = false; // Conversations don't have pagination yet
        break;
      
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [PLATFORM FETCHER] Platform ${platform} initialized successfully:`, {
        itemsCount: newItems.length,
        hasMore,
        nextCursor: !!nextCursor,
        sampleItems: newItems.slice(0, 3).map(item => ({ id: item.id, title: item.title, platform: item.platform }))
      });
    }

    return { items: newItems, hasMore, nextCursor };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load content';
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ [PLATFORM FETCHER] Failed to initialize ${platform}:`, {
        error: errorMessage,
        userId,
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error
      });
    } else {
      console.error(`Failed to initialize ${platform}:`, errorMessage);
    }
    
    throw error; // Re-throw to let caller handle
  }
}

export async function loadMoreContent(
  userId: string, 
  platform: keyof PlatformContentData, 
  convex: ConvexReactClient,
  currentCursor: string | null
): Promise<{
  items: UnifiedContent[];
  hasMore: boolean;
  nextCursor: string | null;
}> {
  try {
    // Currently no platforms support pagination, so return empty
    return { items: [], hasMore: false, nextCursor: null };
  } catch (error) {
    console.error(`Failed to load more ${platform} content:`, error);
    throw error;
  }
} 