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
