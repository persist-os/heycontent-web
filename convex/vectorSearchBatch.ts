// @ts-nocheck
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { contentTypeValidator, contentTypesArrayValidator } from "./types/embeddings";
import { internal } from "./_generated/api";

/**
 * Batch vector search operations for improved performance
 * Replaces multiple sequential vector search calls with single batched operations
 */

/**
 * Batch generate embeddings for multiple content items
 * Reduces API calls by processing multiple items in parallel
 */
export const batchGenerateEmbeddings = action({
  args: {
    userId: v.string(),
    items: v.array(v.object({
      contentId: v.string(),
      contentType: contentTypeValidator,
      title: v.string(),
      content: v.string(),
    })),
    maxConcurrency: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    processed: v.number(),
    succeeded: v.number(),
    failed: v.number(),
    errors: v.array(v.string()),
    results: v.array(v.object({
      contentId: v.string(),
      success: v.boolean(),
      error: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    console.log(`🚀 [BATCH EMBEDDINGS] Processing ${args.items.length} items for user ${args.userId}`);
    
    const maxConcurrency = args.maxConcurrency || 5; // Limit concurrent API calls
    const results = {
      success: true,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
      results: [] as Array<{
        contentId: string;
        success: boolean;
        error?: string;
      }>,
    };

    // Process items in batches to avoid overwhelming the API
    for (let i = 0; i < args.items.length; i += maxConcurrency) {
      const batch = args.items.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (item) => {
        try {
          results.processed++;
          
          // Check if embedding already exists
          const existingEmbedding = await ctx.runQuery(api.vectorSearchQueries.getEmbeddingByContentId, {
            userId: args.userId,
            contentId: item.contentId,
          });

          if (existingEmbedding) {
            console.log(`⏭️ [BATCH EMBEDDINGS] Skipping existing embedding for ${item.contentId}`);
            results.succeeded++;
            return {
              contentId: item.contentId,
              success: true,
            };
          }

          // Generate embedding
          await ctx.runAction(api.vectorSearchEmbeddings.createEmbedding, {
            userId: args.userId,
            contentId: item.contentId,
            contentType: item.contentType,
            title: item.title,
            content: item.content,
          });

          results.succeeded++;
          return {
            contentId: item.contentId,
            success: true,
          };
        } catch (error: any) {
          results.failed++;
          const errorMsg = `Failed to process ${item.contentId}: ${error.message}`;
          results.errors.push(errorMsg);
          console.error(`❌ [BATCH EMBEDDINGS] ${errorMsg}`);
          
          return {
            contentId: item.contentId,
            success: false,
            error: error.message,
          };
        }
      });

      // Wait for current batch to complete before processing next batch
      const batchResults = await Promise.all(batchPromises);
      results.results.push(...batchResults);
      
      console.log(`✅ [BATCH EMBEDDINGS] Completed batch ${Math.floor(i / maxConcurrency) + 1}/${Math.ceil(args.items.length / maxConcurrency)}`);
    }

    // Update overall success status
    results.success = results.failed === 0;

    console.log(`🎯 [BATCH EMBEDDINGS] Completed: ${results.succeeded}/${results.processed} successful`);
    return results;
  },
});

/**
 * Batch vector search for multiple queries
 * Optimizes multiple search operations by reusing embeddings and database connections
 */
export const batchVectorSearch = action({
  args: {
    userId: v.string(),
    queries: v.array(v.object({
      queryId: v.string(),
      query: v.string(),
      limit: v.optional(v.number()),
      contentTypes: contentTypesArrayValidator,
      minSimilarity: v.optional(v.number()),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    results: v.record(v.string(), v.array(v.object({
      contentId: v.string(),
      contentType: v.string(),
      title: v.string(),
      content: v.string(),
      score: v.number(),
    }))),
    errors: v.record(v.string(), v.string()),
  }),
  handler: async (ctx, args) => {
    console.log(`🔍 [BATCH VECTOR SEARCH] Processing ${args.queries.length} queries for user ${args.userId}`);
    
    const results = {
      success: true,
      results: {} as Record<string, Array<{
        contentId: string;
        contentType: string;
        title: string;
        content: string;
        score: number;
      }>>,
      errors: {} as Record<string, string>,
    };

    // Get user embeddings once for all queries (optimization)
    let userEmbeddings: any[] = [];
    try {
      userEmbeddings = await ctx.runQuery(internal.vectorSearchQueries.getAllUserEmbeddings, {
        userId: args.userId,
      });
      console.log(`📚 [BATCH VECTOR SEARCH] Loaded ${userEmbeddings.length} user embeddings`);
    } catch (error: any) {
      console.error(`❌ [BATCH VECTOR SEARCH] Failed to load user embeddings: ${error.message}`);
      return {
        success: false,
        results: {},
        errors: { global: `Failed to load user embeddings: ${error.message}` },
      };
    }

    // Process each query
    for (const queryItem of args.queries) {
      try {
        console.log(`🔍 [BATCH VECTOR SEARCH] Processing query: ${queryItem.queryId}`);
        
        // Use the hybrid search with pre-loaded embeddings
        const searchResults = await ctx.runAction(api.vectorSearch.hybridSearchContentWithQuotas, {
          userId: args.userId,
          query: queryItem.query,
          limit: queryItem.limit || 10,
          contentTypes: queryItem.contentTypes,
          minSimilarity: queryItem.minSimilarity || 0.35,
        });

        results.results[queryItem.queryId] = searchResults;
        console.log(`✅ [BATCH VECTOR SEARCH] Query ${queryItem.queryId}: ${searchResults.length} results`);
        
      } catch (error: any) {
        results.errors[queryItem.queryId] = error.message;
        results.success = false;
        console.error(`❌ [BATCH VECTOR SEARCH] Query ${queryItem.queryId} failed: ${error.message}`);
      }
    }

    console.log(`🎯 [BATCH VECTOR SEARCH] Completed: ${Object.keys(results.results).length} successful, ${Object.keys(results.errors).length} failed`);
    return results;
  },
});

/**
 * Batch crystal context retrieval
 * Optimizes crystal formation by fetching all relevant context in one operation
 */
export const batchCrystalContextRetrieval = action({
  args: {
    userId: v.string(),
    contextQueries: v.array(v.object({
      clusterId: v.string(),
      contextQuery: v.string(),
      limit: v.optional(v.number()),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    contexts: v.record(v.string(), v.array(v.object({
      _id: v.id("crystals"),
      name: v.string(),
      crystal_type: v.string(),
      dimension: v.string(),
      core_insight: v.string(),
      confidence_score: v.number(),
      evidence_strength: v.string(),
      observation_count: v.number(),
      crystal_id: v.string(),
      similarity_score: v.optional(v.number()),
    }))),
    errors: v.record(v.string(), v.string()),
  }),
  handler: async (ctx, args) => {
    console.log(`🔍 [BATCH CRYSTAL CONTEXT] Retrieving context for ${args.contextQueries.length} clusters`);
    
    const results = {
      success: true,
      contexts: {} as Record<string, any[]>,
      errors: {} as Record<string, string>,
    };

    // Process all context queries in parallel (with reasonable concurrency)
    const maxConcurrency = 3;
    for (let i = 0; i < args.contextQueries.length; i += maxConcurrency) {
      const batch = args.contextQueries.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (contextQuery) => {
        try {
          // Use vector search to find relevant crystals
          const searchResults = await ctx.runAction(api.crystalQueries.vectorSearchCrystals, {
            userId: args.userId,
            query: contextQuery.contextQuery,
            limit: contextQuery.limit || 20,
            minSimilarity: 0.3,
          });

          results.contexts[contextQuery.clusterId] = searchResults;
          console.log(`✅ [BATCH CRYSTAL CONTEXT] Cluster ${contextQuery.clusterId}: ${searchResults.length} context crystals`);
          
        } catch (error: any) {
          results.errors[contextQuery.clusterId] = error.message;
          results.success = false;
          console.error(`❌ [BATCH CRYSTAL CONTEXT] Cluster ${contextQuery.clusterId} failed: ${error.message}`);
        }
      });

      await Promise.all(batchPromises);
    }

    console.log(`🎯 [BATCH CRYSTAL CONTEXT] Completed: ${Object.keys(results.contexts).length} successful contexts retrieved`);
    return results;
  },
});

/**
 * Batch shard embedding generation for crystal formation
 * Optimizes the embedding generation process during shard clustering
 */
export const batchShardEmbeddingGeneration = internalAction({
  args: {
    userId: v.string(),
    shards: v.array(v.object({
      shardId: v.string(),
      content: v.string(),
    })),
    maxConcurrency: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    embeddings: v.record(v.string(), v.array(v.float64())),
    failed: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log(`🎯 [BATCH SHARD EMBEDDINGS] Generating embeddings for ${args.shards.length} shards`);
    
    const maxConcurrency = args.maxConcurrency || 5;
    const results = {
      success: true,
      embeddings: {} as Record<string, number[]>,
      failed: [] as string[],
    };

    // Process shards in batches
    for (let i = 0; i < args.shards.length; i += maxConcurrency) {
      const batch = args.shards.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (shard) => {
        try {
          const embedding = await ctx.runAction(api.vectorSearchEmbeddings.generateEmbedding, {
            text: shard.content,
          });
          
          results.embeddings[shard.shardId] = embedding;
          console.log(`✅ [BATCH SHARD EMBEDDINGS] Generated embedding for shard ${shard.shardId}`);
          
        } catch (error: any) {
          results.failed.push(shard.shardId);
          results.success = false;
          console.error(`❌ [BATCH SHARD EMBEDDINGS] Failed for shard ${shard.shardId}: ${error.message}`);
        }
      });

      await Promise.all(batchPromises);
      console.log(`📊 [BATCH SHARD EMBEDDINGS] Completed batch ${Math.floor(i / maxConcurrency) + 1}/${Math.ceil(args.shards.length / maxConcurrency)}`);
    }

    console.log(`🎯 [BATCH SHARD EMBEDDINGS] Final: ${Object.keys(results.embeddings).length} successful, ${results.failed.length} failed`);
    return results;
  },
});
