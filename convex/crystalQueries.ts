import { query, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

/**
 * Single crystal query function
 * 
 * Flexible query that can get crystals by various criteria.
 * Simpler and more maintainable than separate functions.
 * 
 * CRYSTALS ONLY - For shard queries, use queryShard in shardQueries.ts
 */
export const queryCrystal = query({
  args: {
    userId: v.string(),
    useIndex: v.optional(v.string()),
    indexFields: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))),
    filters: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))),
    limit: v.optional(v.number()),
    orderBy: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, { userId, useIndex, indexFields, filters, limit, orderBy }) => {
    try {
      let query;
      
      // Start with base query using by_user index for crystals table only
      if (useIndex && indexFields) {
        query = ctx.db.query("crystals").withIndex(useIndex as any, (q: any) => {
          let queryBuilder = q.eq("userId", userId);
          Object.entries(indexFields).forEach(([field, value]) => {
            queryBuilder = queryBuilder.eq(field, value);
          });
          return queryBuilder;
        });
      } else {
        query = ctx.db.query("crystals").withIndex("by_user", (q) => q.eq("userId", userId));
      }

      // Apply additional filters
      if (filters) {
        Object.entries(filters).forEach(([field, value]) => {
          query = query.filter((q: any) => q.eq(q.field(field), value));
        });
      }

      // Apply ordering if specified
      if (orderBy) {
        query = query.order(orderBy);
      }

      // Execute with limit
      if (limit) {
        return await query.take(limit);
      } else {
        return await query.collect();
      }
    } catch (error) {
      console.error(`[CRYSTAL QUERY] Error querying crystals:`, error);
      return [];
    }
  }
});

/**
 * Vector search for crystals using the vector search system
 * 
 * This function performs semantic search on crystals by:
 * 1. Using the hybrid search system to find relevant crystal embeddings
 * 2. Retrieving the actual crystal data for the matched content IDs
 * 3. Returning structured crystal results with similarity scores
 */
export const vectorSearchCrystals = action({
    args: {
        userId: v.string(),
        query: v.string(),
        limit: v.optional(v.number()),
        minSimilarity: v.optional(v.number()),
    },
    handler: async (ctx, { userId, query, limit, minSimilarity }) => {
        try {
            // Use the hybrid search system to find relevant crystal embeddings
            const searchResults = await ctx.runAction(api.vectorSearch.hybridSearchContent, {
                userId,
                query,
                limit: limit || 10,
                contentTypes: ["crystal"], // Only search crystal content
                minSimilarity: minSimilarity || 0.35,
            });
            
            if (searchResults.length === 0) {
                return [];
            }
            
            // Extract content IDs from search results
            const contentIds = searchResults.map(result => result.contentId);
            
            // Fetch the actual crystal data
            const crystals = await ctx.runQuery(internal.crystalQueries.getCrystalsByIds, {
                userId,
                crystalIds: contentIds,
            });
            
            // Combine crystal data with similarity scores
            const resultsWithScores = crystals.map(crystal => {
                const searchResult = searchResults.find(result => result.contentId === crystal._originalContentId);
                return {
                    ...crystal,
                    similarity_score: searchResult?.score || 0,
                };
            });
            
            // Sort by similarity score (highest first)
            resultsWithScores.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
            
            return resultsWithScores;
            
        } catch (error: any) {
            console.error('[CRYSTAL VECTOR SEARCH] Error:', error);
            return [];
        }
    }
});


/**
 * Internal function to get crystals by their IDs
 * Used by vector search to retrieve actual crystal data after finding matches
 * 
 * Atomically fetches all crystals for the user, then filters by requested IDs.
 * Returns crystals with _originalContentId field for matching with search results.
 */
export const getCrystalsByIds = internalQuery({
    args: {
        userId: v.string(),
        crystalIds: v.array(v.string()),
    },
    handler: async (ctx, { userId, crystalIds }) => {
        if (crystalIds.length === 0) {
            return [];
        }

        try {
            // Extract actual crystal IDs from contentId format "crystal:actualId"
            const actualCrystalIds = crystalIds.map(contentId => 
                contentId.startsWith('crystal:') 
                    ? contentId.substring(8)
                    : contentId
            );

            // Atomically fetch all crystals for user in single query
            const allCrystals = await ctx.db
                .query("crystals")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect();

            // Filter to only requested crystals and add original contentId
            const crystals = allCrystals
                .filter(crystal => actualCrystalIds.includes(crystal.crystal_id))
                .map(crystal => {
                    const index = actualCrystalIds.indexOf(crystal.crystal_id);
                    return {
                        ...crystal,
                        _originalContentId: crystalIds[index]
                    };
                });

            return crystals;
        } catch (error) {
            console.error('[GET CRYSTALS BY IDS] Error:', error);
            return [];
        }
    },
});

/**
 * Get count of crystals and shards for a user
 */
export const getCrystalStats = query({
    args: {
        userId: v.string(),
    },
    returns: v.object({
        crystalsCount: v.number(),
        shardsCount: v.number(),
        byDimension: v.record(v.string(), v.number()),
        byConfidence: v.record(v.string(), v.number()),
        recentActivity: v.object({
            crystalsThisWeek: v.number(),
            shardsThisWeek: v.number(),
        }),
    }),
    handler: async (ctx, { userId }) => {
        try {
            // Get all crystals and shards for the user atomically
            const [crystals, shards] = await Promise.all([
                ctx.db
                    .query("crystals")
                    .withIndex("by_user", (q) => q.eq("userId", userId))
                    .collect(),
                ctx.db
                    .query("crystal_shards")
                    .withIndex("by_user", (q) => q.eq("userId", userId))
                    .collect()
            ]);

            // Calculate basic counts
            const crystalsCount = crystals.length;
            const shardsCount = shards.length;

            // Group by dimension
            const byDimension: Record<string, number> = {};
            crystals.forEach(crystal => {
                if (crystal.dimension) {
                    byDimension[crystal.dimension] = (byDimension[crystal.dimension] || 0) + 1;
                }
            });

            // Group by confidence level
            const byConfidence: Record<string, number> = {};
            crystals.forEach(crystal => {
                if (crystal.confidence_score !== undefined) {
                    // Handle string confidence scores from the schema
                    let level = 'low';
                    if (typeof crystal.confidence_score === 'string') {
                        switch (crystal.confidence_score) {
                            case 'very_high':
                            case 'high':
                                level = 'high';
                                break;
                            case 'moderate':
                                level = 'medium';
                                break;
                            case 'developing':
                            default:
                                level = 'low';
                                break;
                        }
                    } else if (typeof crystal.confidence_score === 'number') {
                        // Handle numeric confidence scores (legacy or computed)
                        level = crystal.confidence_score >= 0.8 ? 'high' : 
                                crystal.confidence_score >= 0.5 ? 'medium' : 'low';
                    }
                    byConfidence[level] = (byConfidence[level] || 0) + 1;
                }
            });

            // Calculate recent activity (last 7 days)
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            const crystalsThisWeek = crystals.filter(c => c._creationTime > oneWeekAgo).length;
            const shardsThisWeek = shards.filter(s => s._creationTime > oneWeekAgo).length;

            return {
                crystalsCount,
                shardsCount,
                byDimension,
                byConfidence,
                recentActivity: {
                    crystalsThisWeek,
                    shardsThisWeek,
                },
            };
            
        } catch (error: any) {
            console.error('[CRYSTAL STATS] Error getting stats:', error);
            // Return empty stats instead of throwing
            return {
                crystalsCount: 0,
                shardsCount: 0,
                byDimension: {},
                byConfidence: {},
                recentActivity: {
                    crystalsThisWeek: 0,
                    shardsThisWeek: 0,
                },
            };
        }
    }
});

/**
 * Get crystals by user ID
 * 
 * Parallel to getShardsByUser in shardQueries.ts.
 * Fetches crystals for a user with optional limit, ordered by most recent first.
 */
export const getCrystalsByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit }) => {
    const crystals = await ctx.db
      .query("crystals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit || 100)
    
    return crystals;
  },
});

/**
 * Get ALL crystals for a user without limits - for deletion operations
 * 
 * This query fetches all crystals for a user without any limits.
 * Used specifically for deletion operations where we need to delete everything.
 * 
 * @param userId - User ID to fetch crystals for
 * @returns Array of all crystal objects for the user
 */
export const getAllCrystalsByUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const crystals = await ctx.db
      .query("crystals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    return crystals;
  },
});

/**
 * Get crystals by widget ID
 * 
 * Fetches all crystals associated with a specific widget for a user.
 */
export const getCrystalsByWidgetId = query({
    args: {
        widgetId: v.union(v.string(), v.id("widgets")),
        userId: v.string(),
    },
    handler: async (ctx, { widgetId, userId }) => {
        try {
            const crystals = await ctx.db
                .query("crystals")
                .withIndex("by_widget", (q) => q.eq("widgetId", widgetId))
                .filter((q) => q.eq(q.field("userId"), userId))
                .collect();
            
            return crystals;
        } catch (error) {
            console.error('[GET CRYSTALS BY WIDGET] Error:', error);
            return [];
        }
    },
});

/**
 * Get persona data for crystals only
 * 
 * This function handles crystal-specific persona data queries.
 * For shard persona data, use getShardPersonaData in shardQueries.ts
 */
export const getCrystalPersonaData = query({
    args: {
        userId: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { userId, limit }) => {
        try {
            const query = ctx.db
                .query("crystals")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .order("desc");
            
            if (limit) {
                return await query.take(limit);
            } else {
                return await query.collect();
            }
        } catch (error) {
            console.error(`[GET CRYSTAL PERSONA DATA] Error getting crystals:`, error);
            return [];
        }
    },
});
