import { v } from "convex/values";

export const insightImportanceValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
);

export const goalClarityValidator = v.union(
  v.literal("unclear"),
  v.literal("emerging"),
  v.literal("clear"),
  v.literal("very_clear")
);

export const conversationSummarySchemaFields = {
  userId: v.string(),
  projectId: v.optional(v.id("projects")),
  segmentId: v.string(), // Unique identifier for conversation segment
  messageCount: v.number(),
  
  // Key insights extracted
  keyInsights: v.array(v.object({
    insight_type: v.string(),
    content: v.string(),
    confidence: v.number(), // 0-1
    context: v.string(),
    importance: insightImportanceValidator,
  })),
  
  // Working style analysis
  workingStyleHints: v.array(v.string()),
  goalClarity: goalClarityValidator,
  collaborationPreferences: v.array(v.string()),
  timePreferences: v.array(v.string()),
  complexityIndicators: v.array(v.string()),
  emotionalTone: v.string(),
  
  // Follow-up suggestions
  nextQuestions: v.array(v.string()),
  summary: v.string(),
  
  // Metadata
  createdAt: v.number(),
  processedAt: v.number(),
  agentVersion: v.string(),
};

export const conversationSummaryValidator = v.object(conversationSummarySchemaFields);

