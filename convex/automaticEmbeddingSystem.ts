import { action, internalAction, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Types for content changes
export type ContentChangeType = 'created' | 'updated' | 'deleted';
export type QueuePriority = 'high' | 'normal' | 'low';
export type PlatformType = 'youtube' | 'instagram' | 'gmail' | 'notes' | 'conversations' | 'insights';

/**
 * Queue content for embedding processing
 * This is the main entry point for all content changes
 */
export const queueContentForEmbedding = internalMutation({
  args: {
    userId: v.string(),
    contentId: v.string(), // Standardized format: platform:actualId
    platform: v.union(
      v.literal('youtube'),
      v.literal('instagram'),
      v.literal('gmail'),
      v.literal('notes'),
      v.literal('conversations'),
      v.literal('insights')
    ),
    changeType: v.union(
      v.literal('created'),
      v.literal('updated'),
      v.literal('deleted')
    ),
    priority: v.optional(v.union(
      v.literal('high'),
      v.literal('normal'),
      v.literal('low')
    )),
    metadata: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const { userId, contentId, platform, changeType, priority = 'normal', metadata } = args;
    
    console.log('📝 [EMBEDDING QUEUE] Queuing content for embedding:', {
      userId,
      contentId,
      platform,
      changeType,
      priority
    });

    try {
      // Check if this content is already queued (and unprocessed)
      const existingQueueItem = await ctx.db
        .query("embeddingQueue")
        .withIndex("by_user_platform", (q) => q.eq("userId", userId).eq("platform", platform))
        .filter((q) => q.eq(q.field("contentId"), contentId))
        .filter((q) => q.eq(q.field("processedAt"), undefined))
        .first();

      if (existingQueueItem) {
        // Update existing queue item with latest change type and reset retry count
        await ctx.db.patch(existingQueueItem._id, {
          changeType,
          priority,
          retryCount: 0,
          maxRetries: 3, // Ensure maxRetries is set
          createdAt: Date.now(),
          lastAttemptAt: undefined,
          errorMessage: undefined,
          metadata
        });
        console.log('📝 [EMBEDDING QUEUE] Updated existing queue item:', existingQueueItem._id);
      } else {
        // Create new queue item
        const queueId = await ctx.db.insert("embeddingQueue", {
          userId,
          contentId,
          platform,
          changeType,
          priority,
          retryCount: 0,
          maxRetries: 3,
          createdAt: Date.now(),
          metadata
        });
        console.log('📝 [EMBEDDING QUEUE] Created new queue item:', queueId);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ [EMBEDDING QUEUE] Error queuing content:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
});

/**
 * Process the embedding queue (called by cron job)
 */
export const processEmbeddingQueue = internalAction({
  args: {
    batchSize: v.optional(v.number()),
    maxProcessingTime: v.optional(v.number()) // Maximum time in milliseconds
  },
  handler: async (ctx, args) => {
    const { batchSize = 10, maxProcessingTime = 4 * 60 * 1000 } = args; // 4 minutes max
    const startTime = Date.now();
    
    console.log('🔄 [QUEUE PROCESSOR] Starting queue processing:', { batchSize, maxProcessingTime });

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    try {
      // Get unprocessed queue items ordered by priority and creation time
      const queueItems = await ctx.runQuery(internal.automaticEmbeddingSystem.getUnprocessedQueueItems, {
        limit: batchSize
      });

      console.log(`🔄 [QUEUE PROCESSOR] Found ${queueItems.length} items to process`);

      for (const item of queueItems) {
        // Check if we're approaching time limit
        if (Date.now() - startTime > maxProcessingTime) {
          console.log('⏰ [QUEUE PROCESSOR] Approaching time limit, stopping processing');
          break;
        }

        results.processed++;

        try {
          // Check if item still exists before processing (race condition protection)
          const currentItem = await ctx.runQuery(internal.automaticEmbeddingSystem.getQueueItem, {
            queueId: item._id
          });
          
          if (!currentItem) {
            console.log(`🔄 [QUEUE PROCESSOR] Item already processed: ${item.contentId}`);
            results.succeeded++;
            continue;
          }

          // Mark item as being attempted
          await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemAttempted, {
            queueId: item._id
          });

          console.log(`🎯 [QUEUE PROCESSOR] Processing item: ${item.contentId} (${item.changeType})`);

          if (item.changeType === 'deleted') {
            // Handle content deletion
            const deleteResult = await ctx.runAction(api.embeddingOrchestrator.orchestrateEmbeddingUpdate, {
              userId: item.userId,
              trigger: 'content_deleted',
              contentId: item.contentId,
              platform: item.platform,
              metadata: item.metadata
            });

            if (deleteResult.succeeded > 0) {
              await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemCompleted, {
                queueId: item._id
              });
              results.succeeded++;
              console.log(`✅ [QUEUE PROCESSOR] Successfully deleted embedding: ${item.contentId}`);
            } else {
              throw new Error(deleteResult.errors.join(', ') || 'Delete failed');
            }
          } else {
            // Handle content creation/update
            const embeddingResult = await ctx.runAction(api.embeddingOrchestrator.orchestrateEmbeddingUpdate, {
              userId: item.userId,
              trigger: item.changeType === 'created' ? 'content_created' : 'content_updated',
              contentId: item.contentId,
              platform: item.platform,
              metadata: item.metadata
            });

            if (embeddingResult.succeeded > 0) {
              await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemCompleted, {
                queueId: item._id
              });
              results.succeeded++;
              console.log(`✅ [QUEUE PROCESSOR] Successfully processed: ${item.contentId}`);
            } else {
              throw new Error(embeddingResult.errors.join(', ') || 'Processing failed');
            }
          }

        } catch (error) {
          results.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`${item.contentId}: ${errorMessage}`);
          
          console.error(`❌ [QUEUE PROCESSOR] Failed to process ${item.contentId}:`, error);

          // Check if this is a permanent error that shouldn't be retried
          const isPermanentError = errorMessage.includes('Content not found') || 
                                   errorMessage.includes('not found by platform router') ||
                                   errorMessage.includes('Delete on nonexistent document'); // Add this for our race condition

          if (isPermanentError) {
            // Mark as completed to stop retrying
            await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemCompleted, {
              queueId: item._id,
              errorMessage: `Permanent error - not retrying: ${errorMessage}`
            });
            console.log(`🚫 [QUEUE PROCESSOR] Marked as permanent error (will not retry): ${item.contentId}`);
          } else {
            // Handle retry logic for temporary errors
            const maxRetries = item.maxRetries ?? 3; // Default to 3 retries
            const retryCount = item.retryCount ?? 0; // Default to 0 retries
            if (retryCount < maxRetries) {
              await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemFailed, {
                queueId: item._id,
                errorMessage
              });
            } else {
              // Max retries reached, mark as permanently failed
              await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemCompleted, {
                queueId: item._id,
                errorMessage: `Max retries exceeded: ${errorMessage}`
              });
              console.error(`💀 [QUEUE PROCESSOR] Max retries exceeded for ${item.contentId}`);
            }
          }
        }
      }

      const duration = Date.now() - startTime;
      console.log('✅ [QUEUE PROCESSOR] Queue processing completed:', {
        ...results,
        duration: `${duration}ms`,
        itemsPerSecond: results.processed / (duration / 1000)
      });

      return results;

    } catch (error) {
      console.error('❌ [QUEUE PROCESSOR] Critical error in queue processing:', error);
      return {
        processed: 0,
        succeeded: 0,
        failed: 1,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
});

/**
 * Lightweight queue processor for active users - processes a few items quickly
 */
export const processQueueForActiveUser = internalAction({
  args: {
    userId: v.string(),
    maxItems: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { userId, maxItems = 8 } = args; // Increased from 3 to 8 items per heartbeat
    
    console.log(`⚡ [ACTIVE QUEUE] Processing queue for active user: ${userId}`);
    
    try {
      // Get user's pending queue items with higher limit
      const userQueueItems = await ctx.runQuery(internal.automaticEmbeddingSystem.getUnprocessedQueueItems, {
        limit: maxItems * 2 // Get more items to filter from
      });
      
      // Filter to only this user's items and take up to maxItems
      const userItems = userQueueItems.filter(item => item.userId === userId).slice(0, maxItems);
      
      if (userItems.length === 0) {
        console.log('⚡ [ACTIVE QUEUE] No items to process for user');
        return { success: true, processed: 0, reason: 'queue_empty' };
      }
      
      console.log(`⚡ [ACTIVE QUEUE] Processing ${userItems.length} items for active user`);
      
      let processed = 0;
      let succeeded = 0;
      let failed = 0;
      
      for (const item of userItems) {
        try {
          // Check if item still exists before processing (race condition protection)
          const currentItem = await ctx.runQuery(internal.automaticEmbeddingSystem.getQueueItem, {
            queueId: item._id
          });
          
          if (!currentItem) {
            console.log(`🔄 [ACTIVE QUEUE] Item already processed: ${item.contentId}`);
            processed++;
            succeeded++;
            continue;
          }
          
          // Mark item as being attempted
          await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemAttempted, {
            queueId: item._id
          });
          
          console.log(`⚡ [ACTIVE QUEUE] Processing: ${item.contentId} (${item.changeType})`);
          
          if (item.changeType === 'deleted') {
            // Handle content deletion
            const deleteResult = await ctx.runAction(api.embeddingOrchestrator.orchestrateEmbeddingUpdate, {
              userId: item.userId,
              trigger: 'content_deleted',
              contentId: item.contentId,
              platform: item.platform,
              metadata: { ...item.metadata, source: 'active_processing' }
            });

            if (deleteResult.succeeded > 0) {
              await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemCompleted, {
                queueId: item._id
              });
              succeeded++;
              console.log(`✅ [ACTIVE QUEUE] Deleted embedding: ${item.contentId}`);
            } else {
              throw new Error(deleteResult.errors.join(', ') || 'Delete failed');
            }
          } else {
            // Handle content creation/update
            const embeddingResult = await ctx.runAction(api.embeddingOrchestrator.orchestrateEmbeddingUpdate, {
              userId: item.userId,
              trigger: item.changeType === 'created' ? 'content_created' : 'content_updated',
              contentId: item.contentId,
              platform: item.platform,
              metadata: { ...item.metadata, source: 'active_processing' }
            });

            if (embeddingResult.succeeded > 0) {
              await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemCompleted, {
                queueId: item._id
              });
              succeeded++;
              console.log(`✅ [ACTIVE QUEUE] Processed: ${item.contentId}`);
            } else {
              throw new Error(embeddingResult.errors.join(', ') || 'Processing failed');
            }
          }
          
          processed++;
          
          // Reduced delay between items for faster processing
          if (userItems.length > 1 && processed < userItems.length) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Reduced from 500ms to 200ms
          }
          
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ [ACTIVE QUEUE] Failed to process ${item.contentId}:`, error);

          // Check if this is a permanent error
          const isPermanentError = errorMessage.includes('Content not found') || 
                                   errorMessage.includes('not found by platform router') ||
                                   errorMessage.includes('Delete on nonexistent document'); // Add this for our race condition

          if (isPermanentError) {
            await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemCompleted, {
              queueId: item._id,
              errorMessage: `Permanent error - not retrying: ${errorMessage}`
            });
            console.log(`🚫 [ACTIVE QUEUE] Marked as permanent error: ${item.contentId}`);
          } else {
            // Handle retry logic for temporary errors
            const maxRetries = item.maxRetries ?? 3;
            const retryCount = item.retryCount ?? 0;
            if (retryCount < maxRetries) {
              await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemFailed, {
                queueId: item._id,
                errorMessage
              });
            } else {
              await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemCompleted, {
                queueId: item._id,
                errorMessage: `Max retries exceeded: ${errorMessage}`
              });
            }
          }
        }
      }
      
      console.log(`⚡ [ACTIVE QUEUE] Completed: ${processed} processed, ${succeeded} succeeded, ${failed} failed`);
      
      return {
        success: true,
        processed,
        succeeded,
        failed
      };
      
    } catch (error) {
      console.error('❌ [ACTIVE QUEUE] Error processing queue for active user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Lightweight sync for active users (runs every 2-3 minutes)
 */
export const performQuickSync = internalAction({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    console.log('⚡ [QUICK SYNC] Starting quick sync for active user:', userId);
    
    try {
      // ALWAYS process queue items for active users first
      const queueResult = await ctx.runAction(internal.automaticEmbeddingSystem.processQueueForActiveUser, {
        userId,
        maxItems: 10 // Increased from 5 to 10 items per heartbeat
      });
      
      console.log(`⚡ [QUICK SYNC] Queue processing result:`, queueResult);

      // Check if there's been a recent full sync (within 3 minutes)
      const recentSync = await ctx.runQuery(internal.automaticEmbeddingSystem.getRecentUserSync, {
        userId,
        withinMinutes: 3
      });

      // Check current queue status after processing
      const queueStatus = await ctx.runQuery(internal.automaticEmbeddingSystem.getQueueStatus, {
        userId
      });

      // If queue is now clean and no recent full sync, do a validation sync
      if (queueStatus.pending === 0 && queueStatus.failed === 0 && !recentSync) {
        console.log('⚡ [QUICK SYNC] Queue is clean and no recent full sync, performing validation sync');
        
        const fullSyncResult = await ctx.runAction(internal.automaticEmbeddingSystem.syncEmbeddingsOnLogin, {
          userId,
          forceSync: true
        });
        
        return { 
          success: true, 
          queueResult,
          fullSyncTriggered: true, 
          fullSyncResult 
        };
      } else {
        console.log(`⚡ [QUICK SYNC] Queue status: ${queueStatus.pending} pending, ${queueStatus.failed} failed. Recent sync: ${!!recentSync}`);
        return { 
          success: true, 
          queueResult,
          fullSyncTriggered: false,
          reason: queueStatus.pending > 0 || queueStatus.failed > 0 ? 'queue_busy' : 'recent_sync',
          queueStatus 
        };
      }
      
    } catch (error) {
      console.error('❌ [QUICK SYNC] Error during quick sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * User heartbeat - call this from frontend when user is active
 */
export const userHeartbeat = action({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    try {
      // Trigger a quick sync for active users
      const result = await ctx.runAction(internal.automaticEmbeddingSystem.performQuickSync, args);
      return result;
    } catch (error) {
      console.error('❌ [USER HEARTBEAT] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Self-healing mechanism - sync embeddings on user login
 */
export const syncEmbeddingsOnLogin = internalAction({
  args: {
    userId: v.string(),
    forceSync: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const { userId, forceSync = false } = args;
    
    console.log('🔄 [EMBEDDING SYNC] Starting login sync for user:', userId);

    try {
      // Check if user has had a recent sync (within 5 minutes) unless forced
      if (!forceSync) {
        const recentSync = await ctx.runQuery(internal.automaticEmbeddingSystem.getRecentUserSync, {
          userId,
          withinMinutes: 5
        });

        if (recentSync) {
          console.log('🔄 [EMBEDDING SYNC] Recent sync found, skipping:', recentSync._id);
          return { success: true, skipped: true, syncId: recentSync._id };
        }
      }

      // Create sync record
      const syncId = await ctx.runMutation(internal.automaticEmbeddingSystem.createSyncRecord, {
        userId,
        syncType: 'login'
      });

      const results = {
        itemsQueued: 0,
        platformsProcessed: [] as string[],
        errors: [] as string[]
      };

      try {
        // Get all unified content across platforms
        const allContent = await ctx.runQuery(api.platformRouter.getAllUnifiedContent, {
          userId,
          limit: 1000 // Process up to 1000 items total
        });

        // Get existing embeddings to identify missing ones
        const existingEmbeddings = await ctx.runQuery(api.vectorSearch.getUserEmbeddings, {
          userId,
          limit: 2000 // Get all embeddings
        });

        const existingEmbeddingIds = new Set(existingEmbeddings.map(e => e.contentId));
        
        console.log(`🔄 [EMBEDDING SYNC] Found ${allContent.length} content items, ${existingEmbeddings.length} embeddings`);

        // Queue missing embeddings
        for (const content of allContent) {
          if (!existingEmbeddingIds.has(content.id)) {
            await ctx.runMutation(internal.automaticEmbeddingSystem.queueContentForEmbedding, {
              userId,
              contentId: content.id,
              platform: content.platform,
              changeType: 'created',
              priority: 'low',
              metadata: { source: 'login_sync' }
            });
            results.itemsQueued++;
          }
        }

        // Check for orphaned embeddings (embeddings without content)
        const contentIds = new Set(allContent.map(c => c.id));
        for (const embedding of existingEmbeddings) {
          if (!contentIds.has(embedding.contentId)) {
            await ctx.runMutation(internal.automaticEmbeddingSystem.queueContentForEmbedding, {
              userId,
              contentId: embedding.contentId,
              platform: embedding.contentId.split(':')[0] as PlatformType,
              changeType: 'deleted',
              priority: 'low',
              metadata: { source: 'orphan_cleanup' }
            });
            results.itemsQueued++;
          }
        }

        // Group content by platform for reporting
        const platformCounts = allContent.reduce((acc, content) => {
          acc[content.platform] = (acc[content.platform] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        results.platformsProcessed = Object.keys(platformCounts);

        // Complete sync record
        await ctx.runMutation(internal.automaticEmbeddingSystem.completeSyncRecord, {
          syncId,
          platformsProcessed: results.platformsProcessed,
          itemsQueued: results.itemsQueued
        });

        console.log('✅ [EMBEDDING SYNC] Login sync completed:', results);

        return { success: true, syncId, ...results };

      } catch (error) {
        // Mark sync as failed
        await ctx.runMutation(internal.automaticEmbeddingSystem.failSyncRecord, {
          syncId,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }

    } catch (error) {
      console.error('❌ [EMBEDDING SYNC] Error during login sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Helper queries and mutations
 */

export const getUnprocessedQueueItems = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { limit = 10 } = args;
    
    return await ctx.db
      .query("embeddingQueue")
      .withIndex("by_processedAt")
      .filter((q) => q.eq(q.field("processedAt"), undefined))
      .order("asc") // Process oldest first
      .take(limit);
  }
});

export const getQueueItem = query({
  args: {
    queueId: v.id("embeddingQueue")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.queueId);
  }
});

export const getRecentUserSync = query({
  args: {
    userId: v.string(),
    withinMinutes: v.number()
  },
  handler: async (ctx, args) => {
    const { userId, withinMinutes } = args;
    const cutoffTime = Date.now() - (withinMinutes * 60 * 1000);
    
    return await ctx.db
      .query("embeddingSyncs")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "completed"))
      .filter((q) => q.gt(q.field("startedAt"), cutoffTime))
      .order("desc")
      .first();
  }
});

export const getQueueStatus = query({
  args: {
    userId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    // Create separate query builders for each operation
    const createBaseQuery = () => userId 
      ? ctx.db.query("embeddingQueue").withIndex("by_userId", (q) => q.eq("userId", userId))
      : ctx.db.query("embeddingQueue");
    
    const [pending, processing, failed] = await Promise.all([
      createBaseQuery().filter((q) => q.eq(q.field("processedAt"), undefined)).collect(),
      createBaseQuery().filter((q) => q.neq(q.field("lastAttemptAt"), undefined)).filter((q) => q.eq(q.field("processedAt"), undefined)).collect(),
      createBaseQuery().filter((q) => q.and(
        q.neq(q.field("retryCount"), undefined),
        q.gt(q.field("retryCount"), 0)
      )).collect()
    ]);

    return {
      pending: pending.length,
      processing: processing.length,
      failed: failed.length,
      total: pending.length + processing.length + failed.length
    };
  }
});

// Internal mutations for queue management

export const markQueueItemAttempted = internalMutation({
  args: {
    queueId: v.id("embeddingQueue")
  },
  handler: async (ctx, args) => {
    // Check if item still exists before updating (race condition protection)
    const item = await ctx.db.get(args.queueId);
    if (!item) {
      console.log(`🔄 [QUEUE] Item already processed/deleted: ${args.queueId}`);
      return; // Silently return - item was already handled
    }

    try {
      await ctx.db.patch(args.queueId, {
        lastAttemptAt: Date.now()
      });
    } catch (error) {
      // If patch fails (item deleted), that's fine - it means another process handled it
      console.log(`🔄 [QUEUE] Item already processed by another process: ${args.queueId}`);
    }
  }
});

export const markQueueItemCompleted = internalMutation({
  args: {
    queueId: v.id("embeddingQueue"),
    errorMessage: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { queueId, errorMessage } = args;
    
    // First check if the item still exists to avoid race conditions
    const existingItem = await ctx.db.get(queueId);
    if (!existingItem) {
      console.log(`🔄 [QUEUE] Item already processed/deleted: ${queueId}`);
      return; // Silently return - item was already handled
    }
    
    if (errorMessage) {
      // Keep failed items for debugging, just mark as processed
      await ctx.db.patch(queueId, {
        processedAt: Date.now(),
        errorMessage
      });
      console.log(`🔴 [QUEUE] Kept failed item for debugging: ${queueId}`);
    } else {
      // Delete successful items immediately to keep queue clean
      try {
        await ctx.db.delete(queueId);
        console.log(`✅ [QUEUE] Deleted successful item: ${queueId}`);
      } catch (error) {
        // If deletion fails (item already deleted), that's fine - it means another process handled it
        console.log(`🔄 [QUEUE] Item already deleted by another process: ${queueId}`);
      }
    }
  }
});

export const markQueueItemFailed = internalMutation({
  args: {
    queueId: v.id("embeddingQueue"),
    errorMessage: v.string()
  },
  handler: async (ctx, args) => {
    // Check if item still exists before updating (race condition protection)
    const item = await ctx.db.get(args.queueId);
    if (!item) {
      console.log(`🔄 [QUEUE] Item already processed/deleted: ${args.queueId}`);
      return; // Silently return - item was already handled
    }

    const currentRetryCount = item.retryCount ?? 0; // Default to 0 if undefined
    
    try {
      await ctx.db.patch(args.queueId, {
        retryCount: currentRetryCount + 1,
        lastAttemptAt: Date.now(),
        errorMessage: args.errorMessage
      });
      console.log(`🔄 [QUEUE] Marked item for retry (${currentRetryCount + 1}): ${args.queueId}`);
    } catch (error) {
      // If patch fails (item deleted), that's fine - it means another process handled it
      console.log(`🔄 [QUEUE] Item already processed by another process: ${args.queueId}`);
    }
  }
});

export const createSyncRecord = internalMutation({
  args: {
    userId: v.string(),
    syncType: v.union(
      v.literal('login'),
      v.literal('manual'),
      v.literal('scheduled')
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("embeddingSyncs", {
      userId: args.userId,
      syncType: args.syncType,
      status: 'running',
      startedAt: Date.now(),
      platformsProcessed: [],
      itemsQueued: 0
    });
  }
});

export const completeSyncRecord = internalMutation({
  args: {
    syncId: v.id("embeddingSyncs"),
    platformsProcessed: v.array(v.string()),
    itemsQueued: v.number()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.syncId, {
      status: 'completed',
      completedAt: Date.now(),
      platformsProcessed: args.platformsProcessed,
      itemsQueued: args.itemsQueued
    });
  }
});

export const failSyncRecord = internalMutation({
  args: {
    syncId: v.id("embeddingSyncs"),
    errorMessage: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.syncId, {
      status: 'failed',
      completedAt: Date.now(),
      errorMessage: args.errorMessage
    });
  }
});

/**
 * Debug and utility functions
 */

export const forceProcessQueue = action({
  args: {
    batchSize: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.automaticEmbeddingSystem.processEmbeddingQueue, {
      batchSize: args.batchSize
    });
  }
});

export const forceSyncUser = action({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.automaticEmbeddingSystem.syncEmbeddingsOnLogin, {
      userId: args.userId,
      forceSync: true
    });
  }
});

export const clearUserQueue = internalMutation({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const userQueueItems = await ctx.db
      .query("embeddingQueue")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const item of userQueueItems) {
      await ctx.db.delete(item._id);
    }

    return { deleted: userQueueItems.length };
  }
});

/**
 * Clean up invalid queue items (especially Instagram posts that don't exist)
 */
export const cleanupInvalidQueueItems = internalAction({
  args: {
    userId: v.optional(v.string()),
    platform: v.optional(v.union(
      v.literal('youtube'),
      v.literal('instagram'),
      v.literal('gmail'),
      v.literal('notes'),
      v.literal('conversations'),
      v.literal('insights')
    ))
  },
  handler: async (ctx, args) => {
    const { userId, platform } = args;
    
    console.log('🧹 [CLEANUP] Starting cleanup of invalid queue items...', { userId, platform });
    
    try {
      // Get all unprocessed queue items (or filtered by user/platform)
      let queueItems = await ctx.runQuery(internal.automaticEmbeddingSystem.getUnprocessedQueueItems, {
        limit: 100
      });
      
      // Filter by user and platform if specified
      if (userId) {
        queueItems = queueItems.filter(item => item.userId === userId);
      }
      if (platform) {
        queueItems = queueItems.filter(item => item.platform === platform);
      }
      
      console.log(`🧹 [CLEANUP] Found ${queueItems.length} unprocessed queue items to check`);
      
      let cleanedCount = 0;
      let validCount = 0;
      
      for (const item of queueItems) {
        try {
          // Check if the content actually exists using platform router
          const content = await ctx.runQuery(api.platformRouter.getUnifiedContentById, {
            userId: item.userId,
            contentId: item.contentId
          });
          
          if (!content) {
            // Content doesn't exist, mark as permanently failed
            await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemCompleted, {
              queueId: item._id,
              errorMessage: `Cleanup: Content not found - ${item.contentId}`
            });
            cleanedCount++;
            console.log(`🗑️ [CLEANUP] Removed invalid item: ${item.contentId}`);
          } else {
            validCount++;
          }
        } catch (error) {
          // If there's an error checking content, also mark as failed
          await ctx.runMutation(internal.automaticEmbeddingSystem.markQueueItemCompleted, {
            queueId: item._id,
            errorMessage: `Cleanup: Error checking content - ${error instanceof Error ? error.message : 'Unknown error'}`
          });
          cleanedCount++;
          console.log(`🗑️ [CLEANUP] Removed problematic item: ${item.contentId}`);
        }
      }
      
      console.log(`✅ [CLEANUP] Cleanup completed: ${cleanedCount} invalid items removed, ${validCount} valid items kept`);
      
      return {
        success: true,
        totalChecked: queueItems.length,
        invalidItemsRemoved: cleanedCount,
        validItemsKept: validCount
      };
      
    } catch (error) {
      console.error('❌ [CLEANUP] Error during cleanup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Development helper: Clear all queue items (for migration)
 */
export const clearAllQueueItems = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allItems = await ctx.db.query("embeddingQueue").collect();
    
    let deletedCount = 0;
    for (const item of allItems) {
      await ctx.db.delete(item._id);
      deletedCount++;
    }

    console.log(`🧹 [MIGRATION] Cleared ${deletedCount} old queue items`);
    return { deleted: deletedCount };
  }
});

/**
 * Cleanup functions for cron jobs
 */

export const cleanupOldQueueItems = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    // Get old failed queue items (successful items are deleted immediately now)
    const oldFailedItems = await ctx.db
      .query("embeddingQueue")
      .withIndex("by_processedAt")
      .filter((q) => q.neq(q.field("processedAt"), undefined)) // Has been processed (failed)
      .filter((q) => q.neq(q.field("errorMessage"), undefined)) // Has error (failed)
      .filter((q) => q.lt(q.field("processedAt"), cutoffTime)) // Older than cutoff
      .take(50); // Delete in batches of 50

    let deletedCount = 0;
    for (const item of oldFailedItems) {
      await ctx.db.delete(item._id);
      deletedCount++;
    }

    console.log(`🧹 [CLEANUP] Deleted ${deletedCount} old failed queue items`);
    return { deleted: deletedCount };
  }
});

export const cleanupOldSyncRecords = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    // Get old sync records
    const oldSyncs = await ctx.db
      .query("embeddingSyncs")
      .withIndex("by_startedAt")
      .filter((q) => q.lt(q.field("startedAt"), cutoffTime))
      .take(50); // Delete in batches of 50

    let deletedCount = 0;
    for (const sync of oldSyncs) {
      await ctx.db.delete(sync._id);
      deletedCount++;
    }

    console.log(`🧹 [CLEANUP] Deleted ${deletedCount} old sync records`);
    return { deleted: deletedCount };
  }
}); 