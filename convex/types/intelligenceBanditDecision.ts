import { v } from "convex/values";

export const intelligenceBanditDecisionSchemaFields = {
  userId: v.string(),
  jobId: v.optional(v.string()),  // Link to background_jobs if triggered
  
  // Decision context
  armPulled: v.string(),
  triggered: v.boolean(),
  
  // State snapshot at decision time
  state_snapshot: v.object({
    semantic_drift: v.number(),
    activity_velocity: v.number(),
    hours_since_last: v.number(),
    crystal_count: v.number(),
    active_crystals: v.number(),
    formations_since_last: v.number(),
  }),
  
  // All arms' state for analysis
  arms_state: v.array(v.object({
    armId: v.string(),
    armName: v.string(),
    alpha: v.number(),
    beta: v.number(),
    sampled_value: v.number(),
  })),
  
  // Outcome (populated after analysis)
  reward: v.optional(v.number()),
  
  decisionAt: v.number(),
  rewardObservedAt: v.optional(v.number()),
};

export const intelligenceBanditDecisionValidator = v.object(intelligenceBanditDecisionSchemaFields);

