/**
 * Stardust Type Definitions
 * 
 * CRITICAL: These types MUST match backend/app/models/stardust_models.py exactly
 * Any changes here should be mirrored in Python and vice versa.
 * 
 * Stardust represents "What You Do" - concrete project potentials that evolve into star organisms.
 * Parallel species to Crystals: Crystals = "Who You Are", Stardust = "What You Do"
 * 
 * NOTE: Lifecycle stages are LLM-driven and flexible. Validators accept any string
 * to allow AI to create contextual stages beyond the common ones (embryo, juvenile, 
 * mature, ghost, transcendent, archived).
 */

import { v } from "convex/values";

// ============================================================================
// STARDUST VALIDATORS
// ============================================================================

// Flexible lifecycle stage - LLM can generate any stage name
// Common stages: embryo, juvenile, mature, ghost, transcendent, archived
export const stardustLifecycleStageValidator = v.optional(v.any());

// Flexible string validators - no hardcoded categories
export const stardustEvidenceStrengthValidator = v.optional(v.any());
export const stardustDomainValidator = v.optional(v.any());

// Schema fields (unwrapped for defineTable)
export const stardustSchemaFields = {
  // Core identification
  userId: v.string(),
  
  // Stardust definition
  name: v.optional(v.any()),
  description: v.optional(v.any()),
  keywords: v.optional(v.any()),
  dimension: v.optional(v.any()),
  
  // Detection metadata (legacy compatible)
  detectedAt: v.optional(v.any()),  // Legacy: detected_at
  detected_at: v.optional(v.any()),
  detectionMethod: v.optional(v.any()),  // Legacy: detection_method
  detection_method: v.optional(v.any()),
  confidence: v.optional(v.any()),
  evidenceStrength: v.optional(v.any()),  // Legacy: evidence_strength
  evidence_strength: v.optional(v.any()),
  
  // Source tracking (legacy compatible)
  sourceShardIds: v.optional(v.any()),  // Legacy: source_shard_ids
  source_shard_ids: v.optional(v.any()),
  shardCount: v.optional(v.any()),  // Legacy: shard_count
  shard_count: v.optional(v.any()),
  relatedNoteIds: v.optional(v.any()),  // Legacy: related_note_ids
  related_note_ids: v.optional(v.any()),
  relatedConversationIds: v.optional(v.any()),  // Legacy: related_conversation_ids
  related_conversation_ids: v.optional(v.any()),
  
  // Lifecycle stage
  lifecycleStage: v.optional(v.any()),
  health: v.optional(v.any()),
  energy: v.optional(v.any()),
  
  // Project suggestions (legacy compatible)
  suggestedProjectName: v.optional(v.any()),  // Legacy: suggested_project_name
  suggested_project_name: v.optional(v.any()),
  suggestedProjectDescription: v.optional(v.any()),  // Legacy: suggested_project_description
  suggested_project_description: v.optional(v.any()),
  suggestedDomain: v.optional(v.any()),  // Legacy: suggested_domain
  suggested_domain: v.optional(v.any()),
  suggestedComplexity: v.optional(v.any()),  // Legacy: suggested_complexity
  suggested_complexity: v.optional(v.any()),
  suggestedTimeHorizon: v.optional(v.any()),  // Legacy: suggested_time_horizon
  suggested_time_horizon: v.optional(v.any()),
  
  // Promotion tracking (legacy compatible)
  promoted: v.optional(v.any()),
  promotedAt: v.optional(v.any()),  // Legacy: promoted_at
  promoted_at: v.optional(v.any()),
  promotedToProjectId: v.optional(v.any()),  // Legacy: promoted_to_project_id
  promoted_to_project_id: v.optional(v.any()),
  confidenceAtPromotion: v.optional(v.any()),  // Legacy: confidence_at_promotion
  confidence_at_promotion: v.optional(v.any()),
  
  // Temporal metadata
  createdAt: v.optional(v.any()),
  updatedAt: v.optional(v.any()),
  lastEvolution: v.optional(v.any()),
  
  // Symbiotic relationships (legacy compatible)
  relatedCrystalIds: v.optional(v.any()),  // Legacy: related_crystal_ids
  related_crystal_ids: v.optional(v.any()),
  symbioticPairs: v.optional(v.any()),  // Legacy: symbiotic_pairs
  symbiotic_pairs: v.optional(v.any()),
  
  // Legacy fields
  stardustId: v.optional(v.any()),  // Legacy stardust_id field
};

// Wrapped validator for mutations/queries
export const stardustValidator = v.object(stardustSchemaFields);

export const stardustCreateValidator = v.object({
  userId: v.string(),
  name: v.optional(v.any()),
  description: v.optional(v.any()),
  confidence: v.optional(v.any()),
  // Legacy compatible source tracking
  sourceShardIds: v.optional(v.any()),
  source_shard_ids: v.optional(v.any()),
  keywords: v.optional(v.any()),
  dimension: v.optional(v.any()),
  // Legacy compatible project suggestions
  suggestedProjectName: v.optional(v.any()),
  suggested_project_name: v.optional(v.any()),
  suggestedProjectDescription: v.optional(v.any()),
  suggested_project_description: v.optional(v.any()),
  suggestedDomain: v.optional(v.any()),
  suggested_domain: v.optional(v.any()),
  suggestedComplexity: v.optional(v.any()),
  suggested_complexity: v.optional(v.any()),
  suggestedTimeHorizon: v.optional(v.any()),
  suggested_time_horizon: v.optional(v.any()),
  // Legacy compatible related IDs
  relatedNoteIds: v.optional(v.any()),
  related_note_ids: v.optional(v.any()),
  relatedConversationIds: v.optional(v.any()),
  related_conversation_ids: v.optional(v.any()),
  shardCount: v.optional(v.any()),
  shard_count: v.optional(v.any()),
  evidenceStrength: v.optional(v.any()),
  evidence_strength: v.optional(v.any()),
  lifecycleStage: v.optional(v.any()),
  health: v.optional(v.any()),
  energy: v.optional(v.any()),
  detectionMethod: v.optional(v.any()),
  detection_method: v.optional(v.any()),
  // Legacy fields
  stardustId: v.optional(v.any()),
});

export const stardustUpdateValidator = v.object({
  name: v.optional(v.any()),
  description: v.optional(v.any()),
  confidence: v.optional(v.any()),
  // Legacy compatible source tracking
  sourceShardIds: v.optional(v.any()),
  source_shard_ids: v.optional(v.any()),
  keywords: v.optional(v.any()),
  shardCount: v.optional(v.any()),
  shard_count: v.optional(v.any()),
  evidenceStrength: v.optional(v.any()),
  evidence_strength: v.optional(v.any()),
  // Legacy compatible project suggestions
  suggestedProjectName: v.optional(v.any()),
  suggested_project_name: v.optional(v.any()),
  suggestedProjectDescription: v.optional(v.any()),
  suggested_project_description: v.optional(v.any()),
  suggestedDomain: v.optional(v.any()),
  suggested_domain: v.optional(v.any()),
  suggestedComplexity: v.optional(v.any()),
  suggested_complexity: v.optional(v.any()),
  suggestedTimeHorizon: v.optional(v.any()),
  suggested_time_horizon: v.optional(v.any()),
  lifecycleStage: v.optional(v.any()),
  health: v.optional(v.any()),
  energy: v.optional(v.any()),
  // Legacy compatible symbiotic relationships
  relatedCrystalIds: v.optional(v.any()),
  related_crystal_ids: v.optional(v.any()),
  symbioticPairs: v.optional(v.any()),
  symbiotic_pairs: v.optional(v.any()),
});

// ============================================================================
// TYPE EXPORTS (FLEXIBLE, LLM-DRIVEN)
// ============================================================================

// Flexible string - LLM can generate any stage name
// Common stages: "embryo", "juvenile", "mature", "ghost", "transcendent", "archived"
export type StardustLifecycleStage = any;

// Flexible string types - no hardcoded categories
export type StardustEvidenceStrength = any;
export type StardustDomain = any;

export interface Stardust {
  userId: string;
  name?: any;
  description?: any;
  keywords?: any;
  dimension?: any;
  // Legacy compatible detection metadata
  detectedAt?: any;
  detected_at?: any;
  detectionMethod?: any;
  detection_method?: any;
  confidence?: any;
  evidenceStrength?: any;
  evidence_strength?: any;
  // Legacy compatible source tracking
  sourceShardIds?: any;
  source_shard_ids?: any;
  shardCount?: any;
  shard_count?: any;
  relatedNoteIds?: any;
  related_note_ids?: any;
  relatedConversationIds?: any;
  related_conversation_ids?: any;
  lifecycleStage?: any;
  health?: any;
  energy?: any;
  // Legacy compatible project suggestions
  suggestedProjectName?: any;
  suggested_project_name?: any;
  suggestedProjectDescription?: any;
  suggested_project_description?: any;
  suggestedDomain?: any;
  suggested_domain?: any;
  suggestedComplexity?: any;
  suggested_complexity?: any;
  suggestedTimeHorizon?: any;
  suggested_time_horizon?: any;
  promoted?: any;
  // Legacy compatible promotion tracking
  promotedAt?: any;
  promoted_at?: any;
  promotedToProjectId?: any;
  promoted_to_project_id?: any;
  confidenceAtPromotion?: any;
  confidence_at_promotion?: any;
  createdAt?: any;
  updatedAt?: any;
  lastEvolution?: any;
  // Legacy compatible symbiotic relationships
  relatedCrystalIds?: any;
  related_crystal_ids?: any;
  symbioticPairs?: any;
  symbiotic_pairs?: any;
  // Legacy fields
  stardustId?: any;
}

export interface StardustCreateInput {
  userId: string;
  name?: any;
  description?: any;
  confidence?: any;
  // Legacy compatible source tracking
  sourceShardIds?: any;
  source_shard_ids?: any;
  keywords?: any;
  dimension?: any;
  // Legacy compatible project suggestions
  suggestedProjectName?: any;
  suggested_project_name?: any;
  suggestedProjectDescription?: any;
  suggested_project_description?: any;
  suggestedDomain?: any;
  suggested_domain?: any;
  suggestedComplexity?: any;
  suggested_complexity?: any;
  suggestedTimeHorizon?: any;
  suggested_time_horizon?: any;
  // Legacy compatible related IDs
  relatedNoteIds?: any;
  related_note_ids?: any;
  relatedConversationIds?: any;
  related_conversation_ids?: any;
  shardCount?: any;
  shard_count?: any;
  evidenceStrength?: any;
  evidence_strength?: any;
  lifecycleStage?: any;
  health?: any;
  energy?: any;
  detectionMethod?: any;
  detection_method?: any;
  // Legacy fields
  stardustId?: any;
}

export interface StardustUpdateInput {
  name?: any;
  description?: any;
  confidence?: any;
  // Legacy compatible source tracking
  sourceShardIds?: any;
  source_shard_ids?: any;
  keywords?: any;
  shardCount?: any;
  shard_count?: any;
  evidenceStrength?: any;
  evidence_strength?: any;
  // Legacy compatible project suggestions
  suggestedProjectName?: any;
  suggested_project_name?: any;
  suggestedProjectDescription?: any;
  suggested_project_description?: any;
  suggestedDomain?: any;
  suggested_domain?: any;
  suggestedComplexity?: any;
  suggested_complexity?: any;
  suggestedTimeHorizon?: any;
  suggested_time_horizon?: any;
  lifecycleStage?: any;
  health?: any;
  energy?: any;
  // Legacy compatible symbiotic relationships
  relatedCrystalIds?: any;
  related_crystal_ids?: any;
  symbioticPairs?: any;
  symbiotic_pairs?: any;
}

