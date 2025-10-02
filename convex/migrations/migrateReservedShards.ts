import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * ONE-TIME MIGRATION: Convert legacy 'reserved' shards to 'unprocessed'
 * 
 * Context: The 'reserved' status was used before distributed locking.
 * Now that we have proper distributed locks, 'reserved' is obsolete and
 * any shards stuck in that state are from failed formations.
 * 
 * This migration:
 * 1. Finds all shards with status='reserved'
 * 2. Converts them to 'unprocessed'
 * 3. Clears reservation metadata (reserved_by_formation, reserved_at)
 * 
 * Safe to run multiple times - idempotent.
 */
export const migrateReservedShardsToUnprocessed = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { dryRun = false, batchSize = 100 }) => {
    const currentTime = Date.now();
    
    console.log(`[MIGRATION] Starting reserved shards migration (dryRun: ${dryRun})`);
    
    // Find all shards with reserved status
    const allShards = await ctx.db
      .query("crystal_shards")
      .collect();
    
    const reservedShards = allShards.filter(shard => shard.shard_status === "reserved");
    
    console.log(`[MIGRATION] Found ${reservedShards.length} reserved shards out of ${allShards.length} total`);
    
    if (reservedShards.length === 0) {
      return {
        success: true,
        message: "No reserved shards found - migration not needed",
        migratedCount: 0,
        totalShards: allShards.length,
      };
    }
    
    // Group by user for reporting
    const byUser: Record<string, number> = {};
    const migrationDetails: Array<{
      shardId: string;
      userId: string;
      reservedBy?: string;
      reservedAt?: number;
      ageHours?: number;
    }> = [];
    
    for (const shard of reservedShards) {
      byUser[shard.userId] = (byUser[shard.userId] || 0) + 1;
      
      const ageHours = shard.reserved_at 
        ? Math.floor((currentTime - shard.reserved_at) / (1000 * 60 * 60))
        : undefined;
      
      migrationDetails.push({
        shardId: shard._id,
        userId: shard.userId,
        reservedBy: shard.reserved_by_formation,
        reservedAt: shard.reserved_at,
        ageHours,
      });
    }
    
    console.log(`[MIGRATION] Reserved shards by user:`, byUser);
    console.log(`[MIGRATION] Sample details:`, migrationDetails.slice(0, 5));
    
    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        message: `DRY RUN: Would migrate ${reservedShards.length} reserved shards`,
        affectedUsers: Object.keys(byUser).length,
        byUser,
        sampleDetails: migrationDetails.slice(0, 10),
        totalReserved: reservedShards.length,
      };
    }
    
    // Perform migration in batches
    let migratedCount = 0;
    const batches = [];
    
    for (let i = 0; i < reservedShards.length; i += batchSize) {
      const batch = reservedShards.slice(i, i + batchSize);
      batches.push(batch);
    }
    
    console.log(`[MIGRATION] Processing ${batches.length} batches of ${batchSize} shards each`);
    
    for (const batch of batches) {
      for (const shard of batch) {
        try {
          await ctx.db.patch(shard._id, {
            shard_status: "unprocessed",
            reserved_by_formation: undefined,
            reserved_at: undefined,
            updatedAt: currentTime,
          });
          migratedCount++;
        } catch (error) {
          console.error(`[MIGRATION] Failed to migrate shard ${shard._id}:`, error);
        }
      }
    }
    
    console.log(`[MIGRATION] Successfully migrated ${migratedCount} shards`);
    
    return {
      success: true,
      message: `Successfully migrated ${migratedCount} reserved shards to unprocessed`,
      migratedCount,
      totalReserved: reservedShards.length,
      affectedUsers: Object.keys(byUser).length,
      byUser,
      sampleDetails: migrationDetails.slice(0, 10),
    };
  },
});

/**
 * Check current shard status distribution
 * Useful for verifying migration results
 */
export const getShardStatusDistribution = mutation({
  args: {},
  handler: async (ctx) => {
    const allShards = await ctx.db.query("crystal_shards").collect();
    
    const distribution: Record<string, number> = {
      unprocessed: 0,
      reserved: 0,
      used_for_crystal: 0,
      archived: 0,
      null: 0,
    };
    
    const byUser: Record<string, Record<string, number>> = {};
    
    for (const shard of allShards) {
      const status = shard.shard_status || "null";
      distribution[status] = (distribution[status] || 0) + 1;
      
      if (!byUser[shard.userId]) {
        byUser[shard.userId] = { unprocessed: 0, reserved: 0, used_for_crystal: 0, archived: 0, null: 0 };
      }
      byUser[shard.userId][status] = (byUser[shard.userId][status] || 0) + 1;
    }
    
    return {
      total: allShards.length,
      distribution,
      byUser,
      timestamp: Date.now(),
    };
  },
});

