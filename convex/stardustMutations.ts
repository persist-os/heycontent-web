/**
 * Stardust Mutations
 * 
 * Mutations for managing stardust (parallel species to crystals).
 * Stardust represents "What You Do" - concrete project potentials that evolve into star organisms.
 * 
 * 🌟 STARDUST SYSTEM:
 * - Parallel species to crystals ("What You Do" vs "Who You Are")
 * - Code-based detection (zero LLM cost)
 * - Flows through crystal dam alongside shards
 * - Evolves into star organisms (projects)
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  stardustCreateValidator,
  stardustUpdateValidator,
  stardustLifecycleStageValidator,
} from "./types/stardust";


/**
 * Create a new stardust
 */
export const createStardust = mutation({
  args: stardustCreateValidator.fields,
  returns: v.id("stardust"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const stardustId = await ctx.db.insert("stardust", {
      userId: args.userId,
      stardust_id: args.stardust_id,
      name: args.name,
      description: args.description,
      keywords: args.keywords,
      dimension: args.dimension,
      detected_at: now,
      detection_method: args.detection_method || "code_based",
      confidence: args.confidence,
      evidence_strength: args.evidence_strength,
      source_shard_ids: args.source_shard_ids,
      shard_count: args.shard_count,
      related_note_ids: args.related_note_ids,
      related_conversation_ids: args.related_conversation_ids,
      lifecycleStage: args.lifecycleStage || "embryo",
      health: args.health ?? 0.5,
      energy: args.energy ?? 0.5,
      suggested_project_name: args.suggested_project_name,
      suggested_project_description: args.suggested_project_description,
      suggested_domain: args.suggested_domain,
      suggested_complexity: args.suggested_complexity,
      suggested_time_horizon: args.suggested_time_horizon,
      promoted: false,
      promoted_at: undefined,
      promoted_to_project_id: undefined,
      confidence_at_promotion: undefined,
      createdAt: now,
      updatedAt: now,
      lastEvolution: undefined,
      related_crystal_ids: [],
      symbiotic_pairs: [],
    });
    
    return stardustId;
  },
});


/**
 * Update a stardust (e.g., add more shards, update confidence, evolve lifecycle)
 */
export const updateStardust = mutation({
  args: {
    stardustId: v.id("stardust"),
    updates: stardustUpdateValidator,
  },
  returns: v.id("stardust"),
  handler: async (ctx, args) => {
    const updateData: any = {
      ...args.updates,
      updatedAt: Date.now(),
    };
    
    // Track lifecycle evolution
    if (args.updates.lifecycleStage) {
      updateData.lastEvolution = Date.now();
    }
    
    await ctx.db.patch(args.stardustId, updateData);
    
    return args.stardustId;
  },
});


/**
 * Mark a stardust as promoted (when converted to star organism/project)
 */
export const promoteStardust = mutation({
  args: {
    stardustId: v.id("stardust"),
    projectId: v.id("projects"),
    confidenceAtPromotion: v.number(),
  },
  returns: v.id("stardust"),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.stardustId, {
      promoted: true,
      promoted_at: Date.now(),
      promoted_to_project_id: args.projectId,
      confidence_at_promotion: args.confidenceAtPromotion,
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
 * Batch create multiple stardust (for efficient bulk operations)
 */
export const batchCreateStardust = mutation({
  args: {
    stardustList: v.array(v.object({
      userId: v.string(),
      stardust_id: v.string(),
      name: v.string(),
      description: v.string(),
      confidence: v.number(),
      source_shard_ids: v.array(v.string()),
      keywords: v.array(v.string()),
      dimension: v.string(),
      suggested_project_name: v.string(),
      suggested_project_description: v.string(),
      suggested_domain: v.string(),
      suggested_complexity: v.number(),
      suggested_time_horizon: v.string(),
      related_note_ids: v.array(v.string()),
      related_conversation_ids: v.array(v.string()),
      shard_count: v.number(),
      evidence_strength: v.string(),
    })),
  },
  returns: v.array(v.id("stardust")),
  handler: async (ctx, args) => {
    const now = Date.now();
    const createdIds: any[] = [];
    
    for (const stardustData of args.stardustList) {
      const stardustId = await ctx.db.insert("stardust", {
        userId: stardustData.userId,
        stardust_id: stardustData.stardust_id,
        name: stardustData.name,
        description: stardustData.description,
        keywords: stardustData.keywords,
        dimension: stardustData.dimension,
        detected_at: now,
        detection_method: "code_based",
        confidence: stardustData.confidence,
        evidence_strength: stardustData.evidence_strength,
        source_shard_ids: stardustData.source_shard_ids,
        shard_count: stardustData.shard_count,
        related_note_ids: stardustData.related_note_ids,
        related_conversation_ids: stardustData.related_conversation_ids,
        lifecycleStage: "embryo",
        health: 0.5,
        energy: 0.5,
        suggested_project_name: stardustData.suggested_project_name,
        suggested_project_description: stardustData.suggested_project_description,
        suggested_domain: stardustData.suggested_domain,
        suggested_complexity: stardustData.suggested_complexity,
        suggested_time_horizon: stardustData.suggested_time_horizon,
        promoted: false,
        promoted_at: undefined,
        promoted_to_project_id: undefined,
        confidence_at_promotion: undefined,
        createdAt: now,
        updatedAt: now,
        lastEvolution: undefined,
        related_crystal_ids: [],
        symbiotic_pairs: [],
      });
      
      createdIds.push(stardustId);
    }
    
    return createdIds;
  },
});


/**
 * Evolve stardust lifecycle stage (manual or automated evolution)
 */
export const evolveStardustLifecycle = mutation({
  args: {
    stardustId: v.id("stardust"),
    newStage: stardustLifecycleStageValidator,
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
    const relatedCrystalIds = stardust.related_crystal_ids || [];
    if (!relatedCrystalIds.includes(args.crystalId)) {
      relatedCrystalIds.push(args.crystalId);
    }
    
    // Add symbiotic pair
    const symbioticPairs = stardust.symbiotic_pairs || [];
    const pairId = `${args.stardustId}_${args.crystalId}`;
    if (!symbioticPairs.includes(pairId)) {
      symbioticPairs.push(pairId);
    }
    
    await ctx.db.patch(args.stardustId, {
      related_crystal_ids: relatedCrystalIds,
      symbiotic_pairs: symbioticPairs,
      updatedAt: Date.now(),
    });
    
    return args.stardustId;
  },
});

