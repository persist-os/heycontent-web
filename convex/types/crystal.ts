/**
 * Crystal Type Definitions
 * 
 * CRITICAL: These types MUST match backend/app/models/crystal_models.py exactly
 * Any changes here should be mirrored in Python and vice versa.
 * 
 * For shard types, see types/shard.ts
 * 
 * VALIDATOR PATTERN:
 * - AI-GENERATED FIELDS: Flexible validators (v.optional(v.string()))
 *   All crystal content fields use flexible string validators to prevent AI save failures
 * 
 * - PROGRAMMATIC FIELDS: Strict validators only for lifecycle management
 *   Examples: evolution_change_type (set by backend intelligence system)
 */

import { v } from "convex/values";

// ============================================================================
// CRYSTAL VALIDATORS
// ============================================================================

// Flexible crystal type - allow any string to accommodate new types from AI
export const crystalTypeValidator = v.string();

// Flexible lifecycle stage - LLM can generate any stage name
// Common stages: embryo, juvenile, mature, transcendent, archived
export const lifecycleStageValidator = v.string();

// Flexible string validators - no hardcoded categories (matching schema flexibility)
export const confidenceScoreValidator = v.string();
export const evidenceStrengthValidator = v.string();
export const consistencyRatingValidator = v.string();
export const stabilityTrendValidator = v.string();
export const reviewPriorityValidator = v.string();

// PROGRAMMATICALLY SET: Strict validator safe (set by intelligence system, not AI)
export const evolutionChangeTypeValidator = v.union(
  v.literal("strengthened"),
  v.literal("weakened"),
  v.literal("refined"),
  v.literal("contradicted"),
  v.literal("created"),
  v.literal("merged_at_limit")
);

// Schema fields (unwrapped for defineTable)
export const crystalSchemaFields = {
  // Core identification
  userId: v.string(),
  crystal_id: v.string(),
  
  // Crystal definition
  name: v.string(),
  crystal_type: crystalTypeValidator,
  dimension: v.string(),
  
  // Project & widget context
  projectId: v.optional(v.id("projects")),
  widgetId: v.optional(v.string()),
  
  // STRUCTURAL FIX: Make critical fields required to prevent incomplete crystals
  // Flexible crystal content - now required for data integrity
  secondary_dimensions: v.optional(v.array(v.string())),
  description: v.string(), // REQUIRED: Crystal description
  core_insight: v.string(), // REQUIRED: Core insight
  detailed_analysis: v.optional(v.string()),
  
  // Supporting evidence
  shardIds: v.optional(v.array(v.string())),
  supporting_quotes: v.optional(v.array(v.string())),
  
  // Confidence & reliability
  confidence_score: v.optional(v.string()),
  evidence_strength: v.optional(v.string()),
  consistency_rating: v.optional(v.string()),
  observation_count: v.optional(v.number()),
  time_span_days: v.optional(v.number()),
  
  // Lifecycle management
  lifecycleStage: v.optional(lifecycleStageValidator),
  lifecycle_stage: v.optional(lifecycleStageValidator),
  health: v.optional(v.number()),
  energy: v.optional(v.number()),
  lastEvolution: v.optional(v.number()),
  
  // Pattern metadata - now required for data integrity
  tags: v.optional(v.array(v.string())),
  behavioral_implications: v.array(v.string()), // REQUIRED: Behavioral implications
  interaction_guidance: v.array(v.string()), // REQUIRED: Interaction guidance
  
  // Contradictions & nuance
  contradicting_shards: v.optional(v.array(v.string())),
  contradiction_analysis: v.optional(v.string()),
  
  // Evolution tracking
  evolution_history: v.optional(v.array(v.object({
    timestamp: v.number(),
    change_type: evolutionChangeTypeValidator,
    description: v.string(),
    triggering_shard_id: v.string(),
  }))),
  stability_trend: v.optional(v.string()),
  last_evolution: v.optional(v.number()),
  
  // Cross-crystal relationships
  related_crystals: v.optional(v.array(v.string())),
  conflicting_crystals: v.optional(v.array(v.string())),
  
  // Utilization metadata
  usage_count: v.optional(v.number()),
  usage_frequency: v.optional(v.number()),
  last_used: v.optional(v.number()),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  next_review_due: v.optional(v.number()),
  review_priority: v.optional(v.string()),
  auto_promoted: v.optional(v.boolean()),
  related_conversation_ids: v.optional(v.array(v.string())),
  related_note_ids: v.optional(v.array(v.string())),
  
  // Archival fields
  archived: v.optional(v.boolean()),
  archived_at: v.optional(v.number()),
};

// Wrapped validator for mutations/queries
export const crystalValidator = v.object(crystalSchemaFields);

export const crystalUpdateValidator = v.object({
  name: v.optional(v.string()),
  crystal_type: v.optional(crystalTypeValidator),
  dimension: v.optional(v.string()),
  secondary_dimensions: v.optional(v.array(v.string())),
  description: v.optional(v.string()),
  core_insight: v.optional(v.string()),
  detailed_analysis: v.optional(v.string()),
  shardIds: v.optional(v.array(v.id("crystal_shards"))),
  supporting_quotes: v.optional(v.array(v.string())),
  confidence_score: v.optional(v.string()),
  evidence_strength: v.optional(v.string()),
  consistency_rating: v.optional(v.string()),
  observation_count: v.optional(v.number()),
  time_span_days: v.optional(v.number()),
  lifecycleStage: v.optional(lifecycleStageValidator),
  health: v.optional(v.number()),
  energy: v.optional(v.number()),
  lastEvolution: v.optional(v.number()),
  tags: v.optional(v.array(v.string())),
  behavioral_implications: v.optional(v.array(v.string())),
  interaction_guidance: v.optional(v.array(v.string())),
  contradicting_shards: v.optional(v.array(v.id("crystal_shards"))),
  contradiction_analysis: v.optional(v.string()),
  evolution_history: v.optional(v.array(v.object({
    timestamp: v.number(),
    change_type: evolutionChangeTypeValidator,
    description: v.string(),
    triggering_shard_id: v.string(),
  }))),
  stability_trend: v.optional(v.string()),
  last_evolution: v.optional(v.number()),
  related_crystals: v.optional(v.array(v.id("crystals"))),
  conflicting_crystals: v.optional(v.array(v.id("crystals"))),
  usage_count: v.optional(v.union(v.number(), v.literal("INCREMENT"))),
  usage_frequency: v.optional(v.number()),
  last_used: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  next_review_due: v.optional(v.number()),
  review_priority: v.optional(v.string()),
  archived: v.optional(v.boolean()),
  archived_at: v.optional(v.number()),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Flexible crystal type - can be any string value
export type CrystalType = string;

// Flexible string - LLM can generate any stage name
// Common stages: "embryo", "juvenile", "mature", "transcendent", "archived"
export type LifecycleStage = string;

// Flexible string types - no hardcoded categories (matching schema flexibility)
export type ConfidenceScore = string;
export type EvidenceStrength = string;
export type ConsistencyRating = string;
export type StabilityTrend = string;
export type ReviewPriority = string;

export type EvolutionChangeType = 
  | "strengthened"
  | "weakened"
  | "refined"
  | "contradicted"
  | "created"
  | "merged_at_limit";

export interface EvolutionHistoryEntry {
  timestamp: number;
  change_type: EvolutionChangeType;
  description: string;
  triggering_shard_id: string;
}

export interface Crystal {
  userId: string;
  crystal_id: string;
  name: string;
  crystal_type: CrystalType;
  dimension: string;
  projectId?: string;
  widgetId?: string;
  secondary_dimensions?: string[];
  description?: string;
  core_insight?: string;
  detailed_analysis?: string;
  shardIds?: string[];
  supporting_quotes?: string[];
  confidence_score?: string;
  evidence_strength?: string;
  consistency_rating?: string;
  observation_count?: number;
  time_span_days?: number;
  lifecycleStage?: LifecycleStage;
  health?: number;
  energy?: number;
  lastEvolution?: number;
  tags?: string[];
  behavioral_implications?: string[];
  interaction_guidance?: string[];
  contradicting_shards?: string[];
  contradiction_analysis?: string;
  evolution_history?: EvolutionHistoryEntry[];
  stability_trend?: string;
  last_evolution?: number;
  related_crystals?: string[];
  conflicting_crystals?: string[];
  usage_count?: number;
  usage_frequency?: number;
  last_used?: number;
  createdAt: number;
  updatedAt: number;
  next_review_due?: number;
  review_priority?: string;
  auto_promoted?: boolean;
  related_conversation_ids?: string[];
  related_note_ids?: string[];
  archived?: boolean;
  archived_at?: number;
}

