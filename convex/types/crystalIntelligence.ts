import { v } from "convex/values";

export const contradictionSeverityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
);

export const healthTrendValidator = v.union(
  v.literal("improving"),
  v.literal("stable"),
  v.literal("declining")
);

export const reviewPriorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
);

export const crystalIntelligenceSchemaFields = {
  userId: v.string(),
  crystalId: v.string(),
  
  // Usage statistics (aggregated from usageEvents) - all optional for incremental updates
  usage: v.optional(v.object({
    total_retrievals: v.optional(v.number()),
    retrievals_last_7d: v.optional(v.number()),
    retrievals_last_30d: v.optional(v.number()),
    last_used: v.optional(v.number()),
    last_retrieved: v.optional(v.number()),
    usage_frequency: v.optional(v.number()),
    contexts: v.optional(v.array(v.string())),
    co_occurrence: v.optional(v.array(v.string())),
  })),
  
  // Relationship analysis (vector similarity based) - all optional for incremental updates
  relationships: v.optional(v.object({
    related: v.optional(v.array(v.object({
      crystalId: v.string(),
      similarity: v.number(),
      relationship_type: v.string(),
      confidence: v.number(),
    }))),
    related_crystal_ids: v.optional(v.array(v.string())),
    relationship_scores: v.optional(v.any()),
    conflicting: v.optional(v.array(v.object({
      crystalId: v.string(),
      conflict_score: v.number(),
      conflict_type: v.string(),
      resolution: v.optional(v.string()),
    }))),
  })),
  
  // Contradiction analysis (shard-level) - all optional for incremental updates
  contradictions: v.optional(v.object({
    shard_ids: v.optional(v.array(v.string())),
    severity: v.optional(contradictionSeverityValidator),
    patterns: v.optional(v.array(v.string())),
    analysis: v.optional(v.string()),
  })),
  
  // Health scoring (composite metric) - all optional for incremental updates
  health: v.optional(v.object({
    overall_score: v.optional(v.number()),
    last_computed: v.optional(v.number()),
    components: v.optional(v.object({
      evidence_strength: v.optional(v.number()),
      usage_recency: v.optional(v.number()),
      usage_frequency: v.optional(v.number()),
      contradiction_impact: v.optional(v.number()),
      age_factor: v.optional(v.number()),
    })),
    trend: v.optional(healthTrendValidator),
  })),
  
  // Lifecycle management - all optional for incremental updates
  lifecycle: v.optional(v.object({
    review_priority: v.optional(reviewPriorityValidator),
    next_review_due: v.optional(v.number()),
    archival_candidate: v.optional(v.boolean()),
    archival_reason: v.optional(v.string()),
    archival_confidence: v.optional(v.number()),
  })),
  
  // Metadata
  analysis_version: v.string(),
  last_analyzed: v.number(),
  analysis_depth: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const crystalIntelligenceValidator = v.object(crystalIntelligenceSchemaFields);

