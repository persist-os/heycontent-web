import { useContentStore } from '@/store/content-store';
import { ConvexReactClient } from 'convex/react';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

// Type for convex client that can be either ConvexReactClient or ConvexHttpClient
type ConvexClient = ConvexReactClient | ConvexHttpClient;

// Helper function to check if convex client has the query method
function hasQueryMethod(client: any): client is { query: Function } {
  return client && typeof client.query === 'function';
}

export interface LinkReference {
  type: 'smart_note' | 'youtube' | 'instagram' | 'gmail' | 'insight' | 'conversation';
  id: string;
  index?: number; // For insights, the specific index in the list
}

export interface ResolvedLinkContent {
  type: string;
  title: string;
  content: string;
  contentId: string; // The original content ID that was resolved
  index?: number; // For insights, the specific index
  metadata?: any;
}

/**
 * Centralized function to resolve link content for chat context injection.
 * This is the single access point for fetching content from different link types.
 * 
 * Note: This function is designed to be called from the client side and will
 * use the existing Convex queries that are already being used in the app.
 */
export async function resolveLinkContent(
  link: LinkReference, 
  userId: string,
  allLinkableContent: any[],
  convex?: ConvexClient
): Promise<ResolvedLinkContent | null> {
  try {
    console.log('🔗 [LINK RESOLVER] Resolving link:', { link, userId, allLinkableContentCount: allLinkableContent?.length });

    switch (link.type) {
      case 'smart_note':
        return await resolveSmartNoteContent(link.id, userId, allLinkableContent);
      
      case 'youtube':
        return await resolveYouTubeContent(link.id, userId, allLinkableContent);
      
      case 'instagram':
        return await resolveInstagramContent(link.id, userId, allLinkableContent);
      
      case 'gmail':
        return await resolveGmailContent(link.id, userId, allLinkableContent, convex);
      
      case 'insight':
        return await resolveInsightContent(link.id, link.index, userId, allLinkableContent);
      
      case 'conversation':
        return await resolveConversationContent(link.id, userId, allLinkableContent);
      
      default:
        console.warn('🔗 [LINK RESOLVER] Unknown link type:', link.type);
        return null;
    }
  } catch (error) {
    console.error('🔗 [LINK RESOLVER] Error resolving link content:', error);
    return null;
  }
}

/**
 * Resolve smart note content - returns the actual note content with title, statistics, and analysis
 */
async function resolveSmartNoteContent(noteId: string, userId: string, allLinkableContent: any[]): Promise<ResolvedLinkContent | null> {
  try {
    // Remove 'note:' or 'notes:' prefix if present
    const actualNoteId = noteId.startsWith('note:') ? noteId.replace('note:', '') : 
                        noteId.startsWith('notes:') ? noteId.replace('notes:', '') : noteId;
    

    
    const note = allLinkableContent.find(item => 
      item.id === actualNoteId || 
      item.id === `note:${actualNoteId}` || 
      item.id === `notes:${actualNoteId}`
    );

    if (!note) {
      console.warn('🔗 [LINK RESOLVER] Smart note not found:', {
        noteId,
        actualNoteId,
        availableNoteIds: allLinkableContent.filter(item => item.type === 'note').map(item => item.id),
        allLinkableContentCount: allLinkableContent.length,
        allLinkableContentTypes: allLinkableContent.map(item => item.type)
      });
      return null;
    }
    


    // Build comprehensive content including full note body/content, title, statistics, analysis, etc.
    let contentParts = [];

    // Add title
    if (note.title) {
      contentParts.push(`Title: ${note.title}`);
    }

    // Add main note content if available
    if (note.content) {
      contentParts.push(`Content: ${note.content}`);
    }

    // Add statistics if available
    if (note.statistics) {
      const stats = note.statistics;
      const statsParts = [];
      if (stats.views !== undefined) statsParts.push(`Views: ${stats.views.toLocaleString()}`);
      if (stats.likes !== undefined) statsParts.push(`Likes: ${stats.likes.toLocaleString()}`);
      if (stats.comments !== undefined) statsParts.push(`Comments: ${stats.comments.toLocaleString()}`);
      if (stats.shares !== undefined) statsParts.push(`Shares: ${stats.shares.toLocaleString()}`);
      if (stats.engagement_rate !== undefined) statsParts.push(`Engagement Rate: ${(stats.engagement_rate * 100).toFixed(2)}%`);
      if (stats.reach !== undefined) statsParts.push(`Reach: ${stats.reach.toLocaleString()}`);
      if (stats.impressions !== undefined) statsParts.push(`Impressions: ${stats.impressions.toLocaleString()}`);
      if (statsParts.length > 0) {
        contentParts.push(`Statistics: ${statsParts.join(', ')}`);
      }
    }

    // Add analysis content
    if (note.analysis) {
      const analysisText = typeof note.analysis === 'string' ? note.analysis : JSON.stringify(note.analysis, null, 2);
      contentParts.push(`Analysis: ${analysisText}`);
    }

    // Add insights if available
    if (note.insights && Array.isArray(note.insights) && note.insights.length > 0) {
      const insightsText = note.insights
        .map((insight: any, index: number) => `${index + 1}. ${insight.text || insight}`)
        .join('\n');
      contentParts.push(`Key Insights:\n${insightsText}`);
    }

    // Add recommendations if available
    if (note.recommendations && Array.isArray(note.recommendations) && note.recommendations.length > 0) {
      const recommendationsText = note.recommendations
        .map((rec: any, index: number) => `${index + 1}. ${rec.text || rec}`)
        .join('\n');
      contentParts.push(`Recommendations:\n${recommendationsText}`);
    }

    // Add tags if available
    if (note.tags && Array.isArray(note.tags) && note.tags.length > 0) {
      contentParts.push(`Tags: ${note.tags.join(', ')}`);
    }

    // Add platform and content type info
    if (note.platform || note.contentType) {
      const platformInfo = [];
      if (note.platform) platformInfo.push(note.platform);
      if (note.contentType) platformInfo.push(note.contentType);
      contentParts.push(`Platform: ${platformInfo.join(' - ')}`);
    }

    // Add creation date if available
    if (note.createdAt) {
      const date = new Date(note.createdAt).toLocaleDateString();
      contentParts.push(`Created: ${date}`);
    }

    const fullContent = contentParts.join('\n\n');
    

    
    return {
      type: 'smart_note',
      title: note.title || 'Smart Note',
      content: fullContent,
      contentId: noteId,
      metadata: {
        contentType: note.contentType,
        platform: note.platform,
        createdAt: note.createdAt,
        important: note.important,
        statistics: note.statistics,
        insights: note.insights,
        recommendations: note.recommendations,
        tags: note.tags
      }
    };
  } catch (error) {
    console.error('🔗 [LINK RESOLVER] Error resolving smart note:', error);
    return null;
  }
}

/**
 * Resolve YouTube content - returns the analysis column
 */
async function resolveYouTubeContent(videoId: string, userId: string, allLinkableContent: any[]): Promise<ResolvedLinkContent | null> {
  try {
    // Remove 'youtube:' prefix if present
    const actualVideoId = videoId.startsWith('youtube:') ? videoId.replace('youtube:', '') : videoId;
    
    const video = allLinkableContent.find(item => item.id === `youtube:${actualVideoId}`);

    if (!video) {
      console.warn('🔗 [LINK RESOLVER] YouTube video not found:', videoId);
      return null;
    }

    // Only include analysis and statistics
    let contentParts = [];
    if (video.analysis) {
      console.log('🔗 [LINK RESOLVER] YouTube analysis type:', typeof video.analysis, video.analysis);
      const analysisText = typeof video.analysis === 'string' ? video.analysis : JSON.stringify(video.analysis, null, 2);
      console.log('🔗 [LINK RESOLVER] YouTube analysis text:', analysisText);
      contentParts.push(`Analysis: ${analysisText}`);
    }
    if (video.statistics) {
      const stats = video.statistics;
      const statsParts = [];
      if (stats.views !== undefined) statsParts.push(`Views: ${stats.views.toLocaleString()}`);
      if (stats.likes !== undefined) statsParts.push(`Likes: ${stats.likes.toLocaleString()}`);
      if (stats.comments !== undefined) statsParts.push(`Comments: ${stats.comments.toLocaleString()}`);
      if (stats.shares !== undefined) statsParts.push(`Shares: ${stats.shares.toLocaleString()}`);
      if (stats.engagement_rate !== undefined) statsParts.push(`Engagement Rate: ${(stats.engagement_rate * 100).toFixed(2)}%`);
      if (stats.reach !== undefined) statsParts.push(`Reach: ${stats.reach.toLocaleString()}`);
      if (stats.impressions !== undefined) statsParts.push(`Impressions: ${stats.impressions.toLocaleString()}`);
      if (statsParts.length > 0) {
        contentParts.push(`Statistics: ${statsParts.join(', ')}`);
      }
    }
    const fullContent = contentParts.join('\n\n');
    return {
      type: 'youtube',
      title: video.title,
      content: fullContent,
      contentId: videoId,
      metadata: {
        contentType: video.contentType,
        platform: video.platform,
        createdAt: video.createdAt,
        thumbnailUrl: video.thumbnailUrl,
        statistics: video.statistics
      }
    };
  } catch (error) {
    console.error('🔗 [LINK RESOLVER] Error resolving YouTube content:', error);
    return null;
  }
}

/**
 * Resolve Instagram content - returns the analysis and statistics
 */
async function resolveInstagramContent(postId: string, userId: string, allLinkableContent: any[]): Promise<ResolvedLinkContent | null> {
  try {
    // Remove 'instagram:' prefix if present
    const actualPostId = postId.startsWith('instagram:') ? postId.replace('instagram:', '') : postId;
    
    console.log('🔗 [LINK RESOLVER] Resolving Instagram content:', {
      originalPostId: postId,
      actualPostId,
      allLinkableContentCount: allLinkableContent.length,
      instagramItemsCount: allLinkableContent.filter(item => item.id?.startsWith('instagram:')).length
    });
    
    const post = allLinkableContent.find(item => item.id === `instagram:${actualPostId}`);

    if (!post) {
      console.warn('🔗 [LINK RESOLVER] Instagram post not found:', postId);
      console.log('🔗 [LINK RESOLVER] Available Instagram IDs:', 
        allLinkableContent
          .filter(item => item.id?.startsWith('instagram:'))
          .map(item => item.id)
          .slice(0, 10) // Show first 10
      );
      return null;
    }

    console.log('🔗 [LINK RESOLVER] Found Instagram post:', {
      id: post.id,
      title: post.title,
      hasContent: !!post.content,
      hasStatistics: !!post.statistics,
      statisticsKeys: post.statistics ? Object.keys(post.statistics) : 'none',
      hasInsights: !!post.insights,
      insightsKeys: post.insights ? Object.keys(post.insights) : 'none',
      hasAnalysis: !!post.analysis,
      hasAnalysisMarkdown: !!post.analysisMarkdown,
      hasConvexData: !!post.convexData,
      contentType: post.contentType,
      mediaType: post.mediaType,
    });

    // Build comprehensive content including caption, insights, statistics, analysis, etc.
    let contentParts = [];

    // Add caption
    if (post.content) {
      contentParts.push(`Caption: ${post.content}`);
    }

    // Add media type
    if (post.contentType) {
      contentParts.push(`Media Type: ${post.contentType.toUpperCase()}`);
    }

    // Add statistics if available - use both insights and statistics fields
    const stats = post.statistics || post.insights || {};
    if (stats && Object.keys(stats).length > 0) {
      const statsParts = [];
      if (stats.likes !== undefined && stats.likes !== null) statsParts.push(`Likes: ${stats.likes.toLocaleString()}`);
      if (stats.comments !== undefined && stats.comments !== null) statsParts.push(`Comments: ${stats.comments.toLocaleString()}`);
      if (stats.reach !== undefined && stats.reach !== null) statsParts.push(`Reach: ${stats.reach.toLocaleString()}`);
      if (stats.impressions !== undefined && stats.impressions !== null) statsParts.push(`Impressions: ${stats.impressions.toLocaleString()}`);
      if (stats.saved !== undefined && stats.saved !== null) statsParts.push(`Saved: ${stats.saved.toLocaleString()}`);
      if (stats.shares !== undefined && stats.shares !== null) statsParts.push(`Shares: ${stats.shares.toLocaleString()}`);
      if (stats.total_interactions !== undefined && stats.total_interactions !== null) statsParts.push(`Total Interactions: ${stats.total_interactions.toLocaleString()}`);
      if (stats.profile_visits !== undefined && stats.profile_visits !== null) statsParts.push(`Profile Visits: ${stats.profile_visits.toLocaleString()}`);
      if (stats.views !== undefined && stats.views !== null) statsParts.push(`Views: ${stats.views.toLocaleString()}`);
      
      if (statsParts.length > 0) {
        contentParts.push(`Statistics: ${statsParts.join(', ')}`);
        console.log('🔗 [LINK RESOLVER] Added statistics:', statsParts.join(', '));
      }
    } else {
      console.log('🔗 [LINK RESOLVER] No statistics found for post');
    }

    // Add analysis content if available
    if (post.analysis) {
      const analysisText = typeof post.analysis === 'string' ? post.analysis : JSON.stringify(post.analysis, null, 2);
      contentParts.push(`Analysis: ${analysisText}`);
      console.log('🔗 [LINK RESOLVER] Added analysis (length:', analysisText.length, ')');
    }

    // Add additional insights if available and different from statistics
    if (post.insights && post.insights !== post.statistics) {
      const insightsText = typeof post.insights === 'string' ? post.insights : JSON.stringify(post.insights, null, 2);
      contentParts.push(`Additional Insights: ${insightsText}`);
      console.log('🔗 [LINK RESOLVER] Added additional insights');
    }

    // Add platform and content type info
    if (post.platform || post.contentType) {
      const platformInfo = [];
      if (post.platform) platformInfo.push(post.platform);
      if (post.contentType) platformInfo.push(post.contentType);
      contentParts.push(`Platform: ${platformInfo.join(' - ')}`);
    }

    // Add creation date if available
    if (post.createdAt) {
      const date = new Date(post.createdAt).toLocaleDateString();
      contentParts.push(`Published: ${date}`);
    }

    // Add media URLs for reference
    if (post.mediaUrl) {
      contentParts.push(`Media URL: ${post.mediaUrl}`);
    }
    if (post.thumbnailUrl && post.thumbnailUrl !== post.mediaUrl) {
      contentParts.push(`Thumbnail URL: ${post.thumbnailUrl}`);
    }

    const fullContent = contentParts.join('\n\n');
    
    console.log('🔗 [LINK RESOLVER] Built comprehensive content (length:', fullContent.length, ')');
    console.log('🔗 [LINK RESOLVER] Content preview:', fullContent.substring(0, 300) + '...');
    
    return {
      type: 'instagram',
      title: post.title || 'Instagram Post',
      content: fullContent,
      contentId: postId,
      metadata: {
        contentType: post.contentType,
        platform: post.platform,
        createdAt: post.createdAt,
        mediaUrl: post.mediaUrl,
        thumbnailUrl: post.thumbnailUrl,
        insights: post.insights,
        statistics: post.statistics,
        analysis: post.analysis
      }
    };
  } catch (error) {
    console.error('🔗 [LINK RESOLVER] Error resolving Instagram content:', error);
    return null;
  }
}

/**
 * Resolve Gmail content - returns the email thread content
 */
async function resolveGmailContent(threadId: string, userId: string, allLinkableContent: any[], convex?: ConvexClient): Promise<ResolvedLinkContent | null> {
  try {
    // Remove 'gmail:' prefix if present
    const actualThreadId = threadId.startsWith('gmail:') ? threadId.replace('gmail:', '') : threadId;
    
    // Debug logging to understand what we're looking for and what's available
    console.log('🔗 [LINK RESOLVER] resolveGmailContent debug:', {
      originalThreadId: threadId,
      actualThreadId,
      lookingForId: `gmail:${actualThreadId}`,
      allLinkableContentCount: allLinkableContent?.length,
      gmailItems: allLinkableContent?.filter(item => item.id?.startsWith('gmail:')).map(item => ({
        id: item.id,
        title: item.title,
        type: item.type
      })).slice(0, 5) // Show first 5 Gmail items
    });
    
    let thread = allLinkableContent.find(item => item.id === `gmail:${actualThreadId}`);

    if (!thread) {
      console.warn('🔗 [LINK RESOLVER] Gmail thread not found:', threadId);
      // Try to find by just the threadId without the gmail: prefix
      const alternativeThread = allLinkableContent.find(item => item.id === actualThreadId);
      if (alternativeThread) {
        console.log('🔗 [LINK RESOLVER] Found thread by alternative ID:', alternativeThread.id);
        // Use the alternative thread
        thread = alternativeThread;
      } else {
        console.warn('🔗 [LINK RESOLVER] Gmail thread not found by any method:', {
          threadId,
          actualThreadId,
          availableGmailIds: allLinkableContent?.filter(item => item.id?.startsWith('gmail:')).map(item => item.id).slice(0, 10)
        });
        return null;
      }
    }

    // Now fetch the actual Gmail thread data from the database
    if (!convex) {
      console.warn('🔗 [LINK RESOLVER] Convex client not available, using fallback data');
      // Fall back to using the basic thread data from the store
      return {
        type: 'gmail',
        title: thread.title || 'Gmail Thread',
        content: thread.content || 'No content available',
        contentId: threadId,
        metadata: {
          from: thread.from,
          messageCount: thread.messageCount,
          category: thread.category,
          contentType: thread.contentType,
          platform: thread.platform,
          createdAt: thread.createdAt,
          analysis: thread.analysis
        }
      };
    }

    console.log('🔗 [LINK RESOLVER] About to fetch Gmail thread data:', {
      userId,
      actualThreadId,
      convexAvailable: !!convex,
      convexType: convex.constructor.name
    });

    try {
      // Fetch the full Gmail thread data
      const fullThreadData = await convex.query(api.gmailQueries.getGmailThreadByThreadId, {
        userId,
        threadId: actualThreadId
      });

      console.log('🔗 [LINK RESOLVER] Gmail thread query result:', {
        found: !!fullThreadData,
        threadId: fullThreadData?.threadId,
        subject: fullThreadData?.subject,
        messageCount: fullThreadData?.message_count,
        hasMessages: !!fullThreadData?.messages,
        messagesCount: fullThreadData?.messages?.length || 0
      });

      if (!fullThreadData) {
        console.warn('🔗 [LINK RESOLVER] Full Gmail thread data not found for threadId:', actualThreadId);
        // Fall back to using the basic thread data from the store
        // Try to extract better content from the thread data
        const threadData = thread.data || {};
        const messages = threadData.messages || thread.messages || [];
        
        let fallbackContent = '';
        if (messages && messages.length > 0) {
          const contentParts = [];
          contentParts.push(`Subject: ${thread.title || 'No Subject'}`);
          contentParts.push(`From: ${thread.from || 'Unknown Sender'}`);
          contentParts.push('\n--- Email Content ---');
          
          messages.forEach((message: any, index: number) => {
            contentParts.push(`\nMessage ${index + 1}:`);
            if (message.from) {
              contentParts.push(`From: ${message.from}`);
            }
            if (message.subject) {
              contentParts.push(`Subject: ${message.subject}`);
            }
            const messageContent = message.snippet || message.body || message.content || '';
            if (messageContent) {
              contentParts.push(`Content: ${messageContent}`);
            }
          });
          
          fallbackContent = contentParts.join('\n');
        } else {
          fallbackContent = thread.content || 'No content available';
        }
        
        return {
          type: 'gmail',
          title: thread.title || 'Gmail Thread',
          content: fallbackContent,
          contentId: threadId,
          metadata: {
            from: thread.from,
            messageCount: thread.messageCount,
            category: thread.category,
            contentType: thread.contentType,
            platform: thread.platform,
            createdAt: thread.createdAt,
            analysis: thread.analysis
          }
        };
      }

      // Build comprehensive Gmail content from the full thread data
      let contentParts = [];
      
      // Extract data from the thread - the actual content is in the data field
      const threadData = fullThreadData.data || {};
      const messages = threadData.messages || fullThreadData.messages || [];
      
      // Add subject from thread data or messages
      const subject = threadData.subject || fullThreadData.subject || (messages[0]?.subject) || 'No Subject';
      contentParts.push(`Subject: ${subject}`);
      
      // Add from field from thread data or messages
      const from = threadData.from || fullThreadData.from || (messages[0]?.from) || 'Unknown Sender';
      contentParts.push(`From: ${from}`);
      
      // Add the actual email content from messages
      if (messages && messages.length > 0) {
        contentParts.push('\n--- Email Content ---');
        messages.forEach((message: any, index: number) => {
          contentParts.push(`\nMessage ${index + 1}:`);
          if (message.from) {
            contentParts.push(`From: ${message.from}`);
          }
          if (message.subject) {
            contentParts.push(`Subject: ${message.subject}`);
          }
          // Extract the actual message content - check multiple possible fields
          let messageContent = '';
          if (message.snippet) {
            messageContent = message.snippet;
          } else if (message.body) {
            messageContent = message.body;
          } else if (message.content) {
            messageContent = message.content;
          } else if (message.data?.snippet) {
            messageContent = message.data.snippet;
          } else if (message.data?.body) {
            messageContent = message.data.body;
          }
          
          if (messageContent) {
            contentParts.push(`Content: ${messageContent}`);
          }
        });
      } else if (fullThreadData.snippet) {
        // Fall back to thread snippet if no messages are available
        contentParts.push(`\nContent: ${fullThreadData.snippet}`);
      }
      
      // Add message count
      const messageCount = messages.length || fullThreadData.message_count || 1;
      contentParts.push(`\nTotal Messages: ${messageCount}`);
      
      // Add category if available
      if (fullThreadData.category && fullThreadData.category !== 'none') {
        contentParts.push(`Category: ${fullThreadData.category}`);
      }
      
      // Join all content parts
      const fullContent = contentParts.join('\n');
      
      console.log('🔗 [LINK RESOLVER] Built Gmail content:', {
        contentLength: fullContent.length,
        contentPreview: fullContent.substring(0, 200) + '...',
        messageCount: fullThreadData.message_count,
        hasMessages: !!fullThreadData.messages,
        messagesCount: fullThreadData.messages?.length || 0
      });

      return {
        type: 'gmail',
        title: fullThreadData.subject || 'Gmail Thread',
        content: fullContent,
        contentId: threadId,
        metadata: {
          from: fullThreadData.from,
          messageCount: fullThreadData.message_count,
          category: fullThreadData.category,
          contentType: 'email',
          platform: 'gmail',
          createdAt: fullThreadData.createdAt,
          analysis: fullThreadData.analysis,
          threadId: fullThreadData.threadId
        }
      };

    } catch (error) {
      console.error('🔗 [LINK RESOLVER] Error fetching Gmail thread data:', error);
      // Fall back to using the basic thread data from the store
      // Try to extract better content from the thread data
      const threadData = thread.data || {};
      const messages = threadData.messages || thread.messages || [];
      
      let fallbackContent = '';
      if (messages && messages.length > 0) {
        const contentParts = [];
        contentParts.push(`Subject: ${thread.title || 'No Subject'}`);
        contentParts.push(`From: ${thread.from || 'Unknown Sender'}`);
        contentParts.push('\n--- Email Content ---');
        
        messages.forEach((message: any, index: number) => {
          contentParts.push(`\nMessage ${index + 1}:`);
          if (message.from) {
            contentParts.push(`From: ${message.from}`);
          }
          if (message.subject) {
            contentParts.push(`Subject: ${message.subject}`);
          }
          const messageContent = message.snippet || message.body || message.content || '';
          if (messageContent) {
            contentParts.push(`Content: ${messageContent}`);
          }
        });
        
        fallbackContent = contentParts.join('\n');
      } else {
        fallbackContent = thread.content || 'No content available';
      }
      
      return {
        type: 'gmail',
        title: thread.title || 'Gmail Thread',
        content: fallbackContent,
        contentId: threadId,
        metadata: {
          from: thread.from,
          messageCount: thread.messageCount,
          category: thread.category,
          contentType: thread.contentType,
          platform: thread.platform,
          createdAt: thread.createdAt,
          analysis: thread.analysis
        }
      };
    }
  } catch (error) {
    console.error('🔗 [LINK RESOLVER] Error resolving Gmail content:', error);
    return null;
  }
}

/**
 * Resolve insight content - returns the specific insight (not the whole list)
 */
async function resolveInsightContent(insightId: string, index?: number, userId?: string, allLinkableContent?: any[]): Promise<ResolvedLinkContent | null> {
  try {
    console.log('🔗 [LINK RESOLVER] Resolving insight:', { insightId, index, allLinkableContentCount: allLinkableContent?.length });
    
    // insightId is now in format "platform:analysisId" (parsed by parseContentId)
    // index is already the parsed index
    const [platform, analysisId] = insightId.split(':');
    const actualIndex = index;
    
    if (actualIndex === undefined || isNaN(actualIndex)) {
      console.warn('🔗 [LINK RESOLVER] Invalid insight index:', actualIndex);
      return null;
    }
    
    // Look for the insight in allLinkableContent
    // The insight items have IDs in format: insight:platform:analysisId:index (without 's')
    // or insights:platform:analysisId:index (with 's')
    let insight = allLinkableContent?.find(item => {
      if (item.type !== 'insight') return false;
      return item.id === `insight:${platform}:${analysisId}:${actualIndex}` || 
             item.id === `insights:${platform}:${analysisId}:${actualIndex}` ||
             item.id === insightId; // Also try the exact insightId
    });
    
    console.log('🔗 [LINK RESOLVER] Found insight:', { insight, analysisId, actualIndex });
    
    if (!insight) {
      console.warn('🔗 [LINK RESOLVER] Insight not found:', analysisId);
      // Debug: show available insight IDs
      const availableInsightIds = allLinkableContent?.filter(item => item.type === 'insight').map(item => item.id) || [];
      console.log('🔗 [LINK RESOLVER] Available insight IDs:', availableInsightIds);
      return null;
    }
    // Only include the individual insight referenced by index
    let content = '';
    if (insight.insights && Array.isArray(insight.insights) && insight.insights[actualIndex]) {
      const singleInsight = insight.insights[actualIndex];
      
      console.log('🔗 [LINK RESOLVER] Processing single insight:', {
        insightIndex: actualIndex,
        singleInsight,
        hasActionSteps: !!singleInsight.actionSteps,
        actionStepsCount: singleInsight.actionSteps?.length || 0,
        hasExpectedOutcome: !!singleInsight.expectedOutcome,
        hasImpact: !!singleInsight.impact,
        hasWhyNow: !!singleInsight.whyNow,
        whyNowCount: singleInsight.whyNow?.length || 0,
        hasSourceDetails: !!singleInsight.sourceDetails,
        sourceDetailsCount: singleInsight.sourceDetails?.length || 0,
        hasRelatedItems: !!singleInsight.relatedItems,
        relatedItemsCount: singleInsight.relatedItems?.length || 0
      });
      
      // Format the insight content properly with all available fields
      const insightContent = [
        `Title: ${singleInsight.title || 'Untitled Insight'}`,
        '',
        'Action Steps:',
        ...(singleInsight.actionSteps || []).map((step: string, i: number) => `${i + 1}. ${step}`),
        '',
        `Expected Outcome: ${singleInsight.expectedOutcome || 'Not specified'}`,
        '',
        `Impact: ${singleInsight.impact || 'Not specified'}`,
        '',
        'Why Now:',
        ...(singleInsight.whyNow || []).map((reason: string, i: number) => `${i + 1}. ${reason}`),
        '',
        'Source Details:',
        ...(singleInsight.sourceDetails || []).map((detail: string, i: number) => `${i + 1}. ${detail}`),
        '',
        'Related Items:',
        ...(singleInsight.relatedItems || []).map((item: any) => `${item.label}: ${item.value}`),
        '',
        `Platform: ${singleInsight.platform || insight.platform || 'Not specified'}`,
        '',
        `Highlight Color: ${singleInsight.highlightColor || 'Not specified'}`,
        `Outcome Color: ${singleInsight.outcomeColor || 'Not specified'}`
      ].join('\n');
      
      content = insightContent;
      
      console.log('🔗 [LINK RESOLVER] Generated insight content:', {
        contentLength: content.length,
        contentPreview: content.substring(0, 300) + '...'
      });
    } else if (insight.analysis) {
      // fallback
      content = insight.analysis;
      console.log('🔗 [LINK RESOLVER] Using fallback analysis content:', {
        contentLength: content.length,
        contentPreview: content.substring(0, 300) + '...'
      });
    } else {
      console.warn('🔗 [LINK RESOLVER] No insight content found, using title only');
      content = insight.title || 'No content available';
    }
    return {
      type: 'insight',
      title: insight.title,
      content,
      contentId: analysisId,
      index: actualIndex,
      metadata: {
        contentType: insight.contentType,
        platform: insight.platform,
        createdAt: insight.createdAt,
        insights: insight.insights
      }
    };
  } catch (error) {
    console.error('🔗 [LINK RESOLVER] Error resolving insight content:', error);
    return null;
  }
}

/**
 * Resolve conversation content - returns the full conversation thread
 */
async function resolveConversationContent(conversationId: string, userId: string, allLinkableContent: any[]): Promise<ResolvedLinkContent | null> {
  try {
    // Remove 'conversation:' prefix if present
    const actualConversationId = conversationId.startsWith('conversation:') ? conversationId.replace('conversation:', '') : conversationId;
    
    console.log('🔗 [LINK RESOLVER] Resolving conversation content:', {
      originalConversationId: conversationId,
      actualConversationId,
      allLinkableContentCount: allLinkableContent.length,
      conversationItemsCount: allLinkableContent.filter(item => item.id?.startsWith('conversation:')).length
    });
    
    const conversation = allLinkableContent.find(item => item.id === `conversation:${actualConversationId}`);

    if (!conversation) {
      console.warn('🔗 [LINK RESOLVER] Conversation not found:', conversationId);
      console.log('🔗 [LINK RESOLVER] Available conversation IDs:', 
        allLinkableContent
          .filter(item => item.id?.startsWith('conversation:'))
          .map(item => item.id)
          .slice(0, 10) // Show first 10
      );
      console.log('🔗 [LINK RESOLVER] All available content types:', 
        allLinkableContent.reduce((acc, item) => {
          acc[item.type || 'unknown'] = (acc[item.type || 'unknown'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );
      return null;
    }

    console.log('🔗 [LINK RESOLVER] Found conversation:', {
      id: conversation.id,
      title: conversation.title,
      hasMessages: !!conversation.messages,
      messagesCount: conversation.messages?.length || 0,
      hasAnalysis: !!conversation.analysis,
      hasAnalysisMarkdown: !!conversation.analysisMarkdown,
      hasConvexData: !!conversation.convexData,
      contentType: conversation.contentType,
      platform: conversation.platform,
    });

    // Build comprehensive conversation content including title, messages, analysis, etc.
    let contentParts = [];

    // Add title
    if (conversation.title) {
      contentParts.push(`Title: ${conversation.title}`);
    }

    // Add messages
    if (conversation.messages && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
      contentParts.push('\n--- Conversation Messages ---');
      conversation.messages.forEach((message: any, index: number) => {
        contentParts.push(`\nMessage ${index + 1}:`);
        if (message.from) {
          contentParts.push(`From: ${message.from}`);
        }
        if (message.role) {
          contentParts.push(`Role: ${message.role}`);
        }
        if (message.content) {
          contentParts.push(`Content: ${message.content}`);
        }
        if (message.analysis) {
          const analysisText = typeof message.analysis === 'string' ? message.analysis : JSON.stringify(message.analysis, null, 2);
          contentParts.push(`Analysis: ${analysisText}`);
        }
        if (message.insights && Array.isArray(message.insights) && message.insights.length > 0) {
          const insightsText = message.insights
            .map((insight: any, i: number) => `${i + 1}. ${insight.text || insight}`)
            .join('\n');
          contentParts.push(`Insights:\n${insightsText}`);
        }
        if (message.recommendations && Array.isArray(message.recommendations) && message.recommendations.length > 0) {
          const recommendationsText = message.recommendations
            .map((rec: any, i: number) => `${i + 1}. ${rec.text || rec}`)
            .join('\n');
          contentParts.push(`Recommendations:\n${recommendationsText}`);
        }
        if (message.tags && Array.isArray(message.tags) && message.tags.length > 0) {
          contentParts.push(`Tags: ${message.tags.join(', ')}`);
        }
        if (message.platform || message.contentType) {
          const platformInfo = [];
          if (message.platform) platformInfo.push(message.platform);
          if (message.contentType) platformInfo.push(message.contentType);
          contentParts.push(`Platform: ${platformInfo.join(' - ')}`);
        }
        if (message.createdAt) {
          const date = new Date(message.createdAt).toLocaleDateString();
          contentParts.push(`Created: ${date}`);
        }
      });
    }

    // Add analysis content
    if (conversation.analysis) {
      const analysisText = typeof conversation.analysis === 'string' ? conversation.analysis : JSON.stringify(conversation.analysis, null, 2);
      contentParts.push(`\nAnalysis: ${analysisText}`);
    }

    // Add insights if available
    if (conversation.insights && Array.isArray(conversation.insights) && conversation.insights.length > 0) {
      const insightsText = conversation.insights
        .map((insight: any, index: number) => `${index + 1}. ${insight.text || insight}`)
        .join('\n');
      contentParts.push(`Key Insights:\n${insightsText}`);
    }

    // Add recommendations if available
    if (conversation.recommendations && Array.isArray(conversation.recommendations) && conversation.recommendations.length > 0) {
      const recommendationsText = conversation.recommendations
        .map((rec: any, index: number) => `${index + 1}. ${rec.text || rec}`)
        .join('\n');
      contentParts.push(`Recommendations:\n${recommendationsText}`);
    }

    // Add tags if available
    if (conversation.tags && Array.isArray(conversation.tags) && conversation.tags.length > 0) {
      contentParts.push(`Tags: ${conversation.tags.join(', ')}`);
    }

    // Add platform and content type info
    if (conversation.platform || conversation.contentType) {
      const platformInfo = [];
      if (conversation.platform) platformInfo.push(conversation.platform);
      if (conversation.contentType) platformInfo.push(conversation.contentType);
      contentParts.push(`Platform: ${platformInfo.join(' - ')}`);
    }

    // Add creation date if available
    if (conversation.createdAt) {
      const date = new Date(conversation.createdAt).toLocaleDateString();
      contentParts.push(`Created: ${date}`);
    }

    const fullContent = contentParts.join('\n\n');
    
    console.log('🔗 [LINK RESOLVER] Built comprehensive conversation content (length:', fullContent.length, ')');
    console.log('🔗 [LINK RESOLVER] Content preview:', fullContent.substring(0, 300) + '...');
    
    return {
      type: 'conversation',
      title: conversation.title || 'Conversation',
      content: fullContent,
      contentId: conversationId,
      metadata: {
        contentType: conversation.contentType,
        platform: conversation.platform,
        createdAt: conversation.createdAt,
        messages: conversation.messages,
        analysis: conversation.analysis,
        insights: conversation.insights,
        recommendations: conversation.recommendations,
        tags: conversation.tags
      }
    };
  } catch (error) {
    console.error('🔗 [LINK RESOLVER] Error resolving conversation content:', error);
    return null;
  }
}

/**
 * Parse a content ID string into a LinkReference object
 */
export function parseContentId(contentId: string): LinkReference | null {
  try {
    if (!contentId.includes(':')) {
      // Assume it's a smart note ID
      return {
        type: 'smart_note',
        id: contentId
      };
    }

    const parts = contentId.split(':');
    
    switch (parts[0]) {
      case 'note':
      case 'notes':
        return {
          type: 'smart_note',
          id: parts.slice(1).join(':')
        };
      
      case 'youtube':
        return {
          type: 'youtube',
          id: parts.slice(1).join(':')
        };
      
      case 'instagram':
        return {
          type: 'instagram',
          id: parts.slice(1).join(':')
        };
      
      case 'gmail':
        return {
          type: 'gmail',
          id: parts.slice(1).join(':')
        };
      
      case 'insight':
      case 'insights':
        // Parse insight ID which has format: insights:platform:analysisId:index
        if (parts.length < 4) {
          console.warn('🔗 [LINK RESOLVER] Invalid insight format in content ID:', contentId);
          return null;
        }
        
        const platform = parts[1]; // youtube, instagram, or gmail
        const analysisId = parts[2];
        const indexStr = parts[3];
        const index = parseInt(indexStr, 10);
        
        if (isNaN(index)) {
          console.warn('🔗 [LINK RESOLVER] Invalid insight index in content ID:', contentId);
          return null;
        }
        
        return {
          type: 'insight',
          id: `${platform}:${analysisId}`,
          index: index
        };
      
      case 'conversation':
      case 'conversations':
        return {
          type: 'conversation',
          id: parts.slice(1).join(':')
        };
      
      default:
        console.warn('🔗 [LINK RESOLVER] Unknown content type prefix:', parts[0]);
        return null;
    }
  } catch (error) {
    console.error('🔗 [LINK RESOLVER] Error parsing content ID:', error);
    return null;
  }
}

/**
 * Extract all content IDs from a message and resolve their content
 */
// Function to extract content IDs from message content
function extractContentIds(content: string): string[] {
  const contentIdPattern = /@\[([^\]]+)\]@/g;
  const contentIds: string[] = [];
  let match;
  
  while ((match = contentIdPattern.exec(content)) !== null) {
    contentIds.push(match[1]);
  }
  
  return contentIds;
}

/**
 * Server-side version of resolveAllLinkContent that doesn't rely on client-side content store
 * This function is designed to be called from API routes and server-side code
 */
export async function resolveAllLinkContentServer(
  message: string, 
  userId: string, 
  convex: ConvexClient
): Promise<ResolvedLinkContent[]> {
  try {
    console.log('🔗 [LINK RESOLVER SERVER] Starting to resolve all link content in message:', message);

    // Extract content IDs from the message
    const contentIds = extractContentIds(message);
    
    if (contentIds.length === 0) {
      console.log('🔗 [LINK RESOLVER SERVER] No content IDs found in message');
      return [];
    }

    console.log('🔗 [LINK RESOLVER SERVER] Found content IDs in message:', contentIds);

    // Resolve all content in parallel using direct Convex queries
    const resolvedContent = await Promise.all(
      contentIds.map(async (contentId) => {
        const linkRef = parseContentId(contentId);
        if (!linkRef) {
          console.warn('🔗 [LINK RESOLVER SERVER] Could not parse content ID:', contentId);
          return null;
        }
        
        console.log('🔗 [LINK RESOLVER SERVER] About to resolve:', {
          contentId,
          linkRef
        });
        
        return await resolveLinkContentServer(linkRef, userId, convex);
      })
    );

    // Filter out null results and return
    const validContent = resolvedContent.filter((content): content is ResolvedLinkContent => content !== null);
    
    console.log('🔗 [LINK RESOLVER SERVER] Resolved content count:', validContent.length);
    
    return validContent;
    
  } catch (error) {
    console.error('🔗 [LINK RESOLVER SERVER] Error resolving link content:', error);
    return [];
  }
}

/**
 * Server-side version of resolveLinkContent that doesn't rely on client-side content store
 */
async function resolveLinkContentServer(
  link: LinkReference, 
  userId: string,
  convex: ConvexClient
): Promise<ResolvedLinkContent | null> {
  try {
    console.log('🔗 [LINK RESOLVER SERVER] Resolving link:', { link, userId });

    switch (link.type) {
      case 'smart_note':
        return await resolveSmartNoteContentServer(link.id, userId, convex);
      
      case 'youtube':
        return await resolveYouTubeContentServer(link.id, userId, convex);
      
      case 'instagram':
        return await resolveInstagramContentServer(link.id, userId, convex);
      
      case 'gmail':
        return await resolveGmailContentServer(link.id, userId, convex);
      
      case 'insight':
        return await resolveInsightContentServer(link.id, link.index, userId, convex);
      
      case 'conversation':
        return await resolveConversationContentServer(link.id, userId, convex);
      
      default:
        console.warn('🔗 [LINK RESOLVER SERVER] Unknown link type:', link.type);
        return null;
    }
  } catch (error) {
    console.error('🔗 [LINK RESOLVER SERVER] Error resolving link content:', error);
    return null;
  }
}

/**
 * Inline all link content directly into the message
 * This replaces link tokens with their actual content
 */
export async function inlineLinkContent(
  message: string,
  userId: string,
  allLinkableContent: any[]
): Promise<string> {
  try {
    console.log('🔗 [LINK INLINER] Inlining links in message:', message);
    
    // Find all link tokens in the message (format: @[type:id]@)
    const linkRegex = /@\[([^\]]+)\]@/g;
    let match;
    let inlinedMessage = message;
    
    while ((match = linkRegex.exec(message)) !== null) {
      const fullMatch = match[0]; // e.g., "@[note:abc123]@"
      const contentId = match[1]; // e.g., "note:abc123"
      
      console.log('🔗 [LINK INLINER] Found link token:', { fullMatch, contentId });
      
      // Parse the content ID
      const linkRef = parseContentId(contentId);
      if (!linkRef) {
        console.warn('🔗 [LINK INLINER] Could not parse content ID:', contentId);
        continue;
      }
      
      // Resolve the link content
      const resolvedContent = await resolveLinkContent(linkRef, userId, allLinkableContent);
      if (!resolvedContent) {
        console.warn('🔗 [LINK INLINER] Could not resolve content for:', contentId);
        continue;
      }
      
      // Create the inlined content with a label
      const label = getContentLabel(resolvedContent.type);
      const inlinedContent = `[${label}: ${resolvedContent.content}]`;
      
      console.log('🔗 [LINK INLINER] Replacing token with content:', {
        token: fullMatch,
        contentLength: inlinedContent.length
      });
      
      // Replace the token in the message
      inlinedMessage = inlinedMessage.replace(fullMatch, inlinedContent);
    }
    
    console.log('🔗 [LINK INLINER] Final inlined message length:', inlinedMessage.length);
    return inlinedMessage;
    
  } catch (error) {
    console.error('🔗 [LINK INLINER] Error inlining link content:', error);
    return message; // Return original message if there's an error
  }
}

/**
 * Get a human-readable label for content types
 */
function getContentLabel(contentType: string): string {
  switch (contentType) {
    case 'smart_note':
      return 'Note';
    case 'youtube':
      return 'YouTube Video';
    case 'instagram':
      return 'Instagram Post';
    case 'gmail':
      return 'Gmail Thread';
    case 'insight':
      return 'Insight';
    case 'conversation':
      return 'Conversation';
    default:
      return 'Content';
  }
}

/**
 * Replace link tokens in a message with their titles
 * This makes the user message more readable while still providing full content to AI
 */
export async function replaceLinkTokensWithTitles(
  message: string,
  userId: string,
  allLinkableContent: any[]
): Promise<string> {
  try {
    console.log('🔗 [LINK TITLE REPLACER] Replacing link tokens with titles in message:', message);
    
    // Find all link tokens in the message (format: @[type:id]@)
    const linkRegex = /@\[([^\]]+)\]@/g;
    let match;
    let replacedMessage = message;
    
    while ((match = linkRegex.exec(message)) !== null) {
      const fullMatch = match[0]; // e.g., "@[note:abc123]@"
      const contentId = match[1]; // e.g., "note:abc123"
      
      console.log('🔗 [LINK TITLE REPLACER] Found link token:', { fullMatch, contentId });
      
      // Parse the content ID
      const linkRef = parseContentId(contentId);
      if (!linkRef) {
        console.warn('🔗 [LINK TITLE REPLACER] Could not parse content ID:', contentId);
        continue;
      }
      
      // Resolve the link content to get the title
      const resolvedContent = await resolveLinkContent(linkRef, userId, allLinkableContent);
      if (!resolvedContent) {
        console.warn('🔗 [LINK TITLE REPLACER] Could not resolve content for:', contentId);
        continue;
      }
      
      // Replace the token with just the title
      const titleReplacement = `[${resolvedContent.title}]`;
      
      console.log('🔗 [LINK TITLE REPLACER] Replacing token with title:', {
        token: fullMatch,
        title: resolvedContent.title
      });
      
      // Replace the token in the message
      replacedMessage = replacedMessage.replace(fullMatch, titleReplacement);
    }
    
    console.log('🔗 [LINK TITLE REPLACER] Final message with titles:', replacedMessage);
    return replacedMessage;
    
  } catch (error) {
    console.error('🔗 [LINK TITLE REPLACER] Error replacing link tokens with titles:', error);
    return message; // Return original message if there's an error
  }
} 

/**
 * Server-side conversation content resolver
 */
async function resolveConversationContentServer(conversationId: string, userId: string, convex: ConvexClient): Promise<ResolvedLinkContent | null> {
  try {
    // Remove 'conversations:' prefix if present
    const actualConversationId = conversationId.startsWith('conversations:') ? conversationId.replace('conversations:', '') : conversationId;
    
    console.log('🔗 [LINK RESOLVER SERVER] Resolving conversation content:', {
      originalConversationId: conversationId,
      actualConversationId
    });
    
    // Fetch conversation directly from Convex
    const conversation = await convex.query(api.chatQueries.getConversation, { 
      conversationId: actualConversationId,
      userId 
    });

    if (!conversation) {
      console.warn('🔗 [LINK RESOLVER SERVER] Conversation not found:', conversationId);
      return null;
    }

    console.log('🔗 [LINK RESOLVER SERVER] Found conversation:', {
      id: conversation._id,
      title: conversation.title,
      hasMessages: !!conversation.messages,
      messagesCount: conversation.messages?.length || 0
    });

    // Build comprehensive conversation content
    let contentParts = [];

    // Add title
    if (conversation.title) {
      contentParts.push(`Title: ${conversation.title}`);
    }

    // Add messages
    if (conversation.messages && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
      contentParts.push('\n--- Conversation Messages ---');
      conversation.messages.forEach((message: any, index: number) => {
        contentParts.push(`\nMessage ${index + 1}:`);
        if (message.role) {
          contentParts.push(`Role: ${message.role}`);
        }
        if (message.content) {
          contentParts.push(`Content: ${message.content}`);
        }
      });
    }

    const fullContent = contentParts.join('\n\n');
    
    console.log('🔗 [LINK RESOLVER SERVER] Built comprehensive conversation content (length:', fullContent.length, ')');
    
    return {
      type: 'conversation',
      title: conversation.title || 'Conversation',
      content: fullContent,
      contentId: conversationId,
      metadata: {
        contentType: 'conversation',
        platform: 'conversations',
        createdAt: conversation.createdAt,
        messages: conversation.messages
      }
    };
  } catch (error) {
    console.error('🔗 [LINK RESOLVER SERVER] Error resolving conversation content:', error);
    return null;
  }
}

/**
 * Server-side insight content resolver
 */
async function resolveInsightContentServer(insightId: string, index?: number, userId?: string, convex?: ConvexClient): Promise<ResolvedLinkContent | null> {
  try {
    console.log('🔗 [LINK RESOLVER SERVER] Resolving insight:', { insightId, index });
    
    // insightId is now in format "platform:analysisId" (parsed by parseContentId)
    // index is already the parsed index
    const [platform, analysisId] = insightId.split(':');
    const actualIndex = index;
    
    if (actualIndex === undefined || isNaN(actualIndex)) {
      console.warn('🔗 [LINK RESOLVER SERVER] Invalid insight index:', actualIndex);
      return null;
    }
    
    let insight = null;
    let analysis = null;
    
    // Fetch insight data directly from Convex based on platform
    if (platform === 'instagram') {
      const instagramAccount = await convex.query(api.instagramQueries.getInstagramAccount, { userId });
      if (instagramAccount?.instagramAccountId) {
        analysis = await convex.query(api.instagramQueries.getInstagramBatchAnalysis, { 
          userId, 
          instagramAccountId: instagramAccount.instagramAccountId 
        });
        if (analysis?.insights?.insights && analysis.insights.insights[actualIndex]) {
          insight = analysis.insights.insights[actualIndex];
        }
      }
    } else if (platform === 'youtube') {
      analysis = await convex.query(api.youtubeQueries.getVideoAnalyses, { userId });
      if (analysis?.analyses) {
        const video = analysis.analyses.find((v: any) => v.id === analysisId);
        if (video && video.analysis) {
          insight = video;
        }
      }
    } else if (platform === 'gmail') {
      const gmailAccounts = await convex.query(api.gmailQueries.getGmailAccounts, { userId });
      if (gmailAccounts.length > 0) {
        analysis = await convex.query(api.gmailQueries.getGmailBatchAnalysis, { 
          userId, 
          gmailAccountId: gmailAccounts[0]._id 
        });
        if (analysis?.insights?.insights && analysis.insights.insights[actualIndex]) {
          insight = analysis.insights.insights[actualIndex];
        }
      }
    }
    
    if (!insight) {
      console.warn('🔗 [LINK RESOLVER SERVER] Insight not found:', { platform, analysisId, actualIndex });
      return null;
    }
    
    // Build comprehensive insight content
    let content = '';
    if (platform === 'instagram' && insight.actionSteps) {
      // Instagram insights have the full structure
      const insightContent = [
        `Title: ${insight.title || 'Untitled Insight'}`,
        '',
        'Action Steps:',
        ...(insight.actionSteps || []).map((step: string, i: number) => `${i + 1}. ${step}`),
        '',
        `Expected Outcome: ${insight.expectedOutcome || 'Not specified'}`,
        '',
        `Impact: ${insight.impact || 'Not specified'}`,
        '',
        'Why Now:',
        ...(insight.whyNow || []).map((reason: string, i: number) => `${i + 1}. ${reason}`),
        '',
        'Source Details:',
        ...(insight.sourceDetails || []).map((detail: string, i: number) => `${i + 1}. ${detail}`),
        '',
        'Related Items:',
        ...(insight.relatedItems || []).map((item: any) => `${item.label}: ${item.value}`),
        '',
        `Platform: ${insight.platform || platform}`,
        '',
        `Highlight Color: ${insight.highlightColor || 'Not specified'}`,
        `Outcome Color: ${insight.outcomeColor || 'Not specified'}`
      ].join('\n');
      
      content = insightContent;
    } else {
      // For other platforms, use available data
      content = insight.analysis || insight.content || insight.description || insight.title || 'Insight content';
    }
    
    return {
      type: 'insight',
      title: insight.title || `${platform} Insight`,
      content,
      contentId: analysisId,
      index: actualIndex,
      metadata: {
        contentType: `${platform}_analysis`,
        platform: 'insights',
        createdAt: analysis?.createdAt || Date.now(),
        insights: insight
      }
    };
  } catch (error) {
    console.error('🔗 [LINK RESOLVER SERVER] Error resolving insight content:', error);
    return null;
  }
} 

/**
 * Server-side smart note content resolver
 */
async function resolveSmartNoteContentServer(noteId: string, userId: string, convex: ConvexClient): Promise<ResolvedLinkContent | null> {
  try {
    // Remove 'note:' or 'notes:' prefix if present
    const actualNoteId = noteId.startsWith('note:') ? noteId.replace('note:', '') : 
                        noteId.startsWith('notes:') ? noteId.replace('notes:', '') : noteId;
    
    // Fetch note directly from Convex
    const note = await convex.query(api.noteQueries.getNote, { noteId: actualNoteId, userId });
    
    if (!note) {
      console.warn('🔗 [LINK RESOLVER SERVER] Smart note not found:', noteId);
      return null;
    }
    
    return {
      type: 'smart_note',
      title: note.title || 'Untitled Note',
      content: note.content || '',
      contentId: noteId,
      metadata: {
        contentType: 'note',
        platform: 'smart-notes',
        createdAt: note.createdAt,
        analysis: note.analysis
      }
    };
  } catch (error) {
    console.error('🔗 [LINK RESOLVER SERVER] Error resolving smart note content:', error);
    return null;
  }
}

/**
 * Server-side YouTube content resolver
 */
async function resolveYouTubeContentServer(videoId: string, userId: string, convex: ConvexClient): Promise<ResolvedLinkContent | null> {
  try {
    // Remove 'youtube:' prefix if present
    const actualVideoId = videoId.startsWith('youtube:') ? videoId.replace('youtube:', '') : videoId;
    
    // Fetch video directly from Convex
    const video = await convex.query(api.youtubeQueries.getVideoAnalyses, { userId });
    const foundVideo = video?.analyses?.find((v: any) => v.id === actualVideoId);
    
    if (!foundVideo) {
      console.warn('🔗 [LINK RESOLVER SERVER] YouTube video not found:', videoId);
      return null;
    }
    
    // Build richer content: include analysis summary and key statistics
    const contentParts: string[] = [];
    const analysisText = foundVideo.analysisMarkdown || foundVideo.analysis?.summary;
    if (analysisText) {
      contentParts.push(`Analysis: ${analysisText}`);
    }
    
    const stats = foundVideo.statistics || foundVideo.analysis?.statistics || {};
    const statsParts: string[] = [];
    if (stats.views !== undefined) statsParts.push(`Views: ${Number(stats.views).toLocaleString()}`);
    if (stats.likes !== undefined) statsParts.push(`Likes: ${Number(stats.likes).toLocaleString()}`);
    if (stats.comments !== undefined) statsParts.push(`Comments: ${Number(stats.comments).toLocaleString()}`);
    if (stats.shares !== undefined) statsParts.push(`Shares: ${Number(stats.shares).toLocaleString()}`);
    if (stats.watchTime !== undefined) statsParts.push(`Watch Time: ${Number(stats.watchTime).toLocaleString()} min`);
    if (stats.engagement_rate !== undefined) statsParts.push(`Engagement Rate: ${(Number(stats.engagement_rate) * 100).toFixed(2)}%`);
    if (stats.impressions !== undefined) statsParts.push(`Impressions: ${Number(stats.impressions).toLocaleString()}`);
    if (stats.clickThroughRate !== undefined) statsParts.push(`CTR: ${(Number(stats.clickThroughRate) * 100).toFixed(2)}%`);
    if (statsParts.length > 0) {
      contentParts.push(`Statistics: ${statsParts.join(', ')}`);
    }
    
    // Include publish date if available
    if (foundVideo.publishedAt) {
      contentParts.push(`Published: ${new Date(foundVideo.publishedAt).toLocaleDateString()}`);
    }
    
    const fullContent = contentParts.join('\n\n') || (foundVideo.title || 'YouTube video');
    
    return {
      type: 'youtube',
      title: foundVideo.title || 'Untitled Video',
      content: fullContent,
      contentId: videoId,
      metadata: {
        contentType: 'video',
        platform: 'youtube',
        createdAt: foundVideo.publishedAt,
        analysis: foundVideo.analysis,
        statistics: stats
      }
    };
  } catch (error) {
    console.error('🔗 [LINK RESOLVER SERVER] Error resolving YouTube content:', error);
    return null;
  }
}

/**
 * Server-side Instagram content resolver
 */
async function resolveInstagramContentServer(postId: string, userId: string, convex: ConvexClient): Promise<ResolvedLinkContent | null> {
  try {
    // Remove 'instagram:' prefix if present
    const actualPostId = postId.startsWith('instagram:') ? postId.replace('instagram:', '') : postId;
    
    // Fetch post directly from Convex
    const posts = await convex.query(api.instagramQueries.getAllInstagramPosts, { userId });
    const post = posts?.find((p: any) => p.postId === actualPostId);
    
    if (!post) {
      console.warn('🔗 [LINK RESOLVER SERVER] Instagram post not found:', postId);
      return null;
    }
    
    // Build richer content: include caption and key statistics
    const contentParts: string[] = [];
    if (post.data?.caption) {
      contentParts.push(`Caption: ${post.data.caption}`);
    }
    
    // Try to gather statistics from common fields - use optional chaining and type-safe access
    const statsSource = (post as any).statistics || (post as any).insights || post.data?.insights || {};
    const statsParts: string[] = [];
    const likes = statsSource.likes ?? statsSource.like_count ?? statsSource.likes_count;
    const comments = statsSource.comments ?? statsSource.comment_count ?? statsSource.comments_count;
    const reach = statsSource.reach;
    const impressions = statsSource.impressions;
    const saved = statsSource.saved ?? statsSource.save_count;
    const shares = statsSource.shares ?? statsSource.share_count;
    const profileVisits = statsSource.profile_visits;
    const views = statsSource.views ?? statsSource.play_count ?? statsSource.video_views;
    const totalInteractions = statsSource.total_interactions;
    
    if (likes !== undefined) statsParts.push(`Likes: ${Number(likes).toLocaleString()}`);
    if (comments !== undefined) statsParts.push(`Comments: ${Number(comments).toLocaleString()}`);
    if (reach !== undefined) statsParts.push(`Reach: ${Number(reach).toLocaleString()}`);
    if (impressions !== undefined) statsParts.push(`Impressions: ${Number(impressions).toLocaleString()}`);
    if (saved !== undefined) statsParts.push(`Saved: ${Number(saved).toLocaleString()}`);
    if (shares !== undefined) statsParts.push(`Shares: ${Number(shares).toLocaleString()}`);
    if (profileVisits !== undefined) statsParts.push(`Profile Visits: ${Number(profileVisits).toLocaleString()}`);
    if (views !== undefined) statsParts.push(`Views: ${Number(views).toLocaleString()}`);
    if (totalInteractions !== undefined) statsParts.push(`Total Interactions: ${Number(totalInteractions).toLocaleString()}`);
    
    if (statsParts.length > 0) {
      contentParts.push(`Statistics: ${statsParts.join(', ')}`);
    }
    
    // Add meta info
    if (post.data?.timestamp) {
      contentParts.push(`Published: ${new Date(post.data.timestamp).toLocaleDateString()}`);
    }
    if ((post as any).mediaUrl) {
      contentParts.push(`Media URL: ${(post as any).mediaUrl}`);
    }
    
    const fullContent = contentParts.join('\n\n') || (post.data?.caption || 'Instagram Post');
    
    return {
      type: 'instagram',
      title: post.data?.caption?.substring(0, 100) || 'Instagram Post',
      content: fullContent,
      contentId: postId,
      metadata: {
        contentType: (post as any).contentType || 'post',
        platform: 'instagram',
        createdAt: post.data?.timestamp,
        statistics: statsSource,
        mediaUrl: (post as any).mediaUrl,
        thumbnailUrl: (post as any).thumbnailUrl
      }
    };
  } catch (error) {
    console.error('🔗 [LINK RESOLVER SERVER] Error resolving Instagram content:', error);
    return null;
  }
}

/**
 * Server-side Gmail content resolver
 */
async function resolveGmailContentServer(threadId: string, userId: string, convex: ConvexClient): Promise<ResolvedLinkContent | null> {
  try {
    // Remove 'gmail:' prefix if present
    const actualThreadId = threadId.startsWith('gmail:') ? threadId.replace('gmail:', '') : threadId;
    
    // Fetch thread directly from Convex
    const threads = await convex.query(api.gmailQueries.getGmailThreadsPaginated, { 
      userId,
      paginationOpts: { numItems: 1000, cursor: null }
    });
    const thread = threads?.page?.find((t: any) => t.threadId === actualThreadId);
    
    if (!thread) {
      console.warn('🔗 [LINK RESOLVER SERVER] Gmail thread not found:', threadId);
      return null;
    }

    console.log('🔗 [LINK RESOLVER SERVER] Found Gmail thread:', {
      threadId: thread.threadId,
      subject: thread.subject,
      from: thread.from,
      hasSnippet: !!thread.snippet,
      snippetLength: thread.snippet?.length || 0,
      hasMessages: !!thread.messages,
      messagesCount: thread.messages?.length || 0,
      hasData: !!thread.data,
      dataKeys: thread.data ? Object.keys(thread.data) : [],
      threadKeys: Object.keys(thread),
      fullThread: thread
    });
    
    // Build comprehensive Gmail content including subject, from, and message content
    let contentParts = [];
    
    // Get the actual data from the thread
    const threadData = thread.data || thread;
    
    if (threadData.subject) {
      contentParts.push(`Subject: ${threadData.subject}`);
    }
    
    if (threadData.from) {
      contentParts.push(`From: ${threadData.from}`);
    }
    
    if (threadData.snippet) {
      contentParts.push(`Snippet: ${threadData.snippet}`);
    }
    
    // Include message content if available - check both thread.messages and thread.data.messages
    const messages = threadData.messages || thread.messages;
    if (messages && Array.isArray(messages) && messages.length > 0) {
      contentParts.push('\n--- Messages ---');
      messages.forEach((message: any, index: number) => {
        contentParts.push(`\nMessage ${index + 1}:`);
        if (message.from) contentParts.push(`From: ${message.from}`);
        if (message.to) contentParts.push(`To: ${message.to}`);
        if (message.subject) contentParts.push(`Subject: ${message.subject}`);
        if (message.date) contentParts.push(`Date: ${message.date}`);
        
        // Include the message body content
        if (message.body) {
          // Clean up the body content - remove excessive whitespace and formatting
          let cleanBody = message.body
            .replace(/\n\s*\n/g, '\n') // Remove multiple empty lines
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
          
          // Limit body length to avoid overwhelming the AI
          if (cleanBody.length > 500) {
            cleanBody = cleanBody.substring(0, 500) + '...';
          }
          
          contentParts.push(`Content: ${cleanBody}`);
        }
      });
    }
    
    // Include thread metadata
    if (threadData.messageCount || threadData.message_count) {
      contentParts.push(`\nTotal Messages: ${threadData.messageCount || threadData.message_count}`);
    }
    
    if (threadData.category) {
      contentParts.push(`Category: ${threadData.category}`);
    }
    
    const fullContent = contentParts.join('\n') || 'No content available';
    
    console.log('🔗 [LINK RESOLVER SERVER] Built comprehensive Gmail content (length:', fullContent.length, ')');
    console.log('🔗 [LINK RESOLVER SERVER] Content preview:', fullContent.substring(0, 200) + '...');
    
    return {
      type: 'gmail',
      title: thread.subject || 'No Subject',
      content: fullContent,
      contentId: threadId,
      metadata: {
        contentType: 'thread',
        platform: 'gmail',
        createdAt: thread.createdAt,
        from: thread.from
      }
    };
  } catch (error) {
    console.error('🔗 [LINK RESOLVER SERVER] Error resolving Gmail content:', error);
    return null;
  }
} 