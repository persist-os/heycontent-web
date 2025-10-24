import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { contentTypeValidator, embeddingOperationValidator } from "./types/embeddings";

/**
 * Simplified Vector Search Mutations
 * 
 * Follows unified mutation pattern from crystal/shard refactor:
 * - Single mutation function with operation parameter
 * - Centralized type definitions from types/embeddings.ts
 * - No code duplication
 * - HTTP endpoint alignment for backend toolkit access
 */

export const mutateEmbedding = mutation({
  args: {
    operation: embeddingOperationValidator,
    userId: v.string(),
    
    // Create/update parameters
    contentId: v.optional(v.string()),
    contentType: v.optional(contentTypeValidator),
    embedding: v.optional(v.array(v.float64())),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    metadata: v.optional(v.any()),
    
    // Delete parameters
    contentIds: v.optional(v.array(v.string())),
  },
  returns: v.object({
    success: v.boolean(),
    data: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { operation, userId } = args;
    
    try {
      switch (operation) {
        case "create_embedding_record":
          return await handleCreateEmbeddingRecord(ctx, args);
          
        case "batch_delete_embeddings":
          return await handleBatchDeleteEmbeddings(ctx, args);
          
        case "delete_all_embeddings":
          return await handleDeleteAllEmbeddings(ctx, args);
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      console.error(`[EMBEDDING MUTATION] ${operation} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

async function handleCreateEmbeddingRecord(ctx: any, args: any) {
  const { userId, contentId, contentType, embedding, title, content, metadata } = args;
  
  if (!userId || !contentId || !contentType || !embedding) {
    throw new Error("userId, contentId, contentType, and embedding are required");
  }
  
  // Upsert pattern - update if exists, create if not (idempotent)
  const existing = await ctx.db
    .query("contentEmbeddings")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.and(
      q.eq(q.field("contentId"), contentId),
      q.eq(q.field("contentType"), contentType)
    ))
    .first();
    
  if (existing) {
    // Update existing embedding
    await ctx.db.patch(existing._id, {
      embedding,
      title,
      content,
      metadata: metadata || {},
      updatedAt: Date.now(),
    });
    
    return {
      success: true,
      data: {
        id: existing._id,
        operation: "updated",
        contentId,
        contentType,
      },
    };
  }
  
  // Create new embedding - if duplicate created concurrently, next call will update
  const embeddingId = await ctx.db.insert("contentEmbeddings", {
    userId,
    contentId,
    contentType,
    embedding,
    title: title || `${contentType} content`,
    content: content || "",
    metadata: metadata || {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  
  return {
    success: true,
    data: {
      id: embeddingId,
      operation: "created",
      contentId,
      contentType,
    },
  };
}

async function handleBatchDeleteEmbeddings(ctx: any, args: any) {
  const { userId, contentType, contentIds = [] } = args;
  
  if (!userId) {
    throw new Error("userId is required");
  }
  
  let deletedCount = 0;
  
  if (contentIds.length > 0) {
    for (const contentId of contentIds) {
      const embeddings = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q: any) => q.eq("userId", userId))
        .filter((q: any) => q.eq(q.field("contentId"), contentId))
        .collect();
        
      for (const embedding of embeddings) {
        if (embedding.userId === userId) {
          await ctx.db.delete(embedding._id);
          deletedCount++;
        }
      }
    }
  } else if (contentType) {
    const embeddings = await ctx.db
      .query("contentEmbeddings")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.eq(q.field("contentType"), contentType))
      .collect();

    for (const embedding of embeddings) {
      if (embedding.userId === userId) {
        await ctx.db.delete(embedding._id);
        deletedCount++;
      }
    }
  }
  
  return {
    success: true,
    data: { deletedCount },
  };
}

async function handleDeleteAllEmbeddings(ctx: any, args: any) {
  const { userId } = args;
  
  const embeddings = await ctx.db
    .query("contentEmbeddings")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect();
    
  let deletedCount = 0;
  for (const embedding of embeddings) {
    if (embedding.userId === userId) {
      await ctx.db.delete(embedding._id);
      deletedCount++;
    }
  }
  
  return {
    success: true,
    data: { deletedCount },
  };
}
