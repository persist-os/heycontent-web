import { v } from "convex/values";

export const intelligenceBanditArmSchemaFields = {
  userId: v.string(),
  armId: v.string(),
  armName: v.string(),
  description: v.optional(v.string()),
  
  // Strategy parameters (e.g., threshold values, min_shards)
  params: v.optional(v.any()),  // Flexible storage for arm-specific parameters
  
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

export const intelligenceBanditArmValidator = v.object(intelligenceBanditArmSchemaFields);

