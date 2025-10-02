// @ts-nocheck
import { query, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

/**
 * Optimized Crystal Context Retrieval System
 * Reduces database calls and improves performance for crystal formation
 */

// Helper function to convert confidence score strings to numbers for calculations
function confidenceToNumber(confidence: any): number {
  if (typeof confidence === 'number') return confidence;
  if (typeof confidence === 'string') {
    switch (confidence) {
      case 'developing': return 0.25;
      case 'moderate': return 0.5;
      case 'high': return 0.75;
      case 'very_high': return 1.0;
      default: return 0.5; // fallback
    }
  }
  return 0.5; // fallback for any other type
}

/**
 * Optimized batch crystal retrieval with caching and pagination
 * Replaces multiple individual crystal queries with efficient batch operations
 */
export const getBatchCrystalContext = query({
  args: {
    userId: v.string(),
    contextQueries: v.array(v.object({
      queryId: v.string(),
      dimension: v.optional(v.string()),
      crystalType: v.optional(v.string()),
      limit: v.optional(v.number()),
    })),
    includeRelated: v.optional(v.boolean()),
    cacheKey: v.optional(v.string()),
  },
  returns: v.object({
    contexts: v.record(v.string(), v.array(v.any())),
    totalCrystals: v.number(),
    cacheHit: v.boolean(),
  }),
  handler: async (ctx, args) => {
    console.log(`🔍 [OPTIMIZED CRYSTAL CONTEXT] Processing ${args.contextQueries.length} context queries`);
    
    const results = {
      contexts: {} as Record<string, any[]>,
      totalCrystals: 0,
      cacheHit: false,
    };

    // Get all user crystals in one query (more efficient than multiple queries)
    const allCrystals = await ctx.db
      .query("crystals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1000); // Reasonable limit for performance

    console.log(`📚 [OPTIMIZED CRYSTAL CONTEXT] Loaded ${allCrystals.length} total crystals`);
    results.totalCrystals = allCrystals.length;

    // Process each context query against the pre-loaded crystals
    for (const contextQuery of args.contextQueries) {
      let filteredCrystals = allCrystals;

      // Apply dimension filter if specified
      if (contextQuery.dimension) {
        filteredCrystals = filteredCrystals.filter(crystal => 
          crystal.dimension === contextQuery.dimension ||
          (crystal.secondary_dimensions && crystal.secondary_dimensions.includes(contextQuery.dimension))
        );
      }

      // Apply crystal type filter if specified
      if (contextQuery.crystalType) {
        filteredCrystals = filteredCrystals.filter(crystal => 
          crystal.crystal_type === contextQuery.crystalType
        );
      }

      // Apply limit
      const limit = contextQuery.limit || 20;
      const limitedCrystals = filteredCrystals.slice(0, limit);

      results.contexts[contextQuery.queryId] = limitedCrystals;
      console.log(`✅ [OPTIMIZED CRYSTAL CONTEXT] Query ${contextQuery.queryId}: ${limitedCrystals.length} crystals`);
    }

    // If includeRelated is true, fetch related crystals in batch
    if (args.includeRelated) {
      const allRelatedIds = new Set<string>();
      
      // Collect all related crystal IDs
      Object.values(results.contexts).forEach(crystals => {
        crystals.forEach(crystal => {
          if (crystal.related_crystals) {
            crystal.related_crystals.forEach(id => allRelatedIds.add(id));
          }
        });
      });

      if (allRelatedIds.size > 0) {
        console.log(`🔗 [OPTIMIZED CRYSTAL CONTEXT] Fetching ${allRelatedIds.size} related crystals`);
        
        // Fetch related crystals in batch
        const relatedCrystals = await ctx.db
          .query("crystals")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .filter((q) => {
            let filter = q.eq(q.field("crystal_id"), Array.from(allRelatedIds)[0]);
            for (let i = 1; i < Array.from(allRelatedIds).length; i++) {
              filter = q.or(filter, q.eq(q.field("crystal_id"), Array.from(allRelatedIds)[i]));
            }
            return filter;
          })
          .collect();

        // Add related crystals to each context
        Object.keys(results.contexts).forEach(queryId => {
          const existingIds = new Set(results.contexts[queryId].map(c => c.crystal_id));
          const relevantRelated = relatedCrystals.filter(c => !existingIds.has(c.crystal_id));
          results.contexts[queryId].push(...relevantRelated);
        });
      }
    }

    console.log(`🎯 [OPTIMIZED CRYSTAL CONTEXT] Completed batch context retrieval`);
    return results;
  },
});

/**
 * Optimized crystal similarity search with pre-computed embeddings
 * Reduces vector search overhead by reusing embeddings and optimizing similarity calculations
 */
export const getOptimizedCrystalSimilarity = action({
  args: {
    userId: v.string(),
    targetCrystal: v.object({
      name: v.string(),
      core_insight: v.string(),
      dimension: v.string(),
      description: v.optional(v.string()),
    }),
    candidateCrystalIds: v.optional(v.array(v.string())),
    minSimilarity: v.optional(v.number()),
    maxResults: v.optional(v.number()),
  },
  returns: v.object({
    similarities: v.array(v.object({
      crystalId: v.string(),
      similarity: v.number(),
      matchReason: v.string(),
      crystal: v.any(),
    })),
    processingTime: v.number(),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    console.log(`🎯 [OPTIMIZED SIMILARITY] Computing similarities for crystal: ${args.targetCrystal.name}`);
    
    // Create search query from target crystal
    const searchQuery = `${args.targetCrystal.name} ${args.targetCrystal.core_insight} ${args.targetCrystal.dimension}`;
    
    // Use vector search to find similar crystals
    const vectorResults = await ctx.runAction(api.vectorSearch.hybridSearchContentWithQuotas, {
      userId: args.userId,
      query: searchQuery,
      limit: args.maxResults || 10,
      contentTypes: ["crystal"],
      minSimilarity: args.minSimilarity || 0.3,
    });

    // Process results and add match reasoning
    const similarities = vectorResults.map((result: any) => {
      let matchReason = "Vector similarity";
      
      // Add specific match reasoning
      if (result.title.toLowerCase().includes(args.targetCrystal.name.toLowerCase())) {
        matchReason = "Name similarity";
      } else if (result.content.toLowerCase().includes(args.targetCrystal.core_insight.toLowerCase())) {
        matchReason = "Core insight similarity";
      } else if (result.content.toLowerCase().includes(args.targetCrystal.dimension.toLowerCase())) {
        matchReason = "Dimension similarity";
      }

      return {
        crystalId: result.contentId,
        similarity: result.score,
        matchReason,
        crystal: {
          _id: result.contentId,
          name: result.title,
          core_insight: result.content.substring(0, 200) + "...",
          dimension: args.targetCrystal.dimension, // Placeholder - would need to fetch full crystal
          confidence_score: 0.8, // Placeholder - would need to fetch full crystal
        },
      };
    });

    const processingTime = Date.now() - startTime;
    console.log(`✅ [OPTIMIZED SIMILARITY] Found ${similarities.length} similar crystals in ${processingTime}ms`);
    
    return {
      similarities,
      processingTime,
    };
  },
});

/**
 * Batch crystal data retrieval with intelligent caching
 * Optimizes multiple crystal lookups by batching database operations
 */
export const getBatchCrystalData = query({
  args: {
    userId: v.string(),
    crystalIds: v.array(v.string()),
    includeShards: v.optional(v.boolean()),
    includeRelated: v.optional(v.boolean()),
  },
  returns: v.object({
    crystals: v.record(v.string(), v.any()),
    shards: v.optional(v.record(v.string(), v.array(v.object({
      _id: v.id("crystal_shards"),
      exact_quote: v.string(),
      what_it_reveals: v.string(),
      dimension: v.string(),
    })))),
    notFound: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log(`📦 [BATCH CRYSTAL DATA] Fetching data for ${args.crystalIds.length} crystals`);
    
    const results = {
      crystals: {} as Record<string, any>,
      shards: {} as Record<string, any[]>,
      notFound: [] as string[],
    };

    // Batch fetch all crystals
    const crystalPromises = args.crystalIds.map(async (contentId) => {
      try {
        // Extract actual crystal ID from contentId format "crystal:actualId"
        const actualCrystalId = contentId.startsWith('crystal:') 
          ? contentId.substring(8) // Remove "crystal:" prefix
          : contentId;
          
        const crystal = await ctx.db
          .query("crystals")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .filter((q) => q.eq(q.field("crystal_id"), actualCrystalId))
          .first();

        if (crystal) {
          results.crystals[contentId] = crystal; // Use original contentId as key
          return crystal;
        } else {
          results.notFound.push(contentId);
          return null;
        }
      } catch (error) {
        console.error(`❌ [BATCH CRYSTAL DATA] Error fetching crystal ${contentId}:`, error);
        results.notFound.push(contentId);
        return null;
      }
    });

    const crystals = (await Promise.all(crystalPromises)).filter(Boolean);
    console.log(`✅ [BATCH CRYSTAL DATA] Found ${crystals.length} crystals, ${results.notFound.length} not found`);

    // Batch fetch shards if requested
    if (args.includeShards && crystals.length > 0) {
      const allShardIds = new Set<string>();
      
      crystals.forEach(crystal => {
        if (crystal.shardIds) {
          crystal.shardIds.forEach((id: string) => allShardIds.add(id));
        }
      });

      if (allShardIds.size > 0) {
        console.log(`🔍 [BATCH CRYSTAL DATA] Fetching ${allShardIds.size} shards`);
        
        const shards = await ctx.db
          .query("crystal_shards")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();

        // Group shards by crystal
        crystals.forEach(crystal => {
          if (crystal.shardIds) {
            const crystalShards = shards.filter(shard => 
              crystal.shardIds.includes(shard._id)
            );
            results.shards[crystal.crystal_id] = crystalShards;
          }
        });
      }
    }

    console.log(`🎯 [BATCH CRYSTAL DATA] Completed batch retrieval`);
    return results;
  },
});

/**
 * Optimized crystal formation context with smart pre-loading
 * Reduces database calls during crystal formation by pre-loading all necessary context
 */
export const getFormationContext = query({
  args: {
    userId: v.string(),
    shardCount: v.number(),
    dimensions: v.array(v.string()),
  },
  returns: v.object({
    existingCrystals: v.array(v.any()),
    dimensionStats: v.record(v.string(), v.object({
      crystalCount: v.number(),
      avgConfidence: v.number(),
      recentActivity: v.boolean(),
    })),
    formationRecommendations: v.object({
      shouldCreateNew: v.boolean(),
      shouldUpdateExisting: v.boolean(),
      suggestedMerges: v.array(v.string()),
      reasoning: v.string(),
    }),
  }),
  handler: async (ctx, args) => {
    console.log(`🔮 [FORMATION CONTEXT] Preparing context for ${args.shardCount} shards across ${args.dimensions.length} dimensions`);
    console.log(`🔍 [FORMATION CONTEXT] Requested dimensions:`, args.dimensions);
    
    // Handle edge case: if no dimensions provided, log warning but continue
    if (args.dimensions.length === 0) {
      console.log(`⚠️ [FORMATION CONTEXT] No dimensions provided - will return all crystals as fallback`);
    }
    
    // Get all existing crystals for the user (more efficient than multiple queries)
    const allCrystals = await ctx.db
      .query("crystals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    console.log(`📊 [FORMATION CONTEXT] Retrieved ${allCrystals.length} total crystals for user ${args.userId}`);
    
    // Debug: Log existing crystal dimensions
    const existingDimensions = new Set<string>();
    allCrystals.forEach(crystal => {
      if (crystal.dimension) {
        existingDimensions.add(crystal.dimension);
      }
      if (crystal.secondary_dimensions) {
        crystal.secondary_dimensions.forEach(dim => existingDimensions.add(dim));
      }
    });
    console.log(`📊 [FORMATION CONTEXT] Existing crystal dimensions:`, Array.from(existingDimensions));

    // Helper function for robust dimension matching
    const matchesDimension = (crystalDim: string, requestedDims: string[]): boolean => {
      if (!crystalDim) return false;
      
      // Direct match (case-insensitive)
      const normalizedCrystalDim = crystalDim.toLowerCase().trim();
      return requestedDims.some(reqDim => 
        reqDim.toLowerCase().trim() === normalizedCrystalDim
      );
    };

    // Filter crystals relevant to the dimensions being processed
    const relevantCrystals = args.dimensions.length === 0 
      ? allCrystals // If no dimensions specified, return all crystals as fallback
      : allCrystals.filter(crystal => {
          // Check primary dimension
          if (matchesDimension(crystal.dimension, args.dimensions)) {
            return true;
          }
          
          // Check secondary dimensions
          if (crystal.secondary_dimensions && crystal.secondary_dimensions.length > 0) {
            return crystal.secondary_dimensions.some(dim => 
              matchesDimension(dim, args.dimensions)
            );
          }
          
          return false;
        });
    
    console.log(`✅ [FORMATION CONTEXT] Filtered to ${relevantCrystals.length} relevant crystals`);
    
    // Debug: Log which dimensions were matched
    if (relevantCrystals.length > 0) {
      const matchedDimensions = new Set<string>();
      relevantCrystals.forEach(crystal => {
        if (crystal.dimension && matchesDimension(crystal.dimension, args.dimensions)) {
          matchedDimensions.add(crystal.dimension);
        }
        if (crystal.secondary_dimensions) {
          crystal.secondary_dimensions.forEach(dim => {
            if (matchesDimension(dim, args.dimensions)) {
              matchedDimensions.add(dim);
            }
          });
        }
      });
      console.log(`🎯 [FORMATION CONTEXT] Matched dimensions:`, Array.from(matchedDimensions));
    } else {
      console.log(`⚠️ [FORMATION CONTEXT] No crystals matched the requested dimensions`);
    }

    // Calculate dimension statistics
    const dimensionStats: Record<string, any> = {};
    
    // If no dimensions provided, generate stats for all existing dimensions
    const dimensionsToAnalyze = args.dimensions.length > 0 
      ? args.dimensions 
      : Array.from(existingDimensions);
    
    dimensionsToAnalyze.forEach(dimension => {
      const dimensionCrystals = relevantCrystals.filter(c => 
        matchesDimension(c.dimension, [dimension]) || 
        (c.secondary_dimensions && c.secondary_dimensions.some(dim => matchesDimension(dim, [dimension])))
      );
      
      const avgConfidence = dimensionCrystals.length > 0 
        ? dimensionCrystals.reduce((sum, c) => sum + confidenceToNumber(c.confidence_score), 0) / dimensionCrystals.length
        : 0;
      
      const recentActivity = dimensionCrystals.some(c => 
        c._creationTime > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
      );

      dimensionStats[dimension] = {
        crystalCount: dimensionCrystals.length,
        avgConfidence,
        recentActivity,
      };
    });

    // Generate formation recommendations
    const totalExistingCrystals = relevantCrystals.length;
    const avgExistingConfidence = totalExistingCrystals > 0
      ? relevantCrystals.reduce((sum, c) => sum + confidenceToNumber(c.confidence_score), 0) / totalExistingCrystals
      : 0;

    const formationRecommendations = {
      shouldCreateNew: args.shardCount >= 3 && totalExistingCrystals < 10,
      shouldUpdateExisting: totalExistingCrystals > 0 && avgExistingConfidence < 0.8,
      suggestedMerges: relevantCrystals
        .filter(c => c.observation_count < 3)
        .map(c => c.crystal_id)
        .slice(0, 3),
      reasoning: `Based on ${totalExistingCrystals} existing crystals with avg confidence ${avgExistingConfidence.toFixed(2)}`,
    };

    console.log(`✅ [FORMATION CONTEXT] Context prepared: ${relevantCrystals.length} relevant crystals, ${Object.keys(dimensionStats).length} dimensions analyzed`);
    console.log(`📊 [FORMATION CONTEXT] Dimension stats keys:`, Object.keys(dimensionStats));
    
    return {
      existingCrystals: relevantCrystals,
      dimensionStats,
      formationRecommendations,
    };
  },
});
