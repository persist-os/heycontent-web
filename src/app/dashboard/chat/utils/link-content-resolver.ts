import { useContentStore } from '@/store/content-store';
import { ConvexReactClient } from 'convex/react';

export interface LinkReference {
  type: 'smart_note' | 'youtube' | 'instagram' | 'gmail' | 'insight';
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
  allLinkableContent: any[]
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
        return await resolveGmailContent(link.id, userId, allLinkableContent);
      
      case 'insight':
        return await resolveInsightContent(link.id, link.index, userId, allLinkableContent);
      
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
    // Remove 'note:' prefix if present
    const actualNoteId = noteId.startsWith('note:') ? noteId.replace('note:', '') : noteId;
    
    const note = allLinkableContent.find(item => item.id === actualNoteId || item.id === `note:${actualNoteId}`);

    if (!note) {
      console.warn('🔗 [LINK RESOLVER] Smart note not found:', noteId);
      return null;
    }

    // Build comprehensive content including full note body/content, title, statistics, analysis, etc.
    const contentParts = [];

    // Add title
    if (note.title) {
      contentParts.push(`Title: ${note.title}`);
    }

    // Add main note body/content if available
    if (note.body) {
      contentParts.push(`Content: ${note.body}`);
    } else if (note.content) {
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
    const contentParts = [];
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
    const contentParts = [];

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
async function resolveGmailContent(threadId: string, userId: string, allLinkableContent: any[]): Promise<ResolvedLinkContent | null> {
  try {
    // Remove 'gmail:' prefix if present
    const actualThreadId = threadId.startsWith('gmail:') ? threadId.replace('gmail:', '') : threadId;
    
    const thread = allLinkableContent.find(item => item.id === `gmail:${actualThreadId}`);

    if (!thread) {
      console.warn('🔗 [LINK RESOLVER] Gmail thread not found:', threadId);
      return null;
    }

    // Build comprehensive content including subject, messages, and analysis
    const contentParts = [];

    // Add subject
    if (thread.title) {
      contentParts.push(`Subject: ${thread.title}`);
    }

    // Add thread info
    if (thread.from) {
      contentParts.push(`From: ${thread.from}`);
    }

    if (thread.messageCount) {
      contentParts.push(`Message Count: ${thread.messageCount}`);
    }

    if (thread.category) {
      contentParts.push(`Category: ${thread.category}`);
    }

    // Add messages content if available
    if (thread.content) {
      contentParts.push(`Messages: ${thread.content}`);
    }

    // Add analysis if available
    if (thread.analysis) {
      const analysisText = typeof thread.analysis === 'string' ? thread.analysis : JSON.stringify(thread.analysis, null, 2);
      contentParts.push(`Analysis: ${analysisText}`);
    }

    // Add platform and content type info
    if (thread.platform || thread.contentType) {
      const platformInfo = [];
      if (thread.platform) platformInfo.push(thread.platform);
      if (thread.contentType) platformInfo.push(thread.contentType);
      contentParts.push(`Platform: ${platformInfo.join(' - ')}`);
    }

    // Add creation date if available
    if (thread.createdAt) {
      const date = new Date(thread.createdAt).toLocaleDateString();
      contentParts.push(`Date: ${date}`);
    }

    const fullContent = contentParts.join('\n\n');
    
    return {
      type: 'gmail',
      title: thread.title || 'Gmail Thread',
      content: fullContent,
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
    
    // insightId is already the analysisId (parsed by parseContentId)
    // index is already the parsed index
    const analysisId = insightId;
    const actualIndex = index;
    
    if (actualIndex === undefined || isNaN(actualIndex)) {
      console.warn('🔗 [LINK RESOLVER] Invalid insight index:', actualIndex);
      return null;
    }
    
    // Look for the insight in allLinkableContent
    // The insight items have IDs in format: insight:analysisId:index
    const insight = allLinkableContent?.find(item => {
      if (item.type !== 'insight') return false;
      return item.id === `insight:${analysisId}:${actualIndex}`;
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
      
      // Format the insight content properly
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
        ...(singleInsight.sourceDetails || []).map((detail: string, i: number) => `${i + 1}. ${detail}`)
      ].join('\n');
      
      content = insightContent;
    } else if (insight.analysis) {
      // fallback
      content = insight.analysis;
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
        // Parse insight ID which has format: insight:analysisId:index
        if (parts.length < 3) {
          console.warn('🔗 [LINK RESOLVER] Invalid insight format in content ID:', contentId);
          return null;
        }
        
        const analysisId = parts[1];
        const indexStr = parts[2];
        const index = parseInt(indexStr, 10);
        
        if (isNaN(index)) {
          console.warn('🔗 [LINK RESOLVER] Invalid insight index in content ID:', contentId);
          return null;
        }
        
        return {
          type: 'insight',
          id: analysisId,
          index: index
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

export async function resolveAllLinkContent(
  message: string, 
  userId: string, 
  convex: ConvexReactClient
): Promise<ResolvedLinkContent[]> {
  try {
    console.log('🔗 [LINK RESOLVER] Starting to resolve all link content in message:', message);

    // Get all content for the user from the unified content store
    const allLinkableContent = useContentStore.getState().getAllLinkableContent();
    
    console.log('🔗 [LINK RESOLVER] Retrieved all linkable content:', {
      totalCount: allLinkableContent.length,
      instagramCount: allLinkableContent.filter(item => item.id?.startsWith('instagram:')).length,
      instagramItems: allLinkableContent
        .filter(item => item.id?.startsWith('instagram:'))
        .slice(0, 3) // Show first 3 Instagram items
        .map(item => ({
          id: item.id,
          title: item.title,
          hasStatistics: !!item.statistics,
          hasInsights: !!item.insights,
          hasAnalysis: !!item.analysis,
          statisticsKeys: item.statistics ? Object.keys(item.statistics) : 'none',
          insightsKeys: item.insights ? Object.keys(item.insights) : 'none'
        }))
    });

    // Extract content IDs from the message
    const contentIds = extractContentIds(message);
    
    if (contentIds.length === 0) {
      console.log('🔗 [LINK RESOLVER] No content IDs found in message');
      return [];
    }

    console.log('🔗 [LINK RESOLVER] Found content IDs in message:', contentIds);

    // Resolve all content in parallel
    const resolvedContent = await Promise.all(
      contentIds.map(async (contentId) => {
        const linkRef = parseContentId(contentId);
        if (!linkRef) {
          console.warn('🔗 [LINK RESOLVER] Could not parse content ID:', contentId);
          return null;
        }
        
        console.log('🔗 [LINK RESOLVER] About to resolve:', {
          contentId,
          linkRef,
          allLinkableContentCount: allLinkableContent.length
        });
        
        return await resolveLinkContent(linkRef, userId, allLinkableContent);
      })
    );

    // Filter out null results and return
    const validContent = resolvedContent.filter((content): content is ResolvedLinkContent => content !== null);
    
    console.log('🔗 [LINK RESOLVER] Resolved content count:', validContent.length);
    
    return validContent;
  } catch (error) {
    console.error('🔗 [LINK RESOLVER] Error resolving all link content:', error);
    return [];
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