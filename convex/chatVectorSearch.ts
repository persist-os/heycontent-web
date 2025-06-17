import { query } from "./_generated/server";
import { v } from "convex/values";

// Get contextual suggestions for chat based on conversation history
export const getChatSuggestions = query({
  args: {
    userId: v.string(),
    conversationId: v.optional(v.id("conversations")),
    recentMessages: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    try {
      // Get recent embedding searches for this user
      const recentEmbeddings = await ctx.db
        .query("vectorSearch")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(20);

      // Group by content type and get diverse suggestions
      const suggestions = [];
      const contentTypeCounts = new Map();

      for (const embedding of recentEmbeddings) {
        const type = embedding.contentType;
        const count = contentTypeCounts.get(type) || 0;

        // Limit suggestions per content type for diversity
        if (count < 2 && suggestions.length < limit) {
          suggestions.push({
            title: embedding.metadata.title,
            snippet: embedding.metadata.snippet || embedding.text.substring(0, 100),
            contentType: embedding.contentType,
            platform: embedding.metadata.platform,
            url: embedding.metadata.url,
            tags: embedding.metadata.tags,
          });
          contentTypeCounts.set(type, count + 1);
        }
      }

      return suggestions;
    } catch (error) {
      console.error("Error getting chat suggestions:", error);
      return [];
    }
  },
});

// Fallback text-based search when embeddings aren't available
export const searchSimilarText = query({
  args: {
    userId: v.string(),
    query: v.string(),
    contentTypes: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const queryLower = args.query.toLowerCase();

    try {
      let embeddings = ctx.db
        .query("vectorSearch")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId));

      // Get all results first, then filter by content type in JavaScript
      const results = await embeddings.take(100); // Get more for text filtering

      // Filter by content types if specified
      const filteredResults = args.contentTypes && args.contentTypes.length > 0
        ? results.filter(result => args.contentTypes!.includes(result.contentType))
        : results;

      // Simple text-based similarity scoring
      const scoredResults = filteredResults
        .map((result) => {
          const text = result.text.toLowerCase();
          const title = result.metadata.title.toLowerCase();
          
          // Basic scoring: exact matches > partial matches > title matches
          let score = 0;
          if (text.includes(queryLower)) score += 3;
          if (title.includes(queryLower)) score += 2;
          
          // Word overlap scoring
          const queryWords = queryLower.split(' ');
          const textWords = text.split(' ');
          const overlap = queryWords.filter(word => textWords.includes(word)).length;
          score += overlap;

          return { ...result, similarity: score };
        })
        .filter((result) => result.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return scoredResults;
    } catch (error) {
      console.error("Error in text-based search:", error);
      return [];
    }
  },
}); 