import { ChatResponseData } from '../types';
import { ContentContext } from '../types';

import dotenv from 'dotenv';

dotenv.config();

import { getApiKey } from '@/app/lib/api-helpers';
import { resolveAllLinkContent } from './link-content-resolver';

// Add Convex client import for direct function calls
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAllLinkableContent } from "@/convex/notes";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Add types for vector search
interface VectorSearchResult {
  contentType: string;
  title: string;
  content: string;
  score?: number;
  _id: string;
}

interface VectorSearchResponse {
  success: boolean;
  context: string;
  relevantContent: Array<{
    title: string;
    contentType: string;
    score: number;
    summary?: string;
  }>;
  prompt: string;
  error?: string;
}

/**
 * Generate embeddings for a specific platform only
 */
export async function generateEmbeddingsForPlatform(
  userId: string, 
  platform: 'instagram' | 'youtube' | 'gmail' | 'conversations' | 'notes'
): Promise<any> {
  
  const results: Record<string, any> = {
    [platform]: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
    errors: [] as string[]
  };

  try {
    switch (platform) {
      case 'instagram':
        // Get Instagram posts only
        const instagramPosts = await convex.query(api.instagramQueries.getAllInstagramPosts, { userId });
        
        for (const post of instagramPosts) {
          results.instagram.processed++;
          
          if (!post || !post._id || !post.data || !post.data.id) {
            console.warn(`⚠️ [PLATFORM EMBEDDING] Skipping invalid Instagram post`);
            results.instagram.skipped++;
            continue;
          }

          try {
            const caption = post.data.caption || '';
            const username = post.data.username || 'Unknown User';
            const mediaType = (post.data as any).media_type || 'Unknown';
            const likeCount = post.data.like_count || 0;
            const commentsCount = post.data.comments_count || 0;
            const timestamp = post.data.timestamp ? new Date(post.data.timestamp).toLocaleDateString() : 'Unknown date';
            
            const hashtags = caption.match(/#[a-zA-Z0-9_]+/g) || [];
            const hashtagText = hashtags.length > 0 ? `\n\nHashtags: ${hashtags.join(' ')}` : '';
            
            const mentions = caption.match(/@[a-zA-Z0-9_.]+/g) || [];
            const mentionText = mentions.length > 0 ? `\n\nMentions: ${mentions.join(' ')}` : '';
            
            const engagementText = `\n\nEngagement: ${likeCount} likes, ${commentsCount} comments`;
            const title = `${username} - ${mediaType} Post (${timestamp})`;
            
            const searchableContent = [
              `Instagram Post by ${username}`,
              `Posted: ${timestamp}`,
              `Media Type: ${mediaType}`,
              `Caption: ${caption}`,
              hashtagText,
              mentionText,
              engagementText,
              `\n\nContext: This is an Instagram ${mediaType.toLowerCase()} post by ${username} with ${likeCount} likes and ${commentsCount} comments.`
            ].filter(Boolean).join('\n');
            
            if (searchableContent.trim().length < 20) {
              console.warn(`⚠️ [PLATFORM EMBEDDING] Skipping Instagram post "${post.data.id}" - content too short`);
              results.instagram.skipped++;
              continue;
            }
            
            await convex.action(api.vectorSearch.createEmbedding, {
              userId,
              contentId: post._id,
              contentType: "instagram_post" as const,
              title: title,
              content: searchableContent,
            });
            
            results.instagram.succeeded++;
            
          } catch (error: any) {
            results.instagram.failed++;
            const errorMsg = `Failed to embed Instagram post "${post.data.id}": ${error.message}`;
            console.error('❌ [PLATFORM EMBEDDING]', errorMsg);
            results.errors.push(errorMsg);
            continue;
          }
        }
        break;

      case 'youtube':
        // Get YouTube videos only
        const youtubeVideos = await convex.query(api.youtubeQueries.getYouTubeVideos, { userId });
        
        for (const video of youtubeVideos) {
          results.youtube.processed++;
          
          if (!video || !video._id || !video.videoId) {
            console.warn(`⚠️ [PLATFORM EMBEDDING] Skipping invalid YouTube video`);
            results.youtube.skipped++;
            continue;
          }

          try {
            const title = video.snippet?.title || `YouTube Video ${video.videoId}`;
            const description = video.snippet?.description || '';
            const channelTitle = video.snippet?.channel?.title || 'Unknown Channel';
            
            let analysisText = '';
            if (video.analysisMarkdown) {
              analysisText = `\n\nAnalysis: ${video.analysisMarkdown}`;
            } else if (video.analysis && typeof video.analysis === 'object') {
              analysisText = `\n\nAnalysis: ${JSON.stringify(video.analysis)}`;
            }
            
            const searchableContent = `YouTube Video: ${title}\n\nChannel: ${channelTitle}\n\nDescription: ${description}${analysisText}`;
            
            if (searchableContent.trim().length < 10) {
              console.warn(`⚠️ [PLATFORM EMBEDDING] Skipping YouTube video "${title}" - content too short`);
              results.youtube.skipped++;
              continue;
            }
            
            await convex.action(api.vectorSearch.createEmbedding, {
              userId,
              contentId: video._id,
              contentType: "youtube_video" as const,
              title: title,
              content: searchableContent,
            });
            
            results.youtube.succeeded++;
            
          } catch (error: any) {
            results.youtube.failed++;
            const errorMsg = `Failed to embed YouTube video "${video.videoId}": ${error.message}`;
            console.error('❌ [PLATFORM EMBEDDING]', errorMsg);
            results.errors.push(errorMsg);
            continue;
          }
        }
        break;

      case 'gmail':
        // Get Gmail threads only
        const gmailThreads = await convex.query(api.gmailQueries.getRecentGmailThreads, { userId, limit: 100 });
        
        for (const thread of gmailThreads) {
          results.gmail.processed++;
          
          if (!thread || !thread._id || !thread.threadId) {
            console.warn(`⚠️ [PLATFORM EMBEDDING] Skipping invalid Gmail thread`);
            results.gmail.skipped++;
            continue;
          }

          try {
            const subject = thread.subject || thread.data?.subject || 'No Subject';
            const from = thread.from || thread.data?.from || 'Unknown Sender';
            const snippet = thread.snippet || thread.data?.snippet || '';
            const messageCount = thread.message_count || thread.data?.messageCount || 1;
            
            let messageDetails = '';
            if (thread.messages && Array.isArray(thread.messages) && thread.messages.length > 0) {
              messageDetails = '\n\nMessages:\n' + thread.messages
                .slice(0, 3)
                .map((msg, index) => `${index + 1}. From: ${msg.from || 'Unknown'}\n   Subject: ${msg.subject || subject}\n   Content: ${(msg.snippet || '').substring(0, 200)}`)
                .join('\n');
            }
            
            let analysisText = '';
            if (thread.analysis && typeof thread.analysis === 'object') {
              analysisText = `\n\nAnalysis: ${JSON.stringify(thread.analysis)}`;
            }
            
            const title = `Email Thread: ${subject}`;
            const searchableContent = `Gmail Thread: ${subject}\n\nFrom: ${from}\n\nSnippet: ${snippet}\n\nMessage Count: ${messageCount}${messageDetails}${analysisText}`;
            
            if (searchableContent.trim().length < 20) {
              console.warn(`⚠️ [PLATFORM EMBEDDING] Skipping Gmail thread "${subject}" - content too short`);
              results.gmail.skipped++;
              continue;
            }
            
            await convex.action(api.vectorSearch.createEmbedding, {
              userId,
              contentId: thread._id,
              contentType: "gmail_thread" as const,
              title: title,
              content: searchableContent,
            });
            
            results.gmail.succeeded++;
            
          } catch (error: any) {
            results.gmail.failed++;
            const errorMsg = `Failed to embed Gmail thread "${thread.threadId}": ${error.message}`;
            console.error('❌ [PLATFORM EMBEDDING]', errorMsg);
            results.errors.push(errorMsg);
            continue;
          }
        }
        break;

      case 'conversations':
        // Get conversations only
        const conversations = await convex.query(api.chatQueries.getHistory, { userId, limit: 100 });
        
        for (const conv of conversations) {
          results.conversations.processed++;
          
          if (!conv || !conv._id || !conv.title || !conv.messages || !Array.isArray(conv.messages)) {
            console.warn(`⚠️ [PLATFORM EMBEDDING] Skipping invalid conversation`);
            results.conversations.skipped++;
            continue;
          }

          if (conv.messages.length === 0) {
            console.warn(`⚠️ [PLATFORM EMBEDDING] Skipping conversation "${conv.title}" - no messages`);
            results.conversations.skipped++;
            continue;
          }

          try {
            const messageContent = conv.messages
              .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
              .map((m: any) => `${m.role || 'unknown'}: ${m.content}`)
              .join('\n');

            if (messageContent.trim().length === 0) {
              console.warn(`⚠️ [PLATFORM EMBEDDING] Skipping conversation "${conv.title}" - no valid message content`);
              results.conversations.skipped++;
              continue;
            }

            const searchableContent = `${conv.title}\n\n${messageContent}`;
            
            if (searchableContent.trim().length < 10) {
              console.warn(`⚠️ [PLATFORM EMBEDDING] Skipping conversation "${conv.title}" - content too short`);
              results.conversations.skipped++;
              continue;
            }

            await convex.action(api.vectorSearch.createEmbedding, {
              userId,
              contentId: conv._id,
              contentType: "conversation" as const,
              title: conv.title,
              content: searchableContent,
            });
            
            results.conversations.succeeded++;
            
          } catch (error: any) {
            results.conversations.failed++;
            const errorMsg = `Failed to embed conversation "${conv.title}": ${error.message}`;
            console.error('❌ [PLATFORM EMBEDDING]', errorMsg);
            results.errors.push(errorMsg);
            continue;
          }
        }
        break;

      case 'notes':
        // Get notes only
        const notes = await convex.query(api.notes.getNotesByUser, { userId });
        
        for (const note of notes) {
          results.notes.processed++;
          
          if (!note || !note._id || !note.title) {
            console.warn(`⚠️ [PLATFORM EMBEDDING] Skipping invalid note`);
            results.notes.skipped++;
            continue;
          }

          try {
            const searchableContent = `${note.title}\n\n${note.content || ''}`;
            
            if (searchableContent.trim().length < 5) {
              console.warn(`⚠️ [PLATFORM EMBEDDING] Skipping note "${note.title}" - content too short`);
              results.notes.skipped++;
              continue;
            }
            
            await convex.action(api.vectorSearch.createEmbedding, {
              userId,
              contentId: note._id,
              contentType: "note" as const,
              title: note.title,
              content: searchableContent,
            });
            
            results.notes.succeeded++;
            
          } catch (error: any) {
            results.notes.failed++;
            const errorMsg = `Failed to embed note "${note.title}": ${error.message}`;
            console.error('❌ [PLATFORM EMBEDDING]', errorMsg);
            results.errors.push(errorMsg);
            continue;
          }
        }
        break;

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    return results;
    
  } catch (error: any) {
    console.error(`💥 [PLATFORM EMBEDDING] Fatal error during ${platform} embedding generation:`, error);
    results.errors.push(`Fatal error: ${error.message}`);
    return results;
  }
}

/**
 * Generate embeddings for all existing user content (one-time setup)
 */
export async function generateEmbeddingsForUser(userId: string): Promise<any> {
  
  const results = {
    conversations: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
    notes: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
    instagramPosts: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
    youtubeVideos: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
    gmailThreads: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
    errors: [] as string[]
  };

  try {
    // Get all conversations
    const conversations = await convex.query(api.chatQueries.getHistory, { userId, limit: 100 });
    
    for (const conv of conversations) {
      results.conversations.processed++;
      
      if (!conv || !conv._id || !conv.title || !conv.messages || !Array.isArray(conv.messages)) {
        console.warn(`⚠️ [EMBEDDING SETUP] Skipping invalid conversation:`, {
          hasConv: !!conv,
          hasId: !!(conv && conv._id),
          hasTitle: !!(conv && conv.title),
          hasMessages: !!(conv && conv.messages),
          isArrayMessages: !!(conv && conv.messages && Array.isArray(conv.messages))
        });
        results.conversations.skipped++;
        continue;
      }

      if (conv.messages.length === 0) {
        console.warn(`⚠️ [EMBEDDING SETUP] Skipping conversation "${conv.title}" - no messages`);
        results.conversations.skipped++;
        continue;
      }

      try {
        const messageContent = conv.messages
          .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
          .map((m: any) => `${m.role || 'unknown'}: ${m.content}`)
          .join('\n');

        if (messageContent.trim().length === 0) {
          console.warn(`⚠️ [EMBEDDING SETUP] Skipping conversation "${conv.title}" - no valid message content`);
          results.conversations.skipped++;
          continue;
        }

        const searchableContent = `${conv.title}\n\n${messageContent}`;
        
        if (searchableContent.trim().length < 10) {
          console.warn(`⚠️ [EMBEDDING SETUP] Skipping conversation "${conv.title}" - content too short`);
          results.conversations.skipped++;
          continue;
        }

        await convex.action(api.vectorSearch.createEmbedding, {
          userId,
          contentId: conv._id,
          contentType: "conversation" as const,
          title: conv.title,
          content: searchableContent,
        });
        
        results.conversations.succeeded++;
        
      } catch (error: any) {
        results.conversations.failed++;
        const errorMsg = `Failed to embed conversation "${conv.title}": ${error.message}`;
        console.error('❌ [EMBEDDING SETUP]', errorMsg);
        results.errors.push(errorMsg);
        
        continue;
      }
    }

    // Get all notes
    const notes = await convex.query(api.notes.getNotesByUser, { userId });
    
    for (const note of notes) {
      results.notes.processed++;
      
      if (!note || !note._id || !note.title) {
        console.warn(`⚠️ [EMBEDDING SETUP] Skipping invalid note:`, {
          hasNote: !!note,
          hasId: !!(note && note._id),
          hasTitle: !!(note && note.title)
        });
        results.notes.skipped++;
        continue;
      }

      try {
        const searchableContent = `${note.title}\n\n${note.content || ''}`;
        
        if (searchableContent.trim().length < 5) {
          console.warn(`⚠️ [EMBEDDING SETUP] Skipping note "${note.title}" - content too short`);
          results.notes.skipped++;
          continue;
        }
        
        await convex.action(api.vectorSearch.createEmbedding, {
          userId,
          contentId: note._id,
          contentType: "note" as const,
          title: note.title,
          content: searchableContent,
        });
        
        results.notes.succeeded++;
        
      } catch (error: any) {
        results.notes.failed++;
        const errorMsg = `Failed to embed note "${note.title}": ${error.message}`;
        console.error('❌ [EMBEDDING SETUP]', errorMsg);
        results.errors.push(errorMsg);
        
        continue;
      }
    }

    // Get all Instagram posts
    try {
      const instagramPosts = await convex.query(api.instagramQueries.getAllInstagramPosts, { userId });
      
      for (const post of instagramPosts) {
        results.instagramPosts.processed++;
        
        if (!post || !post._id || !post.data || !post.data.id) {
          console.warn(`⚠️ [EMBEDDING SETUP] Skipping invalid Instagram post:`, {
            hasPost: !!post,
            hasId: !!(post && post._id),
            hasData: !!(post && post.data),
            hasDataId: !!(post && post.data && post.data.id)
          });
          results.instagramPosts.skipped++;
          continue;
        }

        try {
          const caption = post.data.caption || '';
          const username = post.data.username || 'Unknown User';
          const mediaType = (post.data as any).media_type || 'Unknown';
          const likeCount = post.data.like_count || 0;
          const commentsCount = post.data.comments_count || 0;
          const timestamp = post.data.timestamp ? new Date(post.data.timestamp).toLocaleDateString() : 'Unknown date';
          
          const hashtags = caption.match(/#[a-zA-Z0-9_]+/g) || [];
          const hashtagText = hashtags.length > 0 ? `\n\nHashtags: ${hashtags.join(' ')}` : '';
          
          const mentions = caption.match(/@[a-zA-Z0-9_.]+/g) || [];
          const mentionText = mentions.length > 0 ? `\n\nMentions: ${mentions.join(' ')}` : '';
          
          const engagementText = `\n\nEngagement: ${likeCount} likes, ${commentsCount} comments`;
          
          const title = `${username} - ${mediaType} Post (${timestamp})`;
          
          const searchableContent = [
            `Instagram Post by ${username}`,
            `Posted: ${timestamp}`,
            `Media Type: ${mediaType}`,
            `Caption: ${caption}`,
            hashtagText,
            mentionText,
            engagementText,
            `\n\nContext: This is an Instagram ${mediaType.toLowerCase()} post by ${username} with ${likeCount} likes and ${commentsCount} comments.`
          ].filter(Boolean).join('\n');
          
          if (searchableContent.trim().length < 20) {
            console.warn(`⚠️ [EMBEDDING SETUP] Skipping Instagram post "${post.data.id}" - content too short`);
            results.instagramPosts.skipped++;
            continue;
          }
          
          await convex.action(api.vectorSearch.createEmbedding, {
            userId,
            contentId: post._id,
            contentType: "instagram_post" as const,
            title: title,
            content: searchableContent,
          });
          
          results.instagramPosts.succeeded++;
          
        } catch (error: any) {
          results.instagramPosts.failed++;
          const errorMsg = `Failed to embed Instagram post "${post.data.id}": ${error.message}`;
          console.error('❌ [EMBEDDING SETUP]', errorMsg);
          results.errors.push(errorMsg);
          
          continue;
        }
      }
    } catch (error: any) {
      console.error('❌ [EMBEDDING SETUP] Error fetching Instagram posts:', error);
      results.errors.push(`Failed to fetch Instagram posts: ${error.message}`);
    }

    // Get all YouTube videos
    try {
      const youtubeVideos = await convex.query(api.youtubeQueries.getYouTubeVideos, { userId });
      
      for (const video of youtubeVideos) {
        results.youtubeVideos.processed++;
        
        if (!video || !video._id || !video.videoId) {
          console.warn(`⚠️ [EMBEDDING SETUP] Skipping invalid YouTube video:`, {
            hasVideo: !!video,
            hasId: !!(video && video._id),
            hasVideoId: !!(video && video.videoId)
          });
          results.youtubeVideos.skipped++;
          continue;
        }

        try {
          const title = video.snippet?.title || `YouTube Video ${video.videoId}`;
          const description = video.snippet?.description || '';
          const channelTitle = video.snippet?.channel?.title || 'Unknown Channel';
          const publishedAt = video.snippet?.published_at || '';
          
          let analysisText = '';
          if (video.analysisMarkdown) {
            analysisText = `\n\nAnalysis: ${video.analysisMarkdown}`;
          } else if (video.analysis && typeof video.analysis === 'object') {
            analysisText = `\n\nAnalysis: ${JSON.stringify(video.analysis)}`;
          }
          
          const searchableContent = `YouTube Video: ${title}\n\nChannel: ${channelTitle}\n\nDescription: ${description}${analysisText}`;
          
          if (searchableContent.trim().length < 10) {
            console.warn(`⚠️ [EMBEDDING SETUP] Skipping YouTube video "${title}" - content too short`);
            results.youtubeVideos.skipped++;
            continue;
          }
          
          await convex.action(api.vectorSearch.createEmbedding, {
            userId,
            contentId: video._id,
            contentType: "youtube_video" as const,
            title: title,
            content: searchableContent,
          });
          
          results.youtubeVideos.succeeded++;
          
        } catch (error: any) {
          results.youtubeVideos.failed++;
          const errorMsg = `Failed to embed YouTube video "${video.videoId}": ${error.message}`;
          console.error('❌ [EMBEDDING SETUP]', errorMsg);
          results.errors.push(errorMsg);
          
          continue;
        }
      }
    } catch (error: any) {
      console.error('❌ [EMBEDDING SETUP] Error fetching YouTube videos:', error);
      results.errors.push(`Failed to fetch YouTube videos: ${error.message}`);
    }

    // Get all Gmail threads
    try {
      const gmailThreads = await convex.query(api.gmailQueries.getRecentGmailThreads, { userId, limit: 100 });
      
      for (const thread of gmailThreads) {
        results.gmailThreads.processed++;
        
        if (!thread || !thread._id || !thread.threadId) {
          console.warn(`⚠️ [EMBEDDING SETUP] Skipping invalid Gmail thread:`, {
            hasThread: !!thread,
            hasId: !!(thread && thread._id),
            hasThreadId: !!(thread && thread.threadId)
          });
          results.gmailThreads.skipped++;
          continue;
        }

        try {
          const subject = thread.subject || thread.data?.subject || 'No Subject';
          const from = thread.from || thread.data?.from || 'Unknown Sender';
          const snippet = thread.snippet || thread.data?.snippet || '';
          const messageCount = thread.message_count || thread.data?.messageCount || 1;
          
          let messageDetails = '';
          if (thread.messages && Array.isArray(thread.messages) && thread.messages.length > 0) {
            messageDetails = '\n\nMessages:\n' + thread.messages
              .slice(0, 3)
              .map((msg, index) => `${index + 1}. From: ${msg.from || 'Unknown'}\n   Subject: ${msg.subject || subject}\n   Content: ${(msg.snippet || '').substring(0, 200)}`)
              .join('\n');
          }
          
          let analysisText = '';
          if (thread.analysis && typeof thread.analysis === 'object') {
            analysisText = `\n\nAnalysis: ${JSON.stringify(thread.analysis)}`;
          }
          
          const title = `Email Thread: ${subject}`;
          const searchableContent = `Gmail Thread: ${subject}\n\nFrom: ${from}\n\nSnippet: ${snippet}\n\nMessage Count: ${messageCount}${messageDetails}${analysisText}`;
          
          if (searchableContent.trim().length < 20) {
            console.warn(`⚠️ [EMBEDDING SETUP] Skipping Gmail thread "${subject}" - content too short`);
            results.gmailThreads.skipped++;
            continue;
          }
          
          await convex.action(api.vectorSearch.createEmbedding, {
            userId,
            contentId: thread._id,
            contentType: "gmail_thread" as const,
            title: title,
            content: searchableContent,
          });
          
          results.gmailThreads.succeeded++;
          
        } catch (error: any) {
          results.gmailThreads.failed++;
          const errorMsg = `Failed to embed Gmail thread "${thread.threadId}": ${error.message}`;
          console.error('❌ [EMBEDDING SETUP]', errorMsg);
          results.errors.push(errorMsg);
          
          continue;
        }
      }
    } catch (error: any) {
      console.error('❌ [EMBEDDING SETUP] Error fetching Gmail threads:', error);
      results.errors.push(`Failed to fetch Gmail threads: ${error.message}`);
    }

    return results;
    
  } catch (error: any) {
    console.error('💥 [EMBEDDING SETUP] Fatal error:', error);
    results.errors.push(`Fatal error: ${error.message}`);
    return results;
  }
}

/**
 * Sanitize content to prevent format string errors in the backend
 */
function sanitizeContentForPrompt(content: string): string {
  return content
    // Replace problematic characters that could be interpreted as format specifiers
    .replace(/\{/g, '(')  // Replace { with (
    .replace(/\}/g, ')')  // Replace } with )
    // Clean up any other potential issues
    .replace(/\$\{/g, '$(')  // Replace ${ with $(
    .replace(/`/g, "'")      // Replace backticks with single quotes
    // Truncate very long content to prevent overwhelming the context
    .substring(0, 1000);
}

/**
 * Search for relevant content using vector search - DIRECT CONVEX CALL (bypasses broken HTTP)
 */
async function searchRelevantContent(
  query: string,
  userId: string,
  onStatusUpdate?: (status: string) => void,
  searchLimit: number = 5
): Promise<VectorSearchResponse | null> {
  try {
    onStatusUpdate?.('🔍 Searching for relevant content...');
    
    // Try vector search first
    try {
      console.log('🎯 [FRONTEND DEBUG] Attempting hybrid search with vector + keyword matching...');
      
      const vectorResults = await convex.action(api.vectorSearch.hybridSearchContent, {
        userId,
        query,
        limit: searchLimit,
        contentTypes: ["conversation", "note", "instagram_post", "youtube_video", "gmail_thread"], // Include all content types including Gmail
        minSimilarity: 0.35 // Only return results with >35% similarity (higher threshold for better quality)
      });

      if (vectorResults && vectorResults.length > 0) {
        console.log('🎉 [FRONTEND DEBUG] HYBRID SEARCH SUCCESS! Found', vectorResults.length, 'results using vector + keyword search');
        console.log('🔍 [FRONTEND DEBUG] Content types found:', vectorResults.map((item: any) => item.contentType));
        console.log('🔍 [FRONTEND DEBUG] Similarity scores:', vectorResults.map((item: any) => ({ 
          title: item.title.substring(0, 30) + '...', 
          contentType: item.contentType, 
          score: Math.round(item.score * 1000) / 1000 
        })));
        
        const result = {
          success: true,
          context: vectorResults.map((item: any) => {
            const sanitizedContent = sanitizeContentForPrompt(item.content);
            return `${item.contentType}: ${item.title}\n${sanitizedContent}...`;
          }).join('\n\n'),
          relevantContent: vectorResults.map((item: any) => ({
            title: item.title,
            contentType: item.contentType,
            score: item.score
          })),
          prompt: `Based on the user's previous content:\n\n${vectorResults.map((item: any) => {
            const sanitizedContent = sanitizeContentForPrompt(item.content);
            return `${item.contentType}: ${item.title}\n${sanitizedContent}...`;
          }).join('\n\n')}\n\nUser query: ${query}\n\nPlease provide a helpful response that takes into account the user's existing content and context.`
        };

        onStatusUpdate?.(`Found ${vectorResults.length} relevant items using smart search`);
        return result;
      } else {
        console.warn('[FRONTEND DEBUG] Hybrid search returned no results');
      }
    } catch (vectorError) {
      console.error('[FRONTEND DEBUG] Hybrid search failed, falling back to text search:', vectorError);
    }

    const result = await convex.action(api.chatMutations.chatWithContext, {
      userId,
      query
    });

    if (result && result.relevantContent?.length > 0) {
      onStatusUpdate?.(`Found ${result.relevantContent.length} relevant items using text search`);
      
      return {
        success: true,
        context: result.context,
        relevantContent: result.relevantContent,
        prompt: result.prompt
      };
    }

    console.warn('No relevant content found for query:', query);
    return null;
  } catch (error) {
    console.error('🚨 [FRONTEND DEBUG] All search methods failed:', error);
    onStatusUpdate?.('Search completed with errors');
    return null;
  }
}

/**
 * Send a chat message to the API with integrated vector search
 */
export async function sendChatMessage(
  content: string, 
  isFirstMessage: boolean, 
  sessionId: string | null,
  contentContext?: ContentContext | null,
  hasContextInjection?: boolean,
  onStatusUpdate?: (status: string) => void,
  useContextSearch: boolean = true
): Promise<ChatResponseData> {
  console.log('🐛 [DEBUG] sendChatMessage called with:', {
    content: content.substring(0, 50) + '...',
    isFirstMessage,
    sessionId,
    hasContextInjection,
    contentContext: !!contentContext
  });

  // Get API key - make sure we have one before proceeding
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  console.log('🐛 [DEBUG] Got API key, length:', apiKey.length);

  // Get user ID directly from Firebase/cookies (much simpler!)
  const { getCurrentUserId } = await import('@/app/lib/api-helpers');
  const userId = await getCurrentUserId();
  
  console.log('🐛 [DEBUG] Got user ID directly:', userId);

  // Perform vector search if we have a user ID
  let vectorSearchResults: VectorSearchResponse | null = null;
  
  console.log('🐛 [DEBUG] Vector search conditions check:', {
    hasUserId: !!userId,
    userId: userId,
    hasContextInjection: !!hasContextInjection,
    useContextSearch: useContextSearch,
    shouldPerformSearch: !!(userId && useContextSearch)
  });
  
  if (userId && useContextSearch) { // Always search if context search is enabled and we have a user
    console.log('🐛 [DEBUG] STARTING VECTOR SEARCH - conditions met!');
    onStatusUpdate?.('🔍 Searching your content...');
    
    // Limit results when there's content context injection (like from specific posts/videos)
    const searchLimit = hasContextInjection ? 1 : 5;
    console.log('🐛 [DEBUG] Vector search limit:', searchLimit, 'due to hasContextInjection:', !!hasContextInjection);
    
    vectorSearchResults = await searchRelevantContent(content, userId, onStatusUpdate, searchLimit);
    
    console.log('🐛 [DEBUG] Vector search completed, results:', {
      hasResults: !!vectorSearchResults,
      hasContext: !!(vectorSearchResults && vectorSearchResults.context),
      itemCount: vectorSearchResults?.relevantContent?.length || 0
    });

    // Immediately notify with vector search results if found
    if (vectorSearchResults?.relevantContent?.length > 0) {
      onStatusUpdate?.(`VECTOR_SEARCH_RESULTS:${JSON.stringify({
        foundRelevantContent: true,
        relevantItemsCount: vectorSearchResults.relevantContent.length,
        relevantContent: vectorSearchResults.relevantContent
      })}`);
    }
  } else {
    console.log('🐛 [DEBUG] SKIPPING VECTOR SEARCH - conditions not met:', {
      reason: !userId ? 'No user ID' : !useContextSearch ? 'Context search disabled' : 'Unknown'
    });
  }

  // Always set is_first_message to true when isFirstMessage is true
  // This ensures the first message is ALWAYS properly flagged
  const isFirstMessageBool = isFirstMessage;
  
  const requestBody: any = {
    query: content, // Use the original, clean query
    is_first_message: isFirstMessageBool,
    use_vector_search: useContextSearch // Explicitly pass the flag
  };

  // Add context injection flag to help backend understand the message type
  if (hasContextInjection || (vectorSearchResults && vectorSearchResults.context)) {
    requestBody.has_context_injection = true;
    requestBody.context_enhanced = true;
  }

  // Add vector search metadata if available
  if (vectorSearchResults && vectorSearchResults.context) {
    // Clean the search query by replacing content IDs with titles
    let cleanSearchQuery = content;
    if (content.includes('@[') && userId) {
      try {
        // Get all linkable content for the user
        const allLinkableContent = await convex.query(api.notes.getAllLinkableContent, { userId });
        
        // Create a mapping of content IDs to titles
        const contentIdToTitle = new Map();
        allLinkableContent.forEach((item: any) => {
          const contentIdMatch = content.match(/@\[([^\]]+)\]@/);
          if (contentIdMatch) {
            const contentId = contentIdMatch[1];
            contentIdToTitle.set(contentId, item.title);
          }
        });
        
        // Replace content IDs with titles
        cleanSearchQuery = content.replace(/@\[([^\]]+)\]@/g, (match, contentId) => {
          const title = contentIdToTitle.get(contentId);
          return title ? `[${title}]` : match;
        });
      } catch (error) {
        console.error('Error cleaning search query:', error);
        // Keep original content if cleaning fails
      }
    }
    
    requestBody.vector_search_metadata = {
      foundRelevantContent: true,
      relevantItemsCount: vectorSearchResults.relevantContent.length,
      searchQuery: cleanSearchQuery, // Store cleaned query
      context: vectorSearchResults.context // Pass the context separately
    };
  }

  // Resolve link content if the message contains content IDs
  if (content.includes('@[') && userId) {
    console.log('🔗 [LINK RESOLUTION] Message contains content links, resolving...');
    
    try {
      // Get all linkable content for the user
      const allLinkableContent = await convex.query(api.notes.getAllLinkableContent, { userId });
      
      console.log('🔗 [LINK RESOLUTION] All linkable content from Convex:', {
        totalCount: allLinkableContent?.length || 0,
        types: allLinkableContent?.map(item => item.type) || [],
        insightCount: allLinkableContent?.filter(item => item.type === 'insight').length || 0,
        insights: allLinkableContent?.filter(item => item.type === 'insight').map(item => ({
          id: item.id,
          title: item.title
        })) || []
      });
      
      // Resolve all link content
      const resolvedLinkContent = await resolveAllLinkContent(content, userId, allLinkableContent);
      
      if (resolvedLinkContent.length > 0) {
        console.log('🔗 [LINK RESOLUTION] Resolved link content:', {
          count: resolvedLinkContent.length,
          types: resolvedLinkContent.map(item => item.type)
        });
        
        // Add resolved link content to request body
        requestBody.link_content = resolvedLinkContent;
      } else {
        console.log('🔗 [LINK RESOLUTION] No link content resolved');
      }
    } catch (error) {
      console.error('🔗 [LINK RESOLUTION] Error resolving link content:', error);
      // Continue without link content if resolution fails
    }
  }

  // Handle session ID based on whether this is a first message or continuing conversation
  if (isFirstMessageBool) {
    // For new conversations, explicitly set session_id to null
    requestBody.session_id = null;
    console.log('Sending first message - session_id set to null for new conversation');
  } else if (sessionId) {
    // For continuing conversations, use the conversation ID as session_id
    requestBody.session_id = sessionId;
    console.log('Continuing existing conversation - session_id set to:', sessionId);
  } else {
    // This shouldn't happen, but handle gracefully
    console.warn('Non-first message without session ID - this may cause issues');
    requestBody.session_id = null;
  }



  // Include content context if available
  if (contentContext) {
    // Debug logging for content context
    console.log('🔍 [CONTENT CONTEXT DEBUG] Full content context:', {
      platform: contentContext.platform,
      contentId: contentContext.contentId,
      title: contentContext.title,
      hasAnalysis: !!contentContext.analysis,
      hasConvexData: !!contentContext.convexData,
      convexDataKeys: contentContext.convexData ? Object.keys(contentContext.convexData) : 'none',
      contentKeys: contentContext.content ? Object.keys(contentContext.content) : 'none',
      fullContext: contentContext
    });

    // Additional debug logging specifically for YouTube
    if (contentContext.platform === 'youtube') {
      console.log('🎥 [YOUTUBE CONTEXT DEBUG] YouTube-specific context details:', {
        videoId: contentContext.contentId,
        title: contentContext.title,
        hasAnalysis: !!contentContext.analysis,
        hasDescription: !!(contentContext.content?.description),
        descriptionLength: contentContext.content?.description?.length || 0,
        descriptionPreview: contentContext.content?.description?.substring(0, 100) + (contentContext.content?.description?.length > 100 ? '...' : ''),
        channelTitle: contentContext.content?.channelTitle,
        duration: contentContext.content?.duration,
        hasBasicInfo: !!(contentContext.content?.basicInfo),
        hasRichContext: !!(contentContext.content?.richContext),
        // Rich context details
        hasCaptions: contentContext.content?.hasCaptions,
        captionsStatus: contentContext.content?.captionsStatus,
        captionsLength: contentContext.content?.captions?.length || 0,
        hasComments: contentContext.content?.hasComments,
        commentsCount: contentContext.content?.comments?.length || 0,
        totalComments: contentContext.content?.totalComments || 0,
        tagsCount: contentContext.content?.tags?.length || 0,
        tags: contentContext.content?.tags?.slice(0, 3) || [],
        hasTranscript: !!(contentContext.content?.richContext?.transcript),
        transcriptLength: contentContext.content?.richContext?.transcript?.length || 0,
        videoMetrics: contentContext.metrics,
        convexDataSnippet: contentContext.convexData?.snippet ? {
          title: contentContext.convexData.snippet.title,
          hasDescription: !!contentContext.convexData.snippet.description,
          channel: contentContext.convexData.snippet.channel,
          tagsCount: contentContext.convexData.snippet.tags?.length || 0,
        } : 'none',
        convexDataCaptions: contentContext.convexData?.captions ? {
          status: contentContext.convexData.captions.status,
          hasText: !!(contentContext.convexData.captions.caption_track?.text),
        } : 'none',
        convexDataComments: contentContext.convexData?.comments ? {
          status: contentContext.convexData.comments.status,
          count: contentContext.convexData.comments.comments?.length || 0,
          total: contentContext.convexData.comments.total_comments || 0,
        } : 'none'
      });
      // NEW: Log full context and large fields
      try {
        const fullContextStr = JSON.stringify(contentContext, (key, value) => {
          if (typeof value === 'string' && value.length > 500) return value.slice(0, 500) + '...';
          if (Array.isArray(value) && value.length > 10) return `[Array(${value.length})]`;
          return value;
        }, 2);
        console.log('🎥 [YOUTUBE CONTEXT DEBUG] FULL CONTEXT (truncated):', fullContextStr.length > 2000 ? fullContextStr.slice(0, 2000) + '... [truncated]' : fullContextStr);
      } catch (err) {
        console.warn('Could not stringify contentContext:', err);
      }
      // Log suspiciously large fields
      if (contentContext.content?.captions && contentContext.content.captions.length > 1000) {
        console.log('🎥 [YOUTUBE CONTEXT DEBUG] Captions field is very large:', contentContext.content.captions.length, 'characters');
      }
      if (contentContext.content?.comments && contentContext.content.comments.length > 10) {
        console.log('🎥 [YOUTUBE CONTEXT DEBUG] Comments array is very large:', contentContext.content.comments.length, 'comments');
      }
      if (contentContext.content?.richContext?.transcript && contentContext.content.richContext.transcript.length > 1000) {
        console.log('🎥 [YOUTUBE CONTEXT DEBUG] Transcript is very large:', contentContext.content.richContext.transcript.length, 'characters');
      }
    }

    // Handle both old ContentContext format and new Zustand store format
    if (contentContext.convexData) {
      // New Zustand store format with full Convex data
      const convexData = contentContext.convexData;
      
      // Debug logging for Convex data
      console.log('🔍 [CONVEX DATA DEBUG] Instagram post data:', {
        hasData: !!convexData.data,
        dataKeys: convexData.data ? Object.keys(convexData.data) : 'none',
        hasComments: !!convexData.data?.comments,
        commentsLength: convexData.data?.comments?.length || 0,
        hasChildren: !!convexData.data?.children,
        childrenLength: convexData.data?.children?.length || 0,
        hasInsights: !!convexData.data?.insights,
        insightsKeys: convexData.data?.insights ? Object.keys(convexData.data.insights) : 'none',
        fullConvexData: convexData
      });
      
      requestBody.content_context = {
        platform: contentContext.platform,
        content_id: contentContext.contentId,
        title: contentContext.title,
        analysis: contentContext.analysis,
        thumbnail_url: contentContext.thumbnailUrl,
        published_at: contentContext.publishedAt,
        metrics: contentContext.metrics,
        content: contentContext.content,
        // Include the full Convex document for backend processing
        convex_data: convexData
      };
    } else {
      // Legacy ContentContext format
      console.log('🔍 [LEGACY CONTEXT DEBUG] Using legacy format');
      requestBody.content_context = {
        platform: contentContext.platform,
        content_id: contentContext.contentId,
        title: contentContext.title,
        analysis: contentContext.analysis,
        thumbnail_url: contentContext.thumbnailUrl,
        published_at: contentContext.publishedAt,
        metrics: contentContext.metrics,
        content: contentContext.content
      };
    }
  }



  // Do NOT include user_id in the request body; backend extracts it from API key

  // Add this right before the fetch call
  console.log('📤 SENDING MESSAGE TO BACKEND:', {
    is_first_message: requestBody.is_first_message,
    session_id: requestBody.session_id,
    current_session_id: sessionId,
    expected_behavior: isFirstMessageBool ? 'CREATE_NEW_CONVERSATION' : 'CONTINUE_EXISTING_CONVERSATION',
    conversation_to_continue: isFirstMessageBool ? 'N/A' : sessionId,
    endpoint: '/api/chat/message',
    has_content_context: !!contentContext,
    has_vector_search_context: !!vectorSearchResults,
    vector_search_items: vectorSearchResults?.relevantContent?.length || 0,
    has_link_content: !!requestBody.link_content,
    link_content_count: requestBody.link_content?.length || 0,
    link_content_types: requestBody.link_content?.map((item: any) => item.type) || [],

    content_context: contentContext ? {
      platform: contentContext.platform,
      contentId: contentContext.contentId,
      title: contentContext.title,
      hasAnalysis: !!contentContext.analysis
    } : null
  });

  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const data = await response.json();

  // Add this right after receiving the response
  console.log('📥 RECEIVED RESPONSE FROM BACKEND:', {
    session_id_returned: data.session_id,
    session_id_expected: sessionId,
    response_length: data.chat_response?.length,
    conversation_context: isFirstMessageBool ? 'NEW' : 'EXISTING',
    session_id_changed: sessionId !== data.session_id,
    response_preview: data.chat_response?.substring(0, 100) + '...',
    full_response_structure: Object.keys(data),
    used_vector_context: !!vectorSearchResults
  });

  // Add vector search metadata to the response for debugging
  if (vectorSearchResults) {
    data.vector_search_metadata = {
      foundRelevantContent: true,
      relevantItemsCount: vectorSearchResults.relevantContent.length,
      relevantContent: vectorSearchResults.relevantContent
    };
  }

  return data;
}

/**
 * Load conversation by ID
 */
export async function loadConversation(id: string) {
  try {
    // Get API key for authentication - same pattern as sendChatMessage
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('You are not authenticated. Please log in again.');
    }

    const response = await fetch(`/api/chat/conversation/${id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load conversation: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to load conversation:', error);
    throw error;
  }
}

/**
 * Check if user has embeddings for a specific platform
 */
export async function checkPlatformEmbeddings(
  userId: string, 
  platform: 'instagram' | 'youtube' | 'gmail' | 'conversations' | 'notes'
): Promise<{ hasEmbeddings: boolean; count: number }> {
  try {
    const contentTypeMap = {
      instagram: 'instagram_post',
      youtube: 'youtube_video', 
      gmail: 'gmail_thread',
      conversations: 'conversation',
      notes: 'note'
    };
    
    const contentType = contentTypeMap[platform];
    const result = await convex.query(api.vectorSearch.getPlatformEmbeddingCount, { 
      userId, 
      contentType 
    });
    
    return result;
  } catch (error: any) {
    console.error(`Error checking ${platform} embeddings:`, error);
    return { hasEmbeddings: false, count: 0 };
  }
}

/**
 * Check if user has embeddings
 */
export async function checkUserEmbeddings(userId: string): Promise<{ hasEmbeddings: boolean; count: number }> {
  try {
    const result = await convex.query(api.vectorSearch.hasUserEmbeddings, { userId });
    return result;
  } catch (error: any) {
    console.error('Error checking user embeddings:', error);
    return { hasEmbeddings: false, count: 0 };
  }
}

/**
 * Delete all embeddings for user
 */
export async function deleteAllUserEmbeddings(userId: string): Promise<{ success: boolean; deletedCount: number; message: string }> {
  
  try {
    const result = await convex.mutation(api.vectorSearch.deleteAllUserEmbeddings, { userId });
    return result;
  } catch (error: any) {
    console.error('❌ [EMBEDDING DELETE] Deletion failed:', error);
    return { 
      success: false, 
      deletedCount: 0, 
      message: `Failed to delete embeddings: ${error.message}` 
    };
  }
}

// We no longer generate local session IDs
// All session IDs should come from the backend
