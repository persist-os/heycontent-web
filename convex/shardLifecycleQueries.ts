import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get all unprocessed shards for a user (core function for preventing shard reuse)
 * 
 * CRITICAL: This query ONLY returns shards that are truly unprocessed.
 * It excludes:
 * - Shards with shard_status = "used_for_crystal"
 * - Shards with shard_status = "reserved" (being processed)
 * - Shards with used_in_crystal_id set (already consumed)
 * - Shards with shard_status = "archived"
 */
export const getUnprocessedShards = query({
    args: {
        userId: v.string(),
        limit: v.optional(v.number()),
        minConfidence: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
        dimensions: v.optional(v.array(v.string())),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { userId, limit, minConfidence, dimensions }) => {
        // Get all shards for user and filter for unprocessed
        const allShards = await ctx.db
            .query("crystal_shards")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        // Filter for TRULY unprocessed shards
        let results = allShards.filter(shard => {
            // Explicitly exclude used, archived, or reserved shards
            if (shard.shard_status === "used_for_crystal" || 
                shard.shard_status === "archived" ||
                shard.shard_status === "reserved") {
                return false;
            }
            // CRITICAL: Exclude shards that are already consumed (have used_in_crystal_id)
            if (shard.used_in_crystal_id) {
                return false;
            }
            // Only include shards that are explicitly unprocessed OR have no status (truly new)
            return shard.shard_status === "unprocessed" || !shard.shard_status;
        });

        // Filter by confidence level if specified
        if (minConfidence) {
            const confidenceOrder = { "low": 1, "medium": 2, "high": 3 };
            const minLevel = confidenceOrder[minConfidence];
            results = results.filter(shard => {
                const shardLevel = confidenceOrder[shard.confidence_level as keyof typeof confidenceOrder] || 1;
                return shardLevel >= minLevel;
            });
        }

        // Filter by dimensions if specified
        if (dimensions && dimensions.length > 0) {
            results = results.filter(shard => 
                shard.dimension && dimensions.includes(shard.dimension)
            );
        }

        // Apply limit
        if (limit) {
            results = results.slice(0, limit);
        }

        return results;
    },
});

/**
 * Get shard consumption statistics for a user
 */
export const getShardConsumptionStats = query({
    args: {
        userId: v.string(),
    },
    returns: v.object({
        totalShards: v.number(),
        unprocessed: v.number(),
        usedForCrystal: v.number(),
        archived: v.number(),
        unknownStatus: v.number(),
        consumptionRate: v.number(),
        recentConsumptionCount: v.number(),
    }),
    handler: async (ctx, { userId }) => {
        // Get all shards for user
        const allShards = await ctx.db
            .query("crystal_shards")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const stats = {
            totalShards: allShards.length,
            unprocessed: 0,
            usedForCrystal: 0,
            archived: 0,
            unknownStatus: 0,
            consumptionRate: 0,
            recentConsumptionCount: 0,
        };

        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

        for (const shard of allShards) {
            switch (shard.shard_status) {
                case "unprocessed":
                    stats.unprocessed++;
                    break;
                case "used_for_crystal":
                    stats.usedForCrystal++;
                    if (shard.date_consumed && shard.date_consumed > oneWeekAgo) {
                        stats.recentConsumptionCount++;
                    }
                    break;
                case "archived":
                    stats.archived++;
                    break;
                default:
                    // Handle legacy shards with no status - treat as unprocessed for now
                    // but count separately for visibility
                    if (!shard.shard_status) {
                        stats.unprocessed++;
                    } else {
                        stats.unknownStatus++;
                    }
            }
        }

        // Calculate consumption rate
        const processedShards = stats.usedForCrystal + stats.archived;
        stats.consumptionRate = stats.totalShards > 0 ? processedShards / stats.totalShards : 0;

        return stats;
    },
});

/**
 * Get shards consumed by a specific crystal
 */
export const getShardsByCrystal = query({
    args: {
        userId: v.string(),
        crystalId: v.string(),
    },
    returns: v.array(v.any()),
    handler: async (ctx, { userId, crystalId }) => {
        return await ctx.db
            .query("crystal_shards")
            .withIndex("by_crystal_usage", (q) =>
                q.eq("userId", userId).eq("used_in_crystal_id", crystalId)
            )
            .collect();
    },
});

/**
 * Validate that proposed shards are available for crystal creation
 */
export const validateShardAvailability = query({
    args: {
        userId: v.string(),
        shardIds: v.array(v.id("crystal_shards")),
    },
    returns: v.object({
        valid: v.boolean(),
        availableShards: v.array(v.id("crystal_shards")),
        unavailableShards: v.array(v.object({
            shardId: v.id("crystal_shards"),
            reason: v.string(),
            currentStatus: v.optional(v.string()),
            usedByCrystal: v.optional(v.string()),
        })),
        availableCount: v.number(),
        unavailableCount: v.number(),
    }),
    handler: async (ctx, { userId, shardIds }) => {
        const availableShards: any[] = [];
        const unavailableShards: any[] = [];

        for (const shardId of shardIds) {
            const shard = await ctx.db.get(shardId);
            
            if (!shard) {
                unavailableShards.push({
                    shardId,
                    reason: "Shard not found",
                    currentStatus: undefined,
                    usedByCrystal: undefined,
                });
                continue;
            }

            if (shard.userId !== userId) {
                unavailableShards.push({
                    shardId,
                    reason: "Shard belongs to different user",
                    currentStatus: shard.shard_status,
                    usedByCrystal: shard.used_in_crystal_id,
                });
                continue;
            }

            if (shard.shard_status === "used_for_crystal") {
                unavailableShards.push({
                    shardId,
                    reason: "Already consumed by crystal",
                    currentStatus: shard.shard_status,
                    usedByCrystal: shard.used_in_crystal_id,
                });
                continue;
            }

            if (shard.shard_status === "archived") {
                unavailableShards.push({
                    shardId,
                    reason: "Shard is archived",
                    currentStatus: shard.shard_status,
                    usedByCrystal: undefined,
                });
                continue;
            }

            // Shard is available
            availableShards.push(shardId);
        }

        return {
            valid: unavailableShards.length === 0,
            availableShards,
            unavailableShards,
            availableCount: availableShards.length,
            unavailableCount: unavailableShards.length,
        };
    },
});

/**
 * Get crystal-to-shard mapping for a user
 */
export const getCrystalToShardMapping = query({
    args: {
        userId: v.string(),
        crystalIds: v.optional(v.array(v.string())),
    },
    returns: v.record(v.string(), v.array(v.id("crystal_shards"))),
    handler: async (ctx, { userId, crystalIds }) => {
        const shards = await ctx.db
            .query("crystal_shards")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        const mapping: Record<string, any[]> = {};

        for (const shard of shards) {
            if (shard.used_in_crystal_id) {
                // Filter by specific crystals if provided
                if (crystalIds && !crystalIds.includes(shard.used_in_crystal_id)) {
                    continue;
                }

                if (!mapping[shard.used_in_crystal_id]) {
                    mapping[shard.used_in_crystal_id] = [];
                }
                mapping[shard.used_in_crystal_id].push(shard._id);
            }
        }

        return mapping;
    },
});
