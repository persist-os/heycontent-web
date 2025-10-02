import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Clean Project Widgets Queries
 * Optimized for performance and simplicity
 * Only 2 functions needed - covers all access patterns
 */

// ============================================================================
// CORE QUERIES
// ============================================================================

/**
 * Get project widgets by widgets ID
 * Used by: Direct widget access, updates
 */
export const getProjectWidgets = query({
  args: {
    widgetsId: v.id("project_widgets"),
    userId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("project_widgets"),
      _creationTime: v.number(),
      projectId: v.id("projects"),
      fingerprintId: v.id("project_fingerprints"),
      userId: v.string(),
      categories: v.array(v.any()),
      widgets: v.array(v.any()),
      layout_type: v.string(),
      columns: v.number(),
      rows: v.number(),
      global_theme: v.string(),
      color_scheme: v.string(),
      font_style: v.string(),
      allow_customization: v.boolean(),
      allow_reordering: v.boolean(),
      allow_resizing: v.boolean(),
      required_integrations: v.array(v.string()),
      data_refresh_strategy: v.string(),
      version: v.string(),
      confidence: v.number(),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
      status: v.string(),
      generated_at: v.optional(v.union(v.string(), v.number())),
    })
  ),
  handler: async (ctx, { widgetsId, userId }) => {
    const widgets = await ctx.db.get(widgetsId);
    
    if (!widgets) {
      return null;
    }
    
    // Validate user ownership if userId provided
    if (userId && widgets.userId !== userId) {
      return null;
    }

    return widgets;
  },
});

/**
 * Get project widgets by project ID - Primary access pattern
 * Used by: Project dashboard, widget display
 */
export const getProjectWidgetsByProject = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("project_widgets"),
      _creationTime: v.number(),
      projectId: v.id("projects"),
      fingerprintId: v.id("project_fingerprints"),
      userId: v.string(),
      categories: v.array(v.any()),
      widgets: v.array(v.any()),
      layout_type: v.string(),
      columns: v.number(),
      rows: v.number(),
      global_theme: v.string(),
      color_scheme: v.string(),
      font_style: v.string(),
      allow_customization: v.boolean(),
      allow_reordering: v.boolean(),
      allow_resizing: v.boolean(),
      required_integrations: v.array(v.string()),
      data_refresh_strategy: v.string(),
      version: v.string(),
      confidence: v.number(),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
      status: v.string(),
      generated_at: v.optional(v.union(v.string(), v.number())),
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

    // Find active widgets for this project
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    // Additional user validation for the widgets themselves
    if (widgets && userId && widgets.userId !== userId) {
      return null;
    }

    return widgets;
  },
});