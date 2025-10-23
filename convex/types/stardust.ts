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
export const stardustLifecycleStageValidator = v.string();

// Flexible string validators - no hardcoded categories
export const stardustEvidenceStrengthValidator = v.string();
export const stardustDomainValidator = v.string();

export const stardustValidator = v.object({
  // Core identification
  userId: v.string(),
  stardust_id: v.string(),
  
  // Stardust definition
  name: v.string(),
  description: v.string(),
  keywords: v.array(v.string()),
  dimension: v.string(),
  
  // Detection metadata
  detected_at: v.number(),
  detection_method: v.string(),
  confidence: v.number(),
  evidence_strength: v.string(),
  
  // Source tracking
  source_shard_ids: v.array(v.string()),
  shard_count: v.number(),
  related_note_ids: v.array(v.string()),
  related_conversation_ids: v.array(v.string()),
  
  // Lifecycle stage
  lifecycleStage: stardustLifecycleStageValidator,
  health: v.number(),
  energy: v.number(),
  
  // Project suggestions
  suggested_project_name: v.string(),
  suggested_project_description: v.string(),
  suggested_domain: v.string(),
  suggested_complexity: v.number(),
  suggested_time_horizon: v.string(),
  
  // Promotion tracking
  promoted: v.boolean(),
  promoted_at: v.optional(v.number()),
  promoted_to_project_id: v.optional(v.id("projects")),
  confidence_at_promotion: v.optional(v.number()),
  
  // Temporal metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  lastEvolution: v.optional(v.number()),
  
  // Symbiotic relationships
  related_crystal_ids: v.array(v.string()),
  symbiotic_pairs: v.array(v.string()),
});

export const stardustCreateValidator = v.object({
  userId: v.string(),
  stardust_id: v.string(),
  name: v.string(),
  description: v.string(),
  confidence: v.number(),
  source_shard_ids: v.array(v.string()),
  keywords: v.array(v.string()),
  dimension: v.string(),
  suggested_project_name: v.string(),
  suggested_project_description: v.string(),
  suggested_domain: v.string(),
  suggested_complexity: v.number(),
  suggested_time_horizon: v.string(),
  related_note_ids: v.array(v.string()),
  related_conversation_ids: v.array(v.string()),
  shard_count: v.number(),
  evidence_strength: v.string(),
  lifecycleStage: v.optional(stardustLifecycleStageValidator),
  health: v.optional(v.number()),
  energy: v.optional(v.number()),
  detection_method: v.optional(v.string()),
});

export const stardustUpdateValidator = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  confidence: v.optional(v.number()),
  source_shard_ids: v.optional(v.array(v.string())),
  keywords: v.optional(v.array(v.string())),
  shard_count: v.optional(v.number()),
  evidence_strength: v.optional(v.string()),
  suggested_project_name: v.optional(v.string()),
  suggested_project_description: v.optional(v.string()),
  suggested_domain: v.optional(v.string()),
  suggested_complexity: v.optional(v.number()),
  suggested_time_horizon: v.optional(v.string()),
  lifecycleStage: v.optional(stardustLifecycleStageValidator),
  health: v.optional(v.number()),
  energy: v.optional(v.number()),
  related_crystal_ids: v.optional(v.array(v.string())),
  symbiotic_pairs: v.optional(v.array(v.string())),
});

// ============================================================================
// TYPE EXPORTS (FLEXIBLE, LLM-DRIVEN)
// ============================================================================

// Flexible string - LLM can generate any stage name
// Common stages: "embryo", "juvenile", "mature", "ghost", "transcendent", "archived"
export type StardustLifecycleStage = string;

// Flexible string types - no hardcoded categories
export type StardustEvidenceStrength = string;
export type StardustDomain = string;

export interface Stardust {
  userId: string;
  stardust_id: string;
  name: string;
  description: string;
  keywords: string[];
  dimension: string;
  detected_at: number;
  detection_method: string;
  confidence: number;
  evidence_strength: StardustEvidenceStrength;
  source_shard_ids: string[];
  shard_count: number;
  related_note_ids: string[];
  related_conversation_ids: string[];
  lifecycleStage: StardustLifecycleStage;
  health: number;
  energy: number;
  suggested_project_name: string;
  suggested_project_description: string;
  suggested_domain: string;
  suggested_complexity: number;
  suggested_time_horizon: string;
  promoted: boolean;
  promoted_at?: number;
  promoted_to_project_id?: string;
  confidence_at_promotion?: number;
  createdAt: number;
  updatedAt: number;
  lastEvolution?: number;
  related_crystal_ids: string[];
  symbiotic_pairs: string[];
}

export interface StardustCreateInput {
  userId: string;
  stardust_id: string;
  name: string;
  description: string;
  confidence: number;
  source_shard_ids: string[];
  keywords: string[];
  dimension: string;
  suggested_project_name: string;
  suggested_project_description: string;
  suggested_domain: StardustDomain;
  suggested_complexity: number;
  suggested_time_horizon: string;
  related_note_ids: string[];
  related_conversation_ids: string[];
  shard_count: number;
  evidence_strength: StardustEvidenceStrength;
  lifecycleStage?: StardustLifecycleStage;
  health?: number;
  energy?: number;
  detection_method?: string;
}

export interface StardustUpdateInput {
  name?: string;
  description?: string;
  confidence?: number;
  source_shard_ids?: string[];
  keywords?: string[];
  shard_count?: number;
  evidence_strength?: StardustEvidenceStrength;
  suggested_project_name?: string;
  suggested_project_description?: string;
  suggested_domain?: StardustDomain;
  suggested_complexity?: number;
  suggested_time_horizon?: string;
  lifecycleStage?: StardustLifecycleStage;
  health?: number;
  energy?: number;
  related_crystal_ids?: string[];
  symbiotic_pairs?: string[];
}

