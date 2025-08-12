import { ConvexReactClient } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  UnifiedContent, 
  PlatformContentData, 
  INFINITE_SCROLL_CONFIG 
} from '@/types/content';
import {
  processNotesData,
  processYouTubeData,
  processInstagramData,
  processGmailData,
  processAllInsightsData
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
      
      case 'youtube':
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎥 [PLATFORM FETCHER] Fetching YouTube videos for user: ${userId}`);
        }
        const youtubeResult = await convex.query(api.youtubeQueries.getYouTubeVideos, { 
          userId, 
          limit: INFINITE_SCROLL_CONFIG.PAGE_SIZE,
          paginationOpts: { numItems: INFINITE_SCROLL_CONFIG.PAGE_SIZE, cursor: null }
        });
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎥 [PLATFORM FETCHER] YouTube raw result:`, { 
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
          console.log(`📸 [PLATFORM FETCHER] Fetching Instagram posts for user: ${userId}`);
        }
        const instagramResult = await convex.query(api.instagramQueries.getAllInstagramPosts, { userId });
        if (process.env.NODE_ENV === 'development') {
          console.log(`📸 [PLATFORM FETCHER] Instagram raw result:`, { count: instagramResult?.length, sample: instagramResult?.slice(0, 2) });
        }
        newItems = processInstagramData({ status: 'fulfilled', value: instagramResult });
        hasMore = false; // Instagram doesn't have pagination yet
        break;
      
      case 'gmail':
        if (process.env.NODE_ENV === 'development') {
          console.log(`📧 [PLATFORM FETCHER] Fetching Gmail threads for user: ${userId}`);
        }
        const gmailResult = await convex.query(api.gmailQueries.getGmailThreadsPaginated, { 
          userId,
          paginationOpts: { numItems: INFINITE_SCROLL_CONFIG.PAGE_SIZE, cursor: null }
        });
        if (process.env.NODE_ENV === 'development') {
          console.log(`📧 [PLATFORM FETCHER] Gmail raw result:`, { 
            pageCount: gmailResult?.page?.length || 0,
            isDone: gmailResult?.isDone,
            sample: gmailResult?.page?.slice(0, 2),
            sampleThreadIds: gmailResult?.page?.slice(0, 3).map(thread => thread.threadId)
          });
        }
        newItems = processGmailData({ status: 'fulfilled', value: gmailResult.page });
        if (process.env.NODE_ENV === 'development') {
          console.log(`📧 [PLATFORM FETCHER] Gmail processed items:`, {
            processedCount: newItems.length,
            sampleProcessedIds: newItems.slice(0, 3).map(item => item.id)
          });
        }
        hasMore = !gmailResult.isDone;
        nextCursor = gmailResult.continueCursor;
        break;
      
      case 'insights':
        if (process.env.NODE_ENV === 'development') {
          console.log(`💡 [PLATFORM FETCHER] Fetching insights for user: ${userId}`);
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
          console.log(`💡 [PLATFORM FETCHER] Insights results:`, { 
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
            console.error('💡 [PLATFORM FETCHER] YouTube batch analysis error:', youtubeBatchAnalysis.reason);
          }
          if (instagramBatchAnalysis.status === 'rejected') {
            console.error('💡 [PLATFORM FETCHER] Instagram batch analysis error:', instagramBatchAnalysis.reason);
          }
          if (gmailBatchAnalysis.status === 'rejected') {
            console.error('💡 [PLATFORM FETCHER] Gmail batch analysis error:', gmailBatchAnalysis.reason);
          }
        }
        
        newItems = processAllInsightsData({
          youtubeBatchAnalysis,
          instagramBatchAnalysis,
          gmailBatchAnalysis
        });
        
        console.log(`💡 [PLATFORM FETCHER] Final processed insights:`, {
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
          platform: 'conversations',
          contentType: 'conversation',
          title: conv.title || 'Untitled Conversation',
          content: `${conv.title || ''}\n\n${(conv.messages || [])
            .map((m: any) => `${m.role || 'unknown'}: ${m.content || ''}`)
            .join('\n')}`,
          metadata: {
            createdAt: conv.createdAt || Date.now(),
            updatedAt: conv.updatedAt,
            messageCount: conv.messages?.length || 0,
            messages: conv.messages,
            analysis: conv.analysis,
            insights: conv.insights,
            recommendations: conv.recommendations,
            tags: conv.tags
          },
          originalDocument: conv
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
    let newItems: UnifiedContent[] = [];
    let hasMore = true;
    let nextCursor: string | null = null;

    // Fetch next batch based on platform
    switch (platform) {
      case 'youtube':
        const youtubeResult = await convex.query(api.youtubeQueries.getYouTubeVideos, { 
          userId, 
          limit: INFINITE_SCROLL_CONFIG.PAGE_SIZE,
          paginationOpts: { numItems: INFINITE_SCROLL_CONFIG.PAGE_SIZE, cursor: currentCursor }
        });
        newItems = processYouTubeData({ status: 'fulfilled', value: youtubeResult.videos });
        hasMore = !youtubeResult.isDone;
        nextCursor = youtubeResult.continueCursor;
        break;
      
      case 'gmail':
        const gmailResult = await convex.query(api.gmailQueries.getGmailThreadsPaginated, { 
          userId,
          paginationOpts: { numItems: INFINITE_SCROLL_CONFIG.PAGE_SIZE, cursor: currentCursor }
        });
        newItems = processGmailData({ status: 'fulfilled', value: gmailResult.page });
        hasMore = !gmailResult.isDone;
        nextCursor = gmailResult.continueCursor;
        break;
      
      default:
        // Other platforms don't support pagination yet
        return { items: [], hasMore: false, nextCursor: null };
    }

    return { items: newItems, hasMore, nextCursor };

  } catch (error) {
    console.error(`Failed to load more ${platform} content:`, error);
    throw error;
  }
} 