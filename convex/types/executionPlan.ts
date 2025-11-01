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
  widgetTitle: v.optional(v.string()), // Display title for UI
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
  result: v.optional(v.any()), // Execution result (completed steps, failed steps, outputs)
};

// Execution plan validator (wrapped for mutations)
export const executionPlanValidator = v.object(executionPlanSchemaFields);

// Create validator (excludes auto-generated fields: planId, createdAt, updatedAt, status)
export const executionPlanCreateValidator = v.object({
  userId: v.string(),
  projectId: v.id("projects"),
  steps: v.array(planStepValidator),
  totalEstimatedDurationMinutes: v.number(),
  cognitiveContext: v.optional(v.string()),
  // NO planId - Convex generates _id
  // NO createdAt - Convex generates
  // NO updatedAt - Convex generates
  // NO status - Convex generates
});

// Type exports
export type PlanStep = {
  widgetId: string;
  widgetTitle: string; // Display title for UI
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
  result?: any;
};

