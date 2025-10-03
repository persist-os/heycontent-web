import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Clean Project Widgets Mutations
 * Optimized for performance, validation, and simplicity
 * Only 2 functions needed - no redundancy, no optional chaos
 */

// ============================================================================
// WIDGET CATEGORY VALIDATOR
// ============================================================================

const widgetCategoryValidator = v.object({
  name: v.string(),
  icon: v.optional(v.string()),
  description: v.optional(v.string()),
  display_order: v.optional(v.number()),
});

// ============================================================================
// WIDGET VALIDATOR
// ============================================================================

const widgetValidator = v.object({
  widget_id: v.string(),
  widget_type: v.string(), // Flexible - any widget type
  title: v.string(),
  description: v.optional(v.string()),
  category: v.string(),
  
  // Layout and appearance - flexible
  priority: v.number(),
  size: v.string(), // Flexible - any size
  theme: v.string(), // Flexible - any theme
  position: v.number(),
  
  // Configuration
  config: v.any(),
  data_sources: v.array(v.string()),
  update_frequency: v.string(), // Flexible - any frequency
  
  // Permissions
  interactive: v.boolean(),
  editable: v.boolean(),
  shareable: v.boolean(),
});

// ============================================================================
// CORE MUTATIONS
// ============================================================================

/**
 * Upsert project widgets - handles both create and update
 * Used by: Backend widget generation, frontend updates
 */
export const upsertProjectWidgets = mutation({
  args: {
    projectId: v.id("projects"),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    
    // Widget data with full validation
    categories: v.array(widgetCategoryValidator),
    widgets: v.array(widgetValidator),
    
    // Global layout settings - flexible
    layout_type: v.string(), // Any layout type
    columns: v.number(),
    rows: v.number(),
    
    // Global appearance - flexible
    global_theme: v.string(), // Any theme
    color_scheme: v.string(), // Any color scheme
    font_style: v.string(), // Any font style
    
    // Customization settings
    allow_customization: v.boolean(),
    allow_reordering: v.boolean(),
    allow_resizing: v.boolean(),
    
    // Technical settings
    required_integrations: v.array(v.string()),
    data_refresh_strategy: v.string(), // Any strategy
    
    // Metadata
    version: v.string(),
    confidence: v.number(), // 0-1
    
    // Optional AI-generated timestamps (accepted but completely ignored - we always set our own)
    generated_at: v.optional(v.any()),
    updated_at: v.optional(v.any())
  },
  returns: v.id("project_widgets"),
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
    
    // Basic validation only (no strict ranges)
    if (args.confidence < 0 || args.confidence > 1) {
      throw new Error("Confidence must be between 0 and 1");
    }
    
    // Check if widgets already exist for this project
    const existingWidgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    const now = Date.now();
    
    // Clean the data - remove AI timestamps and use programmatic ones
    // Add missing display_order to categories if not provided
    const cleanCategories = args.categories.map((category, index) => ({
      ...category,
      display_order: category.display_order ?? index + 1,
    }));
    
    // Explicitly exclude AI timestamp fields and build clean data
    const cleanData = {
      projectId: args.projectId,
      fingerprintId: args.fingerprintId,
      userId: args.userId,
      categories: cleanCategories,
      widgets: args.widgets,
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
      // Always use programmatic timestamps - never AI generated ones  
      status: "active",
      // Note: generated_at and updated_at from AI are explicitly excluded
    };
    
    if (existingWidgets) {
      // Update existing widgets - always ensure both timestamps exist
      await ctx.db.patch(existingWidgets._id, {
        ...cleanData,
        // Preserve original createdAt if it exists, otherwise set it now for migration
        createdAt: existingWidgets.createdAt ?? now,
        // Always update updatedAt to current time
        updatedAt: now,
      });
      return existingWidgets._id;
    } else {
      // Create new widgets - always set both timestamps
      const widgetsId = await ctx.db.insert("project_widgets", {
        ...cleanData,
        createdAt: now,
        updatedAt: now,
      });
      return widgetsId;
    }
  },
});

/**
 * Update a single widget within a project's widget collection
 * Used by: Widget editing UI
 */
export const updateWidget = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    widgetId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      priority: v.optional(v.number()),
      size: v.optional(v.string()),
      theme: v.optional(v.string()),
      category: v.optional(v.string()),
      update_frequency: v.optional(v.string()),
      interactive: v.optional(v.boolean()),
      editable: v.optional(v.boolean()),
      shareable: v.optional(v.boolean()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, { projectId, userId, widgetId, updates }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }

    // Find the project widgets document
    const projectWidgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!projectWidgets) {
      throw new Error("Project widgets not found");
    }

    if (projectWidgets.userId !== userId) {
      throw new Error("Access denied: You don't own these widgets");
    }

    // Find the widget in the array
    const widgetIndex = projectWidgets.widgets.findIndex(w => w.widget_id === widgetId);
    if (widgetIndex === -1) {
      throw new Error("Widget not found");
    }

    // Update the widget with new values
    const updatedWidgets = [...projectWidgets.widgets];
    updatedWidgets[widgetIndex] = {
      ...updatedWidgets[widgetIndex],
      ...updates,
    };

    // Update the document
    await ctx.db.patch(projectWidgets._id, {
      widgets: updatedWidgets,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a single widget from a project's widget collection
 * Used by: Widget deletion UI
 */
export const deleteWidget = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    widgetId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, { projectId, userId, widgetId }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }

    // Find the project widgets document
    const projectWidgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!projectWidgets) {
      throw new Error("Project widgets not found");
    }

    if (projectWidgets.userId !== userId) {
      throw new Error("Access denied: You don't own these widgets");
    }

    // Filter out the widget
    const updatedWidgets = projectWidgets.widgets.filter(w => w.widget_id !== widgetId);

    if (updatedWidgets.length === projectWidgets.widgets.length) {
      throw new Error("Widget not found");
    }

    // Update the document
    await ctx.db.patch(projectWidgets._id, {
      widgets: updatedWidgets,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete project widgets - Clean deletion with validation
 * Used by: Project cleanup, widget deletion
 */
export const deleteProjectWidgets = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
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

    // Find all widgets for this project
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    // Only delete widgets owned by the user (additional safety check)
    const userWidgets = widgets.filter(w => w.userId === userId);

    for (const widget of userWidgets) {
      await ctx.db.delete(widget._id);
    }

    return { 
      success: true, 
      deletedCount: userWidgets.length 
    };
  },
});