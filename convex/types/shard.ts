/**
 * Crystal Shard Type Definitions
 * 
 * CRITICAL: These types MUST match backend/app/models/crystal_models.py exactly
 * Any changes here should be mirrored in Python and vice versa.
 * 
 * Shards are the raw insights extracted from conversations/notes that form crystals.
 * 
 * VALIDATOR PATTERN:
 * - PROGRAMMATIC FIELDS: Strict validators (set by code, not AI)
 *   Examples: shard_status, source_type, extraction_method, recency_weight
 * 
 * - AI-GENERATED FIELDS: Flexible validators (v.optional(v.string()))
 *   Examples: confidence_level, linguistic_intensity, emotional_weight, specificity
 *   AI can return creative values - backend normalizes if needed
 * 
 * See: backend/app/agents/persona_crystallization/shard_formation/field_utils.py
 */

import { v } from "convex/values";

// ============================================================================
// SHARD VALIDATORS
// ============================================================================

// PROGRAMMATICALLY SET: Strict validators safe (controlled by code, not AI)
export const shardStatusValidator = v.union(
  v.literal("unprocessed"),
  v.literal("reserved"),
  v.literal("used_for_crystal"),
  v.literal("archived")
);

export const shardSourceTypeValidator = v.union(
  v.literal("conversation"),
  v.literal("note"),
  v.literal("document"),
  v.literal("behavior_observation")
);

export const shardExtractionMethodValidator = v.union(
  v.literal("direct_quote"),
  v.literal("behavioral_inference"),
  v.literal("pattern_synthesis")
);

// AI-GENERATED FIELDS: Use flexible validators to prevent save failures
// AI can return creative values - backend normalizes if needed
// These are optional strings, NOT strict enums

export const shardConfidenceLevelValidator = v.optional(v.string());
export const shardLinguisticIntensityValidator = v.optional(v.string());
export const shardEmotionalWeightValidator = v.optional(v.string());
export const shardSpecificityValidator = v.optional(v.string());

// PROGRAMMATICALLY CALCULATED: Strict validator safe (calculated by backend)
export const shardRecencyWeightValidator = v.union(
  v.literal("recent"),
  v.literal("moderate"),
  v.literal("old")
);

// Schema fields (unwrapped for defineTable)
export const crystalShardSchemaFields = {
  // Core identification
  userId: v.string(),
  
  // Source metadata
  source: v.optional(v.string()),
  sourceIds: v.optional(v.array(v.string())),
  source_type: v.optional(shardSourceTypeValidator),
  extraction_timestamp: v.optional(v.number()),
  extraction_method: v.optional(shardExtractionMethodValidator),
  
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
  confidence_level: v.optional(v.string()),
  linguistic_intensity: v.optional(v.string()),
  emotional_weight: v.optional(v.string()),
  specificity: v.optional(v.string()),
  
  // Pattern connections
  connects_to: v.optional(v.array(v.string())),
  contradicts: v.optional(v.array(v.string())),
  reinforces: v.optional(v.array(v.string())),
  
  // Temporal data
  temporal_context: v.optional(v.string()),
  recency_weight: v.optional(shardRecencyWeightValidator),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  last_referenced: v.optional(v.number()),
  reference_count: v.optional(v.number()),
  
  // Shard lifecycle tracking
  shard_status: v.optional(shardStatusValidator),
  used_in_crystal_id: v.optional(v.string()),
  date_consumed: v.optional(v.number()),
  reserved_by_formation: v.optional(v.string()),
  reserved_at: v.optional(v.number()),
};

/**
 * Complete shard validator for creation
 */
export const crystalShardValidator = v.object(crystalShardSchemaFields);

/**
 * Shard update validator - all fields optional for partial updates
 */
export const crystalShardUpdateValidator = v.object({
  source: v.optional(v.string()),
  sourceIds: v.optional(v.array(v.string())),
  source_type: v.optional(shardSourceTypeValidator),
  extraction_timestamp: v.optional(v.number()),
  extraction_method: v.optional(shardExtractionMethodValidator),
  dimension: v.optional(v.string()),
  exact_quote: v.optional(v.string()),
  what_it_reveals: v.optional(v.string()),
  situation_context: v.optional(v.string()),
  why_significant: v.optional(v.string()),
  confidence_level: v.optional(shardConfidenceLevelValidator),
  linguistic_intensity: v.optional(shardLinguisticIntensityValidator),
  emotional_weight: v.optional(shardEmotionalWeightValidator),
  specificity: v.optional(shardSpecificityValidator),
  connects_to: v.optional(v.array(v.string())),
  contradicts: v.optional(v.array(v.string())),
  reinforces: v.optional(v.array(v.string())),
  temporal_context: v.optional(v.string()),
  recency_weight: v.optional(shardRecencyWeightValidator),
  updatedAt: v.optional(v.number()),
  last_referenced: v.optional(v.number()),
  reference_count: v.optional(v.union(v.number(), v.literal("INCREMENT"))),
  shard_status: v.optional(shardStatusValidator),
  used_in_crystal_id: v.optional(v.string()),
  date_consumed: v.optional(v.number()),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ShardStatus = "unprocessed" | "reserved" | "used_for_crystal" | "archived";

export type ShardSourceType = "conversation" | "note" | "document" | "behavior_observation";

export type ShardExtractionMethod = "direct_quote" | "behavioral_inference" | "pattern_synthesis";

// AI-GENERATED TYPES: Flexible strings (not enums) to allow AI creativity
// Backend can normalize these values if needed
export type ShardConfidenceLevel = string | undefined;
export type ShardLinguisticIntensity = string | undefined;
export type ShardEmotionalWeight = string | undefined;
export type ShardSpecificity = string | undefined;

export type ShardRecencyWeight = "recent" | "moderate" | "old";

/**
 * Crystal Shard interface
 */
export interface CrystalShard {
  userId: string;
  source?: string;
  sourceIds?: string[];
  source_type?: ShardSourceType;
  extraction_timestamp?: number;
  extraction_method?: ShardExtractionMethod;
  projectId?: string;
  widgetId?: string;
  conversationId?: string;
  dimension?: string;
  exact_quote?: string;
  what_it_reveals?: string;
  situation_context?: string;
  why_significant?: string;
  confidence_level?: ShardConfidenceLevel;
  linguistic_intensity?: ShardLinguisticIntensity;
  emotional_weight?: ShardEmotionalWeight;
  specificity?: ShardSpecificity;
  connects_to?: string[];
  contradicts?: string[];
  reinforces?: string[];
  temporal_context?: string;
  recency_weight?: ShardRecencyWeight;
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

