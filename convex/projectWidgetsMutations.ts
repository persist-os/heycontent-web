import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create project widgets
export const createProjectWidgets = mutation({
  args: {
    projectId: v.id("projects"),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    categories: v.array(v.object({
      name: v.string(),
      icon: v.string(),
      description: v.string(),
    })),
    widgets: v.array(v.object({
      widget_id: v.string(),
      widget_type: v.string(),
      title: v.string(),
      description: v.string(),
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
    })),
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const widgetsId = await ctx.db.insert("project_widgets", {
      projectId: args.projectId,
      fingerprintId: args.fingerprintId,
      userId: args.userId,
      categories: args.categories,
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
      generated_at: now,
      version: args.version,
      confidence: args.confidence,
      status: "active",
    });

    return widgetsId;
  },
});

// Update project widgets
export const updateProjectWidgets = mutation({
  args: {
    widgetsId: v.id("project_widgets"),
    updates: v.object({
      widgets: v.optional(v.array(v.object({
        widget_id: v.string(),
        widget_type: v.string(),
        title: v.string(),
        description: v.string(),
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
      }))),
      layout_type: v.optional(v.string()),
      columns: v.optional(v.number()),
      rows: v.optional(v.number()),
      global_theme: v.optional(v.string()),
      color_scheme: v.optional(v.string()),
      font_style: v.optional(v.string()),
      allow_customization: v.optional(v.boolean()),
      allow_reordering: v.optional(v.boolean()),
      allow_resizing: v.optional(v.boolean()),
      required_integrations: v.optional(v.array(v.string())),
      data_refresh_strategy: v.optional(v.string()),
      version: v.optional(v.string()),
      confidence: v.optional(v.number()),
      status: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { widgetsId, updates } = args;
    
    await ctx.db.patch(widgetsId, updates);

    return widgetsId;
  },
});

// Update widget configuration
export const updateWidgetConfig = mutation({
  args: {
    widgetsId: v.id("project_widgets"),
    widgetId: v.string(),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db.get(args.widgetsId);
    if (!widgets) {
      throw new Error("Project widgets not found");
    }

    const updatedWidgets = widgets.widgets.map(widget => 
      widget.widget_id === args.widgetId 
        ? { ...widget, config: args.config }
        : widget
    );

    await ctx.db.patch(args.widgetsId, {
      widgets: updatedWidgets,
    });

    return { success: true };
  },
});

// Reorder widgets
export const reorderWidgets = mutation({
  args: {
    widgetsId: v.id("project_widgets"),
    widgetOrder: v.array(v.string()), // Array of widget IDs in new order
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db.get(args.widgetsId);
    if (!widgets) {
      throw new Error("Project widgets not found");
    }

    // Create a map of widget ID to widget for quick lookup
    const widgetMap = new Map(widgets.widgets.map(widget => [widget.widget_id, widget]));
    
    // Reorder widgets based on the provided order
    const reorderedWidgets = args.widgetOrder
      .map((widgetId, index) => {
        const widget = widgetMap.get(widgetId);
        if (widget) {
          return { ...widget, position: index + 1 };
        }
        return null;
      })
      .filter(Boolean);

    // Add any widgets not in the order array at the end
    const orderedIds = new Set(args.widgetOrder);
    const remainingWidgets = widgets.widgets
      .filter(widget => !orderedIds.has(widget.widget_id))
      .map((widget, index) => ({
        ...widget,
        position: args.widgetOrder.length + index + 1
      }));

    const finalWidgets = [...reorderedWidgets, ...remainingWidgets];

    await ctx.db.patch(args.widgetsId, {
      widgets: finalWidgets,
    });

    return { success: true };
  },
});

// Archive project widgets
export const archiveProjectWidgets = mutation({
  args: {
    widgetsId: v.id("project_widgets"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.widgetsId, {
      status: "archived",
    });

    return { success: true };
  },
});

// Delete project widgets
export const deleteProjectWidgets = mutation({
  args: {
    widgetsId: v.id("project_widgets"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.widgetsId);
    return { success: true };
  },
});

// Delete all widgets for a project
export const deleteProjectWidgetsByProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const widget of widgets) {
      await ctx.db.delete(widget._id);
    }

    return { success: true, deletedCount: widgets.length };
  },
});
