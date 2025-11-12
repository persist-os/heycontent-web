import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Action Queries
 * 
 * Computed status queries and action history queries.
 * Status is computed from actions, not stored in artifact/widget tables.
 * 
 * Pattern: Computed status via Convex queries (reactive, no stored state)
 */

/**
 * Get Artifact Status
 * 
 * Computes artifact status from actions table.
 * For email artifacts: draft → scheduled → sent
 * 
 * Status logic:
 * - "scheduled" if has pending email_schedule actions
 * - "sent" if has completed email_send actions
 * - "draft" otherwise
 */
export const getArtifactStatus = query({
  args: { artifactId: v.id("artifacts") },
  handler: async (ctx, { artifactId }) => {
    const actions = await ctx.db
      .query("actions")
      .withIndex("by_artifact", (q) => q.eq("artifactId", artifactId))
      .collect();
    
    // Compute status from actions
    const hasPendingSchedules = actions.some(
      (a) => a.actionType === "artifact_email_schedule" && a.status === "pending"
    );
    const hasCompletedSends = actions.some(
      (a) => a.actionType === "artifact_email_send" && a.status === "completed"
    );
    
    if (hasPendingSchedules) return "scheduled";
    if (hasCompletedSends) return "sent";
    return "draft";
  },
});

/**
 * Get Widget Status
 * 
 * Computes widget status from actions table.
 * 
 * Status logic:
 * - "completed" if latest execution_start has matching execution_complete
 * - "working" if latest execution_start is in_progress
 * - "pending" otherwise
 */
export const getWidgetStatus = query({
  args: { widgetId: v.id("widgets") },
  handler: async (ctx, { widgetId }) => {
    const latestExecution = await ctx.db
      .query("actions")
      .withIndex("by_widget_type", (q) => 
        q.eq("widgetId", widgetId)
         .eq("actionType", "widget_execution_start")
      )
      .order("desc")
      .first();
    
    if (!latestExecution) return "pending";
    
    // Check if execution completed
    const executionId = latestExecution.actionData?.executionId;
    if (executionId) {
      const completion = await ctx.db
        .query("actions")
        .withIndex("by_widget_type", (q) => 
          q.eq("widgetId", widgetId)
           .eq("actionType", "widget_execution_complete")
        )
        .filter((q) => q.eq(q.field("actionData.executionId"), executionId))
        .first();
      
      if (completion) return "completed";
    }
    
    if (latestExecution.status === "in_progress") return "working";
    return "pending";
  },
});

/**
 * Get Artifact Actions
 * 
 * Returns all actions for an artifact (e.g., email send history).
 * Used for displaying action history in UI.
 */
export const getArtifactActions = query({
  args: { 
    artifactId: v.id("artifacts"),
    actionType: v.optional(v.string()),
  },
  handler: async (ctx, { artifactId, actionType }) => {
    let query = ctx.db
      .query("actions")
      .withIndex("by_artifact", (q) => q.eq("artifactId", artifactId));
    
    if (actionType) {
      query = query.filter((q) => q.eq(q.field("actionType"), actionType));
    }
    
    return await query.order("desc").collect();
  },
});

/**
 * Get Widget Actions
 * 
 * Returns all actions for a widget (e.g., execution history).
 * Used for displaying widget execution history in UI.
 */
export const getWidgetActions = query({
  args: { 
    widgetId: v.id("widgets"),
    actionType: v.optional(v.string()),
  },
  handler: async (ctx, { widgetId, actionType }) => {
    let query = ctx.db
      .query("actions")
      .withIndex("by_widget", (q) => q.eq("widgetId", widgetId));
    
    if (actionType) {
      query = query.filter((q) => q.eq(q.field("actionType"), actionType));
    }
    
    return await query.order("desc").collect();
  },
});

/**
 * Get Artifacts Updated By Widget
 * 
 * Returns artifact IDs that were updated by a specific widget execution.
 * Enables widget-artifact relationship tracking.
 */
export const getArtifactsUpdatedByWidget = query({
  args: { 
    widgetId: v.id("widgets"), 
    executionId: v.string() 
  },
  handler: async (ctx, { widgetId, executionId }) => {
    const actions = await ctx.db
      .query("actions")
      .withIndex("by_widget_artifact", (q) => q.eq("widgetId", widgetId))
      .filter((q) => 
        q.and(
          q.eq(q.field("actionType"), "artifact_update"),
          q.eq(q.field("actionData.executionId"), executionId)
        )
      )
      .collect();
    
    return actions.map((a) => a.artifactId).filter((id): id is NonNullable<typeof id> => id !== undefined);
  },
});

/**
 * Get Widget Executions For Artifact
 * 
 * Returns widget executions that updated a specific artifact.
 * Enables artifact-widget relationship tracking.
 */
export const getWidgetExecutionsForArtifact = query({
  args: { artifactId: v.id("artifacts") },
  handler: async (ctx, { artifactId }) => {
    const actions = await ctx.db
      .query("actions")
      .withIndex("by_artifact", (q) => q.eq("artifactId", artifactId))
      .filter((q) => q.eq(q.field("actionType"), "artifact_update"))
      .collect();
    
    return actions.map((a) => ({
      widgetId: a.widgetId,
      executionId: a.actionData?.executionId,
      timestamp: a.completedAt || a.createdAt,
    })).filter((a): a is { widgetId: NonNullable<typeof a.widgetId>, executionId: string | undefined, timestamp: number } => a.widgetId !== undefined);
  },
});

