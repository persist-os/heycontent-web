import { query, mutation, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Store or update embedding for content
export const storeEmbedding = mutation({
  args: {
    userId: v.string(),
    contentId: v.string(),
    contentType: v.union(
      v.literal("instagram_post"),
      v.literal("youtube_video"), 
      v.literal("gmail_message"),
      v.literal("gmail_thread"),
      v.literal("persona"),
      v.literal("note"),
      v.literal("conversation"),
      v.literal("ambient_insight")
    ),
    embedding: v.array(v.float64()),
    text: v.string(),
    metadata: v.object({
      title: v.string(),
      platform: v.optional(v.string()),
      createdAt: v.number(),
      tags: v.optional(v.array(v.string())),
      snippet: v.optional(v.string()),
      url: v.optional(v.string()),
      from: v.optional(v.string()),
      subject: v.optional(v.string()),
      // Multimodal metadata
      imageUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Check if embedding already exists
    const existing = await ctx.db
      .query("vectorSearch")
      .withIndex("by_user_content", (q) => 
        q.eq("userId", args.userId).eq("contentId", args.contentId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing embedding
      await ctx.db.patch(existing._id, {
        embedding: args.embedding,
        text: args.text,
        metadata: args.metadata,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new embedding
      return await ctx.db.insert("vectorSearch", {
        userId: args.userId,
        contentId: args.contentId,
        contentType: args.contentType,
        embedding: args.embedding,
        text: args.text,
        metadata: args.metadata,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Internal helper to get document by ID
export const getEmbeddingById = internalQuery({
  args: { id: v.id("vectorSearch") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Vector search using Convex's built-in vector search
export const searchSimilar = action({
  args: {
    userId: v.string(),
    queryEmbedding: v.array(v.float64()),
    contentTypes: v.optional(v.array(v.union(
      v.literal("instagram_post"),
      v.literal("youtube_video"), 
      v.literal("gmail_message"),
      v.literal("gmail_thread"),
      v.literal("persona"),
      v.literal("note"),
      v.literal("conversation"),
      v.literal("ambient_insight")
    ))),
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const threshold = args.threshold || 0.7;
    
    // Use Convex's vector search with user filter
    const vectorResults = await ctx.vectorSearch("vectorSearch", "by_embedding", {
      vector: args.queryEmbedding,
      limit: limit * 2, // Get more results to filter
      filter: (q) => q.eq("userId", args.userId),
    });
    
    // Get full documents
    const resultDocuments = [];
    for (const result of vectorResults) {
      if (result._score >= threshold) {
        // Use internal query to get the document directly
        const embedding = await ctx.runQuery(api.internal.getEmbeddingById, {
          id: result._id,
        });
        
        if (embedding) {
          // Filter by content type if specified
          if (!args.contentTypes || args.contentTypes.includes(embedding.contentType)) {
            resultDocuments.push({
              ...embedding,
              _score: result._score,
            });
          }
        }
      }
      if (resultDocuments.length >= limit) break;
    }
    
    return resultDocuments;
  },
});

// Get embedding for specific content
export const getContentEmbedding = query({
  args: {
    userId: v.string(),
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vectorSearch")
      .withIndex("by_user_content", (q) => 
        q.eq("userId", args.userId).eq("contentId", args.contentId)
      )
      .first();
  },
});

// Get all embeddings for a user
export const getUserEmbeddings = query({
  args: {
    userId: v.string(),
    contentType: v.optional(v.union(
      v.literal("instagram_post"),
      v.literal("youtube_video"), 
      v.literal("gmail_message"),
      v.literal("gmail_thread"),
      v.literal("persona"),
      v.literal("note"),
      v.literal("conversation"),
      v.literal("ambient_insight")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("vectorSearch")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId));
    
    if (args.contentType) {
      query = query.filter((q) => q.eq(q.field("contentType"), args.contentType));
    }
    
    const results = await query
      .order("desc")
      .take(args.limit || 50);
    
    return results;
  },
});

// Delete embedding
export const deleteEmbedding = mutation({
  args: {
    userId: v.string(),
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    const embedding = await ctx.db
      .query("vectorSearch")
      .withIndex("by_user_content", (q) => 
        q.eq("userId", args.userId).eq("contentId", args.contentId)
      )
      .first();
    
    if (embedding) {
      await ctx.db.delete(embedding._id);
      return true;
    }
    return false;
  },
});

// Get embeddings stats for a user
export const getEmbeddingStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const embeddings = await ctx.db
      .query("vectorSearch")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    const stats = {
      total: embeddings.length,
      byType: {} as Record<string, number>,
      byPlatform: {} as Record<string, number>,
      oldest: embeddings.length > 0 ? Math.min(...embeddings.map(e => e.createdAt)) : 0,
      newest: embeddings.length > 0 ? Math.max(...embeddings.map(e => e.createdAt)) : 0,
    };
    
    for (const embedding of embeddings) {
      // Count by content type
      stats.byType[embedding.contentType] = (stats.byType[embedding.contentType] || 0) + 1;
      
      // Count by platform
      if (embedding.metadata.platform) {
        stats.byPlatform[embedding.metadata.platform] = 
          (stats.byPlatform[embedding.metadata.platform] || 0) + 1;
      }
    }
    
    return stats;
  },
}); 