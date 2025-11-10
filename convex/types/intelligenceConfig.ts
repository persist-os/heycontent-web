import { v } from "convex/values";

export const analysisDepthValidator = v.union(
  v.literal("fast"),
  v.literal("standard"),
  v.literal("deep")
);

export const intelligenceConfigSchemaFields = {
  userId: v.string(),
  
  // Trigger thresholds (configurable)
  triggers: v.object({
    chat_messages: v.number(),        // DEPRECATED: MAB system controls triggering
    smart_notes: v.number(),          // DEPRECATED: MAB system controls triggering
    crystal_formations: v.number(),   // DEPRECATED: MAB system controls triggering
    days_since_last: v.number(),      // Default: 7
  }),
  
  // Analysis preferences
  preferences: v.object({
    analysis_depth: analysisDepthValidator,
    auto_archival: v.boolean(),
    review_notifications: v.boolean(),
  }),
  
  // Execution tracking
  last_analysis: v.number(),
  last_analysis_triggered_at: v.optional(v.number()),  // Last time MAB triggered analysis (for cooldown)
  last_analysis_snapshot: v.optional(v.any()),  // Snapshot for drift calculation
  next_scheduled_analysis: v.optional(v.number()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const intelligenceConfigValidator = v.object(intelligenceConfigSchemaFields);

