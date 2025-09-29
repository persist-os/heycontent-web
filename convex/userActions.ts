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

    // Always return success immediately - don't let background tasks block login
    const loginResult = {
      success: true,
      syncTriggered: false,
      migrationTriggered: false,
      message: 'Login successful'
    };

    // Trigger background tasks (embedding sync + crystal migration)
    try {
      console.log('🔄 [USER LOGIN] Triggering background tasks for user:', userId);
      
      // Use setTimeout to make this truly asynchronous
      setTimeout(async () => {
        try {
          console.log('🚀 [USER LOGIN] Starting background task execution for user:', userId);
          
          // 1. Check and trigger crystal migration first (if needed)
          console.log('🔮 [USER LOGIN] About to check crystal migration status for user:', userId);
          
          try {
            const migrationResult = await ctx.runAction(api.crystalMigration.triggerCrystalMigration, {
              userId
            });
            
            console.log('🔮 [USER LOGIN] Migration result received:', migrationResult);
            
            if (migrationResult.success && !migrationResult.skipped) {
              console.log(`✅ [USER LOGIN] Crystal migration completed for user ${userId}:`, {
                shardsCreated: migrationResult.crystalSystemResults?.shardsCreated || 0,
                crystalsCreated: migrationResult.crystalSystemResults?.crystalsCreated || 0
              });
            } else if (migrationResult.skipped) {
              console.log(`⏭️ [USER LOGIN] Crystal migration skipped for user ${userId}: ${migrationResult.reason}`);
            } else {
              console.error(`❌ [USER LOGIN] Crystal migration failed for user ${userId}:`, migrationResult.error);
            }
          } catch (migrationError) {
            console.error(`💥 [USER LOGIN] Crystal migration threw error for user ${userId}:`, migrationError);
          }

          // 2. Then trigger embedding sync
          console.log('📡 [USER LOGIN] Starting embedding sync for user:', userId);
          try {
            await ctx.runAction(api.embeddingSystem.syncEmbeddingsOnHeartbeat, {
              userId
            });
            console.log('✅ [USER LOGIN] Background embedding sync completed successfully for user:', userId);
          } catch (embeddingError) {
            console.error(`💥 [USER LOGIN] Embedding sync threw error for user ${userId}:`, embeddingError);
          }
          
          console.log('🏁 [USER LOGIN] Background task execution completed for user:', userId);
          
        } catch (error) {
          console.error('⚠️ [USER LOGIN] Background tasks failed for user:', userId, error);
          // Don't throw - this is background work and shouldn't affect the user
        }
      }, 100); // Small delay to ensure login completes first

      loginResult.syncTriggered = true;
      loginResult.migrationTriggered = true;
      loginResult.message = 'Login successful, background processing initiated';
      
    } catch (error) {
      console.error('⚠️ [USER LOGIN] Failed to trigger background tasks for user:', userId, error);
      // Don't fail the login - just log the error and continue
      loginResult.message = 'Login successful (background processing will retry later)';
    }

    return loginResult;
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
      const embeddings = await ctx.runQuery(api.vectorSearchQueries.getUserEmbeddings, {
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
      const embeddings = await ctx.runQuery(api.vectorSearchQueries.getUserEmbeddings, {
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