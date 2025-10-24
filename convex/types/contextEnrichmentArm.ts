import { v } from "convex/values";

export const contextEnrichmentArmSchemaFields = {
  userId: v.string(),
  agentType: v.string(),  // "chat", "widget", "discovery"
  armId: v.string(),
  armName: v.string(),
  
  // Strategy parameters (stored for reference)
  strategy_params: v.object({
    threshold: v.number(),
    limit: v.number(),
    content_types: v.array(v.string()),
    // Allow both nested and flat structures for backward compatibility
    shard_params: v.optional(v.object({
      limit: v.number(),
      dimensions: v.union(v.null(), v.array(v.string())),
      min_confidence: v.union(v.null(), v.string()),
      keywords: v.union(v.null(), v.array(v.string())),
      tags: v.union(v.null(), v.array(v.string())),
    })),
    // Flat structure (for Convergence-generated configs)
    shard_limit: v.optional(v.number()),
    shard_confidence: v.optional(v.number()),
  }),
  
  // Thompson Sampling parameters (Beta distribution)
  alpha: v.number(),
  beta: v.number(),
  
  // Performance tracking
  total_pulls: v.number(),
  total_reward: v.number(),
  avg_reward: v.number(),
  
  // Confidence metrics
  mean_estimate: v.number(),
  confidence_interval: v.object({
    lower: v.number(),
    upper: v.number(),
  }),
  
  last_pulled: v.optional(v.number()),
  updatedAt: v.number(),
};

export const contextEnrichmentArmValidator = v.object(contextEnrichmentArmSchemaFields);

