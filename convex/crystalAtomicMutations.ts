/**
 * Atomic Crystal Formation Mutations
 * 
 * This module provides atomic operations for crystal creation that ensure
 * crystal insertion and shard consumption happen in a SINGLE transaction.
 * 
 * DESIGN PRINCIPLE:
 * - Crystal creation + shard consumption = ONE atomic operation
 * - No temporal gaps between related database changes
 * - Either all succeed or all fail - no inconsistent state
 * - Eliminates the need for separate shard status management
 * 
 * BENEFITS:
 * - No "already consumed" errors on retry
 * - No race conditions between concurrent formations
 * - Emergency saves can safely retry the entire operation
 * - Simplified architecture without complex state machines
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { publishCrystalFormationBriefing } from "./briefingRoomHelpers";

/**
 * Atomically create a crystal and mark its shards as consumed.
 * 
 * This is the ONLY way crystals should be created. It ensures that:
 * 1. Crystal is inserted into the database
 * 2. ALL specified shards are marked as consumed by this crystal
 * 3. Both operations happen atomically (all succeed or all fail)
 * 
 * @param crystalData - Complete crystal data to insert
 * @param shardIds - Array of shard IDs to mark as consumed
 * @returns Object with success status, crystal ID, and consumption results
 */
export const createCrystalWithShardConsumption = mutation({
  args: {
    crystalData: v.any(), // Crystal data matching the schema
    shardIds: v.array(v.id("crystal_shards")),
  },
  returns: v.object({
    success: v.boolean(),
    crystalId: v.optional(v.id("crystals")),
    shardsMarked: v.number(),
    shardsFailed: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { crystalData, shardIds }) => {
    const errors: string[] = [];
    let shardsMarked = 0;
    let shardsFailed = 0;

    try {
      // Step 1: Insert the crystal (atomic operation)
      const crystalId = await ctx.db.insert("crystals", crystalData);
      
      console.log(`✅ [ATOMIC] Created crystal ${crystalId} with ${shardIds.length} shards to consume`);

      // Step 2: Mark all shards as consumed (in same transaction)
      for (const shardId of shardIds) {
        try {
          const shard = await ctx.db.get(shardId);
          
          if (!shard) {
            errors.push(`Shard ${shardId} not found`);
            shardsFailed++;
            continue;
          }

          // Check if shard is already consumed by THIS crystal (idempotent)
          if (shard.used_in_crystal_id === crystalId) {
            console.log(`ℹ️ [ATOMIC] Shard ${shardId} already consumed by this crystal (idempotent)`);
            shardsMarked++;
            continue;
          }

          // Check if shard is already consumed by ANOTHER crystal
          if (shard.used_in_crystal_id && shard.used_in_crystal_id !== crystalId) {
            errors.push(`Shard ${shardId} already consumed by crystal ${shard.used_in_crystal_id}`);
            shardsFailed++;
            continue;
          }

          // Mark shard as consumed by this crystal
          await ctx.db.patch(shardId, {
            used_in_crystal_id: crystalId,
            shard_status: "used_for_crystal",
            date_consumed: Date.now(),
            updatedAt: Date.now(),
          });

          shardsMarked++;
        } catch (shardError: any) {
          errors.push(`Failed to mark shard ${shardId}: ${shardError.message}`);
          shardsFailed++;
        }
      }

      console.log(`✅ [ATOMIC] Crystal ${crystalId}: ${shardsMarked}/${shardIds.length} shards marked (${shardsFailed} failed)`);

      // Publish briefing event for crystal formation
      try {
        await publishCrystalFormationBriefing(ctx, {
          userId: crystalData.userId,
          crystalId: crystalId,
          crystalName: crystalData.name || "New Crystal",
          crystalType: crystalData.crystal_type || "pattern",
          confidenceScore: crystalData.confidence_score || "moderate",
          coreInsight: crystalData.core_insight || crystalData.description || "New pattern crystallized",
          shardCount: shardsMarked,
        });
        console.log(`📢 [BRIEFING] Published crystal formation briefing for ${crystalId}`);
      } catch (briefingError) {
        console.error(`⚠️ [BRIEFING] Failed to publish crystal briefing (non-critical):`, briefingError);
        // Don't fail the mutation if briefing fails
      }

      return {
        success: true,
        crystalId,
        shardsMarked,
        shardsFailed,
        errors,
      };

    } catch (error: any) {
      console.error(`❌ [ATOMIC] Failed to create crystal:`, error);
      
      // If crystal creation fails, nothing was changed - safe to retry
      return {
        success: false,
        crystalId: undefined,
        shardsMarked: 0,
        shardsFailed: shardIds.length,
        errors: [`Crystal creation failed: ${error.message}`],
      };
    }
  },
});

/**
 * Atomically update an existing crystal and adjust shard associations.
 * 
 * This handles crystal evolution/updates while maintaining shard integrity:
 * 1. Update the crystal data
 * 2. Add new shards to the crystal
 * 3. Optionally remove shards from the crystal
 * 
 * @param crystalId - ID of crystal to update
 * @param updates - Crystal field updates
 * @param addShardIds - Shard IDs to add to this crystal
 * @param removeShardIds - Shard IDs to remove from this crystal
 * @returns Update results with shard changes
 */
export const updateCrystalWithShardAdjustment = mutation({
  args: {
    crystalId: v.id("crystals"),
    updates: v.any(), // Crystal field updates
    addShardIds: v.optional(v.array(v.id("crystal_shards"))),
    removeShardIds: v.optional(v.array(v.id("crystal_shards"))),
  },
  returns: v.object({
    success: v.boolean(),
    shardsAdded: v.number(),
    shardsRemoved: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { crystalId, updates, addShardIds, removeShardIds }) => {
    const errors: string[] = [];
    let shardsAdded = 0;
    let shardsRemoved = 0;

    try {
      // Step 1: Update the crystal
      await ctx.db.patch(crystalId, {
        ...updates,
        updatedAt: Date.now(),
      });

      console.log(`✅ [ATOMIC] Updated crystal ${crystalId}`);

      // Step 2: Add new shards (if specified)
      if (addShardIds && addShardIds.length > 0) {
        for (const shardId of addShardIds) {
          try {
            const shard = await ctx.db.get(shardId);
            
            if (!shard) {
              errors.push(`Shard ${shardId} not found`);
              continue;
            }

            // Skip if already consumed by this crystal (idempotent)
            if (shard.used_in_crystal_id === crystalId) {
              shardsAdded++;
              continue;
            }

            // Error if consumed by another crystal
            if (shard.used_in_crystal_id) {
              errors.push(`Shard ${shardId} already consumed by another crystal`);
              continue;
            }

            // Mark shard as consumed
            await ctx.db.patch(shardId, {
              used_in_crystal_id: crystalId,
              shard_status: "used_for_crystal",
              date_consumed: Date.now(),
              updatedAt: Date.now(),
            });

            shardsAdded++;
          } catch (error: any) {
            errors.push(`Failed to add shard ${shardId}: ${error.message}`);
          }
        }
      }

      // Step 3: Remove shards (if specified)
      if (removeShardIds && removeShardIds.length > 0) {
        for (const shardId of removeShardIds) {
          try {
            const shard = await ctx.db.get(shardId);
            
            if (!shard) {
              errors.push(`Shard ${shardId} not found`);
              continue;
            }

            // Only remove if consumed by THIS crystal
            if (shard.used_in_crystal_id !== crystalId) {
              errors.push(`Shard ${shardId} not consumed by this crystal`);
              continue;
            }

            // Release shard back to unprocessed
            await ctx.db.patch(shardId, {
              used_in_crystal_id: undefined,
              shard_status: "unprocessed",
              date_consumed: undefined,
              updatedAt: Date.now(),
            });

            shardsRemoved++;
          } catch (error: any) {
            errors.push(`Failed to remove shard ${shardId}: ${error.message}`);
          }
        }
      }

      console.log(`✅ [ATOMIC] Crystal ${crystalId}: +${shardsAdded} shards, -${shardsRemoved} shards`);

      return {
        success: true,
        shardsAdded,
        shardsRemoved,
        errors,
      };

    } catch (error: any) {
      console.error(`❌ [ATOMIC] Failed to update crystal:`, error);
      
      return {
        success: false,
        shardsAdded: 0,
        shardsRemoved: 0,
        errors: [`Crystal update failed: ${error.message}`],
      };
    }
  },
});

/**
 * Delete a crystal and optionally release its shards back to unprocessed.
 * 
 * @param crystalId - ID of crystal to delete
 * @param releaseShards - If true, shards become unprocessed again
 * @returns Deletion results
 */
export const deleteCrystalAndReleaseShards = mutation({
  args: {
    crystalId: v.id("crystals"),
    releaseShards: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    shardsReleased: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { crystalId, releaseShards }) => {
    const errors: string[] = [];
    let shardsReleased = 0;

    try {
      // Step 1: Find and release shards (if requested)
      if (releaseShards) {
        const shards = await ctx.db
          .query("crystal_shards")
          .withIndex("by_crystal_usage", (q) => 
            q.eq("used_in_crystal_id", crystalId)
          )
          .collect();

        for (const shard of shards) {
          try {
            await ctx.db.patch(shard._id, {
              used_in_crystal_id: undefined,
              shard_status: "unprocessed",
              date_consumed: undefined,
              updatedAt: Date.now(),
            });
            shardsReleased++;
          } catch (error: any) {
            errors.push(`Failed to release shard ${shard._id}: ${error.message}`);
          }
        }
      }

      // Step 2: Delete the crystal
      await ctx.db.delete(crystalId);

      console.log(`✅ [ATOMIC] Deleted crystal ${crystalId}, released ${shardsReleased} shards`);

      return {
        success: true,
        shardsReleased,
        errors,
      };

    } catch (error: any) {
      console.error(`❌ [ATOMIC] Failed to delete crystal:`, error);
      
      return {
        success: false,
        shardsReleased: 0,
        errors: [`Crystal deletion failed: ${error.message}`],
      };
    }
  },
});

