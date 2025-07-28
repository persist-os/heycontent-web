import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Standardized platform content types
export type PlatformType = 'youtube' | 'instagram' | 'gmail' | 'notes' | 'conversations' | 'insights';

export type ContentType = 
  | 'youtube_video'
  | 'instagram_post' 
  | 'gmail_thread'
  | 'note'
  | 'conversation'
  | 'insight';

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
    thumbnailUrl?: string;
    statistics?: any;
    insights?: any;
    from?: string; // For Gmail
    messageCount?: number; // For Gmail
    category?: string; // For Gmail
    mediaType?: string; // For Instagram
    analysis?: any;
  };
  // Full original Convex document for complete access
  originalDocument: any;
}

/**
 * Standardize platform IDs to consistent format: platform:actualId
 */
export function standardizePlatformId(platform: PlatformType, actualId: string): string {
  // For insights platform, we need to ensure the ID starts with 'insights:'
  if (platform === 'insights') {
    // If it already starts with 'insights:', return as-is
    if (actualId.startsWith('insights:')) {
      return actualId;
    }
    // Otherwise, add the insights prefix
    return `insights:${actualId}`;
  }
  
  // For other platforms, if already prefixed with the correct platform, return as-is
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
  
  if (!['youtube', 'instagram', 'gmail', 'notes', 'conversations', 'insights'].includes(platform)) {
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
          .take(limit ? Math.ceil(limit / 6) : 100);
          
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
          .take(limit ? Math.ceil(limit / 6) : 50);
          
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
      
      // YouTube Videos
      if (!platforms || platforms.includes('youtube')) {
        const youtubeVideos = await ctx.db
          .query("youtubeVideos")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .order("desc")
          .take(limit ? Math.ceil(limit / 6) : 50);
          
        for (const video of youtubeVideos) {
          const title = video.snippet?.title || 'Untitled Video';
          const description = video.snippet?.description || '';
          const captions = video.captions?.caption_track?.text || '';          
          allContent.push({
            id: standardizePlatformId('youtube', video.videoId || video.id),
            platform: 'youtube',
            contentType: 'youtube_video',
            title,
            content: `${title}\n\n${description}\n\n${captions}`,
            metadata: {
              createdAt: video.createdAt || Date.now(),
              updatedAt: video.updatedAt,
              thumbnailUrl: video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.default,
              statistics: video.statistics
            },
            originalDocument: video
          });
        }
      }
      
      // Instagram Posts
      if (!platforms || platforms.includes('instagram')) {
        const instagramPosts = await ctx.db
          .query("instagramPosts")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .order("desc")
          .take(limit ? Math.ceil(limit / 6) : 50);
          
        for (const post of instagramPosts) {
          const caption = post.data?.caption || '';
          const comments = post.data?.comments?.map((c: any) => c.text).join('\n') || '';
          
          allContent.push({
            id: standardizePlatformId('instagram', post.postId),
            platform: 'instagram',
            contentType: 'instagram_post',
            title: caption.substring(0, 100) || 'Instagram Post',
            content: `${caption}\n\nComments:\n${comments}`,
            metadata: {
              createdAt: post.createdAt || Date.now(),
              updatedAt: post.updatedAt,
              mediaType: post.mediaType,
              statistics: post.data?.insights,
              thumbnailUrl: post.data?.media_url
            },
            originalDocument: post
          });
        }
      }
      
      // Gmail Threads
      if (!platforms || platforms.includes('gmail')) {
        const gmailThreads = await ctx.db
          .query("gmailThreads")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .order("desc")
          .take(limit ? Math.ceil(limit / 6) : 50);
          
        for (const thread of gmailThreads) {
          const subject = thread.subject || thread.data?.subject || 'No Subject';
          const snippet = thread.snippet || thread.data?.snippet || '';
          
          allContent.push({
            id: standardizePlatformId('gmail', thread.threadId),
            platform: 'gmail',
            contentType: 'gmail_thread',
            title: subject,
            content: `Subject: ${subject}\n\n${snippet}`,
            metadata: {
              createdAt: thread.createdAt || Date.now(),
              updatedAt: thread.updatedAt,
              from: thread.from || thread.data?.from,
              messageCount: thread.message_count || thread.data?.message_count || 1,
              category: thread.category
            },
            originalDocument: thread
          });
        }
      }
      
      // AI Insights
      if (!platforms || platforms.includes('insights')) {
        // Get YouTube batch analysis
        const youtubeBatchAnalyses = await ctx.db
          .query("youtubeBatchAnalysis")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
          
        for (const analysis of youtubeBatchAnalyses) {
          if (analysis.insights?.insights && Array.isArray(analysis.insights.insights)) {
            analysis.insights.insights.forEach((insight: any, index: number) => {
              allContent.push({
                id: standardizePlatformId('insights', `youtube:${analysis._id}:${index}`),
                platform: 'insights',
                contentType: 'insight',
                title: insight.title || 'YouTube Insight',
                content: `${insight.title}\n\n${insight.impact || insight.description || JSON.stringify(insight)}`,
                metadata: {
                  createdAt: analysis.createdAt || Date.now(),
                  updatedAt: analysis.updatedAt,
                  analysis: insight
                },
                originalDocument: { ...analysis, insight, insightIndex: index }
              });
            });
          }
        }
        
        // Get Instagram batch analysis
        const instagramBatchAnalyses = await ctx.db
          .query("instagramBatchAnalysis")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
          
        for (const analysis of instagramBatchAnalyses) {
          if (analysis.insights?.insights && Array.isArray(analysis.insights.insights)) {
            analysis.insights.insights.forEach((insight: any, index: number) => {
              allContent.push({
                id: standardizePlatformId('insights', `instagram:${analysis._id}:${index}`),
                platform: 'insights',
                contentType: 'insight',
                title: insight.title || 'Instagram Insight',
                content: `${insight.title}\n\n${insight.impact || insight.description || JSON.stringify(insight)}`,
                metadata: {
                  createdAt: analysis.createdAt || Date.now(),
                  updatedAt: analysis.updatedAt,
                  analysis: insight
                },
                originalDocument: { ...analysis, insight, insightIndex: index }
              });
            });
          }
        }
        
        // Get Gmail batch analysis
        const gmailBatchAnalyses = await ctx.db
          .query("gmailBatchAnalysis")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
          
        for (const analysis of gmailBatchAnalyses) {
          if (analysis.insights?.insights && Array.isArray(analysis.insights.insights)) {
            analysis.insights.insights.forEach((insight: any, index: number) => {
              allContent.push({
                id: standardizePlatformId('insights', `gmail:${analysis._id}:${index}`),
                platform: 'insights',
                contentType: 'insight',
                title: insight.title || 'Gmail Insight',
                content: `${insight.title}\n\n${insight.impact || insight.description || JSON.stringify(insight)}`,
                metadata: {
                  createdAt: analysis.createdAt || Date.now(),
                  updatedAt: analysis.updatedAt,
                  analysis: insight
                },
                originalDocument: { ...analysis, insight, insightIndex: index }
              });
            });
          }
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
          
        case 'youtube':
          const video = await ctx.db
            .query("youtubeVideos")
            .withIndex("by_videoId", (q) => q.eq("videoId", actualId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();
            
          if (!video) return null;
          
          const title = video.snippet?.title || 'Untitled Video';
          const description = video.snippet?.description || '';
          const captions = video.captions?.caption_track?.text || '';
                    
          return {
            id: contentId,
            platform: 'youtube',
            contentType: 'youtube_video',
            title,
            content: `${title}\n\n${description}\n\n${captions}`,
            metadata: {
              createdAt: video.createdAt || Date.now(),
              updatedAt: video.updatedAt,
              thumbnailUrl: video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.default,
              statistics: video.statistics
            },
            originalDocument: video
          } as UnifiedPlatformContent;
          
        case 'instagram':
          const post = await ctx.db
            .query("instagramPosts")
            .withIndex("by_postId", (q) => q.eq("postId", actualId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();
            
          if (!post) return null;
          
          const caption = post.data?.caption || '';
          const comments = post.data?.comments?.map((c: any) => c.text).join('\n') || '';
          
          return {
            id: contentId,
            platform: 'instagram',
            contentType: 'instagram_post',
            title: caption.substring(0, 100) || 'Instagram Post',
            content: `${caption}\n\nComments:\n${comments}`,
            metadata: {
              createdAt: post.createdAt || Date.now(),
              updatedAt: post.updatedAt,
              mediaType: post.mediaType,
              statistics: post.data?.insights,
              thumbnailUrl: post.data?.media_url
            },
            originalDocument: post
          } as UnifiedPlatformContent;
          
        case 'gmail':
          const thread = await ctx.db
            .query("gmailThreads")
            .withIndex("by_threadId", (q) => q.eq("threadId", actualId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();
            
          if (!thread) return null;
          
          const subject = thread.subject || thread.data?.subject || 'No Subject';
          const snippet = thread.snippet || thread.data?.snippet || '';
          
          return {
            id: contentId,
            platform: 'gmail',
            contentType: 'gmail_thread',
            title: subject,
            content: `Subject: ${subject}\n\n${snippet}`,
            metadata: {
              createdAt: thread.createdAt || Date.now(),
              updatedAt: thread.updatedAt,
              from: thread.from || thread.data?.from,
              messageCount: thread.message_count || thread.data?.message_count || 1,
              category: thread.category
            },
            originalDocument: thread
          } as UnifiedPlatformContent;
          
        case 'insights':
          // Parse insight ID: platform:analysisId:index
          const insightParts = actualId.split(':');
          if (insightParts.length !== 3) return null;
          
          const [insightPlatform, analysisId, indexStr] = insightParts;
          const index = parseInt(indexStr);
          
          let analysis: any = null;
          if (insightPlatform === 'youtube') {
            analysis = await ctx.db.get(analysisId as Id<"youtubeBatchAnalysis">);
          } else if (insightPlatform === 'instagram') {
            analysis = await ctx.db.get(analysisId as Id<"instagramBatchAnalysis">);
          } else if (insightPlatform === 'gmail') {
            analysis = await ctx.db.get(analysisId as Id<"gmailBatchAnalysis">);
          }
          
          if (!analysis || analysis.userId !== userId) return null;
          
          const insight = analysis.insights?.insights?.[index];
          if (!insight) return null;
          
          return {
            id: contentId,
            platform: 'insights',
            contentType: 'insight',
            title: insight.title || `${insightPlatform} Insight`,
            content: `${insight.title}\n\n${insight.impact || insight.description || JSON.stringify(insight)}`,
            metadata: {
              createdAt: analysis.createdAt || Date.now(),
              updatedAt: analysis.updatedAt,
              analysis: insight
            },
            originalDocument: { ...analysis, insight, insightIndex: index }
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