import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  getWidgetArgsValidator,
  getWidgetByStringIdArgsValidator,
  getProjectWidgetsArgsValidator,
  getWidgetsByCategoryArgsValidator,
  getUserWidgetsArgsValidator,
  getWidgetsByExecutionStatusArgsValidator,
  getWidgetCountArgsValidator,
  searchWidgetsArgsValidator,
  getRecentlyUpdatedWidgetsArgsValidator,
} from "./types/widgets";

/**
 * Individual Widget Queries
 * Follows Convex best practices - efficient queries with proper indexes
 * Each widget has its own Convex ID for optimal performance
 */

// ============================================================================
// GET WIDGET BY CONVEX ID
// ============================================================================

/**
 * Get a single widget by its Convex ID
 * Most efficient query - direct document lookup
 */
export const getWidget = query({
  args: getWidgetArgsValidator,
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { widgetId, userId }) => {
    const widget = await ctx.db.get(widgetId);

    if (!widget) {
      return null;
    }

    // Validate user ownership if userId provided
    if (userId && widget.userId !== userId) {
      return null;
    }

    // Don't return deleted widgets
    if (widget.status === "deleted") {
      return null;
    }

    return widget;
  },
});

// ============================================================================
// GET WIDGET BY LEGACY STRING ID
// ============================================================================

/**
 * Get a widget by legacy widget_id string
 * For backward compatibility with existing code
 */
export const getWidgetByStringId = query({
  args: getWidgetByStringIdArgsValidator,
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { projectId, widget_id, userId }) => {
    // Use compound index for efficient lookup
    const widget = await ctx.db
      .query("widgets")
      .withIndex("by_widget_id", (q) =>
        q.eq("projectId", projectId).eq("widget_id", widget_id)
      )
      .filter((q) => q.neq(q.field("status"), "deleted"))
      .first();

    if (!widget) {
      return null;
    }

    // Validate user ownership if userId provided
    if (userId && widget.userId !== userId) {
      return null;
    }

    return widget;
  },
});

// ============================================================================
// GET ALL WIDGETS FOR PROJECT
// ============================================================================

/**
 * Get all widgets for a project
 * Primary access pattern for project dashboard
 */
export const getProjectWidgets = query({
  args: getProjectWidgetsArgsValidator,
  returns: v.array(v.any()),
  handler: async (ctx, { projectId, userId, includeArchived }) => {
    // Validate project access if userId provided
    if (userId) {
      const project = await ctx.db.get(projectId);
      if (!project || project.userId !== userId) {
        return [];
      }
    }

    let widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    // Filter by user if provided
    if (userId) {
      widgets = widgets.filter((w) => w.userId === userId);
    }

    // Filter by status
    if (!includeArchived) {
      widgets = widgets.filter((w) => w.status === "active");
    } else {
      widgets = widgets.filter((w) => w.status !== "deleted");
    }

    // Sort by position
    return widgets.sort((a, b) => a.position - b.position);
  },
});

// ============================================================================
// GET WIDGETS BY CATEGORY
// ============================================================================

/**
 * Get all widgets in a specific category
 * Uses compound index for efficient filtering
 */
export const getWidgetsByCategory = query({
  args: getWidgetsByCategoryArgsValidator,
  returns: v.array(v.any()),
  handler: async (ctx, { projectId, category, userId }) => {
    // Validate project access if userId provided
    if (userId) {
      const project = await ctx.db.get(projectId);
      if (!project || project.userId !== userId) {
        return [];
      }
    }

    let widgets = await ctx.db
      .query("widgets")
      .withIndex("by_category", (q) =>
        q.eq("projectId", projectId).eq("category", category)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Filter by user if provided
    if (userId) {
      widgets = widgets.filter((w) => w.userId === userId);
    }

    // Sort by position
    return widgets.sort((a, b) => a.position - b.position);
  },
});

// ============================================================================
// GET WIDGETS BY USER
// ============================================================================

/**
 * Get all widgets for a user across all projects
 * Useful for user dashboard
 */
export const getUserWidgets = query({
  args: getUserWidgetsArgsValidator,
  returns: v.array(v.any()),
  handler: async (ctx, { userId, limit }) => {
    const query = ctx.db
      .query("widgets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"));

    const widgets = await query.collect();

    // Sort by most recently updated
    const sorted = widgets.sort((a, b) => b.updatedAt - a.updatedAt);

    // Apply limit if provided
    if (limit) {
      return sorted.slice(0, limit);
    }

    return sorted;
  },
});

// ============================================================================
// GET WIDGETS WITH EXECUTION STATUS
// ============================================================================

/**
 * Get widgets filtered by execution status
 * Useful for monitoring running widgets
 */
export const getWidgetsByExecutionStatus = query({
  args: getWidgetsByExecutionStatusArgsValidator,
  returns: v.array(v.any()),
  handler: async (ctx, { projectId, userId, status }) => {
    // Validate project access
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      return [];
    }

    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("status"), "active"),
          q.eq(q.field("lastRunStatus"), status)
        )
      )
      .collect();

    return widgets.sort((a, b) => a.position - b.position);
  },
});

// ============================================================================
// GET WIDGET COUNT FOR PROJECT
// ============================================================================

/**
 * Get widget count for a project
 * Efficient for displaying stats
 */
export const getWidgetCount = query({
  args: getWidgetCountArgsValidator,
  returns: v.number(),
  handler: async (ctx, { projectId, userId, includeArchived }) => {
    // Validate project access if userId provided
    if (userId) {
      const project = await ctx.db.get(projectId);
      if (!project || project.userId !== userId) {
        return 0;
      }
    }

    let widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    // Filter by user if provided
    if (userId) {
      widgets = widgets.filter((w) => w.userId === userId);
    }

    // Filter by status
    if (!includeArchived) {
      widgets = widgets.filter((w) => w.status === "active");
    } else {
      widgets = widgets.filter((w) => w.status !== "deleted");
    }

    return widgets.length;
  },
});

// ============================================================================
// SEARCH WIDGETS
// ============================================================================

/**
 * Search widgets by title or description
 * For widget search functionality
 */
export const searchWidgets = query({
  args: searchWidgetsArgsValidator,
  returns: v.array(v.any()),
  handler: async (ctx, { projectId, userId, searchTerm, limit }) => {
    // Validate project access
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      return [];
    }

    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();

    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    const filtered = widgets.filter(
      (w) =>
        w.title.toLowerCase().includes(searchLower) ||
        (w.description && w.description.toLowerCase().includes(searchLower))
    );

    // Sort by relevance (title matches first)
    const sorted = filtered.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(searchLower);
      const bTitle = b.title.toLowerCase().includes(searchLower);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      return a.position - b.position;
    });

    // Apply limit if provided
    if (limit) {
      return sorted.slice(0, limit);
    }

    return sorted;
  },
});

// ============================================================================
// GET RECENTLY UPDATED WIDGETS
// ============================================================================

/**
 * Get recently updated widgets
 * For activity tracking
 */
export const getRecentlyUpdatedWidgets = query({
  args: getRecentlyUpdatedWidgetsArgsValidator,
  returns: v.array(v.any()),
  handler: async (ctx, { userId, limit }) => {
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Sort by most recently updated
    const sorted = widgets.sort((a, b) => b.updatedAt - a.updatedAt);

    // Apply limit if provided (default to 10)
    const limitValue = limit || 10;
    return sorted.slice(0, limitValue);
  },
});

