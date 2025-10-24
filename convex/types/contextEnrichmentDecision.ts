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
  engagement_score: v.optional(v.number()),
  grading_score: v.optional(v.number()),  // If LLM grading was used (10% sample)
  final_reward: v.optional(v.number()),
  
  decisionAt: v.number(),
  rewardObservedAt: v.optional(v.number()),
};

export const contextEnrichmentDecisionValidator = v.object(contextEnrichmentDecisionSchemaFields);

