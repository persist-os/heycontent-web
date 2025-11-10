import { v } from "convex/values";

export const contextEnrichmentDecisionSchemaFields = {
  userId: v.string(),
  agentType: v.string(),
  conversationId: v.string(),
  messageIndex: v.number(),  // Which assistant message this decision is for
  
  // Decision context
  armPulled: v.string(),
  strategyUsed: v.object({
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
  
  // All arms' state at decision time (for analysis)
  arms_state: v.array(v.object({
    armId: v.string(),
    armName: v.string(),
    alpha: v.number(),
    beta: v.number(),
    sampled_value: v.number(),
  })),
  
  // Outcome (populated after user responds)
  rating: v.optional(v.number()),  // User rating (1-5) - only if user rated
  final_reward: v.optional(v.number()),  // Normalized reward (0.0-1.0) - only if rating provided
  feedbackId: v.optional(v.id("feedback")),  // Optional - only if user provided feedback
  feedbackText: v.optional(v.string()),  // User's text feedback (denormalized from feedback table)
  
  decisionAt: v.number(),
  rewardObservedAt: v.optional(v.number()),
};

export const contextEnrichmentDecisionValidator = v.object(contextEnrichmentDecisionSchemaFields);

