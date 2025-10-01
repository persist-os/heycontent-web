import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Shard Lifecycle Mutations
 * 
 * DEPRECATED: This file is being phased out in favor of shardStatusManager.ts
 * which provides centralized, optimized shard status management.
 * 
 * Only utility functions remain here for special operations.
 */

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
