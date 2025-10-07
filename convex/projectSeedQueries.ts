/**
 * Project Seed Queries
 * 
 * Convex queries for fetching project seed crystals (crystal_type="project_seed")
 * These are emergent project opportunities detected by the crystal formation agent.
 * 
 * Seeds represent topic domains with sustained user interest that could become projects.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all project seeds for a user
 * 
 * Returns project seed crystals (not yet promoted to projects) with optional filtering
 * by confidence level. Seeds are returned in descending order by confidence score.
 * 
 * @param userId - User ID
 * @param minConfidence - Optional minimum confidence threshold (0-1)
 * @param includePromoted - Whether to include already-promoted seeds (default: false)
 * @param limit - Optional maximum number of seeds to return
 * 
 * @returns Array of project seed crystals with all metadata
 */
export const getProjectSeeds = query({
  args: {
    userId: v.string(),
    minConfidence: v.optional(v.number()),
    includePromoted: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  
  handler: async (ctx, { userId, minConfidence, includePromoted, limit }) => {
    console.log(`🌱 [GET PROJECT SEEDS] Fetching seeds for user ${userId}`);
    
    // Query crystals by user and type
    let query = ctx.db
      .query("crystals")
      .withIndex("by_type", (q) => 
        q.eq("userId", userId).eq("crystal_type", "project_seed")
      );
    
    // Filter by promotion status
    if (!includePromoted) {
      query = query.filter((q) => 
        q.or(
          q.eq(q.field("auto_promoted"), undefined),
          q.eq(q.field("auto_promoted"), false)
        )
      );
    }
    
    // Apply confidence filter if provided
    if (minConfidence !== undefined) {
      query = query.filter((q) => {
        // confidence_score is string ("low", "medium", "high", "very_high")
        // Convert to numeric for comparison
        const score = q.field("confidence_score");
        return q.or(
          q.eq(score, "high"),
          q.eq(score, "very_high")
        );
      });
    }
    
    // Apply limit and collect results
    const seeds = limit 
      ? await query.take(limit)
      : await query.collect();
    
    // Sort by confidence score (highest first) after collection
    seeds.sort((a, b) => {
      const confidenceOrder = { "very_high": 4, "high": 3, "moderate": 2, "developing": 1 };
      const aScore = confidenceOrder[a.confidence_score as keyof typeof confidenceOrder] || 0;
      const bScore = confidenceOrder[b.confidence_score as keyof typeof confidenceOrder] || 0;
      return bScore - aScore;
    });
    
    console.log(`✅ [GET PROJECT SEEDS] Found ${seeds.length} project seeds`);
    
    return seeds;
  },
});

/**
 * Get a specific project seed by ID
 * 
 * @param userId - User ID (for security)
 * @param seedId - Crystal ID of the seed (crystal_id field, NOT Convex _id)
 * 
 * @returns Project seed crystal or null if not found
 */
export const getProjectSeedById = query({
  args: {
    userId: v.string(),
    seedId: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  
  handler: async (ctx, { userId, seedId }) => {
    console.log(`🌱 [GET SEED BY ID] Fetching seed ${seedId} for user ${userId}`);
    
    // Find seed by crystal_id field
    const seed = await ctx.db
      .query("crystals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("crystal_id"), seedId),
          q.eq(q.field("crystal_type"), "project_seed")
        )
      )
      .first();
    
    if (seed) {
      console.log(`✅ [GET SEED BY ID] Found seed: ${seed.name}`);
    } else {
      console.warn(`⚠️ [GET SEED BY ID] Seed not found: ${seedId}`);
    }
    
    return seed || null;
  },
});

/**
 * Get project seeds ready for promotion
 * 
 * Returns seeds that meet the promotion criteria:
 * - Not yet promoted (auto_promoted = false or undefined)
 * - Confidence above threshold
 * - Recent activity (updated in last 30 days)
 * 
 * Used by the lifecycle manager to find seeds ready for auto-promotion.
 * 
 * @param userId - User ID
 * @param confidenceThreshold - Minimum confidence for promotion (MAB-learned per user)
 * 
 * @returns Array of seeds ready for promotion
 */
export const getSeedsReadyForPromotion = query({
  args: {
    userId: v.string(),
    confidenceThreshold: v.number(),
  },
  returns: v.array(v.any()),
  
  handler: async (ctx, { userId, confidenceThreshold }) => {
    console.log(`🌱 [SEEDS READY FOR PROMOTION] Checking for user ${userId}, threshold: ${confidenceThreshold}`);
    
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Get unpromoted project seeds
    const seeds = await ctx.db
      .query("crystals")
      .withIndex("by_type", (q) => 
        q.eq("userId", userId).eq("crystal_type", "project_seed")
      )
      .filter((q) => 
        q.and(
          // Not yet promoted
          q.or(
            q.eq(q.field("auto_promoted"), undefined),
            q.eq(q.field("auto_promoted"), false)
          ),
          // Recent activity (updated in last 30 days)
          q.gte(q.field("updatedAt"), thirtyDaysAgo / 1000) // updatedAt is in seconds
        )
      )
      .order("desc")
      .collect();
    
    // Filter by confidence threshold (confidence_score is string, convert to numeric)
    const confidenceMap: Record<string, number> = {
      "developing": 0.3,
      "moderate": 0.5,
      "high": 0.7,
      "very_high": 0.9,
    };
    
    const readySeeds = seeds.filter(seed => {
      const confidence = confidenceMap[seed.confidence_score as string] || 0;
      return confidence >= confidenceThreshold;
    });
    
    console.log(`✅ [SEEDS READY FOR PROMOTION] Found ${readySeeds.length}/${seeds.length} seeds above threshold`);
    
    return readySeeds;
  },
});

/**
 * Get project seeds with their related content
 * 
 * Returns seeds along with counts of related notes and conversations.
 * Useful for displaying seed richness in the UI.
 * 
 * @param userId - User ID
 * @param limit - Optional maximum number of seeds to return
 * 
 * @returns Array of seeds with content counts
 */
export const getSeedsWithContentCounts = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    seed: v.any(),
    noteCount: v.number(),
    conversationCount: v.number(),
    totalContentCount: v.number(),
  })),
  
  handler: async (ctx, { userId, limit }) => {
    console.log(`🌱 [SEEDS WITH CONTENT] Fetching seeds with content counts for user ${userId}`);
    
    // Get unpromoted seeds
    const query = ctx.db
      .query("crystals")
      .withIndex("by_type", (q) => 
        q.eq("userId", userId).eq("crystal_type", "project_seed")
      )
      .filter((q) => 
        q.or(
          q.eq(q.field("auto_promoted"), undefined),
          q.eq(q.field("auto_promoted"), false)
        )
      )
      .order("desc");
    
    const seeds = limit 
      ? await query.take(limit)
      : await query.collect();
    
    // Add content counts
    const seedsWithCounts = seeds.map(seed => {
      const noteCount = seed.related_note_ids?.length || 0;
      const conversationCount = seed.related_conversation_ids?.length || 0;
      
      return {
        seed,
        noteCount,
        conversationCount,
        totalContentCount: noteCount + conversationCount,
      };
    });
    
    // Sort by total content count (richest seeds first)
    seedsWithCounts.sort((a, b) => b.totalContentCount - a.totalContentCount);
    
    console.log(`✅ [SEEDS WITH CONTENT] Returning ${seedsWithCounts.length} seeds`);
    
    return seedsWithCounts;
  },
});
