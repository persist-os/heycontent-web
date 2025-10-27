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
  v.literal("convergence_optimization"),
  v.literal("evolution_mab_reward"),
  v.literal("formation_mab_reward"),
  v.literal("stardust_promotion"),
  v.literal("widget_execution"),
  v.literal("chat_post_message_tasks"),
  v.literal("conversation_title_generation"),
  v.literal("chaos_generation")
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
export type JobType = "shard_extraction" | "crystal_formation" | "intelligence_analysis" | "chatgpt_import" | "context_enrichment_feedback" | "stardust_stream_detection" | "convergence_optimization" | "evolution_mab_reward" | "formation_mab_reward" | "stardust_promotion" | "widget_execution" | "chat_post_message_tasks" | "conversation_title_generation" | "chaos_generation";
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

export const stardustStreamDetectionPayloadValidator = v.object({
  shard_ids: v.array(v.string()),
  trigger_source: v.string(),
});

export const stardustPromotionPayloadValidator = v.object({
  // Empty payload for stardust promotion jobs
});

export const widgetExecutionPayloadValidator = v.object({
  widget_id: v.string(),
  project_id: v.string(),
  user_id: v.string(),
  scheduled: v.boolean(),
  execution_prompt: v.optional(v.string()),
  metadata: v.optional(v.any()),
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
  file_content_base64: string;  // Base64-encoded file content
  filename: string;
  file_size_mb: number;
}

export interface ContextEnrichmentFeedbackPayload {
  decision_id: string;
  conversation_id: string;
  message_index: number;
  agent_type: string;
}

export interface StardustStreamDetectionPayload {
  shard_ids: string[];
  trigger_source: string;
}

export interface StardustPromotionPayload {
  // Empty payload for stardust promotion jobs
  [key: string]: never;
}

export interface WidgetExecutionPayload {
  widget_id: string;
  project_id: string;
  user_id: string;
  scheduled: boolean;
  execution_prompt?: string;
  metadata?: any;
}

export interface ChatPostMessageTasksPayload {
  user_id: string;
  session_id: string;
  is_first_message: boolean;
  user_message: string;
  ai_response: string;
  user_info?: string;
  enrichment_result?: any;
  enrichment_metadata?: any;
  memory_key: string;
}

export interface ConversationTitleGenerationPayload {
  user_id: string;
  session_id: string;
  user_message: string;
  ai_response: string;
  user_info?: string;
}