import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { 
  widgetCategoryValidator,
  widgetBatchValidator,
  updateWidgetLayoutArgsValidator,
  deleteProjectWidgetsArgsValidator,
  updateProjectWidgetArgsValidator,
  deleteProjectWidgetArgsValidator,
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
    fingerprintId: v.any(),
    userId: v.string(),
    
    // Widget data
    categories: v.optional(v.array(widgetCategoryValidator)),  // ✅ Optional for family transition
    widgets: v.array(widgetBatchValidator),
    
    // Global layout settings - ✅ ALL OPTIONAL for Phase 2 transition
    layout_type: v.optional(v.string()),
    columns: v.optional(v.number()),
    rows: v.optional(v.number()),
    
    // Global appearance - ✅ ALL OPTIONAL
    global_theme: v.optional(v.string()),
    color_scheme: v.optional(v.string()),
    font_style: v.optional(v.string()),
    
    // Customization settings - ✅ ALL OPTIONAL
    allow_customization: v.optional(v.boolean()),
    allow_reordering: v.optional(v.boolean()),
    allow_resizing: v.optional(v.boolean()),
    
    // Technical settings - ✅ ALL OPTIONAL
    required_integrations: v.optional(v.array(v.string())),
    data_refresh_strategy: v.optional(v.string()),
    
    // Metadata - ✅ ALL OPTIONAL
    version: v.optional(v.string()),
    confidence: v.optional(v.number()),
    
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
    const project = await ctx.db.get(args.projectId) as any;  // ✅ Type assertion needed due to v.any() fingerprintId
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== args.userId) {
      throw new Error("Access denied: You don't own this project");
    }
    
    // ✅ Fingerprint validation removed - fingerprintId is v.any() due to table migration
    // The project ownership check above is sufficient for security
    
    // Validate confidence (if provided)
    if (args.confidence !== undefined && (args.confidence < 0 || args.confidence > 1)) {
      throw new Error("Confidence must be between 0 and 1");
    }
    
    const now = Date.now();
    
    // ✅ PHASE 2: Provide defaults for optional layout fields
    const cleanCategories = args.categories 
      ? args.categories.map((category, index) => ({
          ...category,
          display_order: category.display_order ?? index + 1,
        }))
      : [{ name: "General", display_order: 1 }];  // Default category
    
    // ========================================================================
    // STEP 1: Upsert Layout Configuration (project_widgets table)
    // ========================================================================
    
    const existingLayout = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    // ✅ PHASE 2: Use defaults for optional layout fields during family transition
    const layoutData = {
      projectId: args.projectId,
      fingerprintId: args.fingerprintId,
      userId: args.userId,
      categories: cleanCategories,
      layout_type: args.layout_type ?? "grid",
      columns: args.columns ?? 3,
      rows: args.rows ?? 4,
      global_theme: args.global_theme ?? "modern",
      color_scheme: args.color_scheme ?? "default",
      font_style: args.font_style ?? "inter",
      allow_customization: args.allow_customization ?? true,
      allow_reordering: args.allow_reordering ?? true,
      allow_resizing: args.allow_resizing ?? true,
      required_integrations: args.required_integrations ?? [],
      data_refresh_strategy: args.data_refresh_strategy ?? "on_demand",
      version: args.version ?? "1.0",
      confidence: args.confidence ?? 0.8,
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
      // ✅ PHASE 2: Bridge validator (camelCase) to DB schema (mixed case)
      // Validator receives camelCase from Python's model_dump(by_alias=True)
      // DB schema uses snake_case for old fields, camelCase for new fields
      const widgetData = {
        // === OLD FIELDS (snake_case in DB) ===
        widget_id: widget.widgetId,                          // validator: widgetId → DB: widget_id
        widget_type: widget.widgetType,                      // validator: widgetType → DB: widget_type
        title: widget.title,
        description: widget.description,
        category: widget.category ?? "general",
        priority: widget.priority ?? 5,
        size: widget.size ?? "medium",
        theme: widget.theme ?? "default",
        position: widget.position ?? 0,
        config: widget.config ?? {},
        data_sources: widget.dataSource ?? [],               // validator: dataSource → DB: data_sources
        update_frequency: widget.updateFrequency ?? "on_demand",  // validator: updateFrequency → DB: update_frequency
        interactive: widget.interactive ?? true,
        editable: widget.editable ?? true,
        shareable: widget.shareable ?? false,
        
        // === NEW FIELDS (camelCase in DB) ===
        // Phase 2 family fields (validator and DB both use camelCase)
        familyIdentity: widget.familyIdentity,
        agentRoster: widget.agentRoster,
        
        // Orchestration fields (validator and DB both use camelCase)
        capabilities: widget.capabilities,
        execution_history: widget.execution_history,
        inputRequirements: widget.inputRequirements,
        outputArtifacts: widget.outputArtifacts,
        dependencyHints: widget.dependencyHints,
        executionProfile: widget.executionProfile,
        workflowStage: widget.workflowStage,
        
        // === SYSTEM FIELDS ===
        projectId: args.projectId,
        fingerprintId: args.fingerprintId,
        userId: args.userId,
        status: "active" as const,  // ✅ Widgets are active immediately (decision engine removed)
        createdAt: now,
        updatedAt: now,
      };
      
      const widgetId = await ctx.db.insert("widgets", widgetData);
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
  args: updateWidgetLayoutArgsValidator,
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, { projectId, userId, updates }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId) as any;  // ✅ Type assertion needed due to v.any() fingerprintId
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
  args: deleteProjectWidgetsArgsValidator,
  returns: v.object({
    success: v.boolean(),
    deletedWidgetCount: v.number(),
    deletedLayoutCount: v.number(),
  }),
  handler: async (ctx, { projectId, userId }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId) as any;  // ✅ Type assertion needed due to v.any() fingerprintId
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
  args: updateProjectWidgetArgsValidator,
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
  args: deleteProjectWidgetArgsValidator,
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
