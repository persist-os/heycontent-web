import { v } from "convex/values";
import { mutation, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Shard Status Management
 * 
 * Provides atomic, validated transitions for crystal shard lifecycle states:
 * - unprocessed: Newly created shards ready for crystal formation
 * - reserved: Temporarily locked during formation to prevent concurrent use
 * - used_for_crystal: Permanently consumed by a crystal
 * - archived: Removed from active use
 * 
 * All mutations validate state transitions and maintain referential integrity.
 */

// Core handler implementing shared status update logic
async function updateShardStatusHandler(
  ctx: MutationCtx,
  shardIds: Id<"crystal_shards">[],
  targetStatus: "unprocessed" | "reserved" | "used_for_crystal" | "archived",
  context?: {
    crystalId?: string;
    formationRunId?: string;
    clearReservation?: boolean;
    clearConsumption?: boolean;
  },
  allowedFrom?: string[],
  skipIfAlreadyInState?: boolean
) {
  const currentTime = Date.now();
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const shardId of shardIds) {
    try {
      const shard = await ctx.db.get(shardId);
      
      if (!shard) {
        errors.push(`Shard ${shardId} not found`);
        failedCount++;
        continue;
      }

      // Skip if already in target state (optional)
      if (skipIfAlreadyInState && shard.shard_status === targetStatus) {
        skippedCount++;
        continue;
      }

      // Validate allowed transitions
      if (allowedFrom && allowedFrom.length > 0) {
        const currentStatus = shard.shard_status || "unprocessed";
        if (!allowedFrom.includes(currentStatus)) {
          errors.push(
            `Shard ${shardId} cannot transition from ${currentStatus} to ${targetStatus}`
          );
          failedCount++;
          continue;
        }
      }

      // Build update object based on target status
      const updateData: any = {
        shard_status: targetStatus,
        updatedAt: currentTime,
      };

      // Handle specific transition contexts
      switch (targetStatus) {
        case "reserved":
          if (context?.formationRunId) {
            updateData.reserved_by_formation = context.formationRunId;
            updateData.reserved_at = currentTime;
          }
          break;

        case "used_for_crystal":
          if (context?.crystalId) {
            updateData.used_in_crystal_id = context.crystalId;
            updateData.date_consumed = currentTime;
            updateData.last_referenced = currentTime;
            // Clear reservation if transitioning from reserved
            if (shard.shard_status === "reserved") {
              updateData.reserved_by_formation = undefined;
              updateData.reserved_at = undefined;
            }
          }
          break;

        case "unprocessed":
          // Clear reservation data
          if (context?.clearReservation) {
            updateData.reserved_by_formation = undefined;
            updateData.reserved_at = undefined;
          }
          // Clear consumption data
          if (context?.clearConsumption) {
            updateData.used_in_crystal_id = undefined;
            updateData.date_consumed = undefined;
          }
          break;

        case "archived":
          // Keep existing metadata for archived shards
          break;
      }

      await ctx.db.patch(shardId, updateData);
      updatedCount++;

    } catch (error) {
      errors.push(`Failed to update shard ${shardId}: ${error}`);
      failedCount++;
    }
  }

  return {
    success: failedCount === 0,
    updatedCount,
    skippedCount,
    failedCount,
    errors,
  };
}

/**
 * Update shard status with validation and context-specific metadata
 * 
 * Handles all shard state transitions with proper validation rules and
 * context-specific field updates. Supports optional constraints like
 * allowed source states and idempotent skip behavior.
 * 
 * @param shardIds - Array of shard IDs to update
 * @param targetStatus - Desired status (unprocessed, reserved, used_for_crystal, archived)
 * @param context - Status-specific metadata (formationRunId, crystalId, etc.)
 * @param allowedFrom - Optional array of valid source states for this transition
 * @param skipIfAlreadyInState - If true, skip shards already in target state
 * @returns Operation results with counts and any error messages
 */
export const updateShardStatus = mutation({
  args: {
    shardIds: v.array(v.id("crystal_shards")),
    targetStatus: v.union(
      v.literal("unprocessed"),
      v.literal("reserved"),
      v.literal("used_for_crystal"),
      v.literal("archived")
    ),
    context: v.optional(v.object({
      crystalId: v.optional(v.string()),
      formationRunId: v.optional(v.string()),
      clearReservation: v.optional(v.boolean()),
      clearConsumption: v.optional(v.boolean()),
    })),
    allowedFrom: v.optional(v.array(v.string())),
    skipIfAlreadyInState: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    updatedCount: v.number(),
    skippedCount: v.number(),
    failedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    return await updateShardStatusHandler(
      ctx,
      args.shardIds,
      args.targetStatus,
      args.context,
      args.allowedFrom,
      args.skipIfAlreadyInState
    );
  },
});

/**
 * Release reserved shards back to unprocessed state
 * 
 * Safely returns reserved shards to the available pool when formation fails
 * or is cancelled. Only releases shards still reserved by the specified
 * formation run, preventing accidental release of shards reserved by other
 * processes or already consumed.
 * 
 * @param shardIds - Array of shard IDs to release
 * @param formationRunId - Formation run that reserved these shards
 * @returns Release results including count of already-consumed shards
 */
export const releaseReservedShards = mutation({
  args: {
    shardIds: v.array(v.id("crystal_shards")),
    formationRunId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    releasedCount: v.number(),
    alreadyConsumedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { shardIds, formationRunId }) => {
    const currentTime = Date.now();
    let releasedCount = 0;
    let alreadyConsumedCount = 0;
    const errors: string[] = [];

    for (const shardId of shardIds) {
      try {
        const shard = await ctx.db.get(shardId);
        if (!shard) {
          errors.push(`Shard ${shardId} not found`);
          continue;
        }

        // Only release if still reserved by THIS formation
        if (shard.shard_status === "reserved" && 
            shard.reserved_by_formation === formationRunId) {
          
          await ctx.db.patch(shardId, {
            shard_status: "unprocessed",
            reserved_by_formation: undefined,
            reserved_at: undefined,
            updatedAt: currentTime,
          });
          
          releasedCount++;
        } else if (shard.shard_status === "used_for_crystal") {
          // Already consumed - this is fine, just count it
          alreadyConsumedCount++;
        } else {
          errors.push(
            `Shard ${shardId} status=${shard.shard_status}, ` +
            `reserved_by=${shard.reserved_by_formation}, ` +
            `expected_formation=${formationRunId}`
          );
        }
      } catch (error) {
        errors.push(`Failed to release shard ${shardId}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      releasedCount,
      alreadyConsumedCount,
      errors,
    };
  },
});

/**
 * Reserve shards for crystal formation
 * 
 * Atomically marks shards as reserved to prevent concurrent formation runs
 * from using the same shards. Accepts shards from unprocessed or already
 * reserved states (to allow re-reserving stuck/old reservations).
 * 
 * @param shardIds - Array of shard IDs to reserve
 * @param formationRunId - Formation run ID claiming these shards
 * @returns Reservation results with count of already-reserved shards
 */
export const reserveShards = mutation({
  args: {
    shardIds: v.array(v.id("crystal_shards")),
    formationRunId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    reservedCount: v.number(),
    alreadyReservedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { shardIds, formationRunId }) => {
    const result = await updateShardStatusHandler(
      ctx,
      shardIds,
      "reserved",
      { formationRunId },
      ["unprocessed", "reserved"]  // Allow re-reserving old reservations
    );

    return {
      success: result.success,
      reservedCount: result.updatedCount,
      alreadyReservedCount: result.skippedCount + result.failedCount,
      errors: result.errors,
    };
  },
});

/**
 * Mark shards as consumed by a crystal
 * 
 * Permanently associates shards with a crystal, preventing reuse. Accepts
 * shards from both reserved and unprocessed states. Automatically clears
 * reservation metadata when consuming reserved shards.
 * 
 * @param shardIds - Array of shard IDs to consume
 * @param crystalId - Crystal ID that will use these shards
 * @returns Consumption results with failure count and errors
 */
export const consumeShards = mutation({
  args: {
    shardIds: v.array(v.id("crystal_shards")),
    crystalId: v.string(),
    consumptionType: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    markedCount: v.number(),
    failedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { shardIds, crystalId }) => {
    const result = await updateShardStatusHandler(
      ctx,
      shardIds,
      "used_for_crystal",
      { crystalId },
      ["reserved", "unprocessed"]
    );

    return {
      success: result.success,
      markedCount: result.updatedCount,
      failedCount: result.failedCount,
      errors: result.errors,
    };
  },
});

/**
 * Archive shards to remove from active use
 * 
 * Moves shards to archived state, removing them from queries and formation
 * processing while preserving their data for audit purposes.
 * 
 * @param shardIds - Array of shard IDs to archive
 * @returns Archive results with count and any errors
 */
export const archiveShards = mutation({
  args: {
    shardIds: v.array(v.id("crystal_shards")),
  },
  returns: v.object({
    success: v.boolean(),
    archivedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { shardIds }) => {
    const result = await updateShardStatusHandler(
      ctx,
      shardIds,
      "archived"
    );

    return {
      success: result.success,
      archivedCount: result.updatedCount,
      errors: result.errors,
    };
  },
});

