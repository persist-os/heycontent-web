import { v } from "convex/values";

/**
 * Widget Question Schema
 * 
 * Stores questions that widgets ask users during execution.
 * Enables proactive widget behavior and async user interaction.
 */
export const widgetQuestionSchemaFields = {
  // Identifiers
  widgetId: v.union(v.string(), v.id("widgets")),  // Supports both string and Convex ID
  projectId: v.id("projects"),  // Backend uses "projects"
  userId: v.string(),
  
  // Question content
  question: v.string(),
  context: v.any(),  // Execution context
  suggestedAnswers: v.optional(v.array(v.string())),
  
  // Answer
  answer: v.optional(v.string()),
  answeredAt: v.optional(v.number()),
  
  // Status
  status: v.union(
    v.literal("pending"),
    v.literal("answered"),
    v.literal("cancelled")
  ),
  
  // Metadata
  createdAt: v.number(),
};

export const widgetQuestionValidator = v.object(widgetQuestionSchemaFields);

