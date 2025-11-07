import { defineTable } from "convex/server";
import { v } from "convex/values";

export const chatModelSelectionArmSchemaFields = {
  userId: v.string(),
  agentType: v.string(),
  armId: v.string(),
  armName: v.string(),
  params: v.any(),  // Flexible params structure (provider, model_id, temperature, etc.)
  alpha: v.number(),
  beta: v.number(),
  total_pulls: v.number(),
  total_reward: v.number(),
  avg_reward: v.number(),
  mean_estimate: v.number(),
  confidence_interval: v.object({
    lower: v.number(),
    upper: v.number(),
  }),
  last_pulled: v.optional(v.number()),
  updatedAt: v.number(),
  // New: marks if this arm originated from evolution rather than global defaults
  isEvolved: v.optional(v.boolean()),
};

export const chatModelSelectionArmValidator = v.object(chatModelSelectionArmSchemaFields);

