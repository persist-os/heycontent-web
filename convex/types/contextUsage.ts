import { v } from "convex/values";

/**
 * Context Usage Tracking Types
 * 
 * Tracks which context items (crystals, shards, notes, conversations) were used
 * for which outputs (chat responses, widget outputs, etc.) to enable:
 * - Debugging: "Why did AI say X?" → trace to specific context items
 * - Analytics: "Which crystals are most useful?"
 * - Optimization: "Are we fetching items we don't use?"
 */

export const outputTypeValidator = v.union(
  v.literal("chat"),
  v.literal("chat_message"),           // More specific chat type for feedback integration
  v.literal("widget"),
  v.literal("widget_generation"),
  v.literal("widget_output"),          // More specific widget type for feedback integration
  v.literal("note_generation"),        // Note generation for feedback integration
  v.literal("shard_extraction"),
  v.literal("crystal_formation"),
  v.literal("project_discovery")
);

export const contextItemValidator = v.object({
  type: v.string(),                         // "crystal", "shard", "note", "conversation"
  id: v.string(),                          // Convex _id
  relevanceScore: v.optional(v.number()),  // From context grader (0-1)
  relevanceReason: v.optional(v.string()), // Why this item was relevant
  source: v.string(),                      // "vector_search", "project_items"
  wasGraded: v.boolean(),                  // Whether context grading was used
});

export const enrichmentMetadataValidator = v.object({
  strategy: v.optional(v.string()),        // MAB arm ID if applicable
  threshold: v.number(),
  limit: v.number(),
  contentTypes: v.array(v.string()),
  totalItemsFetched: v.number(),
  relevantItemsUsed: v.number(),
});

export const contextUsageSchemaFields = {
  // Core identifiers
  userId: v.string(),
  timestamp: v.number(),
  
  // Output identification
  outputType: outputTypeValidator,
  outputId: v.string(),                    // conversation_id, widget_output_id, etc.
  
  // Context items used (with rich metadata)
  contextItemsUsed: v.array(contextItemValidator),
  
  // Enrichment metadata (strategy used)
  enrichmentMetadata: enrichmentMetadataValidator,
  
  // Outcome tracking (optional, for MAB feedback)
  engagementScore: v.optional(v.number()), // For chat responses
  userFeedback: v.optional(v.string()),    // Explicit feedback if provided
};

export const contextUsageValidator = v.object(contextUsageSchemaFields);

// =========================================================================
// 🌟 REQUEST/RESPONSE VALIDATORS
// =========================================================================

export const getUsageLogsRequestValidator = v.object({
  userId: v.string(),
  startTime: v.optional(v.number()),
  endTime: v.optional(v.number()),
  limit: v.optional(v.number()),
  outputType: v.optional(outputTypeValidator),
});

export const getUsageLogsResponseValidator = v.object({
  success: v.boolean(),
  data: v.optional(v.array(contextUsageValidator)),
  error: v.optional(v.string()),
  message: v.optional(v.string()),
});

