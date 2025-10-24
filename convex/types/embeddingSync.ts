import { v } from "convex/values";

export const embeddingSyncTypeValidator = v.union(
  v.literal("login"),
  v.literal("manual"),
  v.literal("scheduled")
);

export const embeddingSyncStatusValidator = v.union(
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed")
);

export const embeddingSyncSchemaFields = {
  userId: v.string(),
  syncType: v.optional(embeddingSyncTypeValidator),
  status: v.optional(embeddingSyncStatusValidator),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  platformsProcessed: v.optional(v.array(v.string())),
  itemsQueued: v.optional(v.number()), // Added back - needed by the sync logic
  errorMessage: v.optional(v.string()),
  metadata: v.optional(v.any()),
  // Legacy fields for migration compatibility
  createdAt: v.optional(v.number()),
  syncedAt: v.optional(v.number()),
  results: v.optional(v.any())
};

export const embeddingSyncValidator = v.object(embeddingSyncSchemaFields);

