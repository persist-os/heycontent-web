import { v } from "convex/values";

export const formationRunStatusValidator = v.union(
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed")
);

export const formationTriggerTypeValidator = v.union(
  v.literal("threshold_reached"),    // 15+ shards
  v.literal("periodic_refresh"),     // Background job
  v.literal("manual_trigger")        // User initiated
);

export const crystalFormationRunSchemaFields = {
  userId: v.string(),
  status: formationRunStatusValidator,
  
  // Input data
  input_shard_count: v.number(),
  trigger_type: formationTriggerTypeValidator,
  
  // Event tracking
  event_type: v.optional(v.string()),             // Event type for tracking
  timestamp: v.optional(v.number()),              // Event timestamp
  
  // Results
  clusters_formed: v.optional(v.number()),
  crystals_created: v.optional(v.number()),
  crystals_failed: v.optional(v.number()),
  
  // Additional tracking fields for management system
  crystal_count: v.optional(v.number()),           // Number of crystals being processed
  crystals_updated: v.optional(v.number()),        // Crystals that were updated
  crystals_merged: v.optional(v.number()),         // Crystals that were merged
  crystals_archived: v.optional(v.number()),       // Crystals that were archived
  evolution_events: v.optional(v.number()),        // Number of evolution events
  vector_matches_found: v.optional(v.number()),    // Vector search matches found
  agent_recommendations_used: v.optional(v.number()), // Agent recommendations used
  raw_crystals_generated: v.optional(v.number()),  // Raw crystals generated during formation
  
  // Timing
  started_at: v.number(),
  completed_at: v.optional(v.number()),
  duration_ms: v.optional(v.number()),
  
  // Error handling
  error_message: v.optional(v.string()),
  
  // Metadata
  formation_version: v.string(),      // Track algorithm versions
};

export const crystalFormationRunValidator = v.object(crystalFormationRunSchemaFields);

