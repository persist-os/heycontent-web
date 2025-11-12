import { v } from "convex/values";

/**
 * Unified Actions System Types
 * 
 * Tracks ALL actions across widgets, artifacts, tools, and agents.
 * Enables:
 * - Computed status (no stored state)
 * - Widget-artifact relationship tracking
 * - Unified action history
 * - Future extensibility (tool usage, agent actions)
 * 
 * Pattern: Pattern 16 (Validator Centralization) - extracted types for schema maintainability
 */

// Action type validator - covers ALL action types
export const actionTypeValidator = v.union(
  // Artifact actions
  v.literal("artifact_email_send"),
  v.literal("artifact_email_schedule"),
  v.literal("artifact_export"),
  v.literal("artifact_update"),
  
  // Widget actions
  v.literal("widget_execution"),
  v.literal("widget_execution_start"),
  v.literal("widget_execution_complete"),
  v.literal("widget_execution_failed"),
  
  // Tool usage (future)
  v.literal("tool_usage"),
  v.literal("tool_api_call"),
  v.literal("tool_file_read"),
  v.literal("tool_file_write"),
  
  // Agent actions (future)
  v.literal("agent_action"),
  v.literal("agent_spawn"),
  v.literal("agent_complete"),
  v.literal("agent_failed")
);

// Action status validator
export const actionStatusValidator = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("cancelled")
);

// Action schema fields (unwrapped for defineTable)
export const actionSchemaFields = {
  // Relationships - what this action relates to
  userId: v.string(),                    // Always required - user who triggered/owns action
  projectId: v.optional(v.id("projects")),  // Optional - project-level actions
  widgetId: v.optional(v.id("widgets")),      // Optional - widget actions
  artifactId: v.optional(v.id("artifacts")),  // Optional - artifact actions
  agentId: v.optional(v.string()),            // Optional - agent identifier (string, not Convex ID)
  toolId: v.optional(v.string()),             // Optional - tool identifier (string, not Convex ID)
  
  // Action identity
  actionType: actionTypeValidator,
  status: actionStatusValidator,
  
  // Action data - type-specific payload
  actionData: v.any(),  // Flexible: emailId, threadId, exportUrl, executionId, toolParams, etc.
  
  // Scheduling
  scheduledAt: v.optional(v.number()),   // When action should execute (for scheduled actions)
  startedAt: v.optional(v.number()),     // When action started executing
  completedAt: v.optional(v.number()),    // When action completed
  
  // Error tracking
  error: v.optional(v.string()),          // Error message if failed
  errorDetails: v.optional(v.any()),      // Detailed error info
  
  // Metadata
  metadata: v.optional(v.object({
    executionId: v.optional(v.string()),  // Background job execution ID
    retryCount: v.optional(v.number()),    // Retry attempts
    durationMs: v.optional(v.number()),    // Execution duration
    qualityScore: v.optional(v.number()), // Quality score (for widget executions)
  })),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Wrapped validator for mutations/queries
export const actionValidator = v.object(actionSchemaFields);

// Action create validator (for mutations)
export const actionCreateValidator = v.object({
  userId: v.string(),
  projectId: v.optional(v.id("projects")),
  widgetId: v.optional(v.id("widgets")),
  artifactId: v.optional(v.id("artifacts")),
  agentId: v.optional(v.string()),
  toolId: v.optional(v.string()),
  actionType: actionTypeValidator,
  status: actionStatusValidator,
  actionData: v.any(),
  scheduledAt: v.optional(v.number()),
  metadata: v.optional(v.object({
    executionId: v.optional(v.string()),
    retryCount: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    qualityScore: v.optional(v.number()),
  })),
});

// Action update validator (for mutations)
export const actionUpdateValidator = v.object({
  actionId: v.id("actions"),
  status: v.optional(actionStatusValidator),
  actionData: v.optional(v.any()),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  error: v.optional(v.string()),
  errorDetails: v.optional(v.any()),
  metadata: v.optional(v.object({
    executionId: v.optional(v.string()),
    retryCount: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    qualityScore: v.optional(v.number()),
  })),
});

