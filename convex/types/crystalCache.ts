import { v } from "convex/values";

export const cacheTypeValidator = v.union(
  v.literal("crystal_context"),
  v.literal("vector_search"),
  v.literal("formation_context"),
  v.literal("similarity_results")
);

export const crystalCacheSchemaFields = {
  userId: v.string(),
  cacheKey: v.string(),
  cacheType: cacheTypeValidator,
  data: v.any(),
  createdAt: v.number(),
  expiresAt: v.number(),
  accessCount: v.number(),
  lastAccessed: v.number(),
  dataSize: v.number(),
  metadata: v.optional(v.object({
    queryParams: v.optional(v.string()),
    resultCount: v.optional(v.number()),
    processingTime: v.optional(v.number()),
  })),
};

export const crystalCacheValidator = v.object(crystalCacheSchemaFields);

