/**
 * Project Seeds Mutations
 * 
 * Mutations for managing project seeds (code-based detection).
 * Seeds are potential projects identified from shard patterns.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";


/**
 * Create a new project seed
 */
export const createProjectSeed = mutation({
  args: {
    userId: v.string(),
    seedId: v.string(),
    name: v.string(),
    description: v.string(),
    confidence: v.number(),
    sourceShardIds: v.array(v.string()),
    keywords: v.array(v.string()),
    dimension: v.string(),
    suggestedProjectName: v.string(),
    suggestedProjectDescription: v.string(),
    suggestedDomain: v.string(),
    suggestedComplexity: v.number(),
    suggestedTimeHorizon: v.string(),
    relatedNoteIds: v.array(v.string()),
    relatedConversationIds: v.array(v.string()),
    shardCount: v.number(),
    evidenceStrength: v.string(),
  },
  returns: v.id("projectSeeds"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const seedId = await ctx.db.insert("projectSeeds", {
      userId: args.userId,
      seedId: args.seedId,
      name: args.name,
      description: args.description,
      detectedAt: now,
      detectionMethod: "code_based",
      confidence: args.confidence,
      sourceShardIds: args.sourceShardIds,
      keywords: args.keywords,
      dimension: args.dimension,
      suggestedProjectName: args.suggestedProjectName,
      suggestedProjectDescription: args.suggestedProjectDescription,
      suggestedDomain: args.suggestedDomain,
      suggestedComplexity: args.suggestedComplexity,
      suggestedTimeHorizon: args.suggestedTimeHorizon,
      relatedNoteIds: args.relatedNoteIds,
      relatedConversationIds: args.relatedConversationIds,
      shardCount: args.shardCount,
      evidenceStrength: args.evidenceStrength,
      promoted: false,
      createdAt: now,
      updatedAt: now,
    });
    
    return seedId;
  },
});


/**
 * Update a project seed (e.g., add more shards, update confidence)
 */
export const updateProjectSeed = mutation({
  args: {
    seedId: v.id("projectSeeds"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      confidence: v.optional(v.number()),
      sourceShardIds: v.optional(v.array(v.string())),
      keywords: v.optional(v.array(v.string())),
      shardCount: v.optional(v.number()),
      evidenceStrength: v.optional(v.string()),
      suggestedProjectName: v.optional(v.string()),
      suggestedProjectDescription: v.optional(v.string()),
      suggestedDomain: v.optional(v.string()),
      suggestedComplexity: v.optional(v.number()),
      suggestedTimeHorizon: v.optional(v.string()),
    }),
  },
  returns: v.id("projectSeeds"),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.seedId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
    
    return args.seedId;
  },
});


/**
 * Mark a seed as promoted (when converted to project)
 */
export const promoteSeed = mutation({
  args: {
    seedId: v.id("projectSeeds"),
    projectId: v.id("projects"),
    confidenceAtPromotion: v.number(),
  },
  returns: v.id("projectSeeds"),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.seedId, {
      promoted: true,
      promotedAt: Date.now(),
      promotedToProjectId: args.projectId,
      confidenceAtPromotion: args.confidenceAtPromotion,
      updatedAt: Date.now(),
    });
    
    return args.seedId;
  },
});


/**
 * Delete a project seed
 */
export const deleteProjectSeed = mutation({
  args: {
    seedId: v.id("projectSeeds"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.seedId);
    return null;
  },
});
