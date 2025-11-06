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
  armId: v.optional(v.string()),
  parameters: v.optional(v.any()), // Flexible parameters for different optimization strategies
  alpha: v.optional(v.number()),
  beta: v.optional(v.number()),
  lastSelected: v.optional(v.number()),
  rewardHistory: v.optional(v.array(v.number()))
});

// ============================================================================
// LAYER 1: CORE FIELD (Machine Substrate)
// ============================================================================

export const fieldNodeValidator = v.object({
  nodeId: v.optional(v.string()),
  coherence: v.optional(v.number()),
  entropy: v.optional(v.number()),
  temporalDrift: v.optional(v.number()),
  embeddingVector: v.optional(v.array(v.number())),
  lastUpdated: v.optional(v.number())
});

export const fieldCrosslinkValidator = v.object({
  sourceNode: v.optional(v.string()),
  targetNode: v.optional(v.string()),
  weight: v.optional(v.number()),
  relationshipType: v.optional(v.string()),
  confidence: v.optional(v.number())
});

export const coreFieldValidator = v.object({
  field_id: v.optional(v.string()),
  user_id: v.optional(v.string()),
  vectorSpace: v.optional(v.any()), // Embedding manifold representation
  fieldNodes: v.optional(v.array(fieldNodeValidator)),
  crosslinks: v.optional(v.array(fieldCrosslinkValidator)),
  temporalVector: v.optional(v.array(v.number())),
  updateSignature: v.optional(v.string()), // SHA256 hash of shard sources
  lastProcessed: v.optional(v.number())
});

// ============================================================================
// LAYER 2: SEMANTIC METADATA (A2A Language)
// ============================================================================

export const abstractDimensionValidator = v.object({
  dimensionName: v.optional(v.string()),
  value: v.optional(v.number()),
  confidence: v.optional(v.number())
});

export const crossDomainPatternValidator = v.object({
  patternName: v.optional(v.string()),
  strength: v.optional(v.number()),
  domains: v.optional(v.array(v.string()))
});

export const chaosInterpretationValidator = v.object({
  hypothesis: v.optional(v.string()),
  confidence: v.optional(v.number()),
  varianceSource: v.optional(v.string()),
  alternativeExplanations: v.optional(v.array(v.string()))
});

export const semanticMetadataValidator = v.object({
  abstractDimensions: v.optional(v.array(abstractDimensionValidator)),
  crossDomainPatterns: v.optional(v.array(crossDomainPatternValidator)),
  chaosInterpretations: v.optional(v.array(chaosInterpretationValidator)),
  metaInferenceSummary: v.optional(v.string()),
  confidenceProfile: v.optional(v.any()), // Flexible confidence structure
  divergenceLog: v.optional(v.array(v.string()))
});

// ============================================================================
// LAYER 3: HUMAN TRANSPARENCY (Read-Only)
// ============================================================================

export const traceLinkValidator = v.object({
  sourceType: v.optional(v.string()), // "shard", "node", "pattern"
  sourceId: v.optional(v.string()),
  contributionWeight: v.optional(v.number())
});

export const transparencyLayerValidator = v.object({
  humanLabel: v.optional(v.string()),
  interpretiveSummary: v.optional(v.string()),
  traceLinks: v.optional(v.array(traceLinkValidator)),
  temporalNote: v.optional(v.string()),
  stabilityScore: v.optional(v.number()),
  ethicalDisclosure: v.optional(v.string())
});

// ============================================================================
// LAYER 4: CROSS-DOMAIN DISCOVERY
// ============================================================================

// Cross-domain pattern (Layer 4 version - different from Layer 2)
export const crossDomainPatternLayer4Validator = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  domains: v.optional(v.array(v.string())),
  noveltyScore: v.optional(v.number()),
  supportingNodes: v.optional(v.array(v.string()))
});

// Field crosslink (Layer 4 version - different from Layer 1)
export const fieldCrosslinkLayer4Validator = v.object({
  fromNode: v.optional(v.string()),
  toNode: v.optional(v.string()),
  relationship: v.optional(v.string()),
  confidence: v.optional(v.number()),
  rationale: v.optional(v.string())
});

export const temporalDriftValidator = v.object({
  direction: v.optional(v.string()),
  description: v.optional(v.string()),
  keyChanges: v.optional(v.array(v.string())),
  confidence: v.optional(v.number())
});

export const crossDomainLayerValidator = v.object({
  crossDomainPatterns: v.optional(v.array(crossDomainPatternLayer4Validator)),
  fieldCrosslinks: v.optional(v.array(fieldCrosslinkLayer4Validator)),
  temporalDrift: v.optional(temporalDriftValidator),
  emergentThemes: v.optional(v.array(v.string()))
});

// ============================================================================
// USER PREFERENCES (Learned Over Time - Not From Layers)
// ============================================================================

export const communicationPreferenceValidator = v.object({
  tonePreference: v.optional(v.string()), // "formal", "casual", "encouraging", "direct"
  detailLevel: v.optional(v.string()), // "minimal", "moderate", "detailed"
  responseStyle: v.optional(v.string()), // "conversational", "structured", "bullet_points"
  feedbackFrequency: v.optional(v.string()) // "immediate", "periodic", "on_request"
});

export const interactionPreferenceValidator = v.object({
  preferredTriggers: v.optional(v.array(v.string())),
  avoidedTopics: v.optional(v.array(v.string())),
  collaborationStyle: v.optional(v.string()), // "autonomous", "collaborative", "guided"
  decisionMakingStyle: v.optional(v.string()) // "analytical", "intuitive", "balanced"
});

export const userPreferencesValidator = v.object({
  communicationPreferences: v.optional(communicationPreferenceValidator),
  interactionPreferences: v.optional(interactionPreferenceValidator),
  learningPreferences: v.optional(v.any()), // Flexible learning style preferences
  adaptationRate: v.optional(v.number()), // How quickly preferences should evolve
  lastPreferenceUpdate: v.optional(v.number())
});

// ============================================================================
// MAIN COGNITIVE FIELD SCHEMA
// ============================================================================

export const cognitiveFieldSchemaFields = {
  // Core identification
  userId: v.optional(v.string()),
  fieldId: v.optional(v.string()),
  conversationId: v.optional(v.string()),  // Optional: conversation-level fields have this, project-level don't
  projectId: v.id("projects"),  // REQUIRED: Project context
  
  // Field status and lifecycle
  status: v.optional(fieldStatusValidator),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  lastEvolution: v.optional(v.number()),
  
  // Source tracking
  sourceShardIds: v.optional(v.array(v.string())),
  sourceStardustIds: v.optional(v.array(v.string())),
  
  // The four layers
  coreField: v.optional(coreFieldValidator),
  semanticMetadata: v.optional(semanticMetadataValidator),
  transparencyLayer: v.optional(transparencyLayerValidator),
  crossDomainLayer: v.optional(crossDomainLayerValidator),
  
  // User preferences (learned over time)
  userPreferences: v.optional(userPreferencesValidator),
  
  // MAB integration
  mabArms: v.optional(v.array(mabArmValidator)),
  optimizationStrategy: v.optional(v.string()),
  
  // Cross-field relationships
  relatedFields: v.optional(v.array(v.string())),
  conflictingFields: v.optional(v.array(v.string())),
  
  // Utilization tracking
  usageCount: v.optional(v.number()),
  lastUsed: v.optional(v.number()),
  
  // Archival fields
  archived: v.optional(v.boolean()),
  archivedAt: v.optional(v.number())
};

// Wrapped validator for mutations/queries
export const cognitiveFieldValidator = v.object(cognitiveFieldSchemaFields);

// Creation validator (excludes auto-generated fields)
export const cognitiveFieldCreateValidator = v.object({
  userId: v.string(),
  fieldId: v.string(),
  conversationId: v.optional(v.string()),  // Optional: conversation-level fields have this, project-level don't
  projectId: v.id("projects"),  // REQUIRED: Project context
  sourceShardIds: v.array(v.string()),
  sourceStardustIds: v.array(v.string()),
  coreField: v.any(),
  semanticMetadata: v.any(),
  transparencyLayer: v.any(),
  crossDomainLayer: v.optional(v.any()),
  userPreferences: v.optional(userPreferencesValidator),
  mabArms: v.optional(v.array(mabArmValidator)),
  optimizationStrategy: v.optional(v.string()),
  // NO status, NO createdAt, NO updatedAt, NO _id
});

export const cognitiveFieldUpdateValidator = v.object({
  status: v.optional(fieldStatusValidator),
  coreField: v.optional(coreFieldValidator),
  semanticMetadata: v.optional(semanticMetadataValidator),
  transparencyLayer: v.optional(transparencyLayerValidator),
  crossDomainLayer: v.optional(crossDomainLayerValidator),
  userPreferences: v.optional(userPreferencesValidator),
  mabArms: v.optional(v.array(mabArmValidator)),
  optimizationStrategy: v.optional(v.string()),
  relatedFields: v.optional(v.array(v.string())),
  conflictingFields: v.optional(v.array(v.string())),
  usageCount: v.optional(v.union(v.number(), v.literal("INCREMENT"))),
  lastUsed: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  archived: v.optional(v.boolean()),
  archivedAt: v.optional(v.number())
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FieldStatus = "active" | "evolving" | "stable" | "archived";
export type FieldLayer = "core" | "semantic" | "transparency" | "preferences";

export type FieldNode = {
  nodeId?: string;
  coherence?: number;
  entropy?: number;
  temporalDrift?: number;
  embeddingVector?: number[];
  lastUpdated?: number;
};

export type FieldCrosslink = {
  sourceNode?: string;
  targetNode?: string;
  weight?: number;
  relationshipType?: string;
  confidence?: number;
};

export type CoreField = {
  field_id?: string;
  user_id?: string;
  vectorSpace?: any;
  fieldNodes?: FieldNode[];
  crosslinks?: FieldCrosslink[];
  temporalVector?: number[];
  updateSignature?: string;
  lastProcessed?: number;
};

export type AbstractDimension = {
  dimensionName?: string;
  value?: number;
  confidence?: number;
};

export type CrossDomainPattern = {
  patternName?: string;
  strength?: number;
  domains?: string[];
};

export type ChaosInterpretation = {
  hypothesis?: string;
  confidence?: number;
  varianceSource?: string;
  alternativeExplanations?: string[];
};

export type SemanticMetadata = {
  abstractDimensions?: AbstractDimension[];
  crossDomainPatterns?: CrossDomainPattern[];
  chaosInterpretations?: ChaosInterpretation[];
  metaInferenceSummary?: string;
  confidenceProfile?: any;
  divergenceLog?: string[];
};

export type TraceLink = {
  sourceType?: string;
  sourceId?: string;
  contributionWeight?: number;
};

export type TransparencyLayer = {
  humanLabel?: string;
  interpretiveSummary?: string;
  traceLinks?: TraceLink[];
  temporalNote?: string;
  stabilityScore?: number;
  ethicalDisclosure?: string;
};

export type CommunicationPreference = {
  tonePreference?: string;
  detailLevel?: string;
  responseStyle?: string;
  feedbackFrequency?: string;
};

export type InteractionPreference = {
  preferredTriggers?: string[];
  avoidedTopics?: string[];
  collaborationStyle?: string;
  decisionMakingStyle?: string;
};

export type UserPreferences = {
  communicationPreferences?: CommunicationPreference;
  interactionPreferences?: InteractionPreference;
  learningPreferences?: any;
  adaptationRate?: number;
  lastPreferenceUpdate?: number;
};

export type MABArm = {
  armId?: string;
  parameters?: any;
  alpha?: number;
  beta?: number;
  lastSelected?: number;
  rewardHistory?: number[];
};

export type CrossDomainPatternLayer4 = {
  name?: string;
  description?: string;
  domains?: string[];
  noveltyScore?: number;
  supportingNodes?: string[];
};

export type FieldCrosslinkLayer4 = {
  fromNode?: string;
  toNode?: string;
  relationship?: string;
  confidence?: number;
  rationale?: string;
};

export type TemporalDrift = {
  direction?: string;
  description?: string;
  keyChanges?: string[];
  confidence?: number;
};

export type CrossDomainLayer = {
  crossDomainPatterns?: CrossDomainPatternLayer4[];
  fieldCrosslinks?: FieldCrosslinkLayer4[];
  temporalDrift?: TemporalDrift;
  emergentThemes?: string[];
};

export interface CognitiveField {
  userId?: string;
  fieldId?: string;
  conversationId: string;  // REQUIRED: 1:1 link to conversation
  projectId: string;  // REQUIRED: Project context (stored as Convex ID)
  status?: FieldStatus;
  createdAt?: number;
  updatedAt?: number;
  lastEvolution?: number;
  sourceShardIds?: string[];
  sourceStardustIds?: string[];
  coreField?: CoreField;
  semanticMetadata?: SemanticMetadata;
  transparencyLayer?: TransparencyLayer;
  crossDomainLayer?: CrossDomainLayer;
  userPreferences?: UserPreferences;
  mabArms?: MABArm[];
  optimizationStrategy?: string;
  relatedFields?: string[];
  conflictingFields?: string[];
  usageCount?: number;
  lastUsed?: number;
  archived?: boolean;
  archivedAt?: number;
}
