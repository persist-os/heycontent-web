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
    let newItems: UnifiedContent[] = [];
    let hasMore = true;
    let nextCursor: string | null = null;

    // Fetch initial batch based on platform
    switch (platform) {
      case 'notes':
        const notesResult = await convex.query(api.noteQueries.getUserNotes, { userId, numItems: 1000 });
        newItems = processNotesData({ status: 'fulfilled', value: notesResult.page });
        hasMore = !notesResult.isDone; // Check if there are more pages
        break;
      
      case 'conversations':
        const conversationsResult = await convex.query(api.chatQueries.getHistory, { userId, limit: 100 });
        
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

    return { items: newItems, hasMore, nextCursor };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load content';
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ [PLATFORM FETCHER] Failed to initialize ${platform}:`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
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