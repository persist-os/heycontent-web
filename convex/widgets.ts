import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Get a widget by ID
 */
export const get = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    return await ctx.db
      .query("widgets")
      .withIndex("by_widget_id", (q) => q.eq("widget_id", id))
      .first();
  },
});

/**
 * Update a widget
 */
export const update = mutation({
  args: {
    id: v.string(),
    updates: v.any(),
  },
  handler: async (ctx, { id, updates }) => {
    const widget = await ctx.db
      .query("widgets")
      .withIndex("by_widget_id", (q) => q.eq("widget_id", id))
      .first();

    if (!widget) {
      throw new Error(`Widget not found: ${id}`);
    }

    await ctx.db.patch(widget._id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Schedule a widget for background execution
 */
export const schedule = mutation({
  args: {
    widgetId: v.string(),
    userId: v.string(),
    projectId: v.string(),
    frequency: v.optional(v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    )),
    executionPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { widgetId, userId, projectId, frequency = "daily", executionPrompt }) => {
    // Call the backend API to schedule the widget
    const response = await ctx.scheduler.runHttp(
      "POST",
      `${process.env.BACKEND_URL}/api/widgets/${widgetId}/schedule`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        body: JSON.stringify({
          frequency,
          execution_prompt: executionPrompt,
          project_id: projectId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to schedule widget: ${error.error || response.statusText}`);
    }

    return await response.json();
  },
});

/**
 * Unschedule a widget
 */
export const unschedule = mutation({
  args: {
    widgetId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { widgetId, userId }) => {
    // Call the backend API to unschedule the widget
    const response = await ctx.scheduler.runHttp(
      "POST",
      `${process.env.BACKEND_URL}/api/widgets/${widgetId}/unschedule`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to unschedule widget: ${error.error || response.statusText}`);
    }

    return await response.json();
  },
});

/**
 * Get all scheduled widgets for a user
 */
export const listScheduled = query({
  args: {
    userId: v.string(),
    projectId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, projectId }) => {
    let query = ctx.db
      .query("widgets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("scheduleEnabled"), true));

    if (projectId) {
      query = query.filter((q) => q.eq(q.field("projectId"), projectId));
    }

    return await query.collect();
  },
});

/**
 * Process due widgets (internal use only)
 * This is called by a scheduled job to process all widgets that are due for execution
 */
export const processDueWidgets = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find all widgets that are due for execution
    const dueWidgets = await ctx.db
      .query("widgets")
      .withIndex("by_schedule", (q) => 
        q.and(
          q.lte("nextScheduledRun", now),
          q.eq("scheduleEnabled", true)
        )
      )
      .collect();

    // Process each due widget
    for (const widget of dueWidgets) {
      try {
        // Skip if already running
        if (widget.lastRunStatus === "running") {
          continue;
        }

        // Mark as running
        await ctx.db.patch(widget._id, {
          lastRunStatus: "running",
          lastRunAt: now,
          updatedAt: now,
        });

        // Schedule the widget execution
        await ctx.scheduler.runAfter(0, api.widgets.execute, {
          widgetId: widget.widget_id,
          userId: widget.userId,
          projectId: widget.projectId,
          scheduled: true,
          executionPrompt: undefined, // Use widget's default prompt
        });

      } catch (error) {
        console.error(`Error processing widget ${widget._id}:`, error);
        
        // Update widget status to failed
        await ctx.db.patch(widget._id, {
          lastRunStatus: "failed",
          updatedAt: now,
        });
      }
    }

    return { processed: dueWidgets.length };
  },
});

/**
 * Execute a widget (internal use only)
 */
export const execute = internalMutation({
  args: {
    widgetId: v.string(),
    userId: v.string(),
    projectId: v.string(),
    scheduled: v.optional(v.boolean()),
    executionPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { widgetId, userId, projectId, scheduled = false, executionPrompt }) => {
    const now = Date.now();
    
    // Get the widget
    const widget = await ctx.db
      .query("widgets")
      .withIndex("by_widget_id", (q) => q.eq("widget_id", widgetId))
      .first();

    if (!widget) {
      throw new Error(`Widget not found: ${widgetId}`);
    }

    try {
      // Call the backend API to execute the widget
      const response = await ctx.scheduler.runHttp(
        "POST",
        `${process.env.BACKEND_URL}/api/widgets/${widgetId}/execute`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": userId,
          },
          body: JSON.stringify({
            project_id: projectId,
            execution_prompt: executionPrompt,
            scheduled,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to execute widget: ${response.statusText}`);
      }

      const result = await response.json();

      // Update widget with execution results
      await ctx.db.patch(widget._id, {
        lastRunStatus: "success",
        lastRunAt: now,
        updatedAt: now,
        ...(scheduled && {
          lastScheduledRun: now,
          scheduledRunCount: (widget.scheduledRunCount || 0) + 1,
          nextScheduledRun: widget.scheduleEnabled 
            ? await ctx.scheduler.getNextRunTime(widget.scheduleFrequency, now)
            : null,
        }),
      });

      return result;

    } catch (error) {
      // Update widget status to failed
      await ctx.db.patch(widget._id, {
        lastRunStatus: "failed",
        lastRunAt: now,
        updatedAt: now,
      });

      throw error;
    }
  },
});
