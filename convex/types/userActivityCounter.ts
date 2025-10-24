import { v } from "convex/values";

export const activityPriorityValidator = v.union(
  v.literal("low"),
  v.literal("normal"),
  v.literal("high"),
  v.literal("urgent")
);

export const userActivityCounterSchemaFields = {
  userId: v.string(),
  
  // Activity counts since last intelligence analysis
  since_last_analysis: v.object({
    chat_messages: v.number(),
    smart_notes: v.number(),
    crystal_formations: v.number(),
    crystal_retrievals: v.number(),
  }),
  
  // Lifetime activity (for analytics)
  lifetime: v.object({
    chat_messages: v.number(),
    smart_notes: v.number(),
    crystal_formations: v.number(),
    crystal_retrievals: v.number(),
  }),
  
  // Trigger state
  pending_analysis: v.boolean(),
  analysis_priority: activityPriorityValidator,
  
  updatedAt: v.number(),
};

export const userActivityCounterValidator = v.object(userActivityCounterSchemaFields);

