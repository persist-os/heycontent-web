import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { 
  crystalShardUpdateValidator,
  shardStatusValidator,
  shardSourceTypeValidator,
  shardExtractionMethodValidator,
  shardRecencyWeightValidator
} from "./types/shard";

/**
 * Shard Mutations
 * 
 * All shard-specific mutation operations.
 * Separate from crystal mutations for clean architecture.
 */

/**
 * Batch mutation function for efficient shard operations
 *
 * Handles batch create, update, and delete operations for crystal_shards table.
 * Follows the optimized pattern for minimal code and maximum efficiency.
 *
 * @param operations - Array of operation objects
 *
 * @example
 * ```typescript
 * // Batch create multiple shards
 * const result = await batchMutateShards({
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
 * ```
 */
export const batchMutateShards = mutation({
  args: {
    operations: v.array(v.object({
      type: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
      data: v.optional(v.any()),
      id: v.optional(v.id("crystal_shards")),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    results: v.array(v.object({
      operation: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
      success: v.boolean(),
      id: v.optional(v.id("crystal_shards")),
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
      id?: Id<"crystal_shards">;
      error?: string;
    }> = [];

    let successfulOperations = 0;
    let failedOperations = 0;

    // Process each operation in the batch
    for (const op of operations) {
      try {
        let resultId: Id<"crystal_shards"> | undefined;

        switch (op.type) {
          case "create":
            if (!op.data) {
              throw new Error("Data is required for create operations");
            }
            
            // Ensure new shards get proper initial status
            const shardData = { ...op.data };
            if (!shardData.shard_status) {
              shardData.shard_status = "unprocessed";
            }
            
            resultId = await ctx.db.insert("crystal_shards", {
              ...shardData,
              createdAt: shardData.createdAt || Date.now(),
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
            
            const existingShard = await ctx.db.get(op.id);
            if (!existingShard) {
              throw new Error("Shard not found");
            }
            
            // Validate status transitions to prevent race conditions
            const updateData: any = { ...op.data };
            if (updateData.shard_status) {
              if (updateData.shard_status === "used_for_crystal" && 
                  (existingShard as any).shard_status === "used_for_crystal") {
                throw new Error(`Shard ${op.id} already used in crystal ${(existingShard as any).used_in_crystal_id}`);
              }
            }
            
            // Handle INCREMENT operations for reference counting
            if (updateData.reference_count === "INCREMENT") {
              updateData.reference_count = ((existingShard as any).reference_count || 0) + 1;
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
 * Single shard mutation function
 * 
 * Flexible mutation that can create, update, or delete a single shard.
 * Simpler and more maintainable than separate functions.
 */
export const mutateShard = mutation({
  args: {
    operation: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
    id: v.optional(v.id("crystal_shards")),
    data: v.optional(v.any()), // Use flexible validation for shard data
  },
  returns: v.union(v.id("crystal_shards"), v.null()),
  handler: async (ctx, { operation, id, data }) => {
    switch (operation) {
      case "create":
        if (!data) throw new Error("Data is required for create operation");
        const shardData = { ...data };
        if (!shardData.shard_status) {
          shardData.shard_status = "unprocessed";
        }
        if (shardData.reference_count === undefined) {
          shardData.reference_count = 0;
        }
        const shardId = await ctx.db.insert("crystal_shards", {
          ...shardData,
          createdAt: shardData.createdAt || Date.now(),
          updatedAt: Date.now(),
        });
        return shardId;

      case "update":
        if (!id) throw new Error("ID is required for update operation");
        if (!data) throw new Error("Data is required for update operation");
        
        const existingShard = await ctx.db.get(id);
        if (!existingShard) throw new Error("Shard not found");
        
        // Validate status transitions to prevent race conditions
        const updateData: any = { ...data };
        if (updateData.shard_status) {
          if (updateData.shard_status === "used_for_crystal" && 
              (existingShard as any).shard_status === "used_for_crystal") {
            throw new Error(`Shard ${id} already used in crystal ${(existingShard as any).used_in_crystal_id}`);
          }
        }
        
        if (updateData.reference_count === "INCREMENT") {
          updateData.reference_count = ((existingShard as any).reference_count || 0) + 1;
        }
        
        await ctx.db.patch(id, {
          ...updateData,
          updatedAt: Date.now(),
        });
        return id;

      case "delete":
        if (!id) throw new Error("ID is required for delete operation");
        await ctx.db.delete(id);
        return null;

      default:
        throw new Error(`Unknown operation type: ${operation}`);
    }
  }
});

