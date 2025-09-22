import { Infer, v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import schema from "./schema";

// TYPES
const crystalShardValidator = schema.tables.crystal_shards.validator;
export type crystal_shard = Infer<typeof crystalShardValidator>;
const crystalValidator = schema.tables.crystals.validator;
export type crystal = Infer<typeof crystalValidator>;

/**
 * Single item mutation for crystal data (legacy function - use batch version for better performance)
 *
 * @deprecated Use `batchMutateCrystalData` for better performance with multiple items
 */
export const mutateCrystalData = mutation({
    args: {
        table: v.union(v.literal("crystal_shards"), v.literal("crystals")),
        operation: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
        data: v.optional(v.any()),
        shardId: v.optional(v.id("crystal_shards")),
        crystalId: v.optional(v.id("crystals")),
    },
    returns: v.union(v.id("crystal_shards"), v.id("crystals"), v.boolean(), v.null()),
    handler: async (ctx, { table, operation, data, shardId, crystalId }) => {
        const id = table === "crystal_shards" ? shardId : crystalId;

        if (operation === "create") {
            // Ensure new shards get proper initial status
            if (table === "crystal_shards" && data) {
                const shardData = { ...data };
                // Set explicit unprocessed status for new shards if not already set
                if (!shardData.shard_status) {
                    shardData.shard_status = "unprocessed";
                }
                return await ctx.db.insert(table, shardData);
            }
            return await ctx.db.insert(table, data!);
        }
        if (operation === "update") { 
            // Handle special operations for programmatic fields
            const updateData: any = { ...data };
            
            // Handle INCREMENT operations for reference counting
            if (table === "crystal_shards" && updateData.reference_count === "INCREMENT") {
                const existingShard = await ctx.db.get(id!);
                if (existingShard) {
                    updateData.reference_count = ((existingShard as any).reference_count || 0) + 1;
                } else {
                    updateData.reference_count = 1;
                }
            }
            
            if (table === "crystals" && updateData.usage_count === "INCREMENT") {
                const existingCrystal = await ctx.db.get(id!);
                if (existingCrystal) {
                    updateData.usage_count = ((existingCrystal as any).usage_count || 0) + 1;
                } else {
                    updateData.usage_count = 1;
                }
            }
            
            await ctx.db.patch(id!, updateData);
            return id!;
        }
        if (operation === "delete") { 
            await ctx.db.delete(id!); 
            return true; 
        }
        return null;
    }
});

// Partial validators for update operations
const crystalShardUpdateValidator = v.object({
    // Core identification (never updated)
    // userId: v.optional(v.string()),                 // Shouldn't change

    // Source metadata (can be updated)
    source: v.optional(v.string()),
    sourceIds: v.optional(v.array(v.string())),
    source_type: v.optional(v.union(v.literal("conversation"), v.literal("note"), v.literal("document"), v.literal("behavior_observation"))),
    extraction_timestamp: v.optional(v.number()),
    extraction_method: v.optional(v.union(v.literal("direct_quote"), v.literal("behavioral_inference"), v.literal("pattern_synthesis"))),

    // Core revelation (can be updated)
    dimension: v.optional(v.string()),
    exact_quote: v.optional(v.string()),
    what_it_reveals: v.optional(v.string()),
    situation_context: v.optional(v.string()),
    why_significant: v.optional(v.string()),

    // Quality indicators (can be updated)
    confidence_level: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    linguistic_intensity: v.optional(v.union(v.literal("weak"), v.literal("moderate"), v.literal("strong"))),
    emotional_weight: v.optional(v.union(v.literal("neutral"), v.literal("mild"), v.literal("strong"))),
    specificity: v.optional(v.union(v.literal("vague"), v.literal("specific"), v.literal("very_specific"))),

    // Pattern connections (can be updated)
    connects_to: v.optional(v.array(v.string())),
    contradicts: v.optional(v.array(v.string())),
    reinforces: v.optional(v.array(v.string())),

    // Temporal data (can be updated)
    temporal_context: v.optional(v.string()),
    recency_weight: v.optional(v.union(v.literal("recent"), v.literal("moderate"), v.literal("old"))),

    // Metadata (updatedAt should always be updated, createdAt never changes)
    updatedAt: v.optional(v.number()),
    last_referenced: v.optional(v.number()),
    reference_count: v.optional(v.union(v.number(), v.literal("INCREMENT"))),
});

const crystalUpdateValidator = v.object({
    // Core identification (some can be updated)
    // userId: v.optional(v.string()),               // Shouldn't change
    // crystal_id: v.optional(v.string()),          // Shouldn't change

    // Crystal definition (can be updated)
    name: v.optional(v.string()),
    crystal_type: v.optional(v.union(
        v.literal("stable_trait"),
        v.literal("behavioral_pattern"),
        v.literal("preference_cluster"),
        v.literal("value_system"),
        v.literal("contextual_adaptation"),
        v.literal("growth_trajectory"),
        v.literal("contradiction_resolution")
    )),
    dimension: v.optional(v.string()),
    secondary_dimensions: v.optional(v.array(v.string())),

    // Consolidated insight (can be updated)
    description: v.optional(v.string()),
    core_insight: v.optional(v.string()),
    detailed_analysis: v.optional(v.string()),

    // Supporting evidence (can be updated)
    shardIds: v.optional(v.array(v.id("crystal_shards"))),
    supporting_quotes: v.optional(v.array(v.string())),

    // Confidence & reliability (can be updated)
    confidence_score: v.optional(v.union(v.literal("developing"), v.literal("moderate"), v.literal("high"), v.literal("very_high"))),
    evidence_strength: v.optional(v.union(v.literal("weak"), v.literal("moderate"), v.literal("strong"), v.literal("overwhelming"))),
    consistency_rating: v.optional(v.union(v.literal("inconsistent"), v.literal("mostly_consistent"), v.literal("very_consistent"))),
    observation_count: v.optional(v.number()),
    time_span_days: v.optional(v.number()),

    // Pattern metadata (can be updated)
    tags: v.optional(v.array(v.string())),
    behavioral_implications: v.optional(v.array(v.string())),
    interaction_guidance: v.optional(v.array(v.string())),

    // Contradictions & nuance (can be updated)
    contradicting_shards: v.optional(v.array(v.id("crystal_shards"))),
    contradiction_analysis: v.optional(v.string()),

    // Evolution tracking (can be updated)
    evolution_history: v.optional(v.array(v.object({
        timestamp: v.number(),
        change_type: v.union(v.literal("strengthened"), v.literal("weakened"), v.literal("refined"), v.literal("contradicted")),
        description: v.string(),
        triggering_shard_id: v.id("crystal_shards")
    }))),
    stability_trend: v.optional(v.union(v.literal("strengthening"), v.literal("stable"), v.literal("weakening"), v.literal("evolving"))),
    last_evolution: v.optional(v.number()),

    // Cross-crystal relationships (can be updated)
    related_crystals: v.optional(v.array(v.id("crystals"))),
    conflicting_crystals: v.optional(v.array(v.id("crystals"))),

    // Utilization metadata (can be updated)
    usage_count: v.optional(v.union(v.number(), v.literal("INCREMENT"))),
    usage_frequency: v.optional(v.number()),
    last_used: v.optional(v.number()),

    // Metadata (updatedAt should be updated, createdAt never changes)
    updatedAt: v.optional(v.number()),
    next_review_due: v.optional(v.number()),
    review_priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
});

/**
 * Batch mutation function for efficient crystal data operations
 *
 * Handles batch create, update, and delete operations for both crystal_shards and crystals
 * tables through a single unified interface. Significantly more efficient than individual
 * operations when dealing with multiple items.
 *
 * @param table - Target table ("crystal_shards" or "crystals")
 * @param operations - Array of operation objects
 *
 * @example
 * ```typescript
 * // Batch create multiple shards
 * const result = await batchMutateCrystalData({
 *   table: "crystal_shards",
 *   operations: [
 *     {
 *       type: "create",
 *       data: { userId: "user1", dimension: "work_style", exact_quote: "I work best in quiet spaces", createdAt: Date.now(), updatedAt: Date.now() }
 *     },
 *     {
 *       type: "create", 
 *       data: { userId: "user1", dimension: "communication", exact_quote: "I prefer written feedback", createdAt: Date.now(), updatedAt: Date.now() }
 *     }
 *   ]
 * });
 *
 * // Batch update multiple crystals
 * await batchMutateCrystalData({
 *   table: "crystals",
 *   operations: [
 *     {
 *       type: "update",
 *       id: "crystal123",
 *       data: { confidence_score: "very_high", updatedAt: Date.now() }
 *     },
 *     {
 *       type: "update",
 *       id: "crystal456", 
 *       data: { usage_count: 5, updatedAt: Date.now() }
 *     }
 *   ]
 * });
 *
 * // Mixed batch operations
 * await batchMutateCrystalData({
 *   table: "crystal_shards",
 *   operations: [
 *     { type: "create", data: { userId: "user1", dimension: "creativity", createdAt: Date.now(), updatedAt: Date.now() } },
 *     { type: "update", id: "shard789", data: { confidence_level: "high", updatedAt: Date.now() } },
 *     { type: "delete", id: "shard999" }
 *   ]
 * });
 * ```
 */
export const batchMutateCrystalData = mutation({
    args: {
        table: v.union(v.literal("crystal_shards"), v.literal("crystals")),
        operations: v.array(v.object({
            type: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
            data: v.optional(v.any()),
            id: v.optional(v.union(v.id("crystal_shards"), v.id("crystals"))),
        })),
    },
    returns: v.object({
        success: v.boolean(),
        results: v.array(v.object({
            operation: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
            success: v.boolean(),
            id: v.optional(v.union(v.id("crystal_shards"), v.id("crystals"))),
            error: v.optional(v.string()),
        })),
        totalOperations: v.number(),
        successfulOperations: v.number(),
        failedOperations: v.number(),
    }),
    handler: async (ctx, { table, operations }) => {
        const results: Array<{
            operation: "create" | "update" | "delete";
            success: boolean;
            id?: Id<"crystal_shards"> | Id<"crystals">;
            error?: string;
        }> = [];

        let successfulOperations = 0;
        let failedOperations = 0;

        // Process each operation in the batch
        for (const op of operations) {
            try {
                let resultId: Id<"crystal_shards"> | Id<"crystals"> | undefined;

                switch (op.type) {
                    case "create":
                        if (!op.data) {
                            throw new Error("Data is required for create operations");
                        }
                        // Ensure new shards get proper initial status
                        if (table === "crystal_shards") {
                            const shardData = { ...op.data };
                            // Set explicit unprocessed status for new shards if not already set
                            if (!shardData.shard_status) {
                                shardData.shard_status = "unprocessed";
                            }
                            resultId = await ctx.db.insert(table, shardData);
                        } else {
                            // For create operations, Convex will validate against the full schema automatically
                            resultId = await ctx.db.insert(table, op.data);
                        }
                        break;

                    case "update":
                        if (!op.id) {
                            throw new Error("ID is required for update operations");
                        }
                        if (!op.data) {
                            throw new Error("Data is required for update operations");
                        }
                        // For update operations, Convex will validate the fields automatically
                        await ctx.db.patch(op.id, op.data);
                        resultId = op.id;
                        break;

                    case "delete":
                        if (!op.id) {
                            throw new Error("ID is required for delete operations");
                        }
                        await ctx.db.delete(op.id);
                        resultId = op.id;
                        break;

                    default:
                        throw new Error(`Unknown operation type: ${op.type}`);
                }

                results.push({
                    operation: op.type,
                    success: true,
                    id: resultId,
                });
                successfulOperations++;

            } catch (error) {
                results.push({
                    operation: op.type,
                    success: false,
                    id: op.id,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
                failedOperations++;
            }
        }

        return {
            success: failedOperations === 0,
            results,
            totalOperations: operations.length,
            successfulOperations,
            failedOperations,
        };
    }
});