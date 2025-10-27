/**
 * Stardust Mutations - Crystal Pattern (v.any() + Schema Validation)
 * 
 * Mutations for managing stardust (parallel species to crystals).
 * Stardust represents "What You Do" - concrete project potentials that evolve into star organisms.
 * 
 * 🌟 STARDUST SYSTEM:
 * - Parallel species to crystals ("What You Do" vs "Who You Are")
 * - Code-based detection (zero LLM cost)
 * - Flows through crystal dam alongside shards
 * - Evolves into star organisms (projects)
 * 
 * 🏗️ ARCHITECTURE PATTERN:
 * - Follows Crystal atomic mutation pattern (crystalAtomicMutations.ts)
 * - Uses v.any() in mutation args (no rigid validators)
 * - Schema validates at insert/patch time (single source of truth)
 * - HTTP layer does direct passthrough (no field mapping)
 * - Benefits: Zero validator errors, works with any naming convention
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { stardustCreateValidator, stardustUpdateValidator } from "./types/stardust";


/**
 * Create a new stardust
 */
export const createStardust = mutation({
  args: {
    stardustData: stardustCreateValidator,
  },
  returns: v.id("stardust"),
  handler: async (ctx, { stardustData }) => {
    const now = Date.now();
    
    // Add required fields and defaults - Crystal Pattern
    const completeData = {
      ...stardustData,
      detectedAt: stardustData.detectedAt ?? now,
      detectionMethod: stardustData.detectionMethod ?? "code_based",
      lifecycleStage: stardustData.lifecycleStage ?? "embryo",
      health: stardustData.health ?? 0.5,
      energy: stardustData.energy ?? 0.5,
      promoted: false,
      relatedCrystalIds: stardustData.relatedCrystalIds ?? [],
      symbioticPairs: stardustData.symbioticPairs ?? [],
      createdAt: now,
      updatedAt: now,
    };
    
    return await ctx.db.insert("stardust", completeData);
  },
});


/**
 * Update a stardust - Crystal Pattern (v.any() + schema validation)
 * 
 * Following established Crystal atomic mutation pattern.
 */
export const updateStardust = mutation({
  args: {
    stardustId: v.id("stardust"),
    updates: stardustUpdateValidator,
  },
  returns: v.id("stardust"),
  handler: async (ctx, { stardustId, updates }) => {
    const now = Date.now();
    
    const updateData = {
      ...updates,
      updatedAt: now,
      // Track lifecycle evolution if stage changed
      ...(updates.lifecycleStage && { lastEvolution: now }),
    };
    
    await ctx.db.patch(stardustId, updateData);
    
    return stardustId;
  },
});


/**
 * Mark a stardust as promoted (when converted to star organism/project)
 * Thread-safe: prevents double promotion
 */
export const promoteStardust = mutation({
  args: {
    stardustId: v.id("stardust"),
    projectId: v.id("projects"),
    confidenceAtPromotion: v.number(),
  },
  returns: v.id("stardust"),
  handler: async (ctx, args) => {
    const stardust = await ctx.db.get(args.stardustId);
    if (!stardust) {
      throw new Error("Stardust not found");
    }
    if (stardust.promoted) {
      throw new Error(`Stardust ${args.stardustId} already promoted to project ${stardust.promotedToProjectId}`);
    }
    
    await ctx.db.patch(args.stardustId, {
      promoted: true,
      promotedAt: Date.now(),
      promotedToProjectId: args.projectId,
      confidenceAtPromotion: args.confidenceAtPromotion,
      lifecycleStage: "transcendent",
      updatedAt: Date.now(),
    });
    
    return args.stardustId;
  },
});


/**
 * Delete a stardust
 */
export const deleteStardust = mutation({
  args: {
    stardustId: v.id("stardust"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.stardustId);
    return null;
  },
});


/**
 * Batch create multiple stardust - Crystal Pattern (for efficient bulk operations)
 * 
 * Following Crystal Pattern: accepts any data structure, schema validates at insert
 */
export const batchCreateStardust = mutation({
  args: {
    stardustList: v.array(stardustCreateValidator),
  },
  returns: v.array(v.id("stardust")),
  handler: async (ctx, { stardustList }) => {
    const now = Date.now();
    const createdIds: any[] = [];
    
    for (const stardustData of stardustList) {
      const completeData = {
        ...stardustData,
        detectedAt: stardustData.detectedAt ?? now,
        detectionMethod: stardustData.detectionMethod ?? "code_based",
        lifecycleStage: stardustData.lifecycleStage ?? "embryo",
        health: stardustData.health ?? 0.5,
        energy: stardustData.energy ?? 0.5,
        promoted: false,
        relatedCrystalIds: stardustData.relatedCrystalIds ?? [],
        symbioticPairs: stardustData.symbioticPairs ?? [],
        createdAt: now,
        updatedAt: now,
      };
      
      createdIds.push(await ctx.db.insert("stardust", completeData));
    }
    
    return createdIds;
  },
});


/**
 * Batch update multiple stardust atomically
 * Crystal Pattern: Accepts any data structure, schema validates at update
 */
export const batchUpdateStardust = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id("stardust"),
      data: stardustUpdateValidator,
    })),
  },
  returns: v.array(v.id("stardust")),
  handler: async (ctx, { updates }) => {
    const now = Date.now();
    const updatedIds: any[] = [];
    
    for (const update of updates) {
      await ctx.db.patch(update.id, {
        ...update.data,
        updatedAt: now,
      });
      updatedIds.push(update.id);
    }
    
    return updatedIds;
  },
});


/**
 * Evolve stardust lifecycle stage (manual or automated evolution)
 * Crystal Pattern: Accepts any string for lifecycle stage (schema validates)
 */
export const evolveStardustLifecycle = mutation({
  args: {
    stardustId: v.id("stardust"),
    newStage: v.string(),
    healthDelta: v.optional(v.number()),
    energyDelta: v.optional(v.number()),
  },
  returns: v.id("stardust"),
  handler: async (ctx, args) => {
    const stardust = await ctx.db.get(args.stardustId);
    if (!stardust) {
      throw new Error("Stardust not found");
    }
    
    const updateData: any = {
      lifecycleStage: args.newStage,
      lastEvolution: Date.now(),
      updatedAt: Date.now(),
    };
    
    // Apply health and energy deltas if provided
    if (args.healthDelta !== undefined) {
      updateData.health = Math.max(0, Math.min(1, stardust.health + args.healthDelta));
    }
    
    if (args.energyDelta !== undefined) {
      updateData.energy = Math.max(0, Math.min(1, stardust.energy + args.energyDelta));
    }
    
    await ctx.db.patch(args.stardustId, updateData);
    
    return args.stardustId;
  },
});


/**
 * Batch delete multiple stardust - Production ready with chunking
 * 
 * Handles large-scale stardust deletion with proper error handling and chunking.
 * Respects Convex limits and provides comprehensive reporting.
 */
export const batchDeleteStardust = mutation({
  args: {
    stardustIds: v.array(v.id("stardust")),
  },
  returns: v.object({
    success: v.boolean(),
    results: v.array(v.object({
      id: v.id("stardust"),
      success: v.boolean(),
      error: v.optional(v.string()),
    })),
    totalOperations: v.number(),
    successfulOperations: v.number(),
    failedOperations: v.number(),
    chunksProcessed: v.number(),
  }),
  handler: async (ctx, { stardustIds }) => {
    const BATCH_SIZE = 1000; // Well under Convex limit of 16,000
    const chunks = [];
    
    // Split operations into chunks to respect Convex limits
    for (let i = 0; i < stardustIds.length; i += BATCH_SIZE) {
      chunks.push(stardustIds.slice(i, i + BATCH_SIZE));
    }
    
    const allResults: Array<{
      id: Id<"stardust">;
      success: boolean;
      error?: string;
    }> = [];
    
    let totalSuccessful = 0;
    let totalFailed = 0;
    
    // Process each chunk atomically
    for (const chunk of chunks) {
      const chunkResults: Array<{
        id: Id<"stardust">;
        success: boolean;
        error?: string;
      }> = [];
      
      let chunkSuccessful = 0;
      let chunkFailed = 0;
      
      // Process deletions in chunk sequentially for consistency
      for (const stardustId of chunk) {
        try {
          await ctx.db.delete(stardustId);
          
          chunkResults.push({
            id: stardustId,
            success: true,
          });
          chunkSuccessful++;
          
        } catch (error) {
          chunkResults.push({
            id: stardustId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          chunkFailed++;
        }
      }
      
      allResults.push(...chunkResults);
      totalSuccessful += chunkSuccessful;
      totalFailed += chunkFailed;
    }
    
    return {
      success: totalFailed === 0,
      results: allResults,
      totalOperations: stardustIds.length,
      successfulOperations: totalSuccessful,
      failedOperations: totalFailed,
      chunksProcessed: chunks.length,
    };
  },
});

/**
 * Create symbiotic relationship between stardust and crystal
 */
export const createSymbioticPair = mutation({
  args: {
    stardustId: v.id("stardust"),
    crystalId: v.string(),
    pairDescription: v.string(),
  },
  returns: v.id("stardust"),
  handler: async (ctx, args) => {
    const stardust = await ctx.db.get(args.stardustId);
    if (!stardust) {
      throw new Error("Stardust not found");
    }
    
    // Add crystal to related crystals if not already present
    const relatedCrystalIds = stardust.relatedCrystalIds || [];
    if (!relatedCrystalIds.includes(args.crystalId)) {
      relatedCrystalIds.push(args.crystalId);
    }
    
    // Add symbiotic pair
    const symbioticPairs = stardust.symbioticPairs || [];
    const pairId = `${args.stardustId}_${args.crystalId}`;
    if (!symbioticPairs.includes(pairId)) {
      symbioticPairs.push(pairId);
    }
    
    await ctx.db.patch(args.stardustId, {
      relatedCrystalIds: relatedCrystalIds,
      symbioticPairs: symbioticPairs,
      updatedAt: Date.now(),
    });
    
    return args.stardustId;
  },
});

