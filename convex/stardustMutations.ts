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


/**
 * Create a new stardust
 */
export const createStardust = mutation({
  args: {
    userId: v.string(),
    stardustId: v.string(),
    name: v.string(),
    description: v.string(),
    confidence: v.number(),
    sourceShardIds: v.array(v.string()),
    keywords: v.array(v.string()),
    dimension: v.string(),
    suggestedProjectName: v.string(),
    suggestedProjectDescription: v.string(),
    suggestedDomain: v.union(
      v.literal("academic"),
      v.literal("creative"),
      v.literal("business"),
      v.literal("skill_development"),
      v.literal("personal"),
      v.literal("technical"),
      v.literal("unknown")
    ),
    suggestedComplexity: v.number(),
    suggestedTimeHorizon: v.string(),
    relatedNoteIds: v.array(v.string()),
    relatedConversationIds: v.array(v.string()),
    shardCount: v.number(),
    evidenceStrength: v.union(
      v.literal("weak"),
      v.literal("moderate"),
      v.literal("strong")
    ),
    // Optional fields
    lifecycleStage: v.optional(v.union(
      v.literal("embryo"),
      v.literal("juvenile"),
      v.literal("mature"),
      v.literal("elder"),
      v.literal("transcendent")
    )),
    health: v.optional(v.number()),
    energy: v.optional(v.number()),
    detectionMethod: v.optional(v.string()),
  },
  returns: v.id("stardust"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const stardustId = await ctx.db.insert("stardust", {
      userId: args.userId,
      stardustId: args.stardustId,
      name: args.name,
      description: args.description,
      keywords: args.keywords,
      dimension: args.dimension,
      detectedAt: now,
      detectionMethod: args.detectionMethod || "code_based",
      confidence: args.confidence,
      evidenceStrength: args.evidenceStrength,
      sourceShardIds: args.sourceShardIds,
      shardCount: args.shardCount,
      relatedNoteIds: args.relatedNoteIds,
      relatedConversationIds: args.relatedConversationIds,
      lifecycleStage: args.lifecycleStage || "embryo",
      health: args.health ?? 0.5,
      energy: args.energy ?? 0.5,
      suggestedProjectName: args.suggestedProjectName,
      suggestedProjectDescription: args.suggestedProjectDescription,
      suggestedDomain: args.suggestedDomain,
      suggestedComplexity: args.suggestedComplexity,
      suggestedTimeHorizon: args.suggestedTimeHorizon,
      promoted: false,
      createdAt: now,
      updatedAt: now,
      relatedCrystalIds: [],
      symbioticPairs: [],
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
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      confidence: v.optional(v.number()),
      sourceShardIds: v.optional(v.array(v.string())),
      keywords: v.optional(v.array(v.string())),
      shardCount: v.optional(v.number()),
      evidenceStrength: v.optional(v.union(
        v.literal("weak"),
        v.literal("moderate"),
        v.literal("strong")
      )),
      suggestedProjectName: v.optional(v.string()),
      suggestedProjectDescription: v.optional(v.string()),
      suggestedDomain: v.optional(v.union(
        v.literal("academic"),
        v.literal("creative"),
        v.literal("business"),
        v.literal("skill_development"),
        v.literal("personal"),
        v.literal("technical"),
        v.literal("unknown")
      )),
      suggestedComplexity: v.optional(v.number()),
      suggestedTimeHorizon: v.optional(v.string()),
      lifecycleStage: v.optional(v.union(
        v.literal("embryo"),
        v.literal("juvenile"),
        v.literal("mature"),
        v.literal("elder"),
        v.literal("transcendent")
      )),
      health: v.optional(v.number()),
      energy: v.optional(v.number()),
      relatedCrystalIds: v.optional(v.array(v.string())),
      symbioticPairs: v.optional(v.array(v.string())),
    }),
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
 * Batch create multiple stardust (for efficient bulk operations)
 */
export const batchCreateStardust = mutation({
  args: {
    stardustList: v.array(v.object({
      userId: v.string(),
      stardustId: v.string(),
      name: v.string(),
      description: v.string(),
      confidence: v.number(),
      sourceShardIds: v.array(v.string()),
      keywords: v.array(v.string()),
      dimension: v.string(),
      suggestedProjectName: v.string(),
      suggestedProjectDescription: v.string(),
      suggestedDomain: v.union(
        v.literal("academic"),
        v.literal("creative"),
        v.literal("business"),
        v.literal("skill_development"),
        v.literal("personal"),
        v.literal("technical"),
        v.literal("unknown")
      ),
      suggestedComplexity: v.number(),
      suggestedTimeHorizon: v.string(),
      relatedNoteIds: v.array(v.string()),
      relatedConversationIds: v.array(v.string()),
      shardCount: v.number(),
      evidenceStrength: v.union(
        v.literal("weak"),
        v.literal("moderate"),
        v.literal("strong")
      ),
    })),
  },
  returns: v.array(v.id("stardust")),
  handler: async (ctx, args) => {
    const now = Date.now();
    const createdIds: any[] = [];
    
    for (const stardustData of args.stardustList) {
      const stardustId = await ctx.db.insert("stardust", {
        ...stardustData,
        detectedAt: now,
        detectionMethod: "code_based",
        lifecycleStage: "embryo",
        health: 0.5,
        energy: 0.5,
        promoted: false,
        createdAt: now,
        updatedAt: now,
        relatedCrystalIds: [],
        symbioticPairs: [],
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
    newStage: v.union(
      v.literal("embryo"),
      v.literal("juvenile"),
      v.literal("mature"),
      v.literal("elder"),
      v.literal("transcendent")
    ),
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
      relatedCrystalIds,
      symbioticPairs,
      updatedAt: Date.now(),
    });
    
    return args.stardustId;
  },
});

