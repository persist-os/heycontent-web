import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { 
  widgetCategoryValidator,
  widgetBatchValidator,
  widgetUpdateValidator,
  projectWidgetsUpdateValidator
} from "./types/widgets";

/**
 * Project Widget Layout Mutations
 * REDESIGNED for Convex best practices
 * 
 * This file now handles ONLY the layout configuration document
 * Individual widgets are managed in widgetsMutations.ts
 * 
 * Migration strategy: Backend can still send full widget data,
 * we'll split it into layout + individual widgets
 */

// ============================================================================
// UPSERT PROJECT WIDGETS (REDESIGNED)
// ============================================================================

/**
 * Upsert project widgets - NOW splits data into layout + individual widgets
 * 
 * This maintains backward compatibility with backend but stores data optimally:
 * 1. Layout config goes to project_widgets table (single doc)
 * 2. Individual widgets go to widgets table (one doc per widget)
 * 
 * This is a MIGRATION-FRIENDLY mutation that accepts old format but stores in new format
 */
export const upsertProjectWidgets = mutation({
  args: {
    projectId: v.id("projects"),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    
    // Widget data
    categories: v.array(widgetCategoryValidator),
    widgets: v.array(widgetBatchValidator),
    
    // Global layout settings
    layout_type: v.string(),
    columns: v.number(),
    rows: v.number(),
    
    // Global appearance
    global_theme: v.string(),
    color_scheme: v.string(),
    font_style: v.string(),
    
    // Customization settings
    allow_customization: v.boolean(),
    allow_reordering: v.boolean(),
    allow_resizing: v.boolean(),
    
    // Technical settings
    required_integrations: v.array(v.string()),
    data_refresh_strategy: v.string(),
    
    // Metadata
    version: v.string(),
    confidence: v.number(),
    
    // Optional AI-generated timestamps (ignored)
    generated_at: v.optional(v.any()),
    updated_at: v.optional(v.any())
  },
  returns: v.object({
    layoutId: v.id("project_widgets"),
    widgetIds: v.array(v.id("widgets")),
  }),
  handler: async (ctx, args) => {
    // Validate required fields
    if (!args.userId || args.userId.trim() === '') {
      throw new Error("Valid user ID is required");
    }
    
    // Validate project exists and user owns it
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== args.userId) {
      throw new Error("Access denied: You don't own this project");
    }
    
    // Validate fingerprint exists and belongs to this project
    const fingerprint = await ctx.db.get(args.fingerprintId);
    if (!fingerprint) {
      throw new Error("Fingerprint not found");
    }
    
    if (fingerprint.projectId !== args.projectId || fingerprint.userId !== args.userId) {
      throw new Error("Access denied: Fingerprint doesn't belong to this project");
    }
    
    // Validate confidence
    if (args.confidence < 0 || args.confidence > 1) {
      throw new Error("Confidence must be between 0 and 1");
    }
    
    const now = Date.now();
    
    // Clean categories - add display_order if missing
    const cleanCategories = args.categories.map((category, index) => ({
      ...category,
      display_order: category.display_order ?? index + 1,
    }));
    
    // ========================================================================
    // STEP 1: Upsert Layout Configuration (project_widgets table)
    // ========================================================================
    
    const existingLayout = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    const layoutData = {
      projectId: args.projectId,
      fingerprintId: args.fingerprintId,
      userId: args.userId,
      categories: cleanCategories,
      layout_type: args.layout_type,
      columns: args.columns,
      rows: args.rows,
      global_theme: args.global_theme,
      color_scheme: args.color_scheme,
      font_style: args.font_style,
      allow_customization: args.allow_customization,
      allow_reordering: args.allow_reordering,
      allow_resizing: args.allow_resizing,
      required_integrations: args.required_integrations,
      data_refresh_strategy: args.data_refresh_strategy,
      version: args.version,
      confidence: args.confidence,
      status: "active",
    };
    
    let layoutId: Id<"project_widgets">;
    
    if (existingLayout) {
      await ctx.db.patch(existingLayout._id, {
        ...layoutData,
        updatedAt: now,
      });
      layoutId = existingLayout._id;
    } else {
      layoutId = await ctx.db.insert("project_widgets", {
        ...layoutData,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    // ========================================================================
    // STEP 2: Upsert Individual Widgets (widgets table)
    // Delete old widgets, create new ones
    // ========================================================================
    
    // Delete existing widgets for this project
    const existingWidgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    for (const widget of existingWidgets) {
      await ctx.db.delete(widget._id);
    }
    
    // Create new widgets
    const widgetIds: Id<"widgets">[] = [];
    
    for (const widget of args.widgets) {
      // ✅ FIXED: Use spread operator to include ALL validated fields
      // This ensures new fields (outputArtifacts, dependencyHints, etc.) are saved
      const widgetId = await ctx.db.insert("widgets", {
        ...widget,  // Includes ALL fields from widgetBatchValidator
        // Override foreign keys and system fields
        projectId: args.projectId,
        fingerprintId: args.fingerprintId,
        userId: args.userId,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      widgetIds.push(widgetId);
    }
    
    return { layoutId, widgetIds };
  },
});

// ============================================================================
// UPDATE WIDGET LAYOUT (NEW)
// ============================================================================

/**
 * Update only the layout configuration, not individual widgets
 */
export const updateWidgetLayout = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    updates: projectWidgetsUpdateValidator,
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, { projectId, userId, updates }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }

    // Find the layout document
    const layout = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!layout) {
      throw new Error("Widget layout not found");
    }

    if (layout.userId !== userId) {
      throw new Error("Access denied: You don't own this layout");
    }

    // Update the layout
    await ctx.db.patch(layout._id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================================================
// DELETE PROJECT WIDGETS (REDESIGNED)
// ============================================================================

/**
 * Delete both layout and all individual widgets for a project
 */
export const deleteProjectWidgets = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deletedWidgetCount: v.number(),
    deletedLayoutCount: v.number(),
  }),
  handler: async (ctx, { projectId, userId }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }

    // Delete all individual widgets
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    for (const widget of widgets) {
      await ctx.db.delete(widget._id);
    }

    // Delete layout document
    const layouts = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    for (const layout of layouts) {
      await ctx.db.delete(layout._id);
    }

    return { 
      success: true, 
      deletedWidgetCount: widgets.length,
      deletedLayoutCount: layouts.length
    };
  },
});

// ============================================================================
// LEGACY MUTATIONS (deprecated but kept for backward compatibility)
// ============================================================================

/**
 * Update a single widget using Convex ID
 */
export const updateWidget = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    widgetId: v.id("widgets"), // Use Convex ID
    updates: widgetUpdateValidator,
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, { projectId, userId, widgetId, updates }) => {
    // Get widget directly by Convex ID
    const widget = await ctx.db.get(widgetId);

    if (!widget) {
      throw new Error("Widget not found");
    }

    // Verify ownership
    if (widget.projectId !== projectId || widget.userId !== userId) {
      throw new Error("Access denied: You don't own this widget");
    }

    // Update the widget
    await ctx.db.patch(widgetId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a single widget using Convex ID
 */
export const deleteWidget = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    widgetId: v.id("widgets"), // Use Convex ID
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, { projectId, userId, widgetId }) => {
    // Get widget directly by Convex ID
    const widget = await ctx.db.get(widgetId);

    if (!widget) {
      throw new Error("Widget not found");
    }

    // Verify ownership
    if (widget.projectId !== projectId || widget.userId !== userId) {
      throw new Error("Access denied: You don't own this widget");
    }

    // Delete the widget
    await ctx.db.delete(widgetId);

    return { success: true };
  },
});
