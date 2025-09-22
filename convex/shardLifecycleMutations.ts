import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Mark multiple shards as consumed by a specific crystal
 * 
 * This is the core function for implementing strict shard lifecycle management.
 * Once shards are marked as consumed, they cannot be reused for other crystals.
 */
export const markShardsAsConsumed = mutation({
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
    handler: async (ctx, { shardIds, crystalId, consumptionType = "crystal_creation" }) => {
        const currentTime = Date.now();
        let markedCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        for (const shardId of shardIds) {
            try {
                // Verify shard exists and is unprocessed
                const shard = await ctx.db.get(shardId);
                if (!shard) {
                    errors.push(`Shard ${shardId} not found`);
                    failedCount++;
                    continue;
                }

                // Check if already consumed
                if (shard.shard_status === "used_for_crystal") {
                    errors.push(`Shard ${shardId} already consumed by crystal ${shard.used_in_crystal_id}`);
                    failedCount++;
                    continue;
                }

                // Mark as consumed
                await ctx.db.patch(shardId, {
                    shard_status: "used_for_crystal",
                    used_in_crystal_id: crystalId,
                    date_consumed: currentTime,
                    updatedAt: currentTime,
                    last_referenced: currentTime,
                });

                markedCount++;
            } catch (error) {
                errors.push(`Failed to mark shard ${shardId}: ${error}`);
                failedCount++;
            }
        }

        return {
            success: failedCount === 0,
            markedCount,
            failedCount,
            errors,
        };
    },
});

/**
 * Batch update shard status for archiving or reactivating shards
 */
export const batchUpdateShardStatus = mutation({
    args: {
        shardIds: v.array(v.id("crystal_shards")),
        newStatus: v.union(
            v.literal("unprocessed"),
            v.literal("used_for_crystal"),
            v.literal("archived")
        ),
        reason: v.optional(v.string()),
    },
    returns: v.object({
        success: v.boolean(),
        updatedCount: v.number(),
        errors: v.array(v.string()),
    }),
    handler: async (ctx, { shardIds, newStatus, reason }) => {
        const currentTime = Date.now();
        let updatedCount = 0;
        const errors: string[] = [];

        for (const shardId of shardIds) {
            try {
                const shard = await ctx.db.get(shardId);
                if (!shard) {
                    errors.push(`Shard ${shardId} not found`);
                    continue;
                }

                const updateData: any = {
                    shard_status: newStatus,
                    updatedAt: currentTime,
                };

                // Clear consumption data if returning to unprocessed
                if (newStatus === "unprocessed") {
                    updateData.used_in_crystal_id = undefined;
                    updateData.date_consumed = undefined;
                }

                await ctx.db.patch(shardId, updateData);
                updatedCount++;
            } catch (error) {
                errors.push(`Failed to update shard ${shardId}: ${error}`);
            }
        }

        return {
            success: errors.length === 0,
            updatedCount,
            errors,
        };
    },
});

/**
 * Initialize shard status for legacy shards that don't have explicit status
 * This fixes shards created before the status tracking system was implemented
 */
export const initializeLegacyShardStatus = mutation({
    args: {
        userId: v.string(),
        confirmInitialization: v.boolean(),
    },
    returns: v.object({
        success: v.boolean(),
        initializedCount: v.number(),
        alreadyInitializedCount: v.number(),
        message: v.string(),
    }),
    handler: async (ctx, { userId, confirmInitialization }) => {
        if (!confirmInitialization) {
            return {
                success: false,
                initializedCount: 0,
                alreadyInitializedCount: 0,
                message: "Initialization not confirmed. This operation will set status for shards without explicit status.",
            };
        }

        const currentTime = Date.now();
        let initializedCount = 0;
        let alreadyInitializedCount = 0;

        // Get all shards for user
        const shards = await ctx.db
            .query("crystal_shards")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        for (const shard of shards) {
            if (!shard.shard_status) {
                // Initialize shards without status as unprocessed
                // unless they're clearly consumed (have used_in_crystal_id)
                const newStatus = shard.used_in_crystal_id ? "used_for_crystal" : "unprocessed";
                
                await ctx.db.patch(shard._id, {
                    shard_status: newStatus,
                    updatedAt: currentTime,
                    // Set date_consumed if it was used but missing
                    ...(newStatus === "used_for_crystal" && !shard.date_consumed && {
                        date_consumed: currentTime
                    })
                });
                initializedCount++;
            } else {
                alreadyInitializedCount++;
            }
        }

        return {
            success: true,
            initializedCount,
            alreadyInitializedCount,
            message: `Initialized ${initializedCount} legacy shards. ${alreadyInitializedCount} shards already had status.`,
        };
    },
});

/**
 * Reset all shards for a user back to unprocessed status
 * DANGER: This is for debugging/recovery only
 */
export const resetUserShardStatus = mutation({
    args: {
        userId: v.string(),
        confirmReset: v.boolean(),
    },
    returns: v.object({
        success: v.boolean(),
        resetCount: v.number(),
        message: v.string(),
    }),
    handler: async (ctx, { userId, confirmReset }) => {
        if (!confirmReset) {
            return {
                success: false,
                resetCount: 0,
                message: "Reset not confirmed. This operation will reset ALL shards for the user.",
            };
        }

        const currentTime = Date.now();
        let resetCount = 0;

        // Get all shards for user
        const shards = await ctx.db
            .query("crystal_shards")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        for (const shard of shards) {
            await ctx.db.patch(shard._id, {
                shard_status: "unprocessed",
                used_in_crystal_id: undefined,
                date_consumed: undefined,
                updatedAt: currentTime,
            });
            resetCount++;
        }

        return {
            success: true,
            resetCount,
            message: `Reset ${resetCount} shards to unprocessed status`,
        };
    },
});
