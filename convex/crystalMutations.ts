import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  crystalValidator,
  crystalUpdateValidator,
  lifecycleStageValidator,
  crystalTypeValidator,
  confidenceScoreValidator,
  evidenceStrengthValidator,
  consistencyRatingValidator,
  stabilityTrendValidator,
  reviewPriorityValidator,
  evolutionChangeTypeValidator
} from "./types/crystal";

/**
 * Single crystal mutation function
 * 
 * Flexible mutation that can create, update, or delete a single crystal.
 * Simpler and more maintainable than separate functions.
 * 
 * ATOMICITY GUARANTEES:
 * - All shard operations use Promise.all() for parallel atomic execution
 * - Shard validation and updates happen in separate atomic batches
 * - Safe for concurrent multi-instance deployments (Cloud Run, Kubernetes)
 */
export const mutateCrystal = mutation({
  args: {
    operation: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
    id: v.optional(v.id("crystals")),
    data: v.optional(v.any()), // Use flexible validation for crystal data
    shardIds: v.optional(v.array(v.id("crystal_shards"))),
    addShardIds: v.optional(v.array(v.id("crystal_shards"))),
    removeShardIds: v.optional(v.array(v.id("crystal_shards"))),
    releaseShards: v.optional(v.boolean()),
  },
  returns: v.union(v.id("crystals"), v.boolean()),
  handler: async (ctx, { operation, id, data, shardIds, addShardIds, removeShardIds, releaseShards }) => {
    switch (operation) {
      case "create":
        if (!data) throw new Error("Data is required for create operation");
        if (!shardIds || shardIds.length === 0) {
          throw new Error("shard IDs are required for crystal creation");
        }
        
        // Step 1: Validate all shards are available (atomic batch fetch)
        const createTime = Date.now();
        await Promise.all(
          shardIds.map(async (shardId) => {
            const shard = await ctx.db.get(shardId);
            if (!shard) {
              throw new Error(`Shard ${shardId} not found`);
            }
            if (shard.shard_status === "used_for_crystal") {
              throw new Error(`Shard ${shardId} already used in crystal ${shard.used_in_crystal_id}`);
            }
          })
        );
        
        // Step 2: Insert crystal
        const crystalId = await ctx.db.insert("crystals", {
          ...data,
          createdAt: data.createdAt || Date.now(),
          updatedAt: Date.now(),
        });
        
        // Step 3: Mark shards as consumed (atomic parallel operations)
        await Promise.all(
          shardIds.map(shardId =>
            ctx.db.patch(shardId, {
              shard_status: "used_for_crystal",
              used_in_crystal_id: data.crystal_id,
              date_consumed: createTime,
              updatedAt: createTime,
              reserved_by_formation: undefined,
              reserved_at: undefined,
            })
          )
        );
        
        return crystalId;

      case "update":
        if (!id) throw new Error("ID is required for update operation");
        if (!data) throw new Error("Data is required for update operation");
        
        const crystal = await ctx.db.get(id);
        if (!crystal) throw new Error("Crystal not found");
        
        const updateTime = Date.now();
        
        // Handle INCREMENT operations for usage counting
        const updateData: any = { ...data };
        if (updateData.usage_count === "INCREMENT") {
          updateData.usage_count = ((crystal as any).usage_count || 0) + 1;
        }
        
        // Step 1: Update crystal data
        await ctx.db.patch(id, {
          ...updateData,
          updatedAt: updateTime,
        });
        
        // Step 2: Add new shards (validate then mark as consumed atomically)
        if (addShardIds && addShardIds.length > 0) {
          // Validate all shards in parallel
          await Promise.all(
            addShardIds.map(async (shardId) => {
              const shard = await ctx.db.get(shardId);
              if (!shard) throw new Error(`Shard ${shardId} not found`);
              if (shard.shard_status === "used_for_crystal") {
                throw new Error(`Shard ${shardId} already used in crystal ${shard.used_in_crystal_id}`);
              }
            })
          );
          
          // CRITICAL FIX: Update crystal's shardIds array to include new shard IDs
          const currentShardIds = crystal.shardIds || [];
          const updatedShardIds = [...currentShardIds, ...addShardIds];
          await ctx.db.patch(id, {
            shardIds: updatedShardIds,
            observation_count: updatedShardIds.length,
            updatedAt: updateTime,
          });
          
          // Mark all as consumed in parallel
          await Promise.all(
            addShardIds.map(shardId =>
              ctx.db.patch(shardId, {
                shard_status: "used_for_crystal",
                used_in_crystal_id: crystal.crystal_id,
                date_consumed: updateTime,
                updatedAt: updateTime,
                reserved_by_formation: undefined,
                reserved_at: undefined,
              })
            )
          );
        }
        
        // Step 3: Remove shards (return to unprocessed atomically)
        if (removeShardIds && removeShardIds.length > 0) {
          // Fetch and validate all shards in parallel
          const shardsToRemove = await Promise.all(
            removeShardIds.map(async (shardId) => {
              const shard = await ctx.db.get(shardId);
              if (!shard) throw new Error(`Shard ${shardId} not found`);
              return { shardId, shard };
            })
          );
          
          // Update all matching shards in parallel
          await Promise.all(
            shardsToRemove
              .filter(({ shard }) => shard.used_in_crystal_id === crystal.crystal_id)
              .map(({ shardId }) =>
                ctx.db.patch(shardId, {
                  shard_status: "unprocessed",
                  used_in_crystal_id: undefined,
                  date_consumed: undefined,
                  updatedAt: updateTime,
                })
              )
          );
        }
        
        return id;

      case "delete":
        if (!id) throw new Error("ID is required for delete operation");
        
        const crystalToDelete = await ctx.db.get(id);
        if (!crystalToDelete) throw new Error("Crystal not found");
        
        const deleteTime = Date.now();
        
        // Step 1: Release shards if requested (atomic parallel operations)
        if (releaseShards && crystalToDelete.shardIds && crystalToDelete.shardIds.length > 0) {
          // Fetch all shards in parallel
          const shardsToRelease = await Promise.all(
            crystalToDelete.shardIds.map(async (shardId) => {
              const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
              return { shardId: shardId as Id<"crystal_shards">, shard };
            })
          );
          
          // Release all matching shards in parallel
          await Promise.all(
            shardsToRelease
              .filter(({ shard }) => shard && shard.used_in_crystal_id === crystalToDelete.crystal_id)
              .map(({ shardId }) =>
                ctx.db.patch(shardId, {
                  shard_status: "unprocessed",
                  used_in_crystal_id: undefined,
                  date_consumed: undefined,
                  updatedAt: deleteTime,
                })
              )
          );
        }
        
        // Step 2: Delete crystal
        await ctx.db.delete(id);
        return true;

      default:
        throw new Error(`Unknown operation type: ${operation}`);
    }
  }
});

/**
 * Batch mutation function for efficient crystal operations
 *
 * Handles batch create, update, and delete operations for crystals table only.
 * For shard operations, use batchMutateShards from shardMutations.ts
 * 
 * NOTE: Operations are processed sequentially to maintain database consistency.
 * Each operation is atomic, but the batch itself is not a single transaction.
 *
 * @param operations - Array of operation objects
 *
 * @example
 * ```typescript
 * // Batch update multiple crystals
 * await batchMutateCrystals({
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
 * ```
 */
export const batchMutateCrystals = mutation({
    args: {
        operations: v.array(v.object({
            type: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
            data: v.optional(v.any()),
            id: v.optional(v.id("crystals")),
        })),
    },
    returns: v.object({
        success: v.boolean(),
        results: v.array(v.object({
            operation: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
            success: v.boolean(),
            id: v.optional(v.id("crystals")),
            error: v.optional(v.string()),
        })),
        totalOperations: v.number(),
        successfulOperations: v.number(),
        failedOperations: v.number(),
    }),
    handler: async (ctx, { operations }) => {
        const results: Array<{
            operation: "create" | "update" | "delete";
            success: boolean;
            id?: Id<"crystals">;
            error?: string;
        }> = [];

        let successfulOperations = 0;
        let failedOperations = 0;

        // Process each operation in the batch
        for (const op of operations) {
            try {
                let resultId: Id<"crystals"> | undefined;

                switch (op.type) {
                    case "create":
                        if (!op.data) {
                            throw new Error("Data is required for create operations");
                        }
                        
                        resultId = await ctx.db.insert("crystals", {
                          ...op.data,
                          createdAt: op.data.createdAt || Date.now(),
                          updatedAt: Date.now(),
                        });
                        break;

                    case "update":
                        if (!op.id) {
                            throw new Error("ID is required for update operations");
                        }
                        if (!op.data) {
                            throw new Error("Data is required for update operations");
                        }
                        
                        // Handle INCREMENT operations for usage counting
                        const updateData: any = { ...op.data };
                        if (updateData.usage_count === "INCREMENT") {
                          const existingCrystal = await ctx.db.get(op.id);
                          if (existingCrystal) {
                            updateData.usage_count = ((existingCrystal as any).usage_count || 0) + 1;
                          } else {
                            updateData.usage_count = 1;
                          }
                        }
                        
                        await ctx.db.patch(op.id, {
                          ...updateData,
                          updatedAt: Date.now(),
                        });
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
