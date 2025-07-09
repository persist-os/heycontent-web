import { ChatResponseData } from '../types';
import { ContentContext } from '../types';

import dotenv from 'dotenv';

dotenv.config();

import { getApiKey } from '@/app/lib/api-helpers';
import { resolveAllLinkContent } from './link-content-resolver';

// Add Convex client import for direct function calls
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { AuthenticationError } from '@/app/lib/errors';
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

interface ContextGradingResponse {
  relevant_context: Array<{
    title: string;
    contentType: string;
    score: number;
    summary?: string;
    relevance_score: number;
    relevance_reason: string;
  }>;
  grading_summary: {
    total_items: number;
    relevant_items: number;
    confidence_score: number;
  };
  metadata: {
    request_id: string;
    processing_time_ms: number;
  };
}

interface IntentAnalysisResponse {
  needs_context: boolean;
  confidence_score: number;
  reasoning: string;
  metadata: {
    request_id: string;
    processing_time_ms: number;
  };
}

// Enhanced type for vector search metadata that includes all the new properties
interface VectorSearchMetadata {
  foundRelevantContent: boolean;
  relevantItemsCount: number;
  searchQuery?: string;
  context?: string;
  graded?: boolean;
  grading_summary?: {
    total_items: number;
    relevant_items: number;
    confidence_score: number;
  };
  intent_analysis?: IntentAnalysisResponse;
  skipped_reason?: string;
  vector_search_performed?: boolean;
  no_results_reason?: string;
  relevantContent?: Array<{
    title: string;
    contentType: string;
    score: number;
  }>;
}

// Helper function to get random casual status messages for content creators
function getRandomStatusMessage(stage: string): string {
  const statusPools = {
    // Intent analysis stage
    intent_analysis: [
      "Figuring out what you're looking for...",
      "Checking if I need to peek at your stuff...",
      "Seeing what you're asking about...",
      "Getting the vibe of your question...",
      "Understanding what you need...",
      "Piecing together your request...",
    ],
    
    // Vector search stage
    vector_search: [
      "Digging through your stuff...",
      "Checking out your content...",
      "Looking through your posts...",
      "Browsing your stuff...",
      "Scanning through your content...",
      "Hunting through your materials...",
      "Reviewing your content library...",
    ],
    
    // Context grading stage
    context_grading: [
      "Picking the good stuff...",
      "Finding the best bits...",
      "Sorting through what matters...",
      "Grabbing the relevant pieces...",
      "Selecting the cream of the crop...",
      "Curating the perfect mix...",
      "Finding the gems in your content...",
    ],
    
    // Individual item examination
    item_examination: [
      "Checking each piece...",
      "Looking at your content...",
      "Examining what you've got...",
      "Reviewing each item...",
      "Sizing up your stuff...",
    ],
    
    // Response generation stage
    response_generation: [
      "Putting it all together...",
      "Cooking up your answer...",
      "Crafting something cool...",
      "Making magic happen...",
      "Building your response...",
      "Creating something awesome...",
      "Pulling it all together...",
    ],
    
    // Success messages
    success: [
      "Found some good stuff!",
      "Got the perfect pieces!",
      "Picked the cream of the crop!",
      "Found the gems!",
      "Nailed the best content!",
      "Found the good stuff!",
    ],
    
    // Filtering complete messages
    filtering_complete: [
      "Sorted through everything!",
      "Picked the best pieces!",
      "Curated the perfect mix!",
      "Found the golden content!",
      "Got the good stuff sorted!",
    ],
    
    // Skip messages
    skip_simple_query: [
      "This one's easy - no digging needed!",
      "Got this covered without searching!",
      "Simple question, quick answer!",
      "No need to check your stuff for this one!",
      "Straight to the point!",
    ],
    
    // Fallback messages
    fallback: [
      "Working on it...",
      "Almost there...",
      "Just a sec...",
      "Thinking...",
      "On it...",
    ]
  };
  
  const pool = statusPools[stage as keyof typeof statusPools] || statusPools.fallback;
  return pool[Math.floor(Math.random() * pool.length)];
}

export type { ChatResponseData, VectorSearchMetadata }; // Export the types for use in other components

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
 * Search for relevant content using vector search with platform quotas - DIRECT CONVEX CALL
 */
async function searchRelevantContent(
  query: string,
  userId: string,
  onStatusUpdate?: (status: string) => void,
  searchLimit: number = 10
): Promise<VectorSearchResponse | null> {
  try {
    onStatusUpdate?.('Searching your content - digging through your stuff...');
    
    // TEMPORARILY DISABLED: Enhanced hybrid search with quotas
    // TODO: Re-enable after debugging the server error
    // console.log('🎯 [FRONTEND DEBUG] Enhanced search temporarily disabled due to server errors');
    
    // Use the working fallback method directly
    try {
      console.log('🎯 [FRONTEND DEBUG] Using standard hybrid search (enhanced search temporarily disabled)...');
      
      const vectorResults = await convex.action(api.vectorSearch.hybridSearchContent, {
        userId,
        query,
        limit: searchLimit,
        contentTypes: ["conversation", "note", "instagram_post", "youtube_video", "gmail_thread"],
        minSimilarity: 0.35 // Only return results with >35% similarity
      });

      if (vectorResults && vectorResults.length > 0) {
        console.log('🎉 [FRONTEND DEBUG] STANDARD HYBRID SEARCH SUCCESS! Found', vectorResults.length, 'results');
        console.log('🔍 [FRONTEND DEBUG] Content types found:', vectorResults.map((item: any) => item.contentType));
        console.log('🔍 [FRONTEND DEBUG] Similarity scores:', vectorResults.map((item: any) => ({ 
          title: item.title.substring(0, 30) + '...', 
          contentType: item.contentType, 
          score: Math.round(item.score * 1000) / 1000 
        })));
        
        // Send a message that shows the discovered items count
        onStatusUpdate?.(`Discovered ${vectorResults.length} potentially relevant items - found some good stuff!`);
        
        const result = {
          success: true,
          context: vectorResults.map((item: any) => {
            const sanitizedContent = sanitizeContentForPrompt(item.content);
            return `${item.contentType}: ${item.title}\n${sanitizedContent}...`;
          }).join('\n\n'),
          relevantContent: vectorResults.map((item: any) => ({
            title: item.title,
            contentType: item.contentType,
            score: item.score,
            summary: item.content // Keep the actual content for grading!
          })),
          prompt: `Based on the user's previous content:\n\n${vectorResults.map((item: any) => {
            const sanitizedContent = sanitizeContentForPrompt(item.content);
            return `${item.contentType}: ${item.title}\n${sanitizedContent}...`;
          }).join('\n\n')}\n\nUser query: ${query}\n\nPlease provide a helpful response that takes into account the user's existing content and context.`
        };

        return result;
      } else {
        console.warn('[FRONTEND DEBUG] Standard hybrid search returned no results');
        onStatusUpdate?.('No relevant content found in your library');
      }
    } catch (standardError) {
      console.error('[FRONTEND DEBUG] Standard hybrid search failed:', standardError);
    }

    // Final fallback to chatWithContext
    console.log('[FRONTEND DEBUG] Trying final fallback to chatWithContext...');
    const result = await convex.action(api.chatMutations.chatWithContext, {
      userId,
      query
    });

    if (result && result.relevantContent?.length > 0) {
      onStatusUpdate?.(`Found ${result.relevantContent.length} relevant items - good stuff discovered!`);
      
      return {
        success: true,
        context: result.context,
        relevantContent: result.relevantContent,
        prompt: result.prompt
      };
    }

    console.warn('No relevant content found for query:', query);
    onStatusUpdate?.('No relevant content found in your library');
    return null;
  } catch (error) {
    console.error('🚨 [FRONTEND DEBUG] All search methods failed:', error);
    onStatusUpdate?.('Something went wrong with the search, but we\'ll keep going!');
    return null;
  }
}

async function analyzeQueryIntent(
  query: string,
  onStatusUpdate?: (status: string) => void
): Promise<IntentAnalysisResponse | null> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Authentication required for intent analysis');
  }

  // Send a message the ProgressiveThinkingIndicator can recognize
  onStatusUpdate?.('Analyzing whether your query needs context - figuring out what you\'re looking for...');

  // ✅ CRITICAL: First check if this is an obviously simple query that should override backend
  const obviousSimpleQuery = isObviouslySimpleQuery(query);
  if (obviousSimpleQuery) {
    console.log('🎯 [INTENT ANALYSIS] Using heuristic override for obvious simple query:', query);
    const heuristicResult = simpleIntentHeuristic(query);
    
    // Still call backend for logging/debugging, but use heuristic result
    try {
      const backendResult = await callBackendIntentAnalysis(query, apiKey);
      console.log('🎯 [INTENT ANALYSIS] Backend would have said:', backendResult);
      console.log('🎯 [INTENT ANALYSIS] But using heuristic override instead:', heuristicResult);
    } catch (error) {
      console.log('🎯 [INTENT ANALYSIS] Backend call failed, using heuristic (which is correct anyway)');
    }
    
    // Update status based on the result
    if (!heuristicResult.needs_context) {
      onStatusUpdate?.('Query is self-contained - no need to check your stuff for this one!');
    } else {
      onStatusUpdate?.('Query needs context (heuristic) - proceeding with content search');
    }
    
    return heuristicResult;
  }

  try {
    console.log('🎯 [INTENT ANALYSIS] Starting query intent analysis', {
      query: query.substring(0, 50) + '...',
      queryLength: query.length,
      queryFull: query // Log full query for debugging
    });

    const backendResult = await callBackendIntentAnalysis(query, apiKey);
    
    if (backendResult) {
      console.log('🎯 [INTENT ANALYSIS] Backend result received');
      
      // ✅ CRITICAL: Validate backend response and override if obviously wrong
      const validatedResult = validateAndCorrectIntentAnalysis(query, backendResult);
      
      // Update status based on final result
      if (!validatedResult.needs_context) {
        onStatusUpdate?.('Query is self-contained - no additional context needed');
      } else {
        onStatusUpdate?.('Query needs context - proceeding with vector search');
      }

      return validatedResult;
    } else {
      console.log('🎯 [INTENT ANALYSIS] Backend failed, using heuristic fallback');
      const heuristicResult = simpleIntentHeuristic(query);
      
      // Update status based on final result
      if (!heuristicResult.needs_context) {
        onStatusUpdate?.('Query is self-contained - no additional context needed');
      } else {
        onStatusUpdate?.('Query needs context (heuristic) - proceeding with content search');
      }
      
      return heuristicResult;
    }
  } catch (error) {
    console.error('🎯 [INTENT ANALYSIS] Request failed with error:', error);
    onStatusUpdate?.('Intent analysis failed - using heuristic fallback');
    
    const heuristicResult = simpleIntentHeuristic(query);
    
    // Update status based on final result
    if (!heuristicResult.needs_context) {
      onStatusUpdate?.('Query is self-contained - no additional context needed');
    } else {
      onStatusUpdate?.('Query needs context (heuristic) - proceeding with content search');
    }
    
    return heuristicResult;
  }
}

// Helper function to detect obviously simple queries that should never need context
function isObviouslySimpleQuery(query: string): boolean {
  const queryLower = query.toLowerCase().trim();
  
  // Ultra-simple queries that should NEVER need context
  const obviouslySimple = [
    'hi', 'hello', 'hey', 'yo', 'sup',
    'good morning', 'good afternoon', 'good evening',
    'thanks', 'thank you', 'ok', 'okay', 'yes', 'no',
    'bye', 'goodbye', 'see you'
  ];
  
  // Very short general questions
  const simplePatterns = [
    /^what is \w+\?*$/,          // "what is AI?"
    /^how to \w+/,               // "how to code"
    /^who is \w+\?*$/,           // "who is elon musk?"
    /^when was \w+/,             // "when was bitcoin created"
    /^where is \w+/,             // "where is paris"
    /^why does \w+/,             // "why does this work"
    /^explain \w+/,              // "explain quantum physics"
    /^define \w+/,               // "define machine learning"
  ];
  
  // Check exact matches first
  if (obviouslySimple.includes(queryLower)) {
    return true;
  }
  
  // Check patterns
  if (simplePatterns.some(pattern => pattern.test(queryLower))) {
    return true;
  }
  
  // Very short queries (under 15 characters) with no personal indicators
  if (queryLower.length <= 15 && !hasPersonalIndicators(queryLower)) {
    return true;
  }
  
  return false;
}

// Helper function to check for personal indicators
function hasPersonalIndicators(query: string): boolean {
  const personalIndicators = [
    'my ', 'our ', 'my content', 'my post', 'my recent', 
    'analyze my', 'help me with my', 'my audience', 'my brand',
    'my strategy', 'my business', 'my work'
  ];
  
  return personalIndicators.some(indicator => query.includes(indicator));
}

// Separate function for backend API call
async function callBackendIntentAnalysis(query: string, apiKey: string): Promise<IntentAnalysisResponse | null> {
  const response = await fetch('/api/chat/analyze-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query
    })
  });

  console.log('🎯 [INTENT ANALYSIS] Response status:', response.status, response.statusText);

  if (!response.ok) {
    console.error('🎯 [INTENT ANALYSIS] Failed with status:', response.status);
    
    // Try to get error details
    try {
      const errorData = await response.text();
      console.error('🎯 [INTENT ANALYSIS] Error response:', errorData);
    } catch (e) {
      console.error('🎯 [INTENT ANALYSIS] Could not read error response');
    }
    
    return null;
  }

  const data = await response.json();
  
  console.log('🎯 [INTENT ANALYSIS] Intent analysis completed successfully', {
    needs_context: data.needs_context,
    confidence_score: data.confidence_score,
    reasoning: data.reasoning,
    processing_time_ms: data.metadata?.processing_time_ms,
    request_id: data.metadata?.request_id
  });

  // Validate the response structure
  if (typeof data.needs_context !== 'boolean') {
    console.error('🎯 [INTENT ANALYSIS] Invalid response: needs_context is not boolean', data);
    return null;
  }

  return data;
}

// Function to validate and potentially override obviously wrong backend responses
function validateAndCorrectIntentAnalysis(query: string, backendResult: IntentAnalysisResponse): IntentAnalysisResponse {
  const queryLower = query.toLowerCase().trim();
  
  // If backend says "hi" needs context, override it
  if (isObviouslySimpleQuery(query) && backendResult.needs_context) {
    console.warn('🎯 [INTENT ANALYSIS] Backend gave wrong result for obvious simple query, overriding:', {
      query: queryLower,
      backend_said: 'needs_context: true',
      corrected_to: 'needs_context: false',
      backend_reasoning: backendResult.reasoning
    });
    
    const correctedResult = simpleIntentHeuristic(query);
    return {
      ...correctedResult,
      reasoning: `Corrected backend error: "${backendResult.reasoning}" → ${correctedResult.reasoning}`,
      metadata: {
        ...correctedResult.metadata
      }
    };
  }
  
  // Backend result seems reasonable, use it
  return backendResult;
}

// Add a simple heuristic fallback for when backend intent analysis is not available
function simpleIntentHeuristic(query: string): IntentAnalysisResponse {
  const queryLower = query.toLowerCase().trim();
  
  // Very simple queries that clearly don't need context
  const simpleGreetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
  const generalQuestions = ['what is', 'how to', 'explain', 'define', 'who is', 'when was', 'where is'];
  const mathQuestions = ['calculate', 'math', 'formula', 'equation'];
  
  // Personal indicators that suggest context is needed
  const personalIndicators = ['my ', 'our ', 'my content', 'my post', 'my recent', 'analyze my', 'help me with my'];
  
  let needsContext = true; // Default to true for safety
  let reasoning = 'Default heuristic: assuming context needed for safety';
  let confidence = 0.5;
  
  // Check for simple greetings
  if (simpleGreetings.includes(queryLower)) {
    needsContext = false;
    reasoning = 'Simple greeting detected - no context needed';
    confidence = 0.9;
  }
  // Check for general knowledge questions
  else if (generalQuestions.some(indicator => queryLower.includes(indicator))) {
    needsContext = false;
    reasoning = 'General knowledge question detected - no context needed';
    confidence = 0.8;
  }
  // Check for math questions
  else if (mathQuestions.some(indicator => queryLower.includes(indicator))) {
    needsContext = false;
    reasoning = 'Mathematical question detected - no context needed';
    confidence = 0.8;
  }
  // Check for clear personal indicators
  else if (personalIndicators.some(indicator => queryLower.includes(indicator))) {
    needsContext = true;
    reasoning = 'Personal content reference detected - context needed';
    confidence = 0.8;
  }
  // Very short queries (under 10 characters) are likely greetings or simple questions
  else if (queryLower.length < 10) {
    needsContext = false;
    reasoning = 'Very short query - likely does not need context';
    confidence = 0.7;
  }
  
  console.log('🎯 [SIMPLE HEURISTIC] Fallback intent analysis:', {
    query: queryLower,
    needs_context: needsContext,
    reasoning,
    confidence
  });
  
  return {
    needs_context: needsContext,
    confidence_score: confidence,
    reasoning: reasoning,
    metadata: {
      request_id: 'heuristic',
      processing_time_ms: 0
    }
  };
}

async function gradeContextRelevance(
  query: string,
  vectorSearchResults: VectorSearchResult[],
  onStatusUpdate?: (status: string) => void
): Promise<ContextGradingResponse | null> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Authentication required for context grading');
  }

  onStatusUpdate?.(getRandomStatusMessage('context_grading'));

  try {
    console.log('🔍 [CONTEXT GRADING] Starting relevance analysis', {
      query: query.substring(0, 50) + '...',
      resultsCount: vectorSearchResults.length
    });

    const response = await fetch('/api/chat/grade-context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        vector_search_results: vectorSearchResults
      })
    });

    if (!response.ok) {
      console.error('Failed to grade context relevance:', response.status);
      return null;
    }

    const data = await response.json();
    
    console.log('🔍 [CONTEXT GRADING] Relevance analysis completed', {
      totalItems: data.grading_summary.total_items,
      relevantItems: data.grading_summary.relevant_items,
      confidenceScore: data.grading_summary.confidence_score
    });

    // ✅ CRITICAL: Pass the original vector search count to validation
    const validatedData = validateAndFilterContextGrading(
      query, 
      data, 
      vectorSearchResults, 
      onStatusUpdate,
      vectorSearchResults.length // Pass original count for correct filtering stats
    );

    // validateAndFilterContextGrading already provides the final status update with correct filtering breakdown
    return validatedData;
  } catch (error) {
    console.error('Context grading failed:', error);
    onStatusUpdate?.(getRandomStatusMessage('fallback'));
    return null;
  }
}

// Function to validate and filter obviously wrong context grading results
function validateAndFilterContextGrading(
  query: string, 
  gradingResponse: ContextGradingResponse, 
  originalResults: VectorSearchResult[],
  onStatusUpdate?: (status: string) => void,
  originalVectorCount: number = 0 // Add originalVectorCount parameter
): ContextGradingResponse {
  const queryLower = query.toLowerCase().trim();
  
  console.log('🔍 [CONTEXT GRADING] Starting validation and filtering:', {
    query: queryLower,
    backend_approved_count: gradingResponse.relevant_context.length,
    original_vector_count: originalVectorCount,
    all_have_same_reason: gradingResponse.relevant_context.every(item => 
      item.relevance_reason === 'Content appears relevant based on response'
    )
  });

  // Enhanced status updates with specific item analysis
  onStatusUpdate?.('Examining each item for relevance - checking quality...');
  
  const keptItems: Array<{ title: string; reason: string; score: number }> = [];
  const filteredItems: Array<{ title: string; reason: string; score: number }> = [];
  
  // For obviously simple queries like "hi", be very strict about relevance
  if (isObviouslySimpleQuery(query)) {
    console.log('🔍 [CONTEXT GRADING] Simple query detected, applying strict relevance filtering');
    onStatusUpdate?.('Query is self-contained - filtering out all content');
    
    // Filter out obviously irrelevant content for simple queries
    const filteredContent = gradingResponse.relevant_context.filter((item, index) => {
      const shortTitle = item.title.substring(0, 50) + (item.title.length > 50 ? '...' : '');
      
      // For simple greetings, almost nothing should be considered relevant
      if (['hi', 'hello', 'hey', 'yo', 'sup', 'good morning', 'good afternoon', 'good evening'].includes(queryLower)) {
        console.log('🔍 [CONTEXT GRADING] Filtering out item for greeting:', item.title);
        filteredItems.push({
          title: shortTitle,
          reason: 'Not relevant for simple greeting',
          score: item.relevance_score
        });
        onStatusUpdate?.(`❌ "${shortTitle}" - not relevant for simple greeting`);
        return false; // Nothing is relevant for simple greetings
      }
      
      // Check for obviously irrelevant patterns
      const isObviouslyIrrelevant = 
        item.title.includes('No Subject') ||
        item.title.includes('Unknown Sender') ||
        item.summary?.includes('Unknown Sender') ||
        item.summary?.includes('Snippet: \n\n') ||
        item.relevance_score < 0.2; // Very low relevance (lowered from 0.3)
      
      if (isObviouslyIrrelevant) {
        console.log('🔍 [CONTEXT GRADING] Filtering out obviously irrelevant item:', {
          title: item.title,
          reason: item.relevance_reason,
          score: item.relevance_score
        });
        filteredItems.push({
          title: shortTitle,
          reason: item.relevance_score < 0.2 ? 'Score too low' : 'Broken data patterns',
          score: item.relevance_score
        });
        onStatusUpdate?.(`❌ "${shortTitle}" - ${item.relevance_score < 0.2 ? 'not quite relevant enough' : 'looks a bit broken'}`);
        return false;
      }
      
      keptItems.push({
        title: shortTitle,
        reason: 'Passed strict filtering',
        score: item.relevance_score
      });
      onStatusUpdate?.(`✅ "${shortTitle}" - looks good! (${(item.relevance_score * 100).toFixed(1)}%)`);
      return true;
    });
    
    // Final summary with complete filtering stats
    const backendApprovedCount = gradingResponse.relevant_context.length;
    const finalCount = filteredContent.length;
    const backendFilteredCount = originalVectorCount - backendApprovedCount;
    const frontendFilteredCount = backendApprovedCount - finalCount;
    const totalFilteredCount = originalVectorCount - finalCount;
    
    if (totalFilteredCount > 0) {
      onStatusUpdate?.(`Kept ${finalCount} relevant pieces, filtered ${totalFilteredCount} total (${backendFilteredCount} by AI, ${frontendFilteredCount} by strict checking)`);
    } else {
      onStatusUpdate?.(`Kept all ${finalCount} pieces - everything looked good!`);
    }
    
    return {
      ...gradingResponse,
      relevant_context: filteredContent,
      grading_summary: {
        ...gradingResponse.grading_summary,
        relevant_items: filteredContent.length,
        confidence_score: filteredContent.length > 0 ? gradingResponse.grading_summary.confidence_score * 0.5 : 0.1 // Lower confidence for corrected results
      }
    };
  }
  
  // ✅ CRITICAL: For complex queries, TRUST the backend grader much more
  console.log('🔍 [CONTEXT GRADING] Complex query - trusting backend grader with minimal filtering');
  onStatusUpdate?.('Analyzing AI grading quality - checking each piece...');
  
  const filteredContent = gradingResponse.relevant_context.filter((item, index) => {
    const shortTitle = item.title.substring(0, 50) + (item.title.length > 50 ? '...' : '');
    
    // Only filter out CLEARLY broken content patterns - be much more permissive
    const isObviouslyBroken = 
      item.title.includes('No Subject') ||
      item.title.includes('Unknown Sender') ||
      item.summary?.includes('Unknown Sender') ||
      item.summary?.includes('Snippet: \n\n') ||
      item.relevance_score < 0.1; // Very low threshold - only filter truly bad scores
    
    if (isObviouslyBroken) {
      filteredItems.push({
        title: shortTitle,
        reason: 'Contains broken patterns',
        score: item.relevance_score
      });
      onStatusUpdate?.(`❌ "${shortTitle}" - looks a bit broken`);
      console.log('🔍 [CONTEXT GRADING] Filtering out broken content:', {
        title: item.title,
        reason: 'Contains broken patterns'
      });
      return false;
    }
    
    // ✅ TRUST THE BACKEND: If it made it through backend grading, keep it
    // Remove the harsh 2-item limit and "generic reason" filtering
    keptItems.push({
      title: shortTitle,
      reason: `Backend approved (${(item.relevance_score * 100).toFixed(1)}%)`,
      score: item.relevance_score
    });
    onStatusUpdate?.(`✅ "${shortTitle}" - AI thinks it's good! (${(item.relevance_score * 100).toFixed(1)}%)`);
    return true;
  });
  
  // Enhanced final summary with complete filtering breakdown
  const backendApprovedCount = gradingResponse.relevant_context.length;
  const finalCount = filteredContent.length;
  const backendFilteredCount = originalVectorCount - backendApprovedCount;
  const frontendFilteredCount = backendApprovedCount - finalCount;
  const totalFilteredCount = originalVectorCount - finalCount;
  
  if (frontendFilteredCount > 0) {
    onStatusUpdate?.(`Kept ${finalCount} good pieces, filtered ${totalFilteredCount} total (${backendFilteredCount} by AI, ${frontendFilteredCount} by strict checking)`);
  } else if (backendFilteredCount > 0) {
    onStatusUpdate?.(`Kept all ${finalCount} good pieces (${backendFilteredCount} filtered by AI)`);
  } else {
    onStatusUpdate?.(`Kept all ${finalCount} pieces - everything looked good!`);
  }
  
  console.log('🔍 [CONTEXT GRADING] Applied minimal filtering:', {
    original_vector_count: originalVectorCount,
    backend_approved_count: backendApprovedCount,
    final_count: finalCount,
    backend_filtered_count: backendFilteredCount,
    frontend_filtered_count: frontendFilteredCount,
    total_filtered_count: totalFilteredCount,
    query: queryLower
  });
  
  return {
    ...gradingResponse,
    relevant_context: filteredContent,
    grading_summary: {
      ...gradingResponse.grading_summary,
      relevant_items: filteredContent.length,
      confidence_score: filteredContent.length < gradingResponse.relevant_context.length ? 
        gradingResponse.grading_summary.confidence_score * 0.9 : // Much smaller penalty for corrections
        gradingResponse.grading_summary.confidence_score
    }
  };
}

/**
 * Send a chat message with three-stage processing:
 * 1. Stage 0: Intent analysis - determine if query needs context
 * 2. Stage 1A: Vector search (ONLY if needed) + context grading
 * 3. Stage 2: Chat generation with or without context
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
    throw new AuthenticationError('We need to verify your account to continue your creative journey. Please sign in again!');
  }

  console.log('🐛 [DEBUG] Got API key, length:', apiKey.length);

  // Get user ID directly from Firebase/cookies (much simpler!)
  const { getCurrentUserId } = await import('@/app/lib/api-helpers');
  const userId = await getCurrentUserId();
  
  console.log('🐛 [DEBUG] Got user ID directly:', userId);

  // STAGE 0: Intent Analysis - determine if query needs context
  let intentAnalysis: IntentAnalysisResponse | null = null;
  let needsContext = true; // Default to true if intent analysis fails (safe fallback)
  
  if (userId && useContextSearch) {
    console.log('🐛 [DEBUG] STARTING STAGE 0: Intent analysis');
    
    try {
      intentAnalysis = await analyzeQueryIntent(content, onStatusUpdate);
      
      if (intentAnalysis) {
        needsContext = intentAnalysis.needs_context;
        console.log('🐛 [DEBUG] Intent analysis SUCCESS:', {
          needs_context: needsContext,
          confidence_score: intentAnalysis.confidence_score,
          reasoning: intentAnalysis.reasoning
        });
      } else {
        console.log('🐛 [DEBUG] Intent analysis FAILED, trying heuristic fallback');
        
        // ✅ FALLBACK: Use simple heuristic when backend fails
        intentAnalysis = simpleIntentHeuristic(content);
        needsContext = intentAnalysis.needs_context;
        
        console.log('🐛 [DEBUG] Heuristic fallback result:', {
          needs_context: needsContext,
          confidence_score: intentAnalysis.confidence_score,
          reasoning: intentAnalysis.reasoning
        });
        
        if (!needsContext) {
          onStatusUpdate?.(getRandomStatusMessage('skip_simple_query'));
        }
      }
    } catch (error) {
      console.error('🐛 [DEBUG] Intent analysis ERROR:', error);
      
      // ✅ FALLBACK: Use simple heuristic when backend fails
      console.log('🐛 [DEBUG] Using heuristic fallback due to error');
      intentAnalysis = simpleIntentHeuristic(content);
      needsContext = intentAnalysis.needs_context;
      
      console.log('🐛 [DEBUG] Heuristic fallback result:', {
        needs_context: needsContext,
        confidence_score: intentAnalysis.confidence_score,
        reasoning: intentAnalysis.reasoning
      });
      
      if (!needsContext) {
        onStatusUpdate?.(getRandomStatusMessage('skip_simple_query'));
      }
    }
  } else {
    console.log('🐛 [DEBUG] SKIPPING STAGE 0 - conditions not met:', {
      reason: !userId ? 'No user ID' : !useContextSearch ? 'Context search disabled' : 'Unknown'
    });
  }

  // STAGE 1: Vector search + context grading (✅ ONLY if intent analysis says we need context)
  let vectorSearchResults: VectorSearchResponse | null = null;
  let gradedContext: ContextGradingResponse | null = null;
  
  console.log('🐛 [DEBUG] Vector search decision check:', {
    hasUserId: !!userId,
    userId: userId,
    hasContextInjection: !!hasContextInjection,
    useContextSearch: useContextSearch,
    needsContext: needsContext,
    shouldPerformSearch: !!(userId && useContextSearch && needsContext), // ✅ CRITICAL: Only search if needsContext is true
    intentAnalysisResult: intentAnalysis ? 'success' : 'failed_or_null'
  });
  
  // ✅ CRITICAL FIX: Only perform vector search if intent analysis says we need context
  if (userId && useContextSearch && needsContext) {
    console.log('🐛 [DEBUG] ✅ STARTING STAGE 1: Vector search + context grading (intent analysis says context needed)');
    
    // Step 1A: Vector search (searchRelevantContent handles its own status updates)
    const searchLimit = hasContextInjection ? 1 : 10;
    console.log('🐛 [DEBUG] Vector search limit:', searchLimit, 'due to hasContextInjection:', !!hasContextInjection);
    
    vectorSearchResults = await searchRelevantContent(content, userId, onStatusUpdate, searchLimit);
    
    console.log('🐛 [DEBUG] Vector search completed, results:', {
      hasResults: !!vectorSearchResults,
      hasContext: !!(vectorSearchResults && vectorSearchResults.context),
      itemCount: vectorSearchResults?.relevantContent?.length || 0
    });

    // Step 1B: Context grading (gradeContextRelevance handles its own status updates)
    if (vectorSearchResults?.relevantContent?.length > 0) {
      // Convert vector search results to the expected format for grading
      const vectorResultsForGrading: VectorSearchResult[] = vectorSearchResults.relevantContent.map(item => ({
        title: item.title,
        contentType: item.contentType,
        content: item.summary || '', // Now item.summary contains the actual content
        score: item.score,
        _id: `${item.contentType}-${item.title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`
      }));
      
      console.log('🐛 [DEBUG] Vector results for grading:', {
        count: vectorResultsForGrading.length,
        sampleContent: vectorResultsForGrading[0]?.content?.substring(0, 100) + '...',
        allHaveContent: vectorResultsForGrading.every(item => item.content.length > 0)
      });
      
      gradedContext = await gradeContextRelevance(
        content,
        vectorResultsForGrading,
        onStatusUpdate
      );
      
      // If grading failed, fall back to using all vector search results
      if (!gradedContext) {
        console.log('🐛 [DEBUG] Context grading failed, using all vector search results');
        onStatusUpdate?.(getRandomStatusMessage('fallback'));
      }
    }
  } else {
    // ✅ CRITICAL: Log why we're skipping vector search
    const skipReason = !userId ? 'No user ID' : 
                      !useContextSearch ? 'Context search disabled' : 
                      !needsContext ? 'Intent analysis determined query does not need context' : 'Unknown';
    
    console.log('🐛 [DEBUG] ⚡ SKIPPING STAGE 1 - Vector search not needed:', {
      reason: skipReason,
      needsContext: needsContext,
      intentAnalysisPerformed: !!intentAnalysis
    });
    
    if (!needsContext && intentAnalysis) {
      onStatusUpdate?.(`${intentAnalysis.reasoning.toLowerCase().replace(/\./g, '')} - jumping straight to it!`);
    }
  }

  // STAGE 2: Chat generation with or without context
  console.log('🐛 [DEBUG] STARTING STAGE 2: Chat generation');
  onStatusUpdate?.('Generating your response - putting it all together...');

  // Always set is_first_message to true when isFirstMessage is true
  const isFirstMessageBool = isFirstMessage;
  
  const requestBody: any = {
    query: content,
    is_first_message: isFirstMessageBool,
    use_vector_search: useContextSearch && needsContext, // ✅ CRITICAL: Only use vector search if needed
    intent_analysis: intentAnalysis ? {
      needs_context: needsContext,
      confidence_score: intentAnalysis.confidence_score,
      reasoning: intentAnalysis.reasoning
    } : null
  };

  // Add context injection flag to help backend understand the message type
  if (hasContextInjection || gradedContext || vectorSearchResults) {
    requestBody.has_context_injection = true;
    requestBody.context_enhanced = true;
  }

  // ✅ CRITICAL: Different vector search metadata based on whether we actually performed search
  if (needsContext && gradedContext && gradedContext.relevant_context.length > 0) {
    // Use only the relevant context from grading
    const relevantContext = gradedContext.relevant_context.map(item => ({
      title: item.title,
      contentType: item.contentType,
      score: item.relevance_score,
      summary: item.summary,
      relevance_reason: item.relevance_reason
    }));

    // Clean the search query by replacing content IDs with titles (from main)
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
      relevantItemsCount: relevantContext.length,
      searchQuery: cleanSearchQuery,
      context: buildContextString(relevantContext),
      graded: true,
      grading_summary: gradedContext.grading_summary,
      intent_analysis: intentAnalysis,
      // Transform for VectorSearchContext component
      relevantContent: gradedContext.relevant_context.map(item => ({
        title: item.title,
        contentType: item.contentType,
        score: item.relevance_score // Use relevance_score for display
      }))
    };

    console.log('🐛 [DEBUG] Using graded context:', {
      originalCount: gradedContext.grading_summary.total_items,
      relevantCount: gradedContext.grading_summary.relevant_items,
      confidenceScore: gradedContext.grading_summary.confidence_score
    });
  } else if (needsContext && gradedContext && gradedContext.relevant_context.length === 0) {
    // ✅ CRITICAL: Grading succeeded but found no relevant content - respect this decision
    requestBody.vector_search_metadata = {
      foundRelevantContent: false,
      relevantItemsCount: 0,
      searchQuery: content,
      context: '',
      graded: true,
      grading_summary: gradedContext.grading_summary,
      intent_analysis: intentAnalysis,
      vector_search_performed: true,
      no_results_reason: 'Context grading filtered out all content as irrelevant'
    };

    console.log('🐛 [DEBUG] ✅ Grading succeeded but filtered out all content - respecting grading decision:', {
      originalCount: gradedContext.grading_summary.total_items,
      relevantCount: gradedContext.grading_summary.relevant_items,
      confidenceScore: gradedContext.grading_summary.confidence_score
    });
  } else if (needsContext && vectorSearchResults && vectorSearchResults.context) {
    // Fall back to original vector search results ONLY if grading actually failed
    // Clean the search query by replacing content IDs with titles (from main)
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
      searchQuery: cleanSearchQuery,
      context: vectorSearchResults.context,
      graded: false,
      intent_analysis: intentAnalysis,
      // Transform for VectorSearchContext component
      relevantContent: vectorSearchResults.relevantContent.map(item => ({
        title: item.title,
        contentType: item.contentType,
        score: item.score
      }))
    };

    console.log('🐛 [DEBUG] Using original vector search context (grading actually failed)');
  } else if (!needsContext) {
    // ✅ CRITICAL: Query doesn't need context - explicitly set no vector search metadata
    requestBody.vector_search_metadata = {
      foundRelevantContent: false,
      relevantItemsCount: 0,
      searchQuery: content,
      context: '',
      graded: false,
      skipped_reason: intentAnalysis ? intentAnalysis.reasoning : 'Query does not need context from user content',
      intent_analysis: intentAnalysis,
      vector_search_performed: false // ✅ Explicitly indicate no search was performed
    };

    console.log('🐛 [DEBUG] ⚡ Query does not need context - sending empty vector search metadata');
  } else {
    // Fallback case - context was needed but no results found
    requestBody.vector_search_metadata = {
      foundRelevantContent: false,
      relevantItemsCount: 0,
      searchQuery: content,
      context: '',
      graded: false,
      intent_analysis: intentAnalysis,
      vector_search_performed: true,
      no_results_reason: 'Vector search performed but no relevant content found'
    };

    console.log('🐛 [DEBUG] Context was needed but no relevant results found');
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
    requestBody.session_id = null;
    console.log('Sending first message - session_id set to null for new conversation');
  } else if (sessionId) {
    requestBody.session_id = sessionId;
    console.log('Continuing existing conversation - session_id set to:', sessionId);
  } else {
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

    // Handle both old ContentContext format and new Zustand store format
    if (contentContext.convexData) {
      // New Zustand store format with full Convex data
      const convexData = contentContext.convexData;
      
      requestBody.content_context = {
        platform: contentContext.platform,
        content_id: contentContext.contentId,
        title: contentContext.title,
        analysis: contentContext.analysis,
        thumbnail_url: contentContext.thumbnailUrl,
        published_at: contentContext.publishedAt,
        metrics: contentContext.metrics,
        content: contentContext.content,
        convex_data: convexData
      };
    } else {
      // Legacy ContentContext format
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

  // Log the request details with better debugging
  console.log('📤 SENDING MESSAGE TO BACKEND (Stage 2):', {
    is_first_message: requestBody.is_first_message,
    session_id: requestBody.session_id,
    current_session_id: sessionId,
    expected_behavior: isFirstMessageBool ? 'CREATE_NEW_CONVERSATION' : 'CONTINUE_EXISTING_CONVERSATION',
    has_content_context: !!contentContext,
    has_vector_search_context: !!requestBody.vector_search_metadata,
    vector_search_items: requestBody.vector_search_metadata?.relevantItemsCount || 0,
    context_was_graded: requestBody.vector_search_metadata?.graded || false,
    needs_context: needsContext,
    intent_analysis_included: !!requestBody.intent_analysis,
    vector_search_performed: needsContext, // ✅ Log whether vector search was actually performed
    skip_reason: !needsContext ? (intentAnalysis?.reasoning || 'No intent analysis') : null,
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

  // Make the final request to the backend
  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody)
  });

  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError('Your session has timed out. Please refresh the page to continue your creative work!');
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.message || 'We hit a creative block while sending your message. Your work is safe - please try again in a moment!';
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Log the response with better debugging
  console.log('📥 RECEIVED RESPONSE FROM BACKEND (Stage 2):', {
    session_id_returned: data.session_id,
    response_length: data.chat_response?.length,
    conversation_context: isFirstMessageBool ? 'NEW' : 'EXISTING',
    session_id_changed: sessionId !== data.session_id,
    response_preview: data.chat_response?.substring(0, 100) + '...',
    used_graded_context: requestBody.vector_search_metadata?.graded || false,
    intent_analysis_performed: !!intentAnalysis,
    needs_context: needsContext,
    vector_search_was_skipped: !needsContext // ✅ Log if vector search was skipped
  });

  return data;
}

/**
 * DEBUG: Test the enhanced search components individually
 */
export async function debugEnhancedSearch(
  userId: string,
  testStep: 'platform' | 'embedding' | 'similarity' | 'full' = 'full'
): Promise<any> {
  try {
    console.log('🐛 [DEBUG TEST] Testing enhanced search component:', testStep);
    
    const result = await convex.action(api.vectorSearch.debugHybridSearchWithQuotas, {
      userId,
      query: 'test query for debugging',
      testStep
    });
    
    console.log('🐛 [DEBUG TEST] Result:', result);
    return result;
  } catch (error) {
    console.error('🐛 [DEBUG TEST] Error:', error);
    throw error;
  }
}

// Helper function to build context string from relevant items
function buildContextString(relevantItems: Array<{
  title: string;
  contentType: string;
  score: number;
  summary?: string;
  relevance_reason?: string;
}>): string {
  return relevantItems.map(item => 
    `${item.contentType}: "${item.title}"\n${item.summary || ''}\n(Relevance: ${item.relevance_reason || 'N/A'})`
  ).join('\n\n');
}

/**
 * Load conversation by ID
 */
export async function loadConversation(id: string) {
  try {
    // Get API key for authentication - same pattern as sendChatMessage
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new AuthenticationError('We need to verify your account to continue your creative journey. Please sign in again!');
    }

    const response = await fetch(`/api/chat/conversation/${id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorMessage = `We couldn't load this conversation (${response.status}). Your creative work is safe - please try refreshing the page!`;
    throw new Error(errorMessage);
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
    console.warn(`We're having trouble checking your ${platform} content. Don't worry, we're on it!`);
    return { 
      hasEmbeddings: false, 
      count: 0
    };
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
    // Don't show error to user for background checks
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
      message: `We couldn't clear your content index. Don't worry, your data is safe! Please try again or contact support if this continues.`
    };
  }
}
