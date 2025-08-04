// @ts-nocheck
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
      // Trigger embedding sync
      const syncResult = await ctx.runAction(api.embeddingSystem.syncEmbeddingsOnHeartbeat, {
        userId
      });

      return {
        success: true,
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
      // Get embedding counts by platform
      const embeddings = await ctx.runQuery(api.vectorSearch.getUserEmbeddings, {
        userId,
        limit: 2000
      });

      const embeddingsByPlatform = embeddings.reduce((acc, embedding) => {
        // Map contentType to platform for proper categorization
        const contentTypeToPlatform: Record<string, string> = {
          'conversation': 'conversations',
          'instagram_post': 'instagram',
          'youtube_video': 'youtube',
          'gmail_thread': 'gmail',
          'note': 'notes',
          'insight': 'insights'
        };
        
        const platform = contentTypeToPlatform[embedding.contentType] || 'unknown';
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get the most recent embedding update
      const recentUpdates = await ctx.runQuery(api.vectorSearch.getRecentEmbeddingUpdates, {
        userId,
        limit: 1
      });

      const lastUpdate = recentUpdates.length > 0 ? recentUpdates[0] : null;

      return {
        success: true,
        queueStatus: {
          pending: 0,
          failed: 0,
          total: 0
        },
        lastUpdate: lastUpdate ? {
          timestamp: lastUpdate.updatedAt,
          type: lastUpdate.type,
          platform: lastUpdate.platform,
          itemsProcessed: lastUpdate.itemsProcessed || 0,
          itemsSucceeded: lastUpdate.itemsSucceeded || 0,
          itemsFailed: lastUpdate.itemsFailed || 0
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
      const syncResult = await ctx.runAction(api.simpleEmbeddingSystem.syncEmbeddingsOnHeartbeat, {
        userId
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
 * Simple debug info for embedding system
 */
export const getEmbeddingDebugInfo = action({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    try {
      // Get user's embeddings
      const embeddings = await ctx.runQuery(api.vectorSearch.getUserEmbeddings, {
        userId,
        limit: 2000
      });
      
      return {
        success: true,
        totalEmbeddings: embeddings.length,
        embeddingsByType: embeddings.reduce((acc, embedding) => {
          acc[embedding.contentType] = (acc[embedding.contentType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        sampleEmbeddings: embeddings.slice(0, 5).map(e => ({
          contentId: e.contentId,
          contentType: e.contentType,
          createdAt: e.createdAt
        }))
      };
    } catch (error) {
      console.error('❌ [EMBEDDING DEBUG] Error getting debug info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}); 