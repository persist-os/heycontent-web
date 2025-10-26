import { v } from "convex/values";
import { contentTypeValidator } from "./embeddings";

export const embeddingUpdateTypeValidator = v.union(
  v.literal("manual_update"),
  v.literal("automatic_update"),
  v.literal("platform_connection"),
  v.literal("content_update")
);

export const embeddingPlatformTypeValidator = v.union(
  v.literal("conversations"),
  v.literal("notes"),
  v.literal("crystals"),
  v.literal("shards"),
  v.literal("stardusts"),
  v.literal("all")
);

export const embeddingUpdateSchemaFields = {
  userId: v.string(),
  updatedAt: v.number(),
  type: embeddingUpdateTypeValidator,
  platform: v.optional(embeddingPlatformTypeValidator),
  contentType: v.optional(contentTypeValidator),
  contentId: v.optional(v.string()),
  itemsProcessed: v.optional(v.number()),
  itemsSucceeded: v.optional(v.number()),
  itemsFailed: v.optional(v.number()),
};

export const embeddingUpdateValidator = v.object(embeddingUpdateSchemaFields);

