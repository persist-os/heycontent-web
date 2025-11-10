import { v } from "convex/values";

/**
 * Data Import Types & Schema
 * 
 * Tracks one-time data imports from external sources (ChatGPT, Claude, etc.)
 * Ensures users can only import from each source once.
 */

export const importSourceValidator = v.union(
  v.literal("chatgpt"),
  v.literal("claude")
);

export const importStatusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("cancelled")
);

export const dataImportSchemaFields = {
  userId: v.string(),
  importSource: importSourceValidator,
  completed: v.boolean(),
  completedAt: v.optional(v.number()),
  attempts: v.number(),
  lastAttemptAt: v.number(),
  status: v.optional(importStatusValidator),
  progress: v.optional(v.string()),
  error: v.optional(v.string()),
  jobId: v.optional(v.string()),
  progressDetails: v.optional(v.object({
    totalConversations: v.optional(v.number()),
    processedConversations: v.optional(v.number()),
    totalBatches: v.optional(v.number()),
    processedBatches: v.optional(v.number()),
    totalMessages: v.optional(v.number()),
    processedMessages: v.optional(v.number()),
    percentComplete: v.optional(v.number()),
    currentBatch: v.optional(v.number()),
    processingPhase: v.optional(v.string()),
  })),
  contentProcessed: v.optional(v.object({
    conversations: v.number(),
    notes: v.number(),
    totalItems: v.number(),
    messages: v.optional(v.number())
  }))
};

