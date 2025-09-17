import {Infer, v} from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import schema from "./schema";

// VALIDATORS
// Pull field validators from the table validator
// This ensures consistency with the schema
const shardFields = schema.tables.crystal_shards.validator.fields;
const crystalFields = schema.tables.crystals.validator.fields;

// Shards
export const getShardsByUser = query({
    args: { userId: shardFields.userId },
    handler: async (ctx, { userId }) => {
        return ctx.db
            .query("crystal_shards")
            .withIndex("by_user", q => q.eq("userId", userId))
            .collect();
    }
});

export const getShardsByDimension = query({
    args: { userId: shardFields.userId, dimension: shardFields.dimension },
    handler: async (ctx, { userId, dimension }) => {
        return ctx.db
            .query("crystal_shards")
            .withIndex("by_dimension", q => q.eq("userId", userId).eq("dimension", dimension))
            .collect();
    }
});

export const getShardsByConfidence = query({
    args: { userId: shardFields.userId, confidence_level: shardFields.confidence_level },
    handler: async (ctx, { userId, confidence_level }) => {
        return ctx.db
            .query("crystal_shards")
            .withIndex("by_confidence", q => q.eq("userId", userId).eq("confidence_level", confidence_level))
            .collect();
    }
});

export const getShardsByRecency = query({
    args: { userId: shardFields.userId, recency_weight: shardFields.recency_weight },
    handler: async (ctx, { userId, recency_weight }) => {
        return ctx.db
            .query("crystal_shards")
            .withIndex("by_recency", q => q.eq("userId", userId).eq("recency_weight", recency_weight))
            .collect();
    }
});

// Crystals

export const getCrystalsByUser = query({
    args: { userId: crystalFields.userId },
    handler: async (ctx, { userId }) => {
        return ctx.db
            .query("crystals")
            .withIndex("by_user", q => q.eq("userId", userId))
            .collect();
    }
});

export const getCrystalsByDimension = query({
    args: { userId: crystalFields.userId, dimension: crystalFields.dimension },
    handler: async (ctx, { userId, dimension }) => {
        return ctx.db
            .query("crystals")
            .withIndex("by_dimension", q => q.eq("userId", userId).eq("dimension", dimension))
            .collect();
    }
});

export const getCrystalsByConfidence = query({
    args: { userId: crystalFields.userId, confidence_score: crystalFields.confidence_score },
    handler: async (ctx, { userId, confidence_score }) => {
        return ctx.db
            .query("crystals")
            .withIndex("by_confidence", q => q.eq("userId", userId).eq("confidence_score", confidence_score))
            .collect();
    }
});

export const getCrystalsByType = query({
    args: { userId: crystalFields.userId, crystal_type: crystalFields.crystal_type },
    handler: async (ctx, { userId, crystal_type }) => {
        return ctx.db
            .query("crystals")
            .withIndex("by_type", q => q.eq("userId", userId).eq("crystal_type", crystal_type))
            .collect();
    }
});

export const getCrystalsByUsage = query({
    args: { userId: crystalFields.userId, usage_frequency: crystalFields.usage_frequency },
    handler: async (ctx, { userId, usage_frequency }) => {
        return ctx.db
            .query("crystals")
            .withIndex("by_usage", q => q.eq("userId", userId).eq("usage_frequency", usage_frequency))
            .collect();
    }
});

export const getCrystalsByReviewDue = query({
    args: { userId: crystalFields.userId, next_review_due: crystalFields.next_review_due },
    handler: async (ctx, { userId, next_review_due }) => {
        return ctx.db
            .query("crystals")
            .withIndex("by_review_due", q => q.eq("userId", userId).eq("next_review_due", next_review_due))
            .collect();
    }
});

