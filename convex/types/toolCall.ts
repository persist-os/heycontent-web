import { v } from "convex/values";

/**
 * Tool Call Tracking Types
 * 
 * Tracks which tools were called during agent runs to enable:
 * - Debugging: "Why did orchestrator create THIS widget?" → trace to specific tool calls
 * - Analytics: "Which tools are most effective?"
 * - Optimization: "Are agents calling tools unnecessarily?"
 * 
 * Pattern: Copied from contextUsage.ts (LAW I - COPY)
 */

export const sessionTypeValidator = v.union(
  v.literal("conversation"),
  v.literal("project"),
  v.literal("widget"),
  v.literal("unknown")
);

export const toolCallItemValidator = v.object({
  toolName: v.string(),                      // "create_widget", "trigger_widget_update"
  callOrder: v.number(),                     // Order in run (1, 2, 3...)
  success: v.boolean(),                      // Did tool succeed?
  toolArgs: v.optional(v.any()),             // Tool arguments (JSON)
  toolResult: v.optional(v.string()),        // Tool result as string
  errorMessage: v.optional(v.string()),      // Error if failed
});

export const toolCallSchemaFields = {
  // Core identifiers
  userId: v.string(),
  timestamp: v.number(),
  
  // Agent & run identification
  agentType: v.string(),                     // "orchestrator", "chat", "widget_generator"
  runId: v.string(),                         // Links to agnoRunEvents
  
  // Session context
  sessionId: v.string(),                     // conversation_id, project_id, widget_id
  sessionType: sessionTypeValidator,
  
  // Tool calls data
  toolsCalled: v.array(toolCallItemValidator),
  totalToolsCalled: v.number(),
  successfulCalls: v.number(),
  failedCalls: v.number(),
  
  // Outcome tracking (for MAB feedback)
  engagementScore: v.optional(v.number()),
};

export const toolCallValidator = v.object(toolCallSchemaFields);

