import { v } from "convex/values";

export const jobTypeValidator = v.union(
  v.literal("quick_update"),
  v.literal("standard_analysis"),
  v.literal("deep_analysis"),
  v.literal("archival_review")
);

export const jobStatusValidator = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("cancelled")
);

export const jobPriorityValidator = v.union(
  v.literal("low"),
  v.literal("normal"),
  v.literal("high"),
  v.literal("urgent")
);

export const intelligenceJobSchemaFields = {
  userId: v.string(),
  
  // Job configuration
  job_type: jobTypeValidator,
  
  // Execution details
  status: jobStatusValidator,
  priority: jobPriorityValidator,
  
  // Scope (what to analyze)
  scope: v.object({
    crystal_ids: v.optional(v.array(v.string())),
    analyze_all: v.boolean(),
    analysis_depth: v.string(),
  }),
  
  // Execution tracking
  trigger_source: v.string(),
  scheduled_for: v.number(),
  started_at: v.optional(v.number()),
  completed_at: v.optional(v.number()),
  duration_ms: v.optional(v.number()),
  
  // Results
  results: v.optional(v.object({
    crystals_analyzed: v.number(),
    relationships_found: v.number(),
    contradictions_found: v.number(),
    health_scores_updated: v.number(),
    error: v.optional(v.string()),
    details: v.optional(v.any()),  // Additional analysis details from backend
  })),
  
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const intelligenceJobValidator = v.object(intelligenceJobSchemaFields);

