import { v } from "convex/values";

export const evolutionTriggerValidator = v.union(
  v.literal("morning_update"),
  v.literal("evening_update"),
  v.literal("data_change"),
  v.literal("user_edit"),
  v.literal("milestone_reached")
);

export const userResponseValidator = v.union(
  v.literal("accepted"),
  v.literal("modified"),
  v.literal("rejected")
);

export const fingerprintEvolutionHistorySchemaFields = {
  fingerprintId: v.id("project_fingerprints"),
  userId: v.string(),
  projectId: v.id("projects"),

  // Evolution details
  timestamp: v.number(),
  evolution_trigger: v.string(), // "morning_update", "evening_update", "data_change", "user_edit", "milestone_reached"

  // What changed (flattened for AI searchability)
  changes_made: v.record(v.string(), v.any()), // Key-value pairs of what changed
  reasoning: v.string(), // AI reasoning for the evolution
  confidence_score: v.number(), // 0-1 confidence in the evolution

  // User response to evolution
  user_response: v.optional(v.string()), // "accepted", "modified", "rejected"
  user_feedback: v.optional(v.string()), // Any user comments on the evolution

  // Learning captured for future evolutions
  learning_captured: v.string(), // What AI learned from this evolution

  // Context of evolution
  trigger_context: v.optional(v.record(v.string(), v.any())), // Additional context about what triggered the evolution
  evolution_metrics: v.optional(v.record(v.string(), v.number())), // Metrics about the evolution process

  // Metadata
  processing_time_ms: v.optional(v.number()),
  ai_model_version: v.optional(v.string()),
};

export const fingerprintEvolutionHistoryValidator = v.object(fingerprintEvolutionHistorySchemaFields);

