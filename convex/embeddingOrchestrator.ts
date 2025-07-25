import { action, mutation, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { UnifiedPlatformContent, PlatformType, ContentType, parsePlatformId } from "./platformRouter";

// Trigger types for embedding updates
export type EmbeddingTriggerType = 
  | 'content_created'
  | 'content_updated'  
  | 'content_deleted'
  | 'platform_connected'
  | 'platform_refreshed'
  | 'webhook_update'
  | 'manual_trigger';

/**
 * Main orchestrator for all embedding operations
 * This is the single entry point for embedding management
 */
export const orchestrateEmbeddingUpdate = action({
  args: {
    userId: v.string(),
    trigger: v.union(
      v.literal('content_created'),
      v.literal('content_updated'),
      v.literal('content_deleted'),
      v.literal('platform_connected'),
      v.literal('platform_refreshed'),
      v.literal('webhook_update'),
      v.literal('manual_trigger')
    ),
    contentId: v.optional(v.string()), // Standardized platform:actualId format
    platform: v.optional(v.union(
      v.literal('youtube'),
      v.literal('instagram'),
      v.literal('gmail'),
      v.literal('notes'),
      v.literal('conversations'),
      v.literal('insights')
    )),
    // For batch operations
    contentIds: v.optional(v.array(v.string())),
    // Additional context
    metadata: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const { userId, trigger, contentId, platform, contentIds, metadata } = args;
    
    console.log('🤖 [EMBEDDING ORCHESTRATOR] Processing embedding update:', {
      userId,
      trigger,
      contentId,
      platform,
      batchSize: contentIds?.length || 0,
      metadata: !!metadata,
      timestamp: new Date().toISOString()
    });

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      switch (trigger) {
        case 'content_created':
        case 'content_updated':
          if (contentId) {
            console.log(`🎯 [EMBEDDING ORCHESTRATOR] Processing ${trigger} for content:`, contentId);
            const result = await ctx.runAction(internal.embeddingOrchestrator.processSingleContentEmbedding, {
              userId,
              contentId,
              trigger,
              metadata
            });
            results.processed = 1;
            if (result.success) {
              results.succeeded = 1;
              console.log('✅ [EMBEDDING ORCHESTRATOR] Successfully processed content:', contentId);
            } else {
              results.failed = 1;
              results.errors.push(result.error || 'Unknown error');
              console.error('❌ [EMBEDDING ORCHESTRATOR] Failed to process content:', {
                contentId,
                error: result.error
              });
            }
          } else {
            console.warn('⚠️ [EMBEDDING ORCHESTRATOR] No contentId provided for trigger:', trigger);
          }
          break;

        case 'content_deleted':
          if (contentId) {
            const result = await ctx.runAction(internal.embeddingOrchestrator.deleteContentEmbedding, {
              userId,
              contentId
            });
            results.processed = 1;
            if (result.success) {
              results.succeeded = 1;
            } else {
              results.failed = 1;
              results.errors.push(result.error || 'Unknown error');
            }
          }
          break;
          
        case 'platform_connected':
        case 'platform_refreshed':
          if (platform) {
            const result = await ctx.runAction(internal.embeddingOrchestrator.processPlatformEmbeddings, {
              userId,
              platform,
              trigger,
              isFullRefresh: trigger === 'platform_refreshed'
            });
            results.processed = result.processed;
            results.succeeded = result.succeeded;
            results.failed = result.failed;
            results.errors.push(...result.errors);
          }
          break;
          
        case 'webhook_update':
          if (contentIds && contentIds.length > 0) {
            const result = await ctx.runAction(internal.embeddingOrchestrator.processBatchEmbeddings, {
              userId,
              contentIds,
              trigger,
              metadata
            });
            results.processed = result.processed;
            results.succeeded = result.succeeded;
            results.failed = result.failed;
            results.errors.push(...result.errors);
          }
          break;
          
        case 'manual_trigger':
          // Handle manual embedding generation for all content or specific platform
          if (platform) {
            const result = await ctx.runAction(internal.embeddingOrchestrator.processPlatformEmbeddings, {
              userId,
              platform,
              trigger,
              isFullRefresh: true
            });
            results.processed = result.processed;
            results.succeeded = result.succeeded;
            results.failed = result.failed;
            results.errors.push(...result.errors);
          } else {
            // Process all platforms
            const platforms: PlatformType[] = ['notes', 'conversations', 'youtube', 'instagram', 'gmail', 'insights'];
            for (const plt of platforms) {
              try {
                const result = await ctx.runAction(internal.embeddingOrchestrator.processPlatformEmbeddings, {
                  userId,
                  platform: plt,
                  trigger,
                  isFullRefresh: true
                });
                results.processed += result.processed;
                results.succeeded += result.succeeded;
                results.failed += result.failed;
                results.errors.push(...result.errors);
              } catch (error) {
                console.error(`Error processing ${plt} embeddings:`, error);
                results.errors.push(`${plt}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
          break;
      }

      // Record the embedding operation
      await ctx.runMutation(internal.embeddingOrchestrator.recordEmbeddingOperation, {
        userId,
        trigger,
        platform,
        contentId,
        itemsProcessed: results.processed,
        itemsSucceeded: results.succeeded,
        itemsFailed: results.failed,
        metadata
      });

      console.log('✅ [EMBEDDING ORCHESTRATOR] Completed embedding update:', results);
      return results;

    } catch (error) {
      console.error('❌ [EMBEDDING ORCHESTRATOR] Fatal error:', error);
      
      // Record the failed operation
      await ctx.runMutation(internal.embeddingOrchestrator.recordEmbeddingOperation, {
        userId,
        trigger,
        platform,
        contentId,
        itemsProcessed: 0,
        itemsSucceeded: 0,
        itemsFailed: 1,
        metadata: { ...metadata, error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return {
        processed: 0,
        succeeded: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
});

/**
 * Process embedding for a single piece of content
 */
export const processSingleContentEmbedding = internalAction({
  args: {
    userId: v.string(),
    contentId: v.string(),
    trigger: v.union(
      v.literal('content_created'),
      v.literal('content_updated'),
      v.literal('webhook_update')
    ),
    metadata: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const { userId, contentId, trigger } = args;
    
    console.log('🎯 [EMBEDDING PROCESSOR] Processing single content embedding:', {
      userId,
      contentId,
      trigger,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Get unified content using the platform router
      console.log('🔍 [EMBEDDING PROCESSOR] Fetching content using platform router...');
      const content = await ctx.runQuery(api.platformRouter.getUnifiedContentById, {
        userId,
        contentId
      });

      if (!content) {
        console.error('❌ [EMBEDDING PROCESSOR] Content not found by platform router:', {
          userId,
          contentId,
          trigger
        });
        return { success: false, error: `Content not found: ${contentId}` };
      }
      
      console.log('✅ [EMBEDDING PROCESSOR] Content found:', {
        contentId: content.id,
        platform: content.platform,
        contentType: content.contentType,
        title: content.title.substring(0, 50) + '...',
        contentLength: content.content.length
      });

      // Create/update embedding using existing vectorSearch system
      console.log('🤖 [EMBEDDING PROCESSOR] Creating embedding via vectorSearch...');
      await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
        userId,
        contentId: content.id,
        contentType: mapContentTypeToVectorSearchType(content.contentType),
        title: content.title,
        content: content.content,
        triggerType: mapTriggerType(trigger),
        platform: content.platform === 'conversations' ? 'conversations' as const : 
                 content.platform === 'notes' ? 'notes' as const :
                 content.platform as 'instagram' | 'youtube' | 'gmail'
      });

      console.log('✅ [EMBEDDING PROCESSOR] Successfully processed embedding for:', contentId);
      return { success: true };
    } catch (error) {
      console.error('❌ [EMBEDDING PROCESSOR] Error processing single content embedding:', error);
      console.error('❌ [EMBEDDING PROCESSOR] Error details:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        contentId,
        trigger
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
});

/**
 * Delete embedding for deleted content
 */
export const deleteContentEmbedding = internalAction({
  args: {
    userId: v.string(),
    contentId: v.string()
  },
  handler: async (ctx, args) => {
    const { userId, contentId } = args;
    
    try {
      // Delete the embedding from the contentEmbeddings table
      const embedding = await ctx.runQuery(api.vectorSearch.getUserEmbeddings, {
        userId,
        limit: 1000 // Get all to find the right one
      });

      const targetEmbedding = embedding.find(e => e.contentId === contentId);
      if (targetEmbedding) {
        await ctx.runMutation(internal.embeddingOrchestrator.deleteEmbeddingById, {
          embeddingId: targetEmbedding._id
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting content embedding:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
});

/**
 * Process embeddings for all content in a platform
 */
export const processPlatformEmbeddings = internalAction({
  args: {
    userId: v.string(),
    platform: v.union(
      v.literal('youtube'),
      v.literal('instagram'),
      v.literal('gmail'),
      v.literal('notes'),
      v.literal('conversations'),
      v.literal('insights')
    ),
    trigger: v.union(
      v.literal('platform_connected'),
      v.literal('platform_refreshed'),
      v.literal('manual_trigger')
    ),
    isFullRefresh: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const { userId, platform, trigger, isFullRefresh } = args;
    
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Get all content for the platform using unified platform router
      const platformContent = await ctx.runQuery(api.platformRouter.getAllUnifiedContent, {
        userId,
        platforms: [platform],
        limit: 1000 // Process up to 1000 items per platform
      });

      console.log(`🤖 [EMBEDDING ORCHESTRATOR] Processing ${platformContent.length} items for platform: ${platform}`);

      for (const content of platformContent) {
        results.processed++;
        
        try {
          // Check if embedding already exists (for efficiency)
          if (!isFullRefresh) {
            const existingEmbeddings = await ctx.runQuery(api.vectorSearch.getUserEmbeddings, {
              userId,
              limit: 1
            });
            
            const hasEmbedding = existingEmbeddings.some(e => e.contentId === content.id);
            if (hasEmbedding) {
              // Skip if embedding already exists and this isn't a full refresh
              results.succeeded++;
              continue;
            }
          }

          // Create/update embedding
          await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
            userId,
            contentId: content.id,
            contentType: mapContentTypeToVectorSearchType(content.contentType),
            title: content.title,
            content: content.content,
            triggerType: mapTriggerType(trigger),
            platform: content.platform === 'conversations' ? 'conversations' as const : 
                     content.platform === 'notes' ? 'notes' as const :
                     content.platform as 'instagram' | 'youtube' | 'gmail'
          });

          results.succeeded++;
          
        } catch (error) {
          results.failed++;
          const errorMsg = `Failed to embed ${content.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return results;
    } catch (error) {
      console.error(`Error processing ${platform} embeddings:`, error);
      return {
        processed: 0,
        succeeded: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
});

/**
 * Process embeddings for multiple content IDs (batch operation)
 */
export const processBatchEmbeddings = internalAction({
  args: {
    userId: v.string(),
    contentIds: v.array(v.string()),
    trigger: v.union(
      v.literal('webhook_update'),
      v.literal('content_updated')
    ),
    metadata: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const { userId, contentIds, trigger } = args;
    
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const contentId of contentIds) {
      results.processed++;
      
      try {
        const result = await ctx.runAction(internal.embeddingOrchestrator.processSingleContentEmbedding, {
          userId,
          contentId,
          trigger,
          metadata: args.metadata
        });

        if (result.success) {
          results.succeeded++;
        } else {
          results.failed++;
          results.errors.push(result.error || 'Unknown error');
        }
      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to process ${contentId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return results;
  }
});

/**
 * Webhook handlers for automatic embedding updates
 */

// Instagram webhook handler
export const handleInstagramWebhook = action({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    eventType: v.string(),
    eventData: v.any()
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, eventType, eventData } = args;
    
    console.log('📲 [WEBHOOK] Instagram webhook received:', {
      userId,
      eventType,
      accountId: instagramAccountId
    });

    try {
      // Store the webhook event
      await ctx.runMutation(api.instagramMutations.storeInstagramWebhookEvent, {
        userId,
        instagramAccountId,
        eventType,
        eventData,
        timestamp: Date.now()
      });

      // Determine affected content IDs
      const affectedContentIds: string[] = [];
      
      if (eventType === 'posts' && eventData.entry) {
        for (const entry of eventData.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.value && change.value.id) {
                // Standardize Instagram post ID
                affectedContentIds.push(`instagram:${change.value.id}`);
              }
            }
          }
        }
      }

      // Trigger embedding updates for affected content
      if (affectedContentIds.length > 0) {
        await ctx.runAction(api.embeddingOrchestrator.orchestrateEmbeddingUpdate, {
          userId,
          trigger: 'webhook_update',
          platform: 'instagram',
          contentIds: affectedContentIds,
          metadata: { eventType, accountId: instagramAccountId }
        });
      }

      return { success: true, processedItems: affectedContentIds.length };
    } catch (error) {
      console.error('Error handling Instagram webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
});

// YouTube webhook handler (for when YouTube implements webhooks)
export const handleYouTubeWebhook = action({
  args: {
    userId: v.string(),
    channelId: v.string(),
    eventType: v.string(),
    eventData: v.any()
  },
  handler: async (ctx, args) => {
    const { userId, channelId, eventType, eventData } = args;
    
    console.log('📲 [WEBHOOK] YouTube webhook received:', {
      userId,
      eventType,
      channelId
    });

    try {
      // Determine affected video IDs
      const affectedContentIds: string[] = [];
      
      if (eventData.videoId) {
        affectedContentIds.push(`youtube:${eventData.videoId}`);
      }

      // Trigger embedding updates
      if (affectedContentIds.length > 0) {
        await ctx.runAction(api.embeddingOrchestrator.orchestrateEmbeddingUpdate, {
          userId,
          trigger: 'webhook_update',
          platform: 'youtube',
          contentIds: affectedContentIds,
          metadata: { eventType, channelId }
        });
      }

      return { success: true, processedItems: affectedContentIds.length };
    } catch (error) {
      console.error('Error handling YouTube webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
});

// Gmail webhook handler (for when Gmail push notifications are implemented)
export const handleGmailWebhook = action({
  args: {
    userId: v.string(),
    emailAddress: v.string(),
    eventType: v.string(),
    eventData: v.any()
  },
  handler: async (ctx, args) => {
    const { userId, emailAddress, eventType, eventData } = args;
    
    console.log('📲 [WEBHOOK] Gmail webhook received:', {
      userId,
      eventType,
      emailAddress
    });

    try {
      // Determine affected thread IDs
      const affectedContentIds: string[] = [];
      
      if (eventData.threadId) {
        affectedContentIds.push(`gmail:${eventData.threadId}`);
      }

      // Trigger embedding updates
      if (affectedContentIds.length > 0) {
        await ctx.runAction(api.embeddingOrchestrator.orchestrateEmbeddingUpdate, {
          userId,
          trigger: 'webhook_update',
          platform: 'gmail',
          contentIds: affectedContentIds,
          metadata: { eventType, emailAddress }
        });
      }

      return { success: true, processedItems: affectedContentIds.length };
    } catch (error) {
      console.error('Error handling Gmail webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
});

/**
 * Helper functions
 */

function mapContentTypeToVectorSearchType(contentType: ContentType): "conversation" | "instagram_post" | "youtube_video" | "gmail_thread" | "note" {
  switch (contentType) {
    case 'conversation':
      return 'conversation';
    case 'instagram_post':
      return 'instagram_post';
    case 'youtube_video':
      return 'youtube_video';
    case 'gmail_thread':
      return 'gmail_thread';
    case 'note':
      return 'note';
    case 'insight':
      return 'note'; // Treat insights as notes for embedding purposes
    default:
      return 'note';
  }
}

function mapTriggerType(trigger: EmbeddingTriggerType): "content_update" | "platform_connection" | "automatic_update" {
  switch (trigger) {
    case 'content_created':
    case 'content_updated':
      return 'content_update';
    case 'platform_connected':
      return 'platform_connection';
    case 'webhook_update':
    case 'platform_refreshed':
    case 'manual_trigger':
      return 'automatic_update';
    default:
      return 'automatic_update';
  }
}

/**
 * Internal mutations
 */

export const recordEmbeddingOperation = internalMutation({
  args: {
    userId: v.string(),
    trigger: v.union(
      v.literal('content_created'),
      v.literal('content_updated'),
      v.literal('content_deleted'),
      v.literal('platform_connected'),
      v.literal('platform_refreshed'),
      v.literal('webhook_update'),
      v.literal('manual_trigger')
    ),
    platform: v.optional(v.union(
      v.literal('youtube'),
      v.literal('instagram'),
      v.literal('gmail'),
      v.literal('notes'),
      v.literal('conversations'),
      v.literal('insights')
    )),
    contentId: v.optional(v.string()),
    itemsProcessed: v.number(),
    itemsSucceeded: v.number(),
    itemsFailed: v.number(),
    metadata: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("embeddingUpdates", {
      userId: args.userId,
      updatedAt: Date.now(),
      type: args.trigger === 'content_created' || args.trigger === 'content_updated' || args.trigger === 'content_deleted' 
            ? 'content_update' 
            : args.trigger === 'platform_connected' 
            ? 'platform_connection' 
            : 'automatic_update',
      platform: args.platform,
      contentId: args.contentId,
      itemsProcessed: args.itemsProcessed,
      itemsSucceeded: args.itemsSucceeded,
      itemsFailed: args.itemsFailed,
    });
  }
});

export const deleteEmbeddingById = internalMutation({
  args: {
    embeddingId: v.id("contentEmbeddings")
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.embeddingId);
  }
}); 

/**
 * Test function to manually create embedding for a specific note (for debugging)
 */
export const testNoteEmbedding = action({
  args: {
    userId: v.string(),
    noteId: v.string() // Raw note ID without prefix
  },
  handler: async (ctx, args) => {
    const { userId, noteId } = args;
    const contentId = `notes:${noteId}`;
    
    console.log('🧪 [TEST EMBEDDING] Testing note embedding creation:', {
      userId,
      noteId,
      contentId,
      timestamp: new Date().toISOString()
    });

    try {
      // First, let's check if the note exists in the database
      const note = await ctx.runQuery(api.notes.getNote, { noteId, userId });
      
      console.log('🧪 [TEST EMBEDDING] Note existence check:', {
        noteExists: !!note,
        noteTitle: note?.title,
        noteContentLength: note?.content?.length || 0
      });

      if (!note) {
        console.error('❌ [TEST EMBEDDING] Note not found in database');
        return { success: false, error: 'Note not found' };
      }

      // Test platform router
      console.log('🧪 [TEST EMBEDDING] Testing platform router...');
      const content = await ctx.runQuery(api.platformRouter.getUnifiedContentById, {
        userId,
        contentId
      });

      console.log('🧪 [TEST EMBEDDING] Platform router result:', {
        contentFound: !!content,
        contentId: content?.id,
        platform: content?.platform,
        contentType: content?.contentType,
        title: content?.title,
        contentLength: content?.content?.length || 0
      });

      if (!content) {
        console.error('❌ [TEST EMBEDDING] Content not found by platform router');
        return { success: false, error: 'Content not found by platform router' };
      }

      // Test embedding creation
      console.log('🧪 [TEST EMBEDDING] Testing embedding creation...');
      const embeddingResult = await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
        userId,
        contentId: content.id,
        contentType: 'note',
        title: content.title,
        content: content.content,
        triggerType: 'manual_trigger',
        platform: 'notes'
      });

      console.log('🧪 [TEST EMBEDDING] Embedding creation result:', embeddingResult);

      return { 
        success: true, 
        noteExists: true,
        platformRouterWorked: true,
        embeddingResult 
      };

    } catch (error) {
      console.error('❌ [TEST EMBEDDING] Error during test:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
    }
  }
}); 