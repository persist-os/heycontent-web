import { v } from "convex/values";
import { query } from "./_generated/server";

// Get project widgets by ID
export const getProjectWidgets = query({
  args: {
    widgetsId: v.id("project_widgets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.widgetsId);
  },
});

// Get project widgets by project ID
export const getProjectWidgetsByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return widgets;
  },
});

// Get project widgets by fingerprint ID
export const getProjectWidgetsByFingerprint = query({
  args: {
    fingerprintId: v.id("project_fingerprints"),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", args.fingerprintId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return widgets;
  },
});

// Get project widgets for a user
export const getUserProjectWidgets = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("project_widgets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc");

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get widgets by type
export const getWidgetsByType = query({
  args: {
    projectId: v.id("projects"),
    widgetType: v.string(),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!widgets) {
      return [];
    }

    return widgets.widgets.filter(widget => widget.widget_type === args.widgetType);
  },
});

// Get widgets by priority
export const getWidgetsByPriority = query({
  args: {
    projectId: v.id("projects"),
    minPriority: v.optional(v.number()),
    maxPriority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!widgets) {
      return [];
    }

    return widgets.widgets.filter(widget => {
      const priority = widget.priority;
      if (args.minPriority !== undefined && priority < args.minPriority) {
        return false;
      }
      if (args.maxPriority !== undefined && priority > args.maxPriority) {
        return false;
      }
      return true;
    });
  },
});

// Get widgets by theme
export const getWidgetsByTheme = query({
  args: {
    projectId: v.id("projects"),
    theme: v.string(),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!widgets) {
      return [];
    }

    return widgets.widgets.filter(widget => widget.theme === args.theme);
  },
});

// Get widgets by size
export const getWidgetsBySize = query({
  args: {
    projectId: v.id("projects"),
    size: v.string(),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!widgets) {
      return [];
    }

    return widgets.widgets.filter(widget => widget.size === args.size);
  },
});

// Get interactive widgets
export const getInteractiveWidgets = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!widgets) {
      return [];
    }

    return widgets.widgets.filter(widget => widget.interactive);
  },
});

// Get editable widgets
export const getEditableWidgets = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!widgets) {
      return [];
    }

    return widgets.widgets.filter(widget => widget.editable);
  },
});

// Get shareable widgets
export const getShareableWidgets = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!widgets) {
      return [];
    }

    return widgets.widgets.filter(widget => widget.shareable);
  },
});

// Get widgets by update frequency
export const getWidgetsByUpdateFrequency = query({
  args: {
    projectId: v.id("projects"),
    updateFrequency: v.string(),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!widgets) {
      return [];
    }

    return widgets.widgets.filter(widget => widget.update_frequency === args.updateFrequency);
  },
});

// Get widgets by data source
export const getWidgetsByDataSource = query({
  args: {
    projectId: v.id("projects"),
    dataSource: v.string(),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!widgets) {
      return [];
    }

    return widgets.widgets.filter(widget => 
      widget.data_sources.includes(args.dataSource)
    );
  },
});

// Get all project widgets (including archived)
export const getAllProjectWidgets = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    return widgets;
  },
});

// Get project widgets by status
export const getProjectWidgetsByStatus = query({
  args: {
    projectId: v.id("projects"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .order("desc")
      .collect();

    return widgets;
  },
});
