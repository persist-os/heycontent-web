import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import {
  widgetCreateValidator,
  batchCreateWidgetsArgsValidator,
  updateWidgetArgsValidator,
  deleteWidgetArgsValidator,
  deleteProjectWidgetsArgsValidator,
  archiveProjectWidgetsArgsValidator,
  updateWidgetExecutionArgsValidator,
} from "./types/widgets";

/**
 * Individual Widget Mutations
 * Follows Convex best practices - each widget is its own document with a Convex ID
 * Optimized for efficient updates and queries
 */

// ============================================================================
// CREATE WIDGET
// ============================================================================

/**
 * Create a single widget
 * Each widget gets its own Convex ID for optimal queries
 */
export const createWidget = mutation({
  args: widgetCreateValidator,
  returns: v.id("widgets"),
  handler: async (ctx, args) => {
    // Validate user ownership
    const project = await ctx.db.get(args.projectId) as any;  // ✅ Type assertion needed due to v.any() fingerprintId
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== args.userId) {
      throw new Error("Access denied: You don't own this project");
    }


    const now = Date.now();

    const widgetId = await ctx.db.insert("widgets", {
      projectId: args.projectId,
      fingerprintId: args.fingerprintId,
      userId: args.userId,
      widget_id: args.widget_id,
      widget_type: args.widget_type,
      title: args.title,
      description: args.description,
      category: args.category,
      priority: args.priority,
      size: args.size,
      theme: args.theme,
      position: args.position,
      config: args.config,
      data_sources: args.data_sources,
      update_frequency: args.update_frequency,
      interactive: args.interactive,
      editable: args.editable,
      shareable: args.shareable,
      lastRunAt: undefined,
      lastRunStatus: undefined,
      status: "active",  // ✅ Widgets are active immediately (decision engine removed)
      createdAt: now,
      updatedAt: now,
    });

    // ✅ PATTERN 13: Atomic Parent-Child Updates - Add widget ID to project array
    // Reuse existing project variable (already fetched above)
    if (project) {
      const existingWidgetIds = project.widgetIds || [];
      await ctx.db.patch(args.projectId, {
        widgetIds: [...existingWidgetIds, widgetId],
        updatedAt: now,
      });
    }

    return widgetId;
  },
});

// ============================================================================
// BATCH CREATE WIDGETS
// ============================================================================

/**
 * Create multiple widgets efficiently
 * Used by backend widget generation
 */
export const batchCreateWidgets = mutation({
  args: batchCreateWidgetsArgsValidator,
  returns: v.object({
    success: v.boolean(),
    widgetIds: v.array(v.id("widgets")),
  }),
  handler: async (ctx, { projectId, fingerprintId, userId, widgets }) => {
    // Validate user ownership
    const project = await ctx.db.get(projectId) as any;  // ✅ Type assertion needed due to v.any() fingerprintId
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }
 
    const now = Date.now();
    const widgetIds: Id<"widgets">[] = [];

    for (const widget of widgets) {
      const widgetId = await ctx.db.insert("widgets", {
        projectId,
        fingerprintId,
        userId,
        // ✅ Validator uses camelCase, DB uses snake_case for old fields
        widget_id: widget.widgetId,
        widget_type: widget.widgetType,
        title: widget.title,
        description: widget.description,
        category: widget.category,
        priority: widget.priority,
        size: widget.size,
        theme: widget.theme,
        position: widget.position,
        config: widget.config,
        data_sources: widget.dataSource || [],
        update_frequency: widget.updateFrequency || "on_demand",
        interactive: widget.interactive,
        editable: widget.editable,
        shareable: widget.shareable,
        // Orchestration metadata (if provided) - validator uses camelCase
        inputRequirements: widget.inputRequirements,
        outputArtifacts: widget.outputArtifacts,
        dependencyHints: widget.dependencyHints,
        executionProfile: widget.executionProfile,
        workflowStage: widget.workflowStage,
        status: "active",  // ✅ Widgets are active immediately (decision engine removed)
        createdAt: now,
        updatedAt: now,
      });
      widgetIds.push(widgetId);
    }

    // ✅ PATTERN 13: Atomic Parent-Child Updates - Add widget IDs to project array
    // Reuse existing project variable (already fetched above)
    if (project) {
      const existingWidgetIds = project.widgetIds || [];
      await ctx.db.patch(projectId, {
        widgetIds: [...existingWidgetIds, ...widgetIds],
        updatedAt: now,
      });
    }

    return { success: true, widgetIds };
  },
});

// ============================================================================
// UPDATE WIDGET
// ============================================================================

/**
 * Update a single widget by Convex ID
 * Much more efficient than updating array elements
 */
export const updateWidget = mutation({
  args: updateWidgetArgsValidator,
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, { widgetId, userId, updates }) => {
    const widget = await ctx.db.get(widgetId);
    if (!widget) {
      throw new Error("Widget not found");
    }

    // Validate ownership
    if (widget.userId !== userId) {
      throw new Error("Access denied: You don't own this widget");
    }

    await ctx.db.patch(widgetId, {
      ...updates,
      updatedAt: Date.now(),
    });

    // 🆕 INCREMENT FINGERPRINT SIGNALS
    try {
      await ctx.runMutation(api.fingerprintSignalsMutations.increment, {
        projectId: widget.projectId,
        signalType: "widget_updated",
        count: 1,
      });
    } catch (error) {
      console.error("Failed to increment signal:", error);
    }

    return { success: true };
  },
});

// ============================================================================
// DELETE WIDGET
// ============================================================================

/**
 * Delete a single widget (soft delete by setting status)
 */
export const deleteWidget = mutation({
  args: deleteWidgetArgsValidator,
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, { widgetId, userId, hardDelete }) => {
    const widget = await ctx.db.get(widgetId);
    if (!widget) {
      throw new Error("Widget not found");
    }

    // Validate ownership
    if (widget.userId !== userId) {
      throw new Error("Access denied: You don't own this widget");
    }

    if (hardDelete) {
      await ctx.db.delete(widgetId);
    } else {
      // Soft delete
      await ctx.db.patch(widgetId, {
        status: "deleted",
        updatedAt: Date.now(),
      });
    }
    
    // ✅ PATTERN 13: Atomic Parent-Child Updates - Remove widget ID from project array
    const project = await ctx.db.get(widget.projectId) as any;
    if (project && project.widgetIds) {
      const updatedWidgetIds = project.widgetIds.filter((id: Id<"widgets">) => id !== widgetId);
      await ctx.db.patch(widget.projectId, {
        widgetIds: updatedWidgetIds,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// ============================================================================
// DELETE ALL WIDGETS FOR PROJECT
// ============================================================================

/**
 * Delete all widgets for a project
 * Used when deleting a project or regenerating widgets
 */
export const deleteProjectWidgets = mutation({
  args: deleteProjectWidgetsArgsValidator,
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
  }),
  handler: async (ctx, { projectId, userId, hardDelete }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId) as any;  // ✅ Type assertion needed due to v.any() fingerprintId
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }

    // Get all widgets for this project
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    // Filter to only user's widgets
    const userWidgets = widgets.filter((w) => w.userId === userId);

    const now = Date.now();
    for (const widget of userWidgets) {
      if (hardDelete) {
        await ctx.db.delete(widget._id);
      } else {
        await ctx.db.patch(widget._id, {
          status: "deleted",
          updatedAt: now,
        });
      }
    }
    
    // ✅ PATTERN 13: Atomic Parent-Child Updates - Clear project.widgetIds array
    await ctx.db.patch(projectId, {
      widgetIds: [],
      updatedAt: now,
    });

    return { success: true, deletedCount: userWidgets.length };
  },
});

// ============================================================================
// UPDATE WIDGET EXECUTION STATUS
// ============================================================================

/**
 * Update widget execution tracking
 * Used when widgets are run by backend
 */
export const updateWidgetExecution = mutation({
  args: updateWidgetExecutionArgsValidator,
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, { widgetId, userId, status }) => {
    const widget = await ctx.db.get(widgetId);
    if (!widget) {
      throw new Error("Widget not found");
    }

    // Validate ownership
    if (widget.userId !== userId) {
      throw new Error("Access denied: You don't own this widget");
    }

    await ctx.db.patch(widgetId, {
      lastRunStatus: status,
      lastRunAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 🆕 INCREMENT FINGERPRINT SIGNALS (only on success)
    if (status === "success") {
      try {
        await ctx.runMutation(api.fingerprintSignalsMutations.increment, {
          projectId: widget.projectId,
          signalType: "widget_executed",
          count: 1,
        });
      } catch (error) {
        console.error("Failed to increment signal:", error);
      }
    }

    return { success: true };
  },
});

// ============================================================================
// ARCHIVE/UNARCHIVE PROJECT WIDGETS
// ============================================================================

/**
 * Archive or unarchive all widgets for a project
 * Used when pausing/resuming a project
 * ✅ PATTERN 13: Atomic Parent-Child Updates - All widgets updated together
 */
export const archiveProjectWidgets = mutation({
  args: archiveProjectWidgetsArgsValidator,
  returns: v.object({
    success: v.boolean(),
    archivedCount: v.number(),
  }),
  handler: async (ctx, { projectId, userId, archived }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId) as any;  // ✅ Type assertion needed due to v.any() fingerprintId
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }

    // Get all widgets for this project
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    // Filter to only user's widgets
    const userWidgets = widgets.filter((w) => w.userId === userId);

    const now = Date.now();
    let archivedCount = 0;
    
    // Update each widget status atomically
    for (const widget of userWidgets) {
      // When archiving: set status to "archived"
      // When unarchiving: restore to "active" (default for simplicity)
      const newStatus = archived ? "archived" : "active";
      
      await ctx.db.patch(widget._id, {
        status: newStatus,
        updatedAt: now,
      });
      
      archivedCount++;
    }

    return { success: true, archivedCount };
  },
});

