// @ts-nocheck
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Get embedding counts for UI display
 * Embeddings are generated automatically when content is created
 */
export const getEmbeddingCounts = action({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    try {
      // Get embedding counts by content type
      const embeddings = await ctx.runQuery(internal.vectorSearch.getUserEmbeddings, {
        userId
      });

      const embeddingsByType = embeddings.reduce((acc, embedding) => {
        // Map contentType to display name
        const contentTypeToLabel: Record<string, string> = {
          'conversation': 'conversations',
          'note': 'notes',
          'crystal': 'crystals'
        };
        
        const label = contentTypeToLabel[embedding.contentType] || embedding.contentType;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        success: true,
        total: embeddings.length,
        byType: embeddingsByType
      };
    } catch (error) {
      console.error('❌ [EMBEDDING COUNTS] Error getting counts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        total: 0,
        byType: {}
      };
    }
  }
}); 