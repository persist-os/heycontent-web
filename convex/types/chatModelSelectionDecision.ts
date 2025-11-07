import { v } from "convex/values";

export const chatModelSelectionDecisionSchemaFields = {
  userId: v.string(),
  agentType: v.string(),
  armPulled: v.string(),
  strategyUsed: v.any(),  // Flexible params structure
  armsState: v.array(v.object({
    armId: v.string(),
    armName: v.string(),
    alpha: v.number(),
    beta: v.number(),
    sampled_value: v.number(),
  })),
  conversationId: v.string(),  // Required for decision tracking
  messageIndex: v.number(),    // Required for decision tracking (matches message.sequence)
  rating: v.optional(v.number()),  // User rating (1-5) - only if user rated
  final_reward: v.union(v.null(), v.number()),  // Normalized reward (0.0-1.0) - only if rating provided
  feedbackId: v.optional(v.id("feedback")),  // Optional - only if user provided feedback
  feedbackText: v.optional(v.string()),  // User's text feedback (denormalized from feedback table)
  createdAt: v.number(),
  rewardObservedAt: v.union(v.null(), v.number()),
};

export const chatModelSelectionDecisionValidator = v.object(chatModelSelectionDecisionSchemaFields);

