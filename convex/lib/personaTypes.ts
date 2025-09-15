/**
 * TypeScript type definitions for the Autonomous Persona Crystallization System (APCS)
 * These types match the Pydantic models from Agent 1's backend implementation
 */

import { Id } from "../_generated/dataModel";
import { v } from "convex/values";

// Trace types enum matching Agent 1's implementation
export const TRACE_TYPES = [
  "preference",
  "behavior", 
  "goal",
  "constraint",
  "pattern",
  "value",
  "workflow",
  "communication_style",
  "temporal_preference",
  "emotional_pattern"
] as const;

export type TraceType = typeof TRACE_TYPES[number];

// Backend trace metadata structure (matches Pydantic TraceMetadata exactly)
export interface BackendTraceMetadata {
  conversation_id: string;
  message_timestamp: number;
  extraction_timestamp: number;
  linguistic_markers: string[];
  context_length: number;
  user_id: string;
}

// Core persona trace interface (matches backend PersonaTrace exactly)
export interface PersonaTrace {
  trace_id: string;
  trace_type: TraceType;
  verbatim_quote: string;
  extracted_insight: string;
  confidence: number;
  context: string;
  temporal_weight: number;
  preference_strength: number;
  metadata: BackendTraceMetadata;
}

// Convex database trace (with Convex-specific fields added)
export interface ConvexPersonaTrace extends PersonaTrace {
  _id?: Id<"persona_traces">;
  user_id: string;
  conversation_id: Id<"conversations">;
}

// Evolution history entry for crystallized insights (matches backend EvolutionEvent)
export interface EvolutionHistoryEntry {
  timestamp: number;
  event_type: "strengthened" | "weakened" | "contradicted" | "refined";
  old_value: string | null;
  new_value: string;
  trigger_trace_id: string;
  confidence_change: number;
  reason: string;
}

// Confidence history entry
export interface ConfidenceHistoryEntry {
  timestamp: number;
  confidence: number;
}

// Metadata structure for crystallized insights
export interface CrystallizedInsightMetadata {
  first_observed: number;
  last_observed: number;
  frequency: number;
  contexts: string[];
  confidence_history: ConfidenceHistoryEntry[];
}

// Core crystallized insight interface (database format)
export interface CrystallizedInsight {
  _id?: Id<"crystallized_insights">;
  user_id: string;
  insight_type: string;
  crystallized_insight: string;
  confidence: number;
  supporting_traces: Id<"persona_traces">[]; // Stored as Convex IDs in database
  contradiction_flags: string[];
  evolution_history: EvolutionHistoryEntry[];
  temporal_stability: number;
  cross_pattern_correlations: string[];
  metadata: CrystallizedInsightMetadata;
  created_at: number;
  updated_at: number;
}

// Input format for crystallized insights (from backend - uses string IDs)
export interface CrystallizedInsightInput {
  insight_type: string;
  crystallized_insight: string;
  confidence: number;
  supporting_traces: string[]; // Received as string IDs from backend
  contradiction_flags: string[];
  evolution_history: EvolutionHistoryEntry[];
  temporal_stability: number;
  cross_pattern_correlations: string[];
  metadata: CrystallizedInsightMetadata;
  created_at: number;
  updated_at: number;
}

// Input types for trace extraction from Agent 1
export interface TraceExtractionRequest {
  user_id: string;
  conversation_id: Id<"conversations">;
  force_reprocess?: boolean;
}

export interface TraceExtractionResponse {
  traces: PersonaTrace[];
  extraction_metadata: any;
  processing_time_ms: number;
}

// Input types for crystallization process
export interface CrystallizationRequest {
  user_id: string;
  time_window?: number; // days
}

export interface CrystallizationResponse {
  insights: CrystallizedInsight[];
  crystallization_metadata: any;
  processing_time_ms: number;
}

// User persona profile for Agent 3's AI context injection
export interface UserPersonaProfile {
  user_id: string;
  recent_traces: PersonaTrace[];
  crystallized_insights: CrystallizedInsight[];
  confidence_scores: Record<string, number>;
  last_updated: number;
  profile_completeness: number;
}

// Validators for Convex functions (matching the types above)
export const traceTypeValidator = v.union(
  v.literal("preference"),
  v.literal("behavior"),
  v.literal("goal"),
  v.literal("constraint"),
  v.literal("pattern"),
  v.literal("value"),
  v.literal("workflow"),
  v.literal("communication_style"),
  v.literal("temporal_preference"),
  v.literal("emotional_pattern")
);

export const backendTraceMetadataValidator = v.object({
  conversation_id: v.string(),
  message_timestamp: v.float64(),
  extraction_timestamp: v.float64(),
  linguistic_markers: v.array(v.string()),
  context_length: v.number(),
  user_id: v.string()
});

export const personaTraceValidator = v.object({
  trace_id: v.string(),
  trace_type: traceTypeValidator,
  verbatim_quote: v.string(),
  extracted_insight: v.string(),
  confidence: v.number(),
  context: v.string(),
  temporal_weight: v.number(),
  preference_strength: v.number(),
  metadata: backendTraceMetadataValidator
});

export const evolutionHistoryValidator = v.array(v.object({
  timestamp: v.float64(),
  event_type: v.union(
    v.literal("strengthened"),
    v.literal("weakened"),
    v.literal("contradicted"),
    v.literal("refined")
  ),
  old_value: v.union(v.string(), v.null()),
  new_value: v.string(),
  trigger_trace_id: v.string(),
  confidence_change: v.float64(),
  reason: v.string()
}));

export const confidenceHistoryValidator = v.array(v.object({
  timestamp: v.float64(),
  confidence: v.float64()
}));

export const crystallizedInsightMetadataValidator = v.object({
  first_observed: v.float64(),
  last_observed: v.float64(),
  frequency: v.float64(),
  contexts: v.array(v.string()),
  confidence_history: confidenceHistoryValidator
});

export const convexPersonaTraceValidator = v.object({
  _id: v.optional(v.id("persona_traces")),
  user_id: v.string(),
  conversation_id: v.id("conversations"),
  trace_id: v.string(),
  trace_type: traceTypeValidator,
  verbatim_quote: v.string(),
  extracted_insight: v.string(),
  confidence: v.number(),
  context: v.string(),
  temporal_weight: v.number(),
  preference_strength: v.number(),
  metadata: backendTraceMetadataValidator
});

// Validator for database format (with Convex IDs)
export const crystallizedInsightValidator = v.object({
  _id: v.optional(v.id("crystallized_insights")),
  user_id: v.string(),
  insight_type: v.string(),
  crystallized_insight: v.string(),
  confidence: v.number(),
  supporting_traces: v.array(v.id("persona_traces")), // Stored as Convex IDs
  contradiction_flags: v.array(v.string()),
  evolution_history: evolutionHistoryValidator,
  temporal_stability: v.number(),
  cross_pattern_correlations: v.array(v.string()),
  metadata: crystallizedInsightMetadataValidator,
  created_at: v.number(),
  updated_at: v.number()
});

// Validator for input format (with string IDs that get converted)
export const crystallizedInsightInputValidator = v.object({
  insight_type: v.string(),
  crystallized_insight: v.string(),
  confidence: v.float64(),
  supporting_traces: v.array(v.string()), // Input as strings, converted to Convex IDs
  contradiction_flags: v.array(v.string()),
  evolution_history: evolutionHistoryValidator,
  temporal_stability: v.float64(),
  cross_pattern_correlations: v.array(v.string()),
  metadata: crystallizedInsightMetadataValidator,
  created_at: v.float64(),
  updated_at: v.float64()
});

// API endpoints configuration for Agent 1 backend integration
export const AGENT1_ENDPOINTS = {
  TRACE_EXTRACTION: "/api/v1/persona-crystallization/extract-traces",
  CRYSTALLIZATION: "/api/v1/persona-crystallization/crystallize-insights",
  HEALTH_CHECK: "/api/v1/persona-crystallization/health"
} as const;

// Processing status constants
export const PROCESSING_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress", 
  COMPLETED: "completed",
  FAILED: "failed"
} as const;

export type ProcessingStatus = typeof PROCESSING_STATUS[keyof typeof PROCESSING_STATUS];

// Error types for better error handling
export interface PersonaCrystallizationError {
  code: string;
  message: string;
  details: any;
  timestamp: number;
}

// Batch processing types
export interface BatchProcessingResult {
  total_processed: number;
  successful: number;
  failed: number;
  errors: PersonaCrystallizationError[];
  processing_time: number;
}
