/**
 * Clean TypeScript types for the Simplified Persona System
 * All legacy types removed - clean slate implementation
 */

import { Id } from "../_generated/dataModel";
import { v } from "convex/values";

// ===== CORE INTERFACES =====

// Persona trace interface (matches simplified schema)
export interface PersonaTrace {
  _id?: Id<"persona_traces">;
  userId: string;
  content: any;      // Backend-generated trace (any structure the backend wants)
  timestamp: number;
  confidence: number;
}

// Previous version of a crystallized insight (for evolution tracking)
export interface InsightPreviousVersion {
  content: string;
  confidence: number;
  timestamp: number;
  reason: string;     // Why it evolved
}

// Crystallized insight interface (matches simplified schema with evolution)
export interface CrystallizedInsight {
  _id?: Id<"crystallized_insights">;
  userId: string;
  content: string;   // Backend-generated insight
  category: string;
  timestamp: number;
  confidence: number;
  sources: Id<"persona_traces">[];
  // Evolution tracking
  version: number;
  previousVersions?: InsightPreviousVersion[];
  evolutionCount: number;
}

// ===== INPUT TYPES (from backend) =====

// Input format for traces coming from backend
export interface PersonaTraceInput {
  userId: string;
  content: any;
  timestamp: number;
  confidence: number;
}

// Input format for insights coming from backend
export interface CrystallizedInsightInput {
  userId: string;
  content: string;
  category: string;
  timestamp: number;
  confidence: number;
  sources: string[]; // String IDs from backend, converted to Convex IDs
  // Evolution data (optional - for updates)
  version?: number;
  previousVersions?: InsightPreviousVersion[];
  evolutionCount?: number;
  evolutionReason?: string; // Why this version evolved from the previous
}

// ===== CONVEX VALIDATORS =====

// Validator for persona traces
export const personaTraceValidator = v.object({
  userId: v.string(),
  content: v.any(),
  timestamp: v.number(),
  confidence: v.number()
});

// Validator for previous versions in insight evolution
export const insightPreviousVersionValidator = v.object({
  content: v.string(),
  confidence: v.number(),
  timestamp: v.number(),
  reason: v.string()
});

// Validator for crystallized insights
export const crystallizedInsightValidator = v.object({
  userId: v.string(),
  content: v.string(),
  category: v.string(),
  timestamp: v.number(),
  confidence: v.number(),
  sources: v.array(v.id("persona_traces")),
  version: v.number(),
  previousVersions: v.optional(v.array(insightPreviousVersionValidator)),
  evolutionCount: v.number()
});

// Input validators (for data coming from backend)
export const personaTraceInputValidator = v.object({
  userId: v.string(),
  content: v.any(),
  timestamp: v.number(),
  confidence: v.number()
});

export const crystallizedInsightInputValidator = v.object({
  userId: v.string(),
  content: v.string(),
  category: v.string(),
  timestamp: v.number(),
  confidence: v.number(),
  sources: v.array(v.string()), // String IDs from backend
  version: v.optional(v.number()),
  previousVersions: v.optional(v.array(insightPreviousVersionValidator)),
  evolutionCount: v.optional(v.number()),
  evolutionReason: v.optional(v.string())
});

// ===== API TYPES =====

// Response types for API endpoints
export interface TraceStorageResponse {
  success: boolean;
  tracesStored: number;
  errors: string[];
}

export interface InsightStorageResponse {
  success: boolean;
  insightsStored: number;
  newInsights: number;
  evolvedInsights: number;
  errors: string[];
}

// User persona profile for AI context injection
export interface UserPersonaProfile {
  userId: string;
  recentTraces: PersonaTrace[];
  crystallizedInsights: CrystallizedInsight[];
  confidenceScores: {
    overall: number;
    byCategory: Record<string, number>;
  };
  lastUpdated: number;
  profileCompleteness: number;
  summary: {
    totalTraces: number;
    totalInsights: number;
    topCategories: string[];
    recentActivity: number;
  };
}

// ===== ERROR TYPES =====

export interface PersonaCrystallizationError {
  code: string;
  message: string;
  details: any;
  timestamp: number;
}

// ===== BATCH PROCESSING TYPES =====

export interface BatchProcessingResult {
  success: boolean;
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: string[]; // Simplified to string array
  processingTime: number;
}

// ===== CONSTANTS =====

// API endpoints for backend integration
export const PERSONA_ENDPOINTS = {
  STORE_TRACES: "/api/v1/persona/traces",
  STORE_INSIGHTS: "/api/v1/persona/insights",
  GET_PROFILE: "/api/v1/persona/profile"
} as const;

// Processing status constants
export const PROCESSING_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress", 
  COMPLETED: "completed",
  FAILED: "failed"
} as const;

export type ProcessingStatus = typeof PROCESSING_STATUS[keyof typeof PROCESSING_STATUS];