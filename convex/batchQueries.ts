import { query } from "./_generated/server";
import { v } from "convex/values";

// Get status of existing embeddings
export const getBatchStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const embeddings = await ctx.db
        .query("vectorSearch")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();

      // Group by content type
      const stats = embeddings.reduce((acc, embedding) => {
        const type = embedding.contentType;
        if (!acc[type]) {
          acc[type] = {
            count: 0,
            avgTextLength: 0,
            totalTextLength: 0,
            avgEmbeddingDimensions: 0,
            platforms: new Set<string>(),
          };
        }

        acc[type].count++;
        acc[type].totalTextLength += embedding.text.length;
        acc[type].avgTextLength = acc[type].totalTextLength / acc[type].count;
        acc[type].avgEmbeddingDimensions = embedding.embedding.length; // Google Cloud: 1408

        if (embedding.metadata.platform) {
          acc[type].platforms.add(embedding.metadata.platform);
        }

        return acc;
      }, {} as Record<string, any>);

      // Convert Set to Array for JSON serialization
      Object.keys(stats).forEach(key => {
        stats[key].platforms = Array.from(stats[key].platforms);
      });

      return {
        totalEmbeddings: embeddings.length,
        embeddingsByType: stats,
        oldestEmbedding: embeddings.length > 0 ? Math.min(...embeddings.map(e => e.createdAt)) : null,
        newestEmbedding: embeddings.length > 0 ? Math.max(...embeddings.map(e => e.updatedAt)) : null,
      };
    } catch (error) {
      console.error("Error getting batch status:", error);
      return { error: error.message };
    }
  },
}); 