import {Infer, v} from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import schema from "./schema";

// VALIDATOR + TYPES
// Crystal Shards
const crystalShardValidator = schema.tables.crystal_shards.validator;
// infer a type from the validator
export type crystal_shard = Infer<typeof crystalShardValidator>; // { name: string; count: number }
// Crystal Validators
const crystalValidator = schema.tables.crystals.validator;
export type crystal = Infer<typeof crystalValidator>;

// Create Mutations
export const createShards = mutation({
    args: { shard: crystalShardValidator },
    // Optionally validate the return value too:
    handler: async (ctx, { shard }) => {
        return await ctx.db.insert("crystal_shards", shard);
    },
});

export const createCrystal = mutation({
    args: { crystal: crystalValidator },
    // Optionally validate the return value too:
    handler: async (ctx, { crystal }) => {
        return await ctx.db.insert("crystals", crystal);
    },
});

// Update Mutations (complete update)
export const updateShard = mutation({
    args: {
        shardId: v.id("crystal_shards"),
        shard: crystalShardValidator
    },
    handler: async (ctx, { shardId, shard }) => {
        return await ctx.db.patch(shardId, shard);
    },
});

export const updateCrystal = mutation({
    args: {
        crystalId: v.id("crystals"),
        crystal: crystalValidator
    },
    handler: async (ctx, { crystalId, crystal }) => {
        return await ctx.db.patch(crystalId, crystal);
    },
});

// Delete Mutations - return true/false
export const deleteShard = mutation({
    args: { shardId: v.id("crystal_shards") },
    handler: async (ctx, { shardId }) => {
        await ctx.db.delete(shardId);
        return true;
    },
});

export const deleteCrystal = mutation({
    args: { crystalId: v.id("crystals") },
    handler: async (ctx, { crystalId }) => {
        await ctx.db.delete(crystalId);
        return true;
    },
});
