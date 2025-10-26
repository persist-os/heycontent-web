import { v } from "convex/values";

export const embeddingPlatformValidator = v.union(
  v.literal("notes"),
  v.literal("conversations"),
  v.literal("crystals"),
  v.literal("shards"),
  v.literal("stardusts"),
);

export const embeddingChangeTypeValidator = v.union(
  v.literal("created"),
  v.literal("updated"),
  v.literal("deleted")
);

export const embeddingPriorityValidator = v.union(
  v.literal("high"),    // User-triggered actions
  v.literal("normal"),  // Regular content changes
  v.literal("low")      // Batch operations
);

export const embeddingQueueSchemaFields = {
  userId: v.string(),
  contentId: v.string(), // Standardized format: platform:actualId
  platform: embeddingPlatformValidator,
  changeType: embeddingChangeTypeValidator,
  priority: embeddingPriorityValidator,
  retryCount: v.optional(v.number()), // Made optional temporarily for migration
  maxRetries: v.optional(v.number()), // Made optional temporarily for migration
  createdAt: v.number(),
  lastAttemptAt: v.optional(v.number()),
  processedAt: v.optional(v.number()),
  errorMessage: v.optional(v.string()),
  metadata: v.optional(v.any()),
  // Legacy fields for migration compatibility
  attempts: v.optional(v.number()),
  lastError: v.optional(v.string()),
  scheduledAt: v.optional(v.number()),
  updatedAt: v.optional(v.number())
};

export const embeddingQueueValidator = v.object(embeddingQueueSchemaFields);

