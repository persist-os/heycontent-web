import { Infer, v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import schema from "./schema";

// TYPES
const crystalShardValidator = schema.tables.crystal_shards.validator;
export type crystal_shard = Infer<typeof crystalShardValidator>;
const crystalValidator = schema.tables.crystals.validator;
export type crystal = Infer<typeof crystalValidator>;

/**
 * Master function for all crystal data mutations
 *
 * Handles create, update, and delete operations for both crystal_shards and crystals
 * tables through a single unified interface.
 *
 * @param table - Target table ("crystal_shards" or "crystals")
 * @param operation - Operation type ("create", "update", or "delete")
 * @param data - Data payload (required for create/update)
 * @param shardId - Shard ID (required for shard update/delete)
 * @param crystalId - Crystal ID (required for crystal update/delete)
 *
 * @example
 * ```typescript
 * // Create a new shard
 * const shardId = await mutateCrystalData({
 *   table: "crystal_shards",
 *   operation: "create",
 *   data: { content: "New insight", confidence_level: "high" }
 * });
 *
 * // Update existing crystal
 * await mutateCrystalData({
 *   table: "crystals",
 *   operation: "update",
 *   crystalId: "crystal123",
 *   data: { confidence_score: "very_high" }
 * });
 *
 * // Delete a shard
 * await mutateCrystalData({
 *   table: "crystal_shards",
 *   operation: "delete",
 *   shardId: "shard456"
 * });
 * ```
 */
export const mutateCrystalData = mutation({
    args: {
        table: v.union(v.literal("crystal_shards"), v.literal("crystals")),
        operation: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
        data: v.optional(v.union(crystalShardValidator, crystalValidator)),
        shardId: v.optional(v.id("crystal_shards")),
        crystalId: v.optional(v.id("crystals")),
    },

    handler: async (ctx, { table, operation, data, shardId, crystalId }) => {
        const id = table === "crystal_shards" ? shardId : crystalId;

        if (operation === "create") return await ctx.db.insert(table, data!);
        if (operation === "update") return await ctx.db.patch(id!, data!);
        if (operation === "delete") { await ctx.db.delete(id!); return true; }
    }
});