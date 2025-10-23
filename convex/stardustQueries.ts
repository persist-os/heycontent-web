/**
 * Stardust Queries
 * 
 * Queries for retrieving stardust (parallel species to crystals).
 * Stardust represents "What You Do" - concrete project potentials that evolve into star organisms.
 * 
 * 🌟 STARDUST SYSTEM:
 * - Parallel species to crystals ("What You Do" vs "Who You Are")
 * - Code-based detection (zero LLM cost)
 * - Flows through crystal dam alongside shards
 * - Evolves into star organisms (projects)
 */

import { query } from "./_generated/server";
import { v } from "convex/values";


/**
 * List all stardust for a user
 */
export const listStardust = query({
  args: {
    userId: v.string(),
    minConfidence: v.optional(v.number()),
    includePromoted: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("stardust")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));
    
    const allStardust = await query.collect();
    
    // Filter by confidence if specified
    let filtered = allStardust;
    if (args.minConfidence !== undefined) {
      filtered = allStardust.filter(s => s.confidence >= args.minConfidence!);
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
 * Get a specific stardust by ID
 */
export const getStardust = query({
  args: {
    stardustId: v.id("stardust"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const stardust = await ctx.db.get(args.stardustId);
    return stardust || null;
  },
});


/**
 * Get stardust ready for promotion (above threshold)
 */
export const getStardustReadyForPromotion = query({
  args: {
    userId: v.string(),
    confidenceThreshold: v.number(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const allStardust = await ctx.db
      .query("stardust")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter: not promoted + above threshold + mature lifecycle
    const ready = allStardust.filter(
      s => !s.promoted && 
           s.confidence >= args.confidenceThreshold &&
           (s.lifecycleStage === "mature" || s.lifecycleStage === "elder")
    );
    
    // Sort by confidence descending
    ready.sort((a, b) => b.confidence - a.confidence);
    
    return ready;
  },
});


/**
 * Get stardust statistics for a user
 */
export const getStardustStatistics = query({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    totalStardust: v.number(),
    unpromoted: v.number(),
    promoted: v.number(),
    averageConfidence: v.number(),
    highConfidenceStardust: v.number(),
    byLifecycleStage: v.any(),
    byDomain: v.any(),
  }),
  handler: async (ctx, args) => {
    const allStardust = await ctx.db
      .query("stardust")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const totalStardust = allStardust.length;
    const promoted = allStardust.filter(s => s.promoted).length;
    const unpromoted = totalStardust - promoted;
    
    const avgConfidence = totalStardust > 0
      ? allStardust.reduce((sum, s) => sum + s.confidence, 0) / totalStardust
      : 0;
    
    const highConfidence = allStardust.filter(s => s.confidence >= 0.7).length;
    
    // Count by lifecycle stage
    const byLifecycleStage: Record<string, number> = {};
    allStardust.forEach(s => {
      byLifecycleStage[s.lifecycleStage] = (byLifecycleStage[s.lifecycleStage] || 0) + 1;
    });
    
    // Count by domain
    const byDomain: Record<string, number> = {};
    allStardust.forEach(s => {
      byDomain[s.suggestedDomain] = (byDomain[s.suggestedDomain] || 0) + 1;
    });
    
    return {
      totalStardust,
      unpromoted,
      promoted,
      averageConfidence: avgConfidence,
      highConfidenceStardust: highConfidence,
      byLifecycleStage,
      byDomain,
    };
  },
});


/**
 * Get stardust by lifecycle stage
 */
export const getStardustByLifecycleStage = query({
  args: {
    userId: v.string(),
    lifecycleStage: v.union(
      v.literal("embryo"),
      v.literal("juvenile"),
      v.literal("mature"),
      v.literal("elder"),
      v.literal("transcendent")
    ),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const allStardust = await ctx.db
      .query("stardust")
      .withIndex("by_lifecycle", (q) => 
        q.eq("userId", args.userId).eq("lifecycleStage", args.lifecycleStage))
      .collect();
    
    // Sort by confidence descending
    allStardust.sort((a, b) => b.confidence - a.confidence);
    
    return allStardust;
  },
});


/**
 * Get stardust by domain
 */
export const getStardustByDomain = query({
  args: {
    userId: v.string(),
    domain: v.string(),  // Flexible domain as string
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const allStardust = await ctx.db
      .query("stardust")
      .withIndex("by_domain", (q) => 
        q.eq("userId", args.userId).eq("suggestedDomain", args.domain))
      .collect();
    
    // Sort by confidence descending
    allStardust.sort((a, b) => b.confidence - a.confidence);
    
    return allStardust;
  },
});


/**
 * Get stardust by confidence range (for analytics/MAB)
 */
export const getStardustByConfidenceRange = query({
  args: {
    userId: v.string(),
    minConfidence: v.number(),
    maxConfidence: v.number(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const allStardust = await ctx.db
      .query("stardust")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const inRange = allStardust.filter(
      s => s.confidence >= args.minConfidence && s.confidence <= args.maxConfidence
    );
    
    return inRange;
  },
});

