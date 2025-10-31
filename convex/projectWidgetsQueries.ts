import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Project Widget Layout Queries
 * REDESIGNED for Convex best practices
 * 
 * This file now handles ONLY layout configuration queries
 * Individual widget queries are in widgetsQueries.ts
 * 
 * For backward compatibility, we provide aggregated queries that
 * combine layout + widgets to match the old API
 */

// ============================================================================
// GET PROJECT WIDGET LAYOUT
// ============================================================================

/**
 * Get layout configuration only (no individual widgets)
 */
export const getProjectWidgetLayout = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { projectId, userId }) => {
    // Validate project access if userId provided
    if (userId) {
      const project = await ctx.db.get(projectId);
      if (!project || project.userId !== userId) {
        return null;
      }
    }

    const layout = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!layout) {
      return null;
    }

    // Additional user validation
    if (userId && layout.userId !== userId) {
      return null;
    }

    return layout;
  },
});

// ============================================================================
// BACKWARD COMPATIBILITY QUERIES
// ============================================================================

/**
 * Get project widgets with layout (BACKWARD COMPATIBLE)
 * Returns data in the old format: { layout + widgets array }
 * 
 * This maintains compatibility with existing code
 */
export const getProjectWidgets = query({
  args: {
    widgetsId: v.id("project_widgets"),
    userId: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { widgetsId, userId }) => {
    const layout = await ctx.db.get(widgetsId);
    
    if (!layout) {
      return null;
    }
    
    // Validate user ownership if userId provided
    if (userId && layout.userId !== userId) {
      return null;
    }

    // Get all widgets for this project
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", layout.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Sort by position
    const sortedWidgets = widgets.sort((a, b) => a.position - b.position);

    // Return with Convex IDs included
    return {
      ...layout,
      widgets: sortedWidgets.map(w => ({
        _id: w._id, // Convex ID - primary identifier
        widget_id: w.widget_id, // Legacy string ID for backward compatibility
        widget_type: w.widget_type,
        title: w.title,
        description: w.description,
        category: w.category,
        priority: w.priority,
        size: w.size,
        theme: w.theme,
        position: w.position,
        config: w.config,
        data_sources: w.data_sources,
        update_frequency: w.update_frequency,
        interactive: w.interactive,
        editable: w.editable,
        shareable: w.shareable,
        lastRunAt: w.lastRunAt,
        lastRunStatus: w.lastRunStatus,
        // Orchestration metadata
        input_requirements: w.input_requirements,
        output_artifacts: w.output_artifacts,
        dependency_hints: w.dependency_hints,
        execution_profile: w.execution_profile,
        workflow_stage: w.workflow_stage,
      })),
    };
  },
});

/**
 * Get project widgets by project ID (BACKWARD COMPATIBLE)
 * Primary access pattern for project dashboard
 */
export const getProjectWidgetsByProject = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { projectId, userId }) => {
    // Validate project access if userId provided
    if (userId) {
      const project = await ctx.db.get(projectId);
      if (!project || project.userId !== userId) {
        return null;
      }
    }

    // Get layout
    const layout = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!layout) {
      return null;
    }

    // Additional user validation
    if (userId && layout.userId !== userId) {
      return null;
    }

    // Get all widgets for this project
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Filter by user if provided
    const userWidgets = userId 
      ? widgets.filter(w => w.userId === userId)
      : widgets;

    // Sort by position
    const sortedWidgets = userWidgets.sort((a, b) => a.position - b.position);

    // Return with Convex IDs included
    return {
      ...layout,
      widgets: sortedWidgets.map(w => ({
        _id: w._id, // ✅ Convex ID - primary identifier
        widget_id: w.widget_id, // Legacy string ID for backward compatibility
        widget_type: w.widget_type,
        title: w.title,
        description: w.description,
        category: w.category,
        priority: w.priority,
        size: w.size,
        theme: w.theme,
        position: w.position,
        config: w.config,
        data_sources: w.data_sources,
        update_frequency: w.update_frequency,
        interactive: w.interactive,
        editable: w.editable,
        shareable: w.shareable,
        lastRunAt: w.lastRunAt,
        lastRunStatus: w.lastRunStatus,
        // Orchestration metadata
        input_requirements: w.input_requirements,
        output_artifacts: w.output_artifacts,
        dependency_hints: w.dependency_hints,
        execution_profile: w.execution_profile,
        workflow_stage: w.workflow_stage,
      })),
    };
  },
});

/**
 * Get a single widget by widget_id (BACKWARD COMPATIBLE)
 * Used by: Widget execution, individual widget operations
 */
export const getWidgetById = query({
  args: {
    projectId: v.id("projects"),
    widgetId: v.string(),
    userId: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { projectId, widgetId, userId }) => {
    // Validate project access if userId provided
    if (userId) {
      const project = await ctx.db.get(projectId);
      if (!project || project.userId !== userId) {
        return null;
      }
    }

    // Find widget by legacy string ID
    const widget = await ctx.db
      .query("widgets")
      .withIndex("by_widget_id", (q) =>
        q.eq("projectId", projectId).eq("widget_id", widgetId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!widget) {
      return null;
    }

    // Additional user validation
    if (userId && widget.userId !== userId) {
      return null;
    }

    // Return in old format for backward compatibility
    return {
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
      lastRunAt: widget.lastRunAt,
      lastRunStatus: widget.lastRunStatus,
      // Orchestration metadata
      input_requirements: widget.input_requirements,
      output_artifacts: widget.output_artifacts,
      dependency_hints: widget.dependency_hints,
      execution_profile: widget.execution_profile,
      workflow_stage: widget.workflow_stage,
    };
  },
});

// ============================================================================
// NEW OPTIMIZED QUERIES
// ============================================================================

/**
 * Get layout and widget IDs separately (OPTIMIZED)
 * More efficient than returning full widget data
 */
export const getProjectWidgetsSummary = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      layout: v.any(),
      widgetIds: v.array(v.id("widgets")),
      widgetCount: v.number(),
    })
  ),
  handler: async (ctx, { projectId, userId }) => {
    // Validate project access if userId provided
    if (userId) {
      const project = await ctx.db.get(projectId);
      if (!project || project.userId !== userId) {
        return null;
      }
    }

    // Get layout
    const layout = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!layout) {
      return null;
    }

    // Additional user validation
    if (userId && layout.userId !== userId) {
      return null;
    }

    // Get widget IDs only
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const userWidgets = userId 
      ? widgets.filter(w => w.userId === userId)
      : widgets;

    return {
      layout,
      widgetIds: userWidgets.map(w => w._id),
      widgetCount: userWidgets.length,
    };
  },
});

/**
 * Check if project has widgets configured
 */
export const hasWidgets = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, { projectId, userId }) => {
    // Validate project access if userId provided
    if (userId) {
      const project = await ctx.db.get(projectId);
      if (!project || project.userId !== userId) {
        return false;
      }
    }

    // Check if layout exists
    const layout = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!layout) {
      return false;
    }

    // Additional user validation
    if (userId && layout.userId !== userId) {
      return false;
    }

    // Check if any widgets exist
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return widgets !== null;
  },
});
