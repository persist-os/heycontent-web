import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Standardized platform content types
export type PlatformType = 'notes' | 'conversations';

export type ContentType = 
  | 'note'
  | 'conversation';

// Unified content interface
export interface UnifiedPlatformContent {
  id: string; // Standardized format: platform:actualId
  platform: PlatformType;
  contentType: ContentType;
  title: string;
  content: string; // Searchable content for embeddings
  metadata: {
    createdAt: number;
    updatedAt?: number;
    messageCount?: number; // For conversations
    analysis?: any;
  };
  // Full original Convex document for complete access
  originalDocument: any;
}

/**
 * Standardize platform IDs to consistent format: platform:actualId
 */
export function standardizePlatformId(platform: PlatformType, actualId: string): string {
  // If already prefixed with the correct platform, return as-is
  if (actualId.startsWith(`${platform}:`)) {
    return actualId;
  }
  
  // If already prefixed with a different platform, return as-is (legacy handling)
  if (actualId.includes(':')) {
    return actualId;
  }
  
  return `${platform}:${actualId}`;
}

/**
 * Parse standardized platform ID back to components
 */
export function parsePlatformId(standardizedId: string): { platform: PlatformType; actualId: string } | null {
  if (!standardizedId.includes(':')) {
    // Handle legacy format - assume it's a note if no prefix
    return { platform: 'notes', actualId: standardizedId };
  }
  
  const [platform, ...idParts] = standardizedId.split(':');
  const actualId = idParts.join(':'); // Rejoin in case actualId contains colons
  
  if (!['notes', 'conversations'].includes(platform)) {
    return null;
  }
  
  return { platform: platform as PlatformType, actualId };
}

/**
 * Get unified content for a user across all platforms
 */
export const getAllUnifiedContent = query({
  args: { 
    userId: v.string(),
    platforms: v.optional(v.array(v.string())), // Filter by specific platforms
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { userId, platforms, limit } = args;
    const allContent: UnifiedPlatformContent[] = [];
    
    try {
      // Notes
      if (!platforms || platforms.includes('notes')) {
        const notes = await ctx.db
          .query("notes")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .order("desc")
          .take(limit || 100);
          
        for (const note of notes) {
          allContent.push({
            id: standardizePlatformId('notes', note._id),
            platform: 'notes',
            contentType: 'note',
            title: note.title || 'Untitled Note',
            content: `${note.title || ''}\n\n${note.content || ''}`,
            metadata: {
              createdAt: note.createdAt || Date.now(),
              updatedAt: note.updatedAt,
              analysis: note.analysis
            },
            originalDocument: note
          });
        }
      }
      
      // Conversations
      if (!platforms || platforms.includes('conversations')) {
        const conversations = await ctx.db
          .query("conversations")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .order("desc")
          .take(limit || 50);
          
        for (const conv of conversations) {
          const messageContent = conv.messages
            ?.map((m: any) => `${m.role}: ${m.content}`)
            .join('\n') || '';
            
          allContent.push({
            id: standardizePlatformId('conversations', conv._id),
            platform: 'conversations',
            contentType: 'conversation',
            title: conv.title || 'Untitled Conversation',
            content: `${conv.title}\n\n${messageContent}`,
            metadata: {
              createdAt: conv.createdAt || Date.now(),
              updatedAt: conv.updatedAt,
              messageCount: conv.messages?.length || 0
            },
            originalDocument: conv
          });
        }
      }
      
      // Sort by creation date (newest first) and apply limit
      allContent.sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);
      
      if (limit) {
        return allContent.slice(0, limit);
      }
      
      return allContent;
      
    } catch (error) {
      console.error('Error fetching unified content:', error);
      return [];
    }
  }
});

/**
 * Get specific unified content by standardized ID
 */
export const getUnifiedContentById = query({
  args: { 
    userId: v.string(),
    contentId: v.string() // Standardized format: platform:actualId
  },
  handler: async (ctx, args) => {
    const { userId, contentId } = args;
    
    const parsed = parsePlatformId(contentId);
    if (!parsed) {
      return null;
    }
    
    const { platform, actualId } = parsed;
    
    try {
      switch (platform) {
        case 'notes':
          const note = await ctx.db.get(actualId as Id<"notes">);
          if (!note || note.userId !== userId) return null;
          
          return {
            id: contentId,
            platform: 'notes',
            contentType: 'note',
            title: note.title || 'Untitled Note',
            content: `${note.title || ''}\n\n${note.content || ''}`,
            metadata: {
              createdAt: note.createdAt || Date.now(),
              updatedAt: note.updatedAt,
              analysis: note.analysis
            },
            originalDocument: note
          } as UnifiedPlatformContent;
          
        case 'conversations':
          const conv = await ctx.db.get(actualId as Id<"conversations">);
          if (!conv || conv.userId !== userId) return null;
          
          const messageContent = conv.messages
            ?.map((m: any) => `${m.role}: ${m.content}`)
            .join('\n') || '';
            
          return {
            id: contentId,
            platform: 'conversations',
            contentType: 'conversation',
            title: conv.title || 'Untitled Conversation',
            content: `${conv.title}\n\n${messageContent}`,
            metadata: {
              createdAt: conv.createdAt || Date.now(),
              updatedAt: conv.updatedAt,
              messageCount: conv.messages?.length || 0
            },
            originalDocument: conv
          } as UnifiedPlatformContent;
          
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error fetching ${platform} content:`, error);
      return null;
    }
  }
});

/**
 * Get content titles for multiple standardized IDs (for @ mention resolution)
 */
export const getContentTitlesByIds = query({
  args: { 
    userId: v.string(),
    contentIds: v.array(v.string())
  },
  handler: async (ctx, args) => {
    const { userId, contentIds } = args;
    const titles: Record<string, string> = {};
    
    for (const contentId of contentIds) {
      try {
        const content = await ctx.runQuery(api.platformRouter.getUnifiedContentById, {
          userId,
          contentId
        });
        
        if (content) {
          titles[contentId] = content.title;
        } else {
          titles[contentId] = 'Content not found';
        }
      } catch (error) {
        console.error(`Error fetching title for ${contentId}:`, error);
        titles[contentId] = 'Error loading title';
      }
    }
    
    return titles;
  }
}); 