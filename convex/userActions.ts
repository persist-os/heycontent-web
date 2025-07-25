import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import { internalQuery, internalMutation } from "./_generated/server";

/**
 * Handle user login and trigger embedding sync
 */
export const handleUserLogin = action({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    console.log('🔐 [USER LOGIN] Handling login for user:', userId);

    try {
      // Immediately trigger heartbeat to start processing queue items
      const heartbeatResult = await ctx.runAction(internal.automaticEmbeddingSystem.performQuickSync, {
        userId
      });

      console.log('💓 [USER LOGIN] Heartbeat triggered:', heartbeatResult);

      // Trigger automatic embedding sync (for comprehensive validation)
      const syncResult = await ctx.runAction(internal.automaticEmbeddingSystem.syncEmbeddingsOnLogin, {
        userId
      });

      return {
        success: true,
        heartbeatTriggered: true,
        heartbeatResult,
        syncTriggered: true,
        ...syncResult
      };
    } catch (error) {
      console.error('❌ [USER LOGIN] Error handling user login:', error);
      return {
        success: false,
        syncTriggered: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Get embedding system status for UI display
 */
export const getEmbeddingSyncStatus = action({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    try {
      // Get queue status
      const queueStatus = await ctx.runQuery(api.automaticEmbeddingSystem.getQueueStatus, {
        userId
      });

      // Get recent sync information
      const recentSync = await ctx.runQuery(internal.automaticEmbeddingSystem.getRecentUserSync, {
        userId,
        withinMinutes: 60 // Last hour
      });

      // Get embedding counts by platform
      const embeddings = await ctx.runQuery(api.vectorSearch.getUserEmbeddings, {
        userId,
        limit: 2000
      });

      const embeddingsByPlatform = embeddings.reduce((acc, embedding) => {
        const platform = embedding.contentId.split(':')[0] || 'unknown';
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        success: true,
        queueStatus,
        recentSync: recentSync ? {
          syncId: recentSync._id,
          startedAt: recentSync.startedAt,
          completedAt: recentSync.completedAt,
          status: recentSync.status,
          itemsQueued: recentSync.itemsQueued,
          platformsProcessed: recentSync.platformsProcessed
        } : null,
        embeddingCounts: {
          total: embeddings.length,
          byPlatform: embeddingsByPlatform
        }
      };
    } catch (error) {
      console.error('❌ [EMBEDDING STATUS] Error getting sync status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Manually trigger embedding sync (for debug/admin use)
 */
export const triggerManualSync = action({
  args: {
    userId: v.string(),
    forceSync: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const { userId, forceSync = false } = args;

    try {
      const syncResult = await ctx.runAction(internal.automaticEmbeddingSystem.syncEmbeddingsOnLogin, {
        userId,
        forceSync
      });

      return {
        success: true,
        ...syncResult
      };
    } catch (error) {
      console.error('❌ [MANUAL SYNC] Error triggering manual sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Internal query to get user's embeddingQueue items
 */
export const getUserQueueItems = internalQuery({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db
      .query("embeddingQueue")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
    return null;
  }
});

/**
 * Internal query to get user's embeddingSyncs records
 */
export const getUserSyncRecords = internalQuery({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db
      .query("embeddingSyncs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);
    return null;
  }
});

/**
 * Get detailed queue information for debugging
 */
export const getQueueDebugInfo = action({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    try {
      // Get user's queue items
      const userQueueItems = await ctx.runQuery(internal.userActions.getUserQueueItems, { userId });
      // Get recent sync records
      const recentSyncs = await ctx.runQuery(internal.userActions.getUserSyncRecords, { userId });
      return {
        success: true,
        queueItems: userQueueItems.map(item => ({
          id: item._id,
          contentId: item.contentId,
          platform: item.platform,
          changeType: item.changeType,
          priority: item.priority,
          retryCount: item.retryCount,
          createdAt: item.createdAt,
          lastAttemptAt: item.lastAttemptAt,
          processedAt: item.processedAt,
          errorMessage: item.errorMessage
        })),
        syncHistory: recentSyncs.map(sync => ({
          id: sync._id,
          syncType: sync.syncType,
          status: sync.status,
          startedAt: sync.startedAt,
          completedAt: sync.completedAt,
          itemsQueued: sync.itemsQueued,
          platformsProcessed: sync.platformsProcessed,
          errorMessage: sync.errorMessage
        }))
      };
    } catch (error) {
      console.error('❌ [QUEUE DEBUG] Error getting debug info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}); 

/**
 * Clean up invalid queue items (especially for problematic Instagram posts)
 */
export const cleanupInvalidQueueItems = action({
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
    try {
      const result = await ctx.runAction(internal.automaticEmbeddingSystem.cleanupInvalidQueueItems, args);
      return result;
    } catch (error) {
      console.error('❌ [CLEANUP ACTION] Error cleaning up invalid queue items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Internal mutation to clear all embeddingSyncs records
 */
export const clearAllSyncRecords = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const allSyncs = await ctx.db.query("embeddingSyncs").collect();
    let deletedSyncs = 0;
    for (const sync of allSyncs) {
      await ctx.db.delete(sync._id);
      deletedSyncs++;
    }
    return null;
  }
});

/**
 * Cleanup old migration data (development helper)
 */
export const cleanupMigrationData = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Clear old embeddingQueue items
      const queueResult = await ctx.runMutation(internal.automaticEmbeddingSystem.clearAllQueueItems);
      // Clear old embeddingSyncs items
      const syncResult = await ctx.runMutation(internal.userActions.clearAllSyncRecords);
      console.log(`🧹 [MIGRATION CLEANUP] Cleared ${queueResult.deleted} queue items and ${syncResult.deleted} sync records`);
      return {
        success: true,
        queueItemsDeleted: queueResult.deleted,
        syncRecordsDeleted: syncResult.deleted
      };
    } catch (error) {
      console.error('❌ [MIGRATION CLEANUP] Error during cleanup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}); 