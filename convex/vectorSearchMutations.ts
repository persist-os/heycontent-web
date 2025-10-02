import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Optimized Vector Search Mutations
 * 
 * Follows convex-optimized-queries-mutations.mdc patterns:
 * - Single batch mutation function eliminates code duplication
 * - Proper error handling and operation result tracking
 * - User data isolation and access control
 * - Optimized for performance and maintainability
 */

// Define operation types once - no parameter rewriting
const vectorOperationSchema = v.object({
  type: v.union(
    v.literal("create_embedding"),
    v.literal("update_embedding"), 
    v.literal("delete_embedding"),
    v.literal("create_embedding_record"),
    v.literal("generate_embedding"),
    v.literal("batch_generate_embeddings"),
    v.literal("batch_delete_embeddings")
  ),
  data: v.optional(v.any()),
  id: v.optional(v.id("vector_embeddings")),
  
  // Embedding-specific fields
  text: v.optional(v.string()),
  contentId: v.optional(v.string()),
  contentType: v.optional(v.string()),
  embedding: v.optional(v.array(v.number())),
  title: v.optional(v.string()),
  content: v.optional(v.string()),
  metadata: v.optional(v.any()),
  
  // Batch operation fields
  items: v.optional(v.array(v.any())),
  contentIds: v.optional(v.array(v.string())),
  maxConcurrent: v.optional(v.number()),
});

// Single batch mutation function following optimization patterns
export const batchMutateVectorSearchData = mutation({
  args: {
    operation: v.string(),
    userId: v.string(),
    table: v.optional(v.string()),
    operations: v.optional(v.array(vectorOperationSchema)),
    
    // Direct operation parameters (for single operations)
    text: v.optional(v.string()),
    contentId: v.optional(v.string()),
    contentType: v.optional(v.string()),
    embedding: v.optional(v.array(v.number())),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    metadata: v.optional(v.any()),
    
    // Batch operation parameters
    items: v.optional(v.array(v.any())),
    contentIds: v.optional(v.array(v.string())),
    maxConcurrent: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    data: v.any(),
    error: v.optional(v.string()),
    results: v.optional(v.array(v.object({
      operation: v.string(),
      success: v.boolean(),
      id: v.optional(v.string()),
      error: v.optional(v.string()),
    }))),
    totalOperations: v.optional(v.number()),
    successfulOperations: v.optional(v.number()),
    failedOperations: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const { operation, userId, table = "vector_embeddings" } = args;
    
    try {
      switch (operation) {
        case "generate_embedding":
          return await handleGenerateEmbedding(ctx, args);
          
        case "batch_generate_embeddings":
          return await handleBatchGenerateEmbeddings(ctx, args);
          
        case "create_embedding_record":
          return await handleCreateEmbeddingRecord(ctx, args);
          
        case "batch_delete_embeddings":
          return await handleBatchDeleteEmbeddings(ctx, args);
          
        case "batch_operations":
          return await handleBatchOperations(ctx, args);
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      console.error(`Vector search mutation '${operation}' failed:`, error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Generate embedding using external service
async function handleGenerateEmbedding(ctx: any, args: any) {
  const { text, contentId, contentType } = args;
  
  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for embedding generation");
  }
  
  // Limit text length for performance
  const limitedText = text.length > 10000 ? text.substring(0, 10000) : text;
  
  try {
    const embedding = await ctx.runAction("vectorSearchEmbeddings:generateEmbedding", {
      text: limitedText,
    });
    
    return {
      success: true,
      data: {
        embedding,
        contentId,
        contentType,
        textLength: limitedText.length,
      },
    };
  } catch (error) {
    throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Batch generate embeddings with concurrency control
async function handleBatchGenerateEmbeddings(ctx: any, args: any) {
  const { userId, items = [], maxConcurrent = 3 } = args;
  
  if (!items.length) {
    throw new Error("Items array is required for batch embedding generation");
  }
  
  // Limit batch size for memory management
  const limitedItems = items.slice(0, 10);
  const results = [];
  let successfulOperations = 0;
  let failedOperations = 0;
  
  // Process in chunks to manage concurrency
  for (let i = 0; i < limitedItems.length; i += maxConcurrent) {
    const chunk = limitedItems.slice(i, i + maxConcurrent);
    
    const chunkPromises = chunk.map(async (item: any) => {
      try {
        if (!item.text || item.text.trim().length === 0) {
          throw new Error("Text is required for each item");
        }
        
        // Limit text length
        const limitedText = item.text.length > 10000 ? item.text.substring(0, 10000) : item.text;
        
        const embedding = await ctx.runAction("vectorSearchEmbeddings:generateEmbedding", {
          text: limitedText,
        });
        
        const result = {
          operation: "generate_embedding",
          success: true,
          id: item.contentId || `generated_${Date.now()}_${Math.random()}`,
          data: {
            embedding,
            contentId: item.contentId,
            contentType: item.contentType,
            textLength: limitedText.length,
          },
        };
        
        successfulOperations++;
        return result;
      } catch (error) {
        const result = {
          operation: "generate_embedding",
          success: false,
          id: item.contentId || "unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        };
        
        failedOperations++;
        return result;
      }
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  
  return {
    success: failedOperations === 0,
    data: results,
    results,
    totalOperations: limitedItems.length,
    successfulOperations,
    failedOperations,
  };
}

// Create embedding record in database
async function handleCreateEmbeddingRecord(ctx: any, args: any) {
  const { userId, contentId, contentType, embedding, title, content, metadata } = args;
  
  if (!userId || !contentId || !contentType || !embedding) {
    throw new Error("userId, contentId, contentType, and embedding are required");
  }
  
  // Check if embedding already exists - fallback to contentEmbeddings table
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
  } else {
    // Create new embedding record
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
}

// Batch delete embeddings
async function handleBatchDeleteEmbeddings(ctx: any, args: any) {
  const { userId, contentType, contentIds = [] } = args;
  
  if (!userId) {
    throw new Error("userId is required for deletion");
  }
  
  const results = [];
  let successfulOperations = 0;
  let failedOperations = 0;
  
  if (contentIds.length > 0) {
    // Delete specific content IDs
    for (const contentId of contentIds) {
      try {
        const existing = await ctx.db
          .query("contentEmbeddings")
          .withIndex("by_userId", (q: any) => q.eq("userId", userId))
          .filter((q: any) => q.eq(q.field("contentId"), contentId))
          .collect();
          
        for (const embedding of existing) {
          // Verify user ownership before deletion
          if (embedding.userId === userId) {
            await ctx.db.delete(embedding._id);
            results.push({
              operation: "delete",
              success: true,
              id: contentId,
            });
            successfulOperations++;
          } else {
            results.push({
              operation: "delete",
              success: false,
              id: contentId,
              error: "Access denied",
            });
            failedOperations++;
          }
        }
      } catch (error) {
        results.push({
          operation: "delete",
          success: false,
          id: contentId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        failedOperations++;
      }
    }
  } else if (contentType) {
    // Delete all embeddings of specific content type
    try {
      const embeddings = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q: any) => q.eq("userId", userId))
        .filter((q: any) => q.eq(q.field("contentType"), contentType))
        .collect();

      for (const embedding of embeddings) {
        if (embedding.userId === userId) {
          await ctx.db.delete(embedding._id);
          successfulOperations++;
        }
      }
      
      results.push({
        operation: "bulk_delete",
        success: true,
        id: `${contentType}_bulk`,
        deletedCount: successfulOperations,
      });
    } catch (error) {
      results.push({
        operation: "bulk_delete",
        success: false,
        id: `${contentType}_bulk`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      failedOperations++;
    }
  } else {
    // Delete all user embeddings
    try {
      const embeddings = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q: any) => q.eq("userId", userId))
        .collect();
        
      for (const embedding of embeddings) {
        if (embedding.userId === userId) {
        await ctx.db.delete(embedding._id);
          successfulOperations++;
        }
      }
      
      results.push({
        operation: "delete_all",
        success: true,
        id: "all_embeddings",
        deletedCount: successfulOperations,
      });
    } catch (error) {
      results.push({
        operation: "delete_all",
        success: false,
        id: "all_embeddings",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      failedOperations++;
    }
  }
  
  return {
    success: failedOperations === 0,
    data: {
      deletedCount: successfulOperations,
      results,
    },
    results,
    totalOperations: results.length,
    successfulOperations,
    failedOperations,
  };
}

// Handle batch operations (create, update, delete)
async function handleBatchOperations(ctx: any, args: any) {
  const { userId, operations = [] } = args;
  
  if (!operations.length) {
    throw new Error("Operations array is required for batch operations");
  }
  
  const results = [];
  let successfulOperations = 0;
  let failedOperations = 0;
  
  for (const op of operations) {
    try {
      let resultId;
      
      switch (op.type) {
        case "create_embedding":
          resultId = await ctx.db.insert("contentEmbeddings", {
            userId,
            ...op.data,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          break;
          
        case "update_embedding":
          const existing = await ctx.db.get(op.id);
          if (!existing || existing.userId !== userId) {
            throw new Error("Embedding not found or access denied");
          }
          await ctx.db.patch(op.id, {
            ...op.data,
            updatedAt: Date.now(),
          });
          resultId = op.id;
          break;
          
        case "delete_embedding":
          const toDelete = await ctx.db.get(op.id);
          if (!toDelete || toDelete.userId !== userId) {
            throw new Error("Embedding not found or access denied");
          }
          await ctx.db.delete(op.id);
          resultId = op.id;
          break;
          
        default:
          throw new Error(`Unknown operation type: ${op.type}`);
      }
      
      results.push({
        operation: op.type,
        success: true,
        id: resultId,
      });
      successfulOperations++;
    } catch (error) {
      results.push({
        operation: op.type,
        success: false,
        id: op.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      failedOperations++;
    }
  }
  
  return {
    success: failedOperations === 0,
    data: results,
    results,
    totalOperations: operations.length,
    successfulOperations,
    failedOperations,
  };
}

// Legacy compatibility mutation
export const deleteAllUserEmbeddings = mutation({
  args: { userId: v.string() },
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, { userId }) => {
    try {
      const embeddings = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
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
        deletedCount,
        message: `Successfully deleted ${deletedCount} embeddings`,
      };
    } catch (error) {
      console.error("Failed to delete user embeddings:", error);
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to delete embeddings: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});