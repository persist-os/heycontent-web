/**
 * Stardust Type Definitions
 * 
 * CRITICAL: These types MUST match backend/app/models/stardust_models.py exactly
 * Any changes here should be mirrored in Python and vice versa.
 * 
 * Stardust represents "What You Do" - concrete project potentials that evolve into star organisms.
 * Parallel species to Crystals: Crystals = "Who You Are", Stardust = "What You Do"
 * 
 * VALIDATOR PATTERN:
 * - AI-GENERATED FIELDS: Flexible validators (v.optional(v.any()))
 * - PROGRAMMATIC FIELDS: Strict validators only for lifecycle management
 */

import { v } from "convex/values";

// ============================================================================
// STARDUST VALIDATORS
// ============================================================================

// Flexible lifecycle stage - LLM can generate any stage name
export const stardustLifecycleStageValidator = v.string();

// Flexible string validators - no hardcoded categories
export const stardustEvidenceStrengthValidator = v.string();
export const stardustDomainValidator = v.string();

// Schema fields (unwrapped for defineTable) - EXACT field names from actual data
export const stardustSchemaFields = {
  // Core identification
  userId: v.string(),
  
  // Stardust definition
  name: v.optional(v.any()),
  description: v.optional(v.any()),
  keywords: v.optional(v.any()),
  dimension: v.optional(v.any()),
  
  // Detection metadata
  detectedAt: v.optional(v.any()),
  detectionMethod: v.optional(v.any()),
  confidence: v.optional(v.any()),
  evidenceStrength: v.optional(v.any()),
  
  // Source tracking
  sourceShardIds: v.optional(v.any()),
  shardCount: v.optional(v.any()),
  relatedNoteIds: v.optional(v.any()),
  relatedConversationIds: v.optional(v.any()),
  
  // Lifecycle stage
  lifecycleStage: v.optional(v.any()),
  health: v.optional(v.any()),
  energy: v.optional(v.any()),
  
  // Project suggestions
  suggestedProjectName: v.optional(v.any()),
  suggestedProjectDescription: v.optional(v.any()),
  suggestedDomain: v.optional(v.any()),
  suggestedComplexity: v.optional(v.any()),
  suggestedTimeHorizon: v.optional(v.any()),
  
  // Promotion tracking
  promoted: v.optional(v.any()),
  promotedAt: v.optional(v.any()),
  promotedToProjectId: v.optional(v.any()),
  confidenceAtPromotion: v.optional(v.any()),
  
  // Temporal metadata
  createdAt: v.optional(v.any()),
  updatedAt: v.optional(v.any()),
  lastEvolution: v.optional(v.any()),
  lastReferenced: v.optional(v.any()),
  referenceCount: v.optional(v.any()),
  
  // Symbiotic relationships
  relatedCrystalIds: v.optional(v.any()),
  symbioticPairs: v.optional(v.any()),
  
  // Legacy fields
  stardustId: v.optional(v.any()),
};

// Wrapped validator for mutations/queries
export const stardustValidator = v.object(stardustSchemaFields);

export const stardustCreateValidator = v.object({
  userId: v.string(),
  name: v.optional(v.any()),
  description: v.optional(v.any()),
  confidence: v.optional(v.any()),
  sourceShardIds: v.optional(v.any()),
  keywords: v.optional(v.any()),
  dimension: v.optional(v.any()),
  suggestedProjectName: v.optional(v.any()),
  suggestedProjectDescription: v.optional(v.any()),
  suggestedDomain: v.optional(v.any()),
  suggestedComplexity: v.optional(v.any()),
  suggestedTimeHorizon: v.optional(v.any()),
  relatedNoteIds: v.optional(v.any()),
  relatedConversationIds: v.optional(v.any()),
  shardCount: v.optional(v.any()),
  evidenceStrength: v.optional(v.any()),
  lifecycleStage: v.optional(v.any()),
  health: v.optional(v.any()),
  energy: v.optional(v.any()),
  detectionMethod: v.optional(v.any()),
  detectedAt: v.optional(v.any()),
  relatedCrystalIds: v.optional(v.any()),
  symbioticPairs: v.optional(v.any()),
  stardustId: v.optional(v.any()),
});

export const stardustUpdateValidator = v.object({
  name: v.optional(v.any()),
  description: v.optional(v.any()),
  confidence: v.optional(v.any()),
  sourceShardIds: v.optional(v.any()),
  keywords: v.optional(v.any()),
  shardCount: v.optional(v.any()),
  evidenceStrength: v.optional(v.any()),
  suggestedProjectName: v.optional(v.any()),
  suggestedProjectDescription: v.optional(v.any()),
  suggestedDomain: v.optional(v.any()),
  suggestedComplexity: v.optional(v.any()),
  suggestedTimeHorizon: v.optional(v.any()),
  lifecycleStage: v.optional(v.any()),
  health: v.optional(v.any()),
  energy: v.optional(v.any()),
  relatedCrystalIds: v.optional(v.any()),
  symbioticPairs: v.optional(v.any()),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type StardustLifecycleStage = any;
export type StardustEvidenceStrength = any;
export type StardustDomain = any;

export interface Stardust {
  userId: string;
  name?: any;
  description?: any;
  keywords?: any;
  dimension?: any;
  detectedAt?: any;
  detectionMethod?: any;
  confidence?: any;
  evidenceStrength?: any;
  sourceShardIds?: any;
  shardCount?: any;
  relatedNoteIds?: any;
  relatedConversationIds?: any;
  lifecycleStage?: any;
  health?: any;
  energy?: any;
  suggestedProjectName?: any;
  suggestedProjectDescription?: any;
  suggestedDomain?: any;
  suggestedComplexity?: any;
  suggestedTimeHorizon?: any;
  promoted?: any;
  promotedAt?: any;
  promotedToProjectId?: any;
  confidenceAtPromotion?: any;
  createdAt?: any;
  updatedAt?: any;
  lastEvolution?: any;
  relatedCrystalIds?: any;
  symbioticPairs?: any;
  stardustId?: any;
}

export interface StardustCreateInput {
  userId: string;
  name?: any;
  description?: any;
  confidence?: any;
  sourceShardIds?: any;
  keywords?: any;
  dimension?: any;
  suggestedProjectName?: any;
  suggestedProjectDescription?: any;
  suggestedDomain?: any;
  suggestedComplexity?: any;
  suggestedTimeHorizon?: any;
  relatedNoteIds?: any;
  relatedConversationIds?: any;
  shardCount?: any;
  evidenceStrength?: any;
  lifecycleStage?: any;
  health?: any;
  energy?: any;
  detectionMethod?: any;
  detectedAt?: any;
  relatedCrystalIds?: any;
  symbioticPairs?: any;
  stardustId?: any;
}

export interface StardustUpdateInput {
  name?: any;
  description?: any;
  confidence?: any;
  sourceShardIds?: any;
  keywords?: any;
  shardCount?: any;
  evidenceStrength?: any;
  suggestedProjectName?: any;
  suggestedProjectDescription?: any;
  suggestedDomain?: any;
  suggestedComplexity?: any;
  suggestedTimeHorizon?: any;
  lifecycleStage?: any;
  health?: any;
  energy?: any;
  relatedCrystalIds?: any;
  symbioticPairs?: any;
}