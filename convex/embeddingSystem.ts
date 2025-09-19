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
      const existingEmbeddings = await ctx.runQuery(api.vectorSearchQueries.getUserEmbeddings, {
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
            // Skip notes with empty content
            const noteContent = note.content || '';
            if (!noteContent.trim()) {
              console.warn('⚠️ [EMBEDDING] Skipping note with empty content:', note._id);
              results.errors.push(`Skipped note with empty content: ${note._id}`);
              continue;
            }
            
            await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
              userId,
              contentId,
              contentType: 'note',
              title: note.title || 'Untitled Note',
              content: noteContent,
              triggerType: 'automatic_update'
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
            
            // Skip conversations with empty content
            if (!searchableContent || !searchableContent.trim()) {
              console.warn('⚠️ [EMBEDDING] Skipping conversation with empty content:', conv._id);
              results.errors.push(`Skipped conversation with empty content: ${conv._id}`);
              continue;
            }
            
            await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
              userId,
              contentId,
              contentType: 'conversation',
              title: conv.title || 'Conversation',
              content: searchableContent,
              triggerType: 'automatic_update'
            });
            results.created++;
          } catch (error) {
            results.errors.push(`Failed to create conversation embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Crystal Shards
      let crystalShards = [];
      try {
        crystalShards = await ctx.runQuery(api.crystalQueries.getCrystalData, { 
          userId,
          table: 'crystal_shards',
          limit: 1000
        });
      } catch (error) {
        console.warn('⚠️ [EMBEDDING] Failed to fetch crystal shards:', error);
        results.errors.push(`Failed to fetch crystal shards: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      for (const shard of crystalShards) {
        const contentId = `crystal_shards:${shard._id}`;
        if (!existingEmbeddingIds.has(contentId)) {
          try {
            // Create content from shard data
            const shardContent = [
              shard.exact_quote || '',
              shard.what_it_reveals || '',
              shard.situation_context || '',
              shard.why_significant || ''
            ].filter(text => text && text.trim()).join('\n');
            
            // Skip shards with empty content
            if (!shardContent.trim()) {
              console.warn('⚠️ [EMBEDDING] Skipping crystal shard with empty content:', shard._id);
              results.errors.push(`Skipped crystal shard with empty content: ${shard._id}`);
              continue;
            }
            
            const title = shard.dimension ? 
              `Crystal Shard: ${shard.dimension}` : 
              `Crystal Shard: ${shard._id}`;
            
            await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
              userId,
              contentId,
              contentType: 'crystal_shard',
              title,
              content: shardContent,
              triggerType: 'automatic_update'
            });
            results.created++;
          } catch (error) {
            results.errors.push(`Failed to create crystal shard embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // 3. Clean up orphaned embeddings (embeddings without corresponding content)
      const allContentIds = new Set([
        ...notes.map(n => `notes:${n._id}`),
        ...conversations.map(c => `conversations:${c._id}`),
        ...crystalShards.map(s => `crystal_shards:${s._id}`)
      ]);

      for (const embedding of existingEmbeddings) {
        if (!allContentIds.has(embedding.contentId)) {
          try {
            await ctx.runMutation(api.vectorSearchMutations.deleteEmbedding, {
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
      // Always return success: false but don't throw - this prevents the error from propagating
      return {
        success: false,
        created: 0,
        updated: 0,
        deleted: 0,
        errors: [`Embedding sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
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

    // Always return success - don't let embedding sync failures affect the heartbeat
    try {
      // Run the embedding sync in the background
      const syncResult = await ctx.runAction(api.embeddingSystem.syncEmbeddingsOnHeartbeat, {
        userId
      });

      return {
        success: true,
        timestamp: Date.now(),
        syncResult
      };
    } catch (error) {
      console.error('⚠️ [HEARTBEAT] Embedding sync failed during heartbeat for user:', userId, error);
      // Return success anyway - heartbeat should never fail due to embedding issues
      return {
        success: true,
        timestamp: Date.now(),
        syncResult: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}); 