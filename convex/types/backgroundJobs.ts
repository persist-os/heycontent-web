/**
 * Background Jobs Type Definitions
 * 
 * CRITICAL: These types MUST match backend-new/app/background_jobs/types/job_types.py exactly
 * Any changes here should be mirrored in Python and vice versa.
 */

import { v } from "convex/values";

// Job type validator - matches Python JobType enum
export const jobTypeValidator = v.union(
  v.literal("shard_extraction"),
  v.literal("crystal_formation"),
  v.literal("intelligence_analysis"),
  v.literal("chatgpt_import"),
  v.literal("context_enrichment_feedback"),
  v.literal("stardust_stream_detection"),
  v.literal("convergence_optimization")
);

// Job status validator - matches Python JobStatus enum
export const jobStatusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed")
);

// Job priority validator - matches Python JobPriority enum
export const jobPriorityValidator = v.union(
  v.literal("low"),
  v.literal("normal"),
  v.literal("high"),
  v.literal("urgent")
);

// Type exports for TypeScript code
export type JobType = "shard_extraction" | "crystal_formation" | "intelligence_analysis" | "chatgpt_import" | "context_enrichment_feedback" | "stardust_stream_detection" | "convergence_optimization";
export type JobStatus = "queued" | "running" | "completed" | "failed";
export type JobPriority = "low" | "normal" | "high" | "urgent";

// Payload type validators (match Python dataclasses)
export const shardExtractionPayloadValidator = v.object({
  batch_content: v.array(v.any()),
  batch_size: v.number(),
});

export const crystalFormationPayloadValidator = v.object({
  trigger_source: v.string(),
});

export const intelligenceAnalysisPayloadValidator = v.object({
  analysis_depth: v.union(v.literal("fast"), v.literal("standard"), v.literal("deep")),
  decision_id: v.optional(v.string()),
  trigger_source: v.string(),
});

export const chatgptImportPayloadValidator = v.object({
  file_path: v.string(),
  filename: v.string(),
});

export const contextEnrichmentFeedbackPayloadValidator = v.object({
  decision_id: v.string(),
  conversation_id: v.string(),
  message_index: v.number(),
  agent_type: v.string(),
});

// TypeScript interfaces matching Python dataclasses
export interface ShardExtractionPayload {
  batch_content: any[];
  batch_size: number;
}

export interface CrystalFormationPayload {
  trigger_source: string;
}

export interface IntelligenceAnalysisPayload {
  analysis_depth: "fast" | "standard" | "deep";
  decision_id?: string;
  trigger_source: string;
}

export interface ChatGPTImportPayload {
  file_path: string;
  filename: string;
}

export interface ContextEnrichmentFeedbackPayload {
  decision_id: string;
  conversation_id: string;
  message_index: number;
  agent_type: string;
}
