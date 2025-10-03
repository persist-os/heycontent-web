import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Individual Widget Mutations
 * Follows Convex best practices - each widget is its own document with a Convex ID
 * Optimized for efficient updates and queries
 */

// ============================================================================
// WIDGET VALIDATOR
// ============================================================================

const widgetValidator = v.object({
  widget_type: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  category: v.string(),
  priority: v.number(),
  size: v.string(),
  theme: v.string(),
  position: v.number(),
  config: v.any(),
  data_sources: v.array(v.string()),
  update_frequency: v.string(),
  interactive: v.boolean(),
  editable: v.boolean(),
  shareable: v.boolean(),
});

// ============================================================================
// CREATE WIDGET
// ============================================================================

/**
 * Create a single widget
 * Each widget gets its own Convex ID for optimal queries
 */
export const createWidget = mutation({
  args: {
    projectId: v.id("projects"),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    widget_id: v.string(), // Legacy string ID for backward compatibility
    widget_type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    priority: v.number(),
    size: v.string(),
    theme: v.string(),
    position: v.number(),
    config: v.any(),
    data_sources: v.array(v.string()),
    update_frequency: v.string(),
    interactive: v.boolean(),
    editable: v.boolean(),
    shareable: v.boolean(),
  },
  returns: v.id("widgets"),
  handler: async (ctx, args) => {
    // Validate user ownership
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== args.userId) {
      throw new Error("Access denied: You don't own this project");
    }

    // Validate fingerprint
    const fingerprint = await ctx.db.get(args.fingerprintId);
    if (!fingerprint) {
      throw new Error("Fingerprint not found");
    }
    if (fingerprint.projectId !== args.projectId) {
      throw new Error("Fingerprint doesn't belong to this project");
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
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

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
  args: {
    projectId: v.id("projects"),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    widgets: v.array(
      v.object({
        widget_id: v.string(),
        widget_type: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        category: v.string(),
        priority: v.number(),
        size: v.string(),
        theme: v.string(),
        position: v.number(),
        config: v.any(),
        data_sources: v.array(v.string()),
        update_frequency: v.string(),
        interactive: v.boolean(),
        editable: v.boolean(),
        shareable: v.boolean(),
      })
    ),
  },
  returns: v.object({
    success: v.boolean(),
    widgetIds: v.array(v.id("widgets")),
  }),
  handler: async (ctx, { projectId, fingerprintId, userId, widgets }) => {
    // Validate user ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }

    // Validate fingerprint
    const fingerprint = await ctx.db.get(fingerprintId);
    if (!fingerprint) {
      throw new Error("Fingerprint not found");
    }
    if (fingerprint.projectId !== projectId) {
      throw new Error("Fingerprint doesn't belong to this project");
    }

    const now = Date.now();
    const widgetIds: Id<"widgets">[] = [];

    for (const widget of widgets) {
      const widgetId = await ctx.db.insert("widgets", {
        projectId,
        fingerprintId,
        userId,
        widget_id: widget.widget_id,
        widget_type: widget.widget_type,
        title: widget.title,
        description: widget.description,
        category: widget.category,
        priority: widget.priority,
        size: widget.size,
        theme: widget.theme,
        position: widget.position,
        config: widget.config,
        data_sources: widget.data_sources,
        update_frequency: widget.update_frequency,
        interactive: widget.interactive,
        editable: widget.editable,
        shareable: widget.shareable,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      widgetIds.push(widgetId);
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
  args: {
    widgetId: v.id("widgets"),
    userId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
      priority: v.optional(v.number()),
      size: v.optional(v.string()),
      theme: v.optional(v.string()),
      position: v.optional(v.number()),
      config: v.optional(v.any()),
      data_sources: v.optional(v.array(v.string())),
      update_frequency: v.optional(v.string()),
      interactive: v.optional(v.boolean()),
      editable: v.optional(v.boolean()),
      shareable: v.optional(v.boolean()),
      lastRunAt: v.optional(v.number()),
      lastRunStatus: v.optional(
        v.union(
          v.literal("idle"),
          v.literal("running"),
          v.literal("success"),
          v.literal("failed")
        )
      ),
      status: v.optional(
        v.union(
          v.literal("active"),
          v.literal("archived"),
          v.literal("deleted")
        )
      ),
    }),
  },
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
  args: {
    widgetId: v.id("widgets"),
    userId: v.string(),
    hardDelete: v.optional(v.boolean()),
  },
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
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    hardDelete: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
  }),
  handler: async (ctx, { projectId, userId, hardDelete }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
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
  args: {
    widgetId: v.id("widgets"),
    userId: v.string(),
    status: v.union(
      v.literal("idle"),
      v.literal("running"),
      v.literal("success"),
      v.literal("failed")
    ),
  },
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

    return { success: true };
  },
});

