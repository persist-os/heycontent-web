import { query, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

/**
 * Builds and executes a query with all options in one go
 * @param ctx - Convex query context
 * @param table - The table to query (crystal_shards or crystals)
 * @param userId - User ID for scoping the query
 * @param options - Query configuration object
 * @param options.useIndex - Optional index name for optimization
 * @param options.indexFields - Fields to match in the index
 * @param options.filters - Runtime filters to apply
 * @param options.limit - Maximum number of results
 * @param options.orderBy - Sort direction (asc/desc)
 * @returns Promise resolving to query results
 */
const queryWithOptions = async (
    ctx: any,
    table: string,
    userId: string,
    options: {
        useIndex?: string;
        indexFields?: Record<string, any>;
        filters?: Record<string, any>;
        limit?: number;
        orderBy?: "asc" | "desc";
    } = {}
) => {
    // Build base query with index (using multiple variables for type integrity)
    const baseQuery = ctx.db.query(table);
    
    let indexedQuery;
    if (options.useIndex) {
        indexedQuery = baseQuery.withIndex(options.useIndex, (q: any) => {
            let queryBuilder = q.eq("userId", userId);
            if (options.indexFields) {
                Object.entries(options.indexFields).forEach(([field, value]) => {
                    queryBuilder = queryBuilder.eq(field, value);
                });
            }
            return queryBuilder;
        });
    } else {
        indexedQuery = baseQuery.withIndex("by_user", (q: any) => q.eq("userId", userId));
    }

    // Apply filters
    let filteredQuery = indexedQuery;
    if (options.filters) {
        Object.entries(options.filters).forEach(([field, value]) => {
            filteredQuery = filteredQuery.filter((filterQuery: any) => filterQuery.eq(filterQuery.field(field), value));
        });
    }

    // Apply ordering
    let orderedQuery = filteredQuery;
    if (options.orderBy) {
        orderedQuery = filteredQuery.order(options.orderBy);
    }

    // Execute the query with limits
    if (options.limit) {
        return await orderedQuery.take(options.limit);
    } else {
        return await orderedQuery.collect();
    }
};

/**
 * Master function for flexible crystal data retrieval
 *
 * Provides a unified interface for querying crystal_shards and crystals tables
 * with support for various indexes, filters, and result constraints.
 *
 * @example
 * ```typescript
 * // Get recent high-confidence shards
 * const shards = await getCrystalData(ctx, {
 *   userId: "user123",
 *   table: "crystal_shards",
 *   useIndex: "by_confidence",
 *   indexFields: { confidence_level: "high" },
 *   limit: 10,
 *   orderBy: "desc"
 * });
 * ```
 */
export const getCrystalData = query({
    args: {
        userId: v.string(),
        table: v.union(v.literal("crystal_shards"), v.literal("crystals")),
        useIndex: v.optional(v.string()),
        indexFields: v.optional(v.record(v.string(), v.any())),
        filters: v.optional(v.record(v.string(), v.any())),
        limit: v.optional(v.number()),
        orderBy: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    },
    returns: v.array(v.any()),

    handler: async (ctx, { userId, table, ...options }) => {
        return queryWithOptions(ctx, table, userId, options);
    }
});

/**
 * Convenience function for common persona data operations
 *
 * Provides pre-configured queries for typical use cases in persona management.
 * Results are structured based on the operation type.
 *
 * @param userId - User ID for scoping queries
 * @param operation - The type of operation to perform
 * @param limit - Optional maximum number of results per query
 *
 * @example
 * ```typescript
 * // Get overview data (recent shards + top crystals)
 * const overview = await getPersonaData(ctx, {
 *   userId: "user123",
 *   operation: "overview",
 *   limit: 5
 * });
 * // Returns: { recentShards: [...], topCrystals: [...] }
 *
 * // Get high confidence items
 * const highConf = await getPersonaData(ctx, {
 *   userId: "user123",
 *   operation: "high_confidence"
 * });
 * // Returns: { shards: [...], crystals: [...] }
 * ```
 */
export const getPersonaData = query({
    args: {
        userId: v.string(),
        operation: v.union(
            v.literal("shards"),
            v.literal("crystals"),
            v.literal("overview"),
            v.literal("high_confidence"),
            v.literal("due_review")
        ),
        limit: v.optional(v.number())
    },
    returns: v.any(),

    handler: async (ctx, { userId, operation, limit }) => {
        switch (operation) {
            case "shards":
                return queryWithOptions(ctx, "crystal_shards", userId, { limit });

            case "crystals":
                return queryWithOptions(ctx, "crystals", userId, { limit });

            case "high_confidence":
                const [shards, crystals] = await Promise.all([
                    queryWithOptions(ctx, "crystal_shards", userId, {
                        useIndex: "by_confidence",
                        indexFields: { confidence_level: "high" },
                        limit
                    }),
                    queryWithOptions(ctx, "crystals", userId, {
                        useIndex: "by_confidence",
                        indexFields: { confidence_score: "high" },
                        limit
                    })
                ]);
                return { shards, crystals };

            case "due_review":
                return queryWithOptions(ctx, "crystals", userId, {
                    useIndex: "by_review_due",
                    filters: { next_review_due: Date.now() }
                });

            case "overview":
                const [recentShards, topCrystals] = await Promise.all([
                    queryWithOptions(ctx, "crystal_shards", userId, { limit: limit || 10, orderBy: "desc" }),
                    queryWithOptions(ctx, "crystals", userId, { useIndex: "by_usage", limit: limit || 10, orderBy: "desc" })
                ]);
                return { recentShards, topCrystals };
        }
    }
});

/**
 * Vector search for crystal shards using the vector search system
 * 
 * This function performs semantic search on crystal shards by:
 * 1. Using the hybrid search system to find relevant crystal embeddings
 * 2. Retrieving the actual crystal shard data for the matched content IDs
 * 3. Returning structured crystal shard results
 */
export const vectorSearchCrystals = action({
    args: {
        userId: v.string(),
        query: v.string(),
        limit: v.optional(v.number()),
        minSimilarity: v.optional(v.number()),
    },
    returns: v.array(v.object({
        _id: v.id("crystal_shards"),
        _creationTime: v.number(),
        userId: v.string(),
        quote: v.string(),
        source: v.string(),
        confidence_level: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
        tags: v.optional(v.array(v.string())),
        crystal_id: v.optional(v.id("crystals")),
        similarity_score: v.optional(v.number()),
    })),
    handler: async (ctx, { userId, query, limit, minSimilarity }) => {
        console.log('🔍 [CRYSTAL VECTOR SEARCH] Starting vector search for crystals');
        console.log('🔍 [CRYSTAL VECTOR SEARCH] Query:', query);
        console.log('🔍 [CRYSTAL VECTOR SEARCH] User:', userId);
        
        try {
            // Use the hybrid search system to find relevant crystal embeddings
            const searchResults = await ctx.runAction(api.vectorSearch.hybridSearchContentWithQuotas, {
                userId,
                query,
                limit: limit || 10,
                contentTypes: ["crystal"], // Only search crystal content
                minSimilarity: minSimilarity || 0.35,
            });
            
            console.log('🔍 [CRYSTAL VECTOR SEARCH] Found', searchResults.length, 'embedding matches');
            
            if (searchResults.length === 0) {
                console.log('🔍 [CRYSTAL VECTOR SEARCH] No matches found');
                return [];
            }
            
            // Extract content IDs from search results
            const contentIds = searchResults.map(result => result.contentId);
            console.log('🔍 [CRYSTAL VECTOR SEARCH] Content IDs to fetch:', contentIds);
            
            // Fetch the actual crystal shard data
            const crystalShards = await ctx.runQuery(internal.crystalQueries.getCrystalShardsByIds, {
                userId,
                shardIds: contentIds,
            });
            
            console.log('🔍 [CRYSTAL VECTOR SEARCH] Retrieved', crystalShards.length, 'crystal shards');
            
            // Combine crystal shard data with similarity scores
            const resultsWithScores = crystalShards.map(shard => {
                const searchResult = searchResults.find(result => result.contentId === shard._id);
                return {
                    ...shard,
                    similarity_score: searchResult?.score || 0,
                };
            });
            
            // Sort by similarity score (highest first)
            resultsWithScores.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
            
            console.log('✅ [CRYSTAL VECTOR SEARCH] Returning', resultsWithScores.length, 'results');
            return resultsWithScores;
            
        } catch (error: any) {
            console.error('❌ [CRYSTAL VECTOR SEARCH] Error:', error);
            console.error('❌ [CRYSTAL VECTOR SEARCH] Error message:', error.message);
            
            // Return empty array instead of throwing to maintain UX
            console.log('🔍 [CRYSTAL VECTOR SEARCH] Returning empty results due to error');
            return [];
        }
    }
});

/**
 * Internal function to get crystal shards by their IDs
 * Used by vector search to retrieve actual shard data after finding matches
 */
export const getCrystalShardsByIds = internalQuery({
    args: {
        userId: v.string(),
        shardIds: v.array(v.string()),
    },
    returns: v.array(v.object({
        _id: v.id("crystal_shards"),
        _creationTime: v.number(),
        userId: v.string(),
        quote: v.string(),
        source: v.string(),
        confidence_level: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
        tags: v.optional(v.array(v.string())),
        crystal_id: v.optional(v.id("crystals")),
    })),
    handler: async (ctx, { userId, shardIds }) => {
        console.log('🔍 [GET SHARDS BY IDS] Fetching crystal shards by IDs');
        console.log('🔍 [GET SHARDS BY IDS] User:', userId);
        console.log('🔍 [GET SHARDS BY IDS] Shard IDs:', shardIds);
        
        try {
            const shards = [];
            
            for (const shardId of shardIds) {
                try {
                    // Convert string ID to proper Convex ID and fetch the shard
                    const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
                    
                    // Verify the shard belongs to the user and exists
                    if (shard && shard.userId === userId) {
                        shards.push(shard);
                    } else if (shard) {
                        console.warn('🔍 [GET SHARDS BY IDS] Shard belongs to different user:', shardId);
                    } else {
                        console.warn('🔍 [GET SHARDS BY IDS] Shard not found:', shardId);
                    }
                } catch (error) {
                    console.warn('🔍 [GET SHARDS BY IDS] Error fetching shard:', shardId, error);
                    // Continue with other shards
                }
            }
            
            console.log('✅ [GET SHARDS BY IDS] Successfully retrieved', shards.length, 'shards');
            return shards;
            
        } catch (error: any) {
            console.error('❌ [GET SHARDS BY IDS] Error:', error);
            // Return empty array instead of throwing
            return [];
        }
    }
});

/**
 * Ensure a crystal shard has an embedding for vector search
 * This function should be called when a crystal shard is created or updated
 */
export const ensureCrystalShardEmbedding = action({
    args: {
        userId: v.string(),
        shardId: v.id("crystal_shards"),
    },
    returns: v.object({
        success: v.boolean(),
        message: v.string(),
    }),
    handler: async (ctx, { userId, shardId }) => {
        console.log('🔧 [ENSURE EMBEDDING] Ensuring crystal shard has embedding');
        console.log('🔧 [ENSURE EMBEDDING] User:', userId);
        console.log('🔧 [ENSURE EMBEDDING] Shard ID:', shardId);
        
        try {
            // Get the crystal shard
            const shard = await ctx.runQuery(internal.crystalQueries.getCrystalShardsByIds, {
                userId,
                shardIds: [shardId],
            });
            
            if (shard.length === 0) {
                return {
                    success: false,
                    message: "Crystal shard not found or access denied"
                };
            }
            
            const crystalShard = shard[0];
            
            // Check if embedding already exists
            const existingEmbedding = await ctx.runQuery(api.vectorSearchQueries.getEmbeddingByContentId, {
                userId,
                contentId: shardId,
            });
            
            if (existingEmbedding) {
                console.log('✅ [ENSURE EMBEDDING] Embedding already exists');
                return {
                    success: true,
                    message: "Embedding already exists"
                };
            }
            
            // Create embedding for the crystal shard
            const searchableContent = `${crystalShard.quote}\n\nSource: ${crystalShard.source}`;
            
            await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
                userId,
                contentId: shardId,
                contentType: "crystal",
                title: `Crystal Shard: ${crystalShard.quote.substring(0, 50)}...`,
                content: searchableContent,
                triggerType: "content_update",
            });
            
            console.log('✅ [ENSURE EMBEDDING] Successfully created embedding for crystal shard');
            return {
                success: true,
                message: "Embedding created successfully"
            };
            
        } catch (error: any) {
            console.error('❌ [ENSURE EMBEDDING] Error:', error);
            return {
                success: false,
                message: `Failed to create embedding: ${error.message}`
            };
        }
    }
});