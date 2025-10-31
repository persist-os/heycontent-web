/**
 * Execution Plan Type Definitions
 * 
 * Minimal types for project execution plans.
 * Matches backend/app/models/project_execution_models.py
 */

import { v } from "convex/values";

// Plan step validator
export const planStepValidator = v.object({
  widgetId: v.string(),
  executionOrder: v.number(),
  timing: v.string(),
  rationale: v.string(),
  expectedOutput: v.string(),
  dependencies: v.array(v.string()),
  skipRecommended: v.boolean(),
  skipReason: v.optional(v.string()),
});

// Execution plan schema fields (unwrapped for defineTable)
export const executionPlanSchemaFields = {
  planId: v.string(),
  userId: v.string(),
  projectId: v.id("projects"),
  steps: v.array(planStepValidator),
  totalEstimatedDurationMinutes: v.number(),
  cognitiveContext: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  status: v.string(), // "pending", "executing", "completed", "failed"
};

// Execution plan validator (wrapped for mutations)
export const executionPlanValidator = v.object(executionPlanSchemaFields);

// Create validator (excludes auto-generated fields)
export const executionPlanCreateValidator = v.object({
  planId: v.string(),
  userId: v.string(),
  projectId: v.id("projects"),
  steps: v.array(planStepValidator),
  totalEstimatedDurationMinutes: v.number(),
  cognitiveContext: v.optional(v.string()),
});

// Type exports
export type PlanStep = {
  widgetId: string;
  executionOrder: number;
  timing: string;
  rationale: string;
  expectedOutput: string;
  dependencies: string[];
  skipRecommended: boolean;
  skipReason?: string;
};

export type ExecutionPlan = {
  planId: string;
  userId: string;
  projectId: string;
  steps: PlanStep[];
  totalEstimatedDurationMinutes: number;
  cognitiveContext?: string;
  createdAt: number;
  updatedAt: number;
  status: string;
};

