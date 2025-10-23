import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  crystalShardUpdateValidator,
  crystalUpdateValidator,
  lifecycleStageValidator,
} from "./types/crystal";

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

/**
 * Evolve crystal lifecycle stage
 * Parallel to evolveStardustLifecycle - crystals now have lifecycle management
 * 
 * Lifecycle stages:
 * - embryo: Newly formed from shards
 * - juvenile: Building evidence and confidence
 * - mature: Well-established pattern
 * - elder: Long-standing, deeply understood trait
 */
export const evolveCrystalLifecycle = mutation({
  args: {
    crystalId: v.id("crystals"),
    newStage: lifecycleStageValidator,
    healthDelta: v.optional(v.number()),
    energyDelta: v.optional(v.number()),
  },
  returns: v.id("crystals"),
  handler: async (ctx, args) => {
    const crystal = await ctx.db.get(args.crystalId);
    if (!crystal) {
      throw new Error("Crystal not found");
    }
    
    const updateData: any = {
      lifecycleStage: args.newStage,
      lastEvolution: Date.now(),
      updatedAt: Date.now(),
    };
    
    // Apply health delta if provided (clamp to 0-1 range)
    if (args.healthDelta !== undefined && crystal.health !== undefined) {
      updateData.health = Math.max(0, Math.min(1, crystal.health + args.healthDelta));
    }
    
    // Apply energy delta if provided (clamp to 0-1 range)
    if (args.energyDelta !== undefined && crystal.energy !== undefined) {
      updateData.energy = Math.max(0, Math.min(1, crystal.energy + args.energyDelta));
    }
    
    await ctx.db.patch(args.crystalId, updateData);
    
    return args.crystalId;
  },
});