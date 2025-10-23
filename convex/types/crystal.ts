/**
 * Crystal Type Definitions
 * 
 * CRITICAL: These types MUST match backend/app/models/crystal_models.py exactly
 * Any changes here should be mirrored in Python and vice versa.
 */

import { v } from "convex/values";

// ============================================================================
// CRYSTAL SHARD VALIDATORS
// ============================================================================

export const crystalShardValidator = v.object({
  // Core identification
  userId: v.string(),
  
  // Source metadata
  source: v.optional(v.string()),
  sourceIds: v.optional(v.array(v.string())),
  source_type: v.optional(v.union(
    v.literal("conversation"),
    v.literal("note"),
    v.literal("document"),
    v.literal("behavior_observation")
  )),
  extraction_timestamp: v.optional(v.number()),
  extraction_method: v.optional(v.union(
    v.literal("direct_quote"),
    v.literal("behavioral_inference"),
    v.literal("pattern_synthesis")
  )),
  
  // Project & widget context
  projectId: v.optional(v.id("projects")),
  widgetId: v.optional(v.string()),
  conversationId: v.optional(v.string()),
  
  // Core revelation
  dimension: v.optional(v.string()),
  exact_quote: v.optional(v.string()),
  what_it_reveals: v.optional(v.string()),
  situation_context: v.optional(v.string()),
  why_significant: v.optional(v.string()),
  
  // Quality indicators
  confidence_level: v.optional(v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high")
  )),
  linguistic_intensity: v.optional(v.union(
    v.literal("weak"),
    v.literal("moderate"),
    v.literal("strong")
  )),
  emotional_weight: v.optional(v.union(
    v.literal("neutral"),
    v.literal("mild"),
    v.literal("strong")
  )),
  specificity: v.optional(v.union(
    v.literal("vague"),
    v.literal("specific"),
    v.literal("very_specific")
  )),
  
  // Pattern connections
  connects_to: v.optional(v.array(v.string())),
  contradicts: v.optional(v.array(v.string())),
  reinforces: v.optional(v.array(v.string())),
  
  // Temporal data
  temporal_context: v.optional(v.string()),
  recency_weight: v.optional(v.union(
    v.literal("recent"),
    v.literal("moderate"),
    v.literal("old")
  )),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  last_referenced: v.optional(v.number()),
  reference_count: v.optional(v.number()),
  
  // Shard lifecycle tracking
  shard_status: v.optional(v.union(
    v.literal("unprocessed"),
    v.literal("reserved"),
    v.literal("used_for_crystal"),
    v.literal("archived")
  )),
  used_in_crystal_id: v.optional(v.string()),
  date_consumed: v.optional(v.number()),
  reserved_by_formation: v.optional(v.string()),
  reserved_at: v.optional(v.number()),
});

export const crystalShardUpdateValidator = v.object({
  source: v.optional(v.string()),
  sourceIds: v.optional(v.array(v.string())),
  source_type: v.optional(v.union(
    v.literal("conversation"),
    v.literal("note"),
    v.literal("document"),
    v.literal("behavior_observation")
  )),
  extraction_timestamp: v.optional(v.number()),
  extraction_method: v.optional(v.union(
    v.literal("direct_quote"),
    v.literal("behavioral_inference"),
    v.literal("pattern_synthesis")
  )),
  dimension: v.optional(v.string()),
  exact_quote: v.optional(v.string()),
  what_it_reveals: v.optional(v.string()),
  situation_context: v.optional(v.string()),
  why_significant: v.optional(v.string()),
  confidence_level: v.optional(v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high")
  )),
  linguistic_intensity: v.optional(v.union(
    v.literal("weak"),
    v.literal("moderate"),
    v.literal("strong")
  )),
  emotional_weight: v.optional(v.union(
    v.literal("neutral"),
    v.literal("mild"),
    v.literal("strong")
  )),
  specificity: v.optional(v.union(
    v.literal("vague"),
    v.literal("specific"),
    v.literal("very_specific")
  )),
  connects_to: v.optional(v.array(v.string())),
  contradicts: v.optional(v.array(v.string())),
  reinforces: v.optional(v.array(v.string())),
  temporal_context: v.optional(v.string()),
  recency_weight: v.optional(v.union(
    v.literal("recent"),
    v.literal("moderate"),
    v.literal("old")
  )),
  updatedAt: v.optional(v.number()),
  last_referenced: v.optional(v.number()),
  reference_count: v.optional(v.union(v.number(), v.literal("INCREMENT"))),
  shard_status: v.optional(v.union(
    v.literal("unprocessed"),
    v.literal("reserved"),
    v.literal("used_for_crystal"),
    v.literal("archived")
  )),
  used_in_crystal_id: v.optional(v.string()),
  date_consumed: v.optional(v.number()),
});

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

export const evolutionChangeTypeValidator = v.union(
  v.literal("strengthened"),
  v.literal("weakened"),
  v.literal("refined"),
  v.literal("contradicted"),
  v.literal("created"),
  v.literal("merged_at_limit")
);

export const crystalValidator = v.object({
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
  
  // Flexible crystal content
  secondary_dimensions: v.optional(v.array(v.string())),
  description: v.optional(v.string()),
  core_insight: v.optional(v.string()),
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
  
  // Lifecycle management (NEW)
  lifecycleStage: v.optional(lifecycleStageValidator),
  health: v.optional(v.number()),
  energy: v.optional(v.number()),
  lastEvolution: v.optional(v.number()),
  
  // Pattern metadata
  tags: v.optional(v.array(v.string())),
  behavioral_implications: v.optional(v.array(v.string())),
  interaction_guidance: v.optional(v.array(v.string())),
  
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
});

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

export type ShardStatus = "unprocessed" | "reserved" | "used_for_crystal" | "archived";

export interface CrystalShard {
  userId: string;
  source?: string;
  sourceIds?: string[];
  source_type?: "conversation" | "note" | "document" | "behavior_observation";
  extraction_timestamp?: number;
  extraction_method?: "direct_quote" | "behavioral_inference" | "pattern_synthesis";
  projectId?: string;
  widgetId?: string;
  conversationId?: string;
  dimension?: string;
  exact_quote?: string;
  what_it_reveals?: string;
  situation_context?: string;
  why_significant?: string;
  confidence_level?: "low" | "medium" | "high";
  linguistic_intensity?: "weak" | "moderate" | "strong";
  emotional_weight?: "neutral" | "mild" | "strong";
  specificity?: "vague" | "specific" | "very_specific";
  connects_to?: string[];
  contradicts?: string[];
  reinforces?: string[];
  temporal_context?: string;
  recency_weight?: "recent" | "moderate" | "old";
  createdAt: number;
  updatedAt: number;
  last_referenced?: number;
  reference_count?: number;
  shard_status?: ShardStatus;
  used_in_crystal_id?: string;
  date_consumed?: number;
  reserved_by_formation?: string;
  reserved_at?: number;
}

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

