import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import {
  getProjectWidgetLayoutArgsValidator,
  getProjectWidgetsByIdArgsValidator,
  getProjectWidgetsByProjectArgsValidator,
  getWidgetByIdArgsValidator,
  getProjectWidgetsSummaryArgsValidator,
  hasWidgetsArgsValidator,
} from "./types/widgets";

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
  args: getProjectWidgetLayoutArgsValidator,
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
      .first();  // No status filter - show everything

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
  args: getProjectWidgetsByIdArgsValidator,
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

    // Get all widgets for this project (no status filter - show everything)
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", layout.projectId))
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
        // Orchestration metadata (camelCase to match DB schema)
        inputRequirements: w.inputRequirements,
        outputArtifacts: w.outputArtifacts,
        dependencyHints: w.dependencyHints,
        executionProfile: w.executionProfile,
        workflowStage: w.workflowStage,
      })),
    };
  },
});

/**
 * Get project widgets by project ID (BACKWARD COMPATIBLE)
 * Primary access pattern for project dashboard
 */
export const getProjectWidgetsByProject = query({
  args: getProjectWidgetsByProjectArgsValidator,
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { projectId, userId }) => {
    // ✅ FIX: Use getUserContentPermission for collaborator support
    if (userId) {
      const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
        userId,
        contentType: "project",
        contentId: projectId,
      });
      
      if (!permission) {
        return null;
      }
    }

    // Get layout
    const layout = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();  // No status filter - show everything

    if (!layout) {
      return null;
    }

    // Get all widgets for this project (no status filter - show everything)
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    // ✅ FIX: Don't filter by userId - if user has project permission, show ALL widgets
    // The permission check above ensures only authorized users can access widgets

    // Sort by position
    const sortedWidgets = widgets.sort((a, b) => a.position - b.position);

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
        // Orchestration metadata (camelCase to match DB schema)
        inputRequirements: w.inputRequirements,
        outputArtifacts: w.outputArtifacts,
        dependencyHints: w.dependencyHints,
        executionProfile: w.executionProfile,
        workflowStage: w.workflowStage,
      })),
    };
  },
});

/**
 * Get a single widget by widget_id (BACKWARD COMPATIBLE)
 * Used by: Widget execution, individual widget operations
 */
export const getWidgetById = query({
  args: getWidgetByIdArgsValidator,
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
      .first();  // No status filter - show everything

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
      // Orchestration metadata (camelCase to match DB schema)
      inputRequirements: widget.inputRequirements,
      outputArtifacts: widget.outputArtifacts,
      dependencyHints: widget.dependencyHints,
      executionProfile: widget.executionProfile,
      workflowStage: widget.workflowStage,
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
  args: getProjectWidgetsSummaryArgsValidator,
  returns: v.union(
    v.null(),
    v.object({
      layout: v.any(),
      widgetIds: v.array(v.id("widgets")),
      widgetCount: v.number(),
    })
  ),
  handler: async (ctx, { projectId, userId }) => {
    // ✅ FIX: Use getUserContentPermission for collaborator support
    if (userId) {
      const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
        userId,
        contentType: "project",
        contentId: projectId,
      });
      
      if (!permission) {
        return null;
      }
    }

    // Get layout
    const layout = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();  // No status filter - show everything

    if (!layout) {
      return null;
    }

    // Get widget IDs only (no status filter - show everything)
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    // ✅ FIX: Don't filter by userId - if user has project permission, show ALL widgets
    // The permission check above ensures only authorized users can access widgets

    return {
      layout,
      widgetIds: widgets.map(w => w._id),
      widgetCount: widgets.length,
    };
  },
});

/**
 * Check if project has widgets configured
 */
export const hasWidgets = query({
  args: hasWidgetsArgsValidator,
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
      .first();  // No status filter - show everything

    if (!layout) {
      return false;
    }

    // Additional user validation
    if (userId && layout.userId !== userId) {
      return false;
    }

    // Check if any widgets exist (no status filter - show everything)
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    return widgets !== null;
  },
});
