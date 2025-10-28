/**
 * Cognitive Field Type Definitions
 * 
 * CRITICAL: These types MUST match backend/app/models/cognitive_field_models.py exactly
 * Any changes here should be mirrored in Python and vice versa.
 * 
 * Cognitive Fields are dynamic cognitive state containers that serve as shared intelligence
 * substrates between AIs and humans. They replace the static crystal system with a living
 * computational interface between intelligences.
 * 
 * VALIDATOR PATTERN:
 * - PROGRAMMATIC FIELDS: Strict validators (set by code, not AI)
 * - AI-GENERATED FIELDS: Flexible validators (v.optional(v.string()))
 * - MAB-OPTIMIZED FIELDS: Integration with existing MAB system for field optimization
 */

import { v } from "convex/values";

// ============================================================================
// COGNITIVE FIELD VALIDATORS
// ============================================================================

// PROGRAMMATICALLY SET: Strict validators safe (controlled by code, not AI)
export const fieldStatusValidator = v.union(
  v.literal("active"),
  v.literal("evolving"),
  v.literal("stable"),
  v.literal("archived")
);

export const fieldLayerValidator = v.union(
  v.literal("core"),
  v.literal("semantic"),
  v.literal("transparency"),
  v.literal("preferences")
);

// AI-GENERATED FIELDS: Use flexible validators to prevent save failures
export const fieldConfidenceValidator = v.optional(v.string());
export const fieldStabilityValidator = v.optional(v.string());
export const fieldCoherenceValidator = v.optional(v.string());

// MAB INTEGRATION: Field optimization parameters
export const mabArmValidator = v.object({
  arm_id: v.string(),
  parameters: v.any(), // Flexible parameters for different optimization strategies
  alpha: v.number(),
  beta: v.number(),
  last_selected: v.optional(v.number()),
  reward_history: v.optional(v.array(v.number()))
});

// ============================================================================
// LAYER 1: CORE FIELD (Machine Substrate)
// ============================================================================

export const fieldNodeValidator = v.object({
  node_id: v.string(),
  coherence: v.number(),
  entropy: v.number(),
  temporal_drift: v.number(),
  embedding_vector: v.optional(v.array(v.number())),
  last_updated: v.number()
});

export const fieldCrosslinkValidator = v.object({
  source_node: v.string(),
  target_node: v.string(),
  weight: v.number(),
  relationship_type: v.string(),
  confidence: v.number()
});

export const coreFieldValidator = v.object({
  field_id: v.string(),
  user_id: v.string(),
  vector_space: v.any(), // Embedding manifold representation
  field_nodes: v.array(fieldNodeValidator),
  crosslinks: v.array(fieldCrosslinkValidator),
  temporal_vector: v.array(v.number()),
  update_signature: v.string(), // SHA256 hash of shard sources
  last_processed: v.number()
});

// ============================================================================
// LAYER 2: SEMANTIC METADATA (A2A Language)
// ============================================================================

export const abstractDimensionValidator = v.object({
  dimension_name: v.string(),
  value: v.number(),
  confidence: v.number()
});

export const crossDomainPatternValidator = v.object({
  pattern_name: v.string(),
  strength: v.number(),
  domains: v.array(v.string())
});

export const chaosInterpretationValidator = v.object({
  hypothesis: v.string(),
  confidence: v.number(),
  variance_source: v.string(),
  alternative_explanations: v.optional(v.array(v.string()))
});

export const semanticMetadataValidator = v.object({
  abstract_dimensions: v.array(abstractDimensionValidator),
  cross_domain_patterns: v.array(crossDomainPatternValidator),
  chaos_interpretations: v.array(chaosInterpretationValidator),
  meta_inference_summary: v.string(),
  confidence_profile: v.any(), // Flexible confidence structure
  divergence_log: v.array(v.string())
});

// ============================================================================
// LAYER 3: HUMAN TRANSPARENCY (Read-Only)
// ============================================================================

export const traceLinkValidator = v.object({
  source_type: v.string(), // "shard", "node", "pattern"
  source_id: v.string(),
  contribution_weight: v.number()
});

export const transparencyLayerValidator = v.object({
  human_label: v.string(),
  interpretive_summary: v.string(),
  trace_links: v.array(traceLinkValidator),
  temporal_note: v.string(),
  stability_score: v.number(),
  ethical_disclosure: v.string()
});

// ============================================================================
// LAYER 4: USER PREFERENCES (A2A Coordination)
// ============================================================================

export const communicationPreferenceValidator = v.object({
  tone_preference: v.string(), // "formal", "casual", "encouraging", "direct"
  detail_level: v.string(), // "minimal", "moderate", "detailed"
  response_style: v.string(), // "conversational", "structured", "bullet_points"
  feedback_frequency: v.string() // "immediate", "periodic", "on_request"
});

export const interactionPreferenceValidator = v.object({
  preferred_triggers: v.array(v.string()),
  avoided_topics: v.array(v.string()),
  collaboration_style: v.string(), // "autonomous", "collaborative", "guided"
  decision_making_style: v.string() // "analytical", "intuitive", "balanced"
});

export const userPreferencesValidator = v.object({
  communication_preferences: communicationPreferenceValidator,
  interaction_preferences: interactionPreferenceValidator,
  learning_preferences: v.any(), // Flexible learning style preferences
  adaptation_rate: v.number(), // How quickly preferences should evolve
  last_preference_update: v.number()
});

// ============================================================================
// MAIN COGNITIVE FIELD SCHEMA
// ============================================================================

export const cognitiveFieldSchemaFields = {
  // Core identification
  userId: v.string(),
  field_id: v.string(),
  
  // Field status and lifecycle
  status: v.optional(fieldStatusValidator),
  created_at: v.number(),
  updated_at: v.number(),
  last_evolution: v.optional(v.number()),
  
  // Source tracking
  source_shard_ids: v.array(v.string()),
  source_stardust_ids: v.array(v.string()),
  
  // The four layers
  core_field: coreFieldValidator,
  semantic_metadata: semanticMetadataValidator,
  transparency_layer: transparencyLayerValidator,
  user_preferences: userPreferencesValidator,
  
  // MAB integration
  mab_arms: v.array(mabArmValidator),
  optimization_strategy: v.optional(v.string()),
  
  // Cross-field relationships
  related_fields: v.optional(v.array(v.string())),
  conflicting_fields: v.optional(v.array(v.string())),
  
  // Utilization tracking
  usage_count: v.optional(v.number()),
  last_used: v.optional(v.number()),
  
  // Archival fields
  archived: v.optional(v.boolean()),
  archived_at: v.optional(v.number())
};

// Wrapped validator for mutations/queries
export const cognitiveFieldValidator = v.object(cognitiveFieldSchemaFields);

export const cognitiveFieldUpdateValidator = v.object({
  status: v.optional(fieldStatusValidator),
  core_field: v.optional(coreFieldValidator),
  semantic_metadata: v.optional(semanticMetadataValidator),
  transparency_layer: v.optional(transparencyLayerValidator),
  user_preferences: v.optional(userPreferencesValidator),
  mab_arms: v.optional(v.array(mabArmValidator)),
  optimization_strategy: v.optional(v.string()),
  related_fields: v.optional(v.array(v.string())),
  conflicting_fields: v.optional(v.array(v.string())),
  usage_count: v.optional(v.union(v.number(), v.literal("INCREMENT"))),
  last_used: v.optional(v.number()),
  updated_at: v.optional(v.number()),
  archived: v.optional(v.boolean()),
  archived_at: v.optional(v.number())
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FieldStatus = "active" | "evolving" | "stable" | "archived";
export type FieldLayer = "core" | "semantic" | "transparency" | "preferences";

export type FieldNode = {
  node_id: string;
  coherence: number;
  entropy: number;
  temporal_drift: number;
  embedding_vector?: number[];
  last_updated: number;
};

export type FieldCrosslink = {
  source_node: string;
  target_node: string;
  weight: number;
  relationship_type: string;
  confidence: number;
};

export type CoreField = {
  field_id: string;
  user_id: string;
  vector_space: any;
  field_nodes: FieldNode[];
  crosslinks: FieldCrosslink[];
  temporal_vector: number[];
  update_signature: string;
  last_processed: number;
};

export type AbstractDimension = {
  dimension_name: string;
  value: number;
  confidence: number;
};

export type CrossDomainPattern = {
  pattern_name: string;
  strength: number;
  domains: string[];
};

export type ChaosInterpretation = {
  hypothesis: string;
  confidence: number;
  variance_source: string;
  alternative_explanations?: string[];
};

export type SemanticMetadata = {
  abstract_dimensions: AbstractDimension[];
  cross_domain_patterns: CrossDomainPattern[];
  chaos_interpretations: ChaosInterpretation[];
  meta_inference_summary: string;
  confidence_profile: any;
  divergence_log: string[];
};

export type TraceLink = {
  source_type: string;
  source_id: string;
  contribution_weight: number;
};

export type TransparencyLayer = {
  human_label: string;
  interpretive_summary: string;
  trace_links: TraceLink[];
  temporal_note: string;
  stability_score: number;
  ethical_disclosure: string;
};

export type CommunicationPreference = {
  tone_preference: string;
  detail_level: string;
  response_style: string;
  feedback_frequency: string;
};

export type InteractionPreference = {
  preferred_triggers: string[];
  avoided_topics: string[];
  collaboration_style: string;
  decision_making_style: string;
};

export type UserPreferences = {
  communication_preferences: CommunicationPreference;
  interaction_preferences: InteractionPreference;
  learning_preferences: any;
  adaptation_rate: number;
  last_preference_update: number;
};

export type MABArm = {
  arm_id: string;
  parameters: any;
  alpha: number;
  beta: number;
  last_selected?: number;
  reward_history?: number[];
};

export interface CognitiveField {
  userId: string;
  field_id: string;
  status?: FieldStatus;
  created_at: number;
  updated_at: number;
  last_evolution?: number;
  source_shard_ids: string[];
  source_stardust_ids: string[];
  core_field: CoreField;
  semantic_metadata: SemanticMetadata;
  transparency_layer: TransparencyLayer;
  user_preferences: UserPreferences;
  mab_arms: MABArm[];
  optimization_strategy?: string;
  related_fields?: string[];
  conflicting_fields?: string[];
  usage_count?: number;
  last_used?: number;
  archived?: boolean;
  archived_at?: number;
}
