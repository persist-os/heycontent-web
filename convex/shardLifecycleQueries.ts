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
        console.log(`[getUnprocessedShards] Starting query for user: ${userId}`);
        console.log(`[getUnprocessedShards] Filters - limit: ${limit}, minConfidence: ${minConfidence}, dimensions: ${dimensions?.join(',') || 'none'}`);
        
        // Get all shards for user and filter for unprocessed
        const allShards = await ctx.db
            .query("crystal_shards")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        console.log(`[getUnprocessedShards] Total shards found: ${allShards.length}`);
        
        // Count by status for debugging
        const statusCounts: Record<string, number> = {};
        let consumedCount = 0;
        let recentReservedCount = 0;
        let oldReservedCount = 0;
        
        // Filter for TRULY unprocessed shards
        // SOURCE OF TRUTH: used_in_crystal_id indicates actual consumption
        let results = allShards.filter(shard => {
            const status = shard.shard_status || 'null';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            
            // PRIMARY CHECK: Exclude shards that are actually consumed
            if (shard.used_in_crystal_id) {
                consumedCount++;
                console.log(`[getUnprocessedShards] Excluded - consumed: ${shard._id} (crystal: ${shard.used_in_crystal_id})`);
                return false;
            }
            
            // SECONDARY CHECK: Exclude archived shards
            if (shard.shard_status === "archived") {
                console.log(`[getUnprocessedShards] Excluded - archived: ${shard._id}`);
                return false;
            }
            
            // RESERVED SHARDS: Allow if older than 10 minutes (stuck/failed formation)
            // This prevents permanent blocking while still protecting recent formations
            if (shard.shard_status === "reserved") {
                const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
                const reservedAge = shard.reserved_at ? Date.now() - shard.reserved_at : 'unknown';
                const reservedAgeMinutes = typeof reservedAge === 'number' ? Math.floor(reservedAge / 60000) : 'unknown';
                
                // If reserved recently, exclude (active formation)
                if (shard.reserved_at && shard.reserved_at > tenMinutesAgo) {
                    recentReservedCount++;
                    console.log(`[getUnprocessedShards] Excluded - recently reserved: ${shard._id} (age: ${reservedAgeMinutes}min, formation: ${shard.reserved_by_formation})`);
                    return false;
                }
                // If reserved long ago, include (stuck/failed formation)
                oldReservedCount++;
                console.log(`[getUnprocessedShards] Included - old reserved: ${shard._id} (age: ${reservedAgeMinutes}min, formation: ${shard.reserved_by_formation})`);
            }
            
            // Include all other shards (unprocessed, null status, or old reserved)
            return true;
        });

        console.log(`[getUnprocessedShards] Status breakdown:`, statusCounts);
        console.log(`[getUnprocessedShards] Exclusion counts - consumed: ${consumedCount}, recent reserved: ${recentReservedCount}, old reserved (included): ${oldReservedCount}`);
        console.log(`[getUnprocessedShards] After basic filtering: ${results.length} shards`);

        // Filter by confidence level if specified
        if (minConfidence) {
            const beforeCount = results.length;
            const confidenceOrder = { "low": 1, "medium": 2, "high": 3 };
            const minLevel = confidenceOrder[minConfidence];
            results = results.filter(shard => {
                const shardLevel = confidenceOrder[shard.confidence_level as keyof typeof confidenceOrder] || 1;
                return shardLevel >= minLevel;
            });
            console.log(`[getUnprocessedShards] Confidence filter (${minConfidence}): ${beforeCount} -> ${results.length} shards`);
        }

        // Filter by dimensions if specified
        if (dimensions && dimensions.length > 0) {
            const beforeCount = results.length;
            results = results.filter(shard => 
                shard.dimension && dimensions.includes(shard.dimension)
            );
            console.log(`[getUnprocessedShards] Dimension filter (${dimensions.join(',')}): ${beforeCount} -> ${results.length} shards`);
        }

        // Apply limit
        if (limit) {
            const beforeCount = results.length;
            results = results.slice(0, limit);
            console.log(`[getUnprocessedShards] Limit applied (${limit}): ${beforeCount} -> ${results.length} shards`);
        }

        console.log(`[getUnprocessedShards] FINAL RESULT: Returning ${results.length} unprocessed shards`);
        if (results.length > 0) {
            console.log(`[getUnprocessedShards] Sample shard IDs:`, results.slice(0, 5).map(s => s._id));
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
        reserved: v.number(),
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
            reserved: 0,
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
                case "reserved":
                    stats.reserved++;
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

/**
 * Search shards for inline writing - searches ALL shards with contextual filtering
 * 
 * This query enables searching through ALL user shards (not just recent ones)
 * by filtering on dimensions, tags, and other metadata.
 */
export const searchShardsForInlineWriting = query({
    args: {
        userId: v.string(),
        dimensions: v.optional(v.array(v.string())), // Filter by specific dimensions
        tags: v.optional(v.array(v.string())),       // Filter by tags
        keywords: v.optional(v.array(v.string())),   // Keywords to search in text fields
        minConfidence: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
        limit: v.optional(v.number()),               // Max results to return (default 50)
    },
    returns: v.array(v.any()),
    handler: async (ctx, { userId, dimensions, tags, keywords, minConfidence, limit = 50 }) => {
        console.log(`[searchShardsForInlineWriting] Search for user: ${userId}`);
        console.log(`[searchShardsForInlineWriting] Filters - dimensions: ${dimensions?.join(',') || 'none'}, tags: ${tags?.join(',') || 'none'}, keywords: ${keywords?.join(',') || 'none'}`);
        
        let results;
        
        // Optimize query strategy based on filters
        if (dimensions && dimensions.length > 0) {
            // Use dimension index for efficient filtering
            const dimensionResults = [];
            for (const dimension of dimensions) {
                const dimShards = await ctx.db
                    .query("crystal_shards")
                    .withIndex("by_dimension", (q) => 
                        q.eq("userId", userId).eq("dimension", dimension)
                    )
                    .collect();
                dimensionResults.push(...dimShards);
            }
            results = dimensionResults;
            console.log(`[searchShardsForInlineWriting] Dimension query returned ${results.length} shards`);
        } else {
            // No dimension filter - get all shards for user
            results = await ctx.db
                .query("crystal_shards")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect();
            console.log(`[searchShardsForInlineWriting] User query returned ${results.length} total shards`);
        }
        
        // Filter by tags if specified
        if (tags && tags.length > 0) {
            const beforeCount = results.length;
            const tagsLower = tags.map(t => t.toLowerCase());
            results = results.filter(shard => {
                const shardTags = shard.tags || [];
                return shardTags.some((tag: string) => 
                    tagsLower.includes(tag.toLowerCase())
                );
            });
            console.log(`[searchShardsForInlineWriting] Tag filter: ${beforeCount} -> ${results.length} shards`);
        }
        
        // Filter by keywords if specified (search in exact_quote, what_it_reveals, situation_context)
        if (keywords && keywords.length > 0) {
            const beforeCount = results.length;
            const keywordsLower = keywords.map(k => k.toLowerCase());
            results = results.filter(shard => {
                const searchText = [
                    shard.exact_quote || '',
                    shard.what_it_reveals || '',
                    shard.situation_context || '',
                    shard.dimension || ''
                ].join(' ').toLowerCase();
                
                return keywordsLower.some(keyword => searchText.includes(keyword));
            });
            console.log(`[searchShardsForInlineWriting] Keyword filter: ${beforeCount} -> ${results.length} shards`);
        }
        
        // Filter by confidence level if specified
        if (minConfidence) {
            const beforeCount = results.length;
            const confidenceOrder = { "low": 1, "medium": 2, "high": 3 };
            const minLevel = confidenceOrder[minConfidence];
            results = results.filter(shard => {
                const shardLevel = confidenceOrder[shard.confidence_level as keyof typeof confidenceOrder] || 1;
                return shardLevel >= minLevel;
            });
            console.log(`[searchShardsForInlineWriting] Confidence filter (${minConfidence}): ${beforeCount} -> ${results.length} shards`);
        }
        
        // Prioritize shards with exact_quote (essential for voice matching)
        const shardsWithQuotes = results.filter(s => s.exact_quote && s.exact_quote.length > 10);
        const shardsWithoutQuotes = results.filter(s => !s.exact_quote || s.exact_quote.length <= 10);
        
        // Sort each group by recency and confidence
        const sortShards = (shards: any[]) => {
            return shards.sort((a, b) => {
                // Primary: recency_weight (higher is better)
                const recencyDiff = (b.recency_weight || 0) - (a.recency_weight || 0);
                if (Math.abs(recencyDiff) > 0.01) return recencyDiff;
                
                // Secondary: confidence_level
                const confidenceOrder = { "high": 3, "medium": 2, "low": 1 };
                const aConf = confidenceOrder[a.confidence_level as keyof typeof confidenceOrder] || 1;
                const bConf = confidenceOrder[b.confidence_level as keyof typeof confidenceOrder] || 1;
                return bConf - aConf;
            });
        };
        
        const sortedWithQuotes = sortShards(shardsWithQuotes);
        const sortedWithoutQuotes = sortShards(shardsWithoutQuotes);
        
        // Combine: quotes first, then others
        const finalResults = [...sortedWithQuotes, ...sortedWithoutQuotes];
        
        // Apply limit
        const limitedResults = finalResults.slice(0, limit);
        
        console.log(`[searchShardsForInlineWriting] FINAL: Returning ${limitedResults.length} shards (${shardsWithQuotes.length} with quotes, ${shardsWithoutQuotes.length} without)`);
        
        return limitedResults;
    },
});

