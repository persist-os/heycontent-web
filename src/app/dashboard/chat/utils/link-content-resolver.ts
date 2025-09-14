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
  type: 'smart_note' | 'conversation';
  id: string;
}

export interface ResolvedLinkContent {
  type: string;
  title: string;
  content: string;
  contentId: string; // The original content ID that was resolved
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


