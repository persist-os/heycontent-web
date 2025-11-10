import { v } from "convex/values";

export const ambientInsightSchemaFields = {
  userId: v.string(),
  data: v.array(v.object({
    title: v.string(),
    content: v.string(),
    category: v.string(),
    recommendation: v.string(),
  })),
  greetings: v.optional(v.array(v.string())),
  customCommandPrompts: v.optional(v.array(v.object({
    id: v.string(),
    label: v.string(),
    category: v.string(),
    noteType: v.optional(v.string()),
  }))),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const ambientInsightValidator = v.object(ambientInsightSchemaFields);

