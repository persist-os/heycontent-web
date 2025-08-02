// @ts-nocheck
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

/**
 * Embedding sync that runs on user heartbeat
 * This replaces the complex queue system with a straightforward approach
 */
export const syncEmbeddingsOnHeartbeat = action({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    console.log('💓 [EMBEDDING] Starting heartbeat sync for user:', userId);

    const results = {
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [] as string[]
    };

    try {
      // 1. Get all existing embeddings for this user
      const existingEmbeddings = await ctx.runQuery(api.vectorSearch.getUserEmbeddings, {
        userId,
        limit: 2000
      });

      const existingEmbeddingIds = new Set(existingEmbeddings.map(e => e.contentId));
      
      // 2. Check each content type and sync embeddings
      
      // Notes
      const notesResult = await ctx.runQuery(api.noteQueries.getUserNotes, { userId, numItems: 1000 });
      const notes = notesResult.page || [];
      for (const note of notes) {
        const contentId = `notes:${note._id}`;
        if (!existingEmbeddingIds.has(contentId)) {
          // Create new embedding
          try {
            await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
              userId,
              contentId,
              contentType: 'note',
              title: note.title || 'Untitled Note',
              content: note.content || '',
              triggerType: 'automatic_update',
              platform: 'notes'
            });
            results.created++;
          } catch (error) {
            results.errors.push(`Failed to create note embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Conversations
      const conversations = await ctx.runQuery(api.chatQueries.getHistory, { userId, limit: 1000 });
      for (const conv of conversations) {
        const contentId = `conversations:${conv._id}`;
        if (!existingEmbeddingIds.has(contentId)) {
          try {
            const messageContent = conv.messages
              .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
              .map((m: any) => `${m.role || 'unknown'}: ${m.content}`)
              .join('\n');
            
            const searchableContent = `${conv.title}\n\n${messageContent}`;
            
            await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
              userId,
              contentId,
              contentType: 'conversation',
              title: conv.title || 'Conversation',
              content: searchableContent,
              triggerType: 'automatic_update',
              platform: 'conversations'
            });
            results.created++;
          } catch (error) {
            results.errors.push(`Failed to create conversation embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Instagram Posts
      const instagramPosts = await ctx.runQuery(api.instagramQueries.getAllInstagramPosts, { userId });
      for (const post of instagramPosts) {
        const contentId = `instagram:${post.postId}`;
        if (!existingEmbeddingIds.has(contentId)) {
          try {
            const content = post.data?.caption || post.title || 'Instagram Post';
            await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
              userId,
              contentId,
              contentType: 'instagram_post',
              title: post.title || 'Instagram Post',
              content: content,
              triggerType: 'automatic_update',
              platform: 'instagram'
            });
            results.created++;
          } catch (error) {
            results.errors.push(`Failed to create Instagram embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // YouTube Videos
      const youtubeResult = await ctx.runQuery(api.youtubeQueries.getYouTubeVideos, { userId, limit: 1000 });
      const youtubeVideos = youtubeResult.videos || youtubeResult.page || [];
      for (const video of youtubeVideos) {
        const contentId = `youtube:${video.videoId}`;
        if (!existingEmbeddingIds.has(contentId)) {
          try {
            const content = (video.snippet?.title || 'YouTube Video') + '\n\n' + (video.snippet?.description || '');
            await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
              userId,
              contentId,
              contentType: 'youtube_video',
              title: video.snippet?.title || 'YouTube Video',
              content: content,
              triggerType: 'automatic_update',
              platform: 'youtube'
            });
            results.created++;
          } catch (error) {
            results.errors.push(`Failed to create YouTube embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Gmail Threads
      const gmailResult = await ctx.runQuery(api.gmailQueries.getGmailThreadsPaginated, { 
        userId, 
        paginationOpts: { numItems: 1000, cursor: null }
      });
      const gmailThreads = gmailResult.page || [];
      for (const thread of gmailThreads) {
        const contentId = `gmail:${thread.threadId}`;
        if (!existingEmbeddingIds.has(contentId)) {
          try {
            const content = (thread.subject || thread.data?.subject || 'No Subject') + '\n\n' + (thread.snippet || thread.data?.snippet || '');
            await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
              userId,
              contentId,
              contentType: 'gmail_thread',
              title: thread.subject || thread.data?.subject || 'Gmail Thread',
              content: content,
              triggerType: 'automatic_update',
              platform: 'gmail'
            });
            results.created++;
          } catch (error) {
            results.errors.push(`Failed to create Gmail embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // 3. Clean up orphaned embeddings (embeddings without corresponding content)
      const allContentIds = new Set([
        ...notes.map(n => `notes:${n._id}`),
        ...conversations.map(c => `conversations:${c._id}`),
        ...instagramPosts.map(p => `instagram:${p.postId}`),
        ...youtubeVideos.map(v => `youtube:${v.videoId}`),
        ...gmailThreads.map(t => `gmail:${t.threadId}`)
      ]);

      for (const embedding of existingEmbeddings) {
        if (!allContentIds.has(embedding.contentId)) {
          try {
            await ctx.runMutation(api.vectorSearch.deleteEmbedding, {
              userId,
              contentId: embedding.contentId
            });
            results.deleted++;
          } catch (error) {
            results.errors.push(`Failed to delete orphaned embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      console.log('✅ [EMBEDDING] Heartbeat sync completed:', results);
      return { success: true, ...results };

    } catch (error) {
      console.error('❌ [EMBEDDING] Error during heartbeat sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * User heartbeat that triggers embedding sync
 */
export const userHeartbeat = action({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    console.log('💓 [HEARTBEAT] User heartbeat triggered:', userId);

    try {
      // Run the embedding sync
      const syncResult = await ctx.runAction(api.embeddingSystem.syncEmbeddingsOnHeartbeat, {
        userId
      });

      return {
        success: true,
        timestamp: Date.now(),
        syncResult
      };
    } catch (error) {
      console.error('❌ [HEARTBEAT] Error during heartbeat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}); 