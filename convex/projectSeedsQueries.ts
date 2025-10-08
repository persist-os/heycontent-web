/**
 * Project Seeds Queries
 * 
 * Queries for retrieving project seeds (code-based detection).
 * Seeds are potential projects identified from shard patterns.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";


/**
 * Get all project seeds for a user
 */
export const listProjectSeeds = query({
  args: {
    userId: v.string(),
    minConfidence: v.optional(v.number()),
    includePromoted: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("projectSeeds")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));
    
    const seeds = await query.collect();
    
    // Filter by confidence if specified
    let filtered = seeds;
    if (args.minConfidence !== undefined) {
      filtered = seeds.filter(s => s.confidence >= args.minConfidence!);
    }
    
    // Filter by promoted status if specified
    if (args.includePromoted === false) {
      filtered = filtered.filter(s => !s.promoted);
    }
    
    // Sort by confidence descending
    filtered.sort((a, b) => b.confidence - a.confidence);
    
    // Apply limit if specified
    if (args.limit !== undefined) {
      filtered = filtered.slice(0, args.limit);
    }
    
    return filtered;
  },
});


/**
 * Get a specific project seed by ID
 */
export const getProjectSeed = query({
  args: {
    seedId: v.id("projectSeeds"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const seed = await ctx.db.get(args.seedId);
    return seed || null;
  },
});


/**
 * Get seeds ready for promotion (above threshold)
 */
export const getSeedsReadyForPromotion = query({
  args: {
    userId: v.string(),
    confidenceThreshold: v.number(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const seeds = await ctx.db
      .query("projectSeeds")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter: not promoted + above threshold
    const ready = seeds.filter(
      s => !s.promoted && s.confidence >= args.confidenceThreshold
    );
    
    // Sort by confidence descending
    ready.sort((a, b) => b.confidence - a.confidence);
    
    return ready;
  },
});


/**
 * Get seeds by confidence range (for analytics/MAB)
 */
export const getSeedsByConfidenceRange = query({
  args: {
    userId: v.string(),
    minConfidence: v.number(),
    maxConfidence: v.number(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const seeds = await ctx.db
      .query("projectSeeds")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const inRange = seeds.filter(
      s => s.confidence >= args.minConfidence && s.confidence <= args.maxConfidence
    );
    
    return inRange;
  },
});


/**
 * Get seed statistics for a user
 */
export const getSeedStatistics = query({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    totalSeeds: v.number(),
    unpromoted: v.number(),
    promoted: v.number(),
    averageConfidence: v.number(),
    highConfidenceSeeds: v.number(),
  }),
  handler: async (ctx, args) => {
    const seeds = await ctx.db
      .query("projectSeeds")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const totalSeeds = seeds.length;
    const promoted = seeds.filter(s => s.promoted).length;
    const unpromoted = totalSeeds - promoted;
    
    const avgConfidence = totalSeeds > 0
      ? seeds.reduce((sum, s) => sum + s.confidence, 0) / totalSeeds
      : 0;
    
    const highConfidence = seeds.filter(s => s.confidence >= 0.7).length;
    
    return {
      totalSeeds,
      unpromoted,
      promoted,
      averageConfidence: avgConfidence,
      highConfidenceSeeds: highConfidence,
    };
  },
});
