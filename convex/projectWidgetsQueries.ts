import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get all widgets for a specific project
 */
export const getWidgetsByProject = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("project_widgets"),
      _creationTime: v.number(),
      widget_id: v.string(),
      project_id: v.id("projects"),
      user_id: v.string(),
      fingerprint_id: v.id("project_fingerprints"),
      widget_type: v.string(),
      title: v.string(),
      description: v.string(),
      category: v.string(),
      priority: v.number(),
      size: v.string(),
      theme: v.string(),
      position: v.number(),
      layout_type: v.string(),
      config: v.any(),
      data_sources: v.array(v.string()),
      update_frequency: v.string(),
      interactive: v.boolean(),
      editable: v.boolean(),
      shareable: v.boolean(),
      orbital_angle: v.number(),
      orbital_distance: v.number(),
      created_at: v.number(),
      updated_at: v.number(),
      generated_at: v.number(),
      version: v.string(),
      confidence: v.number(),
      status: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    // Optional: Validate user access to project
    if (args.userId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.userId !== args.userId) {
        throw new Error("Access denied: Project not found or user doesn't own this project");
      }
    }

    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .collect();

    return widgets;
  },
});

/**
 * Get all widgets for a specific user across all projects
 */
export const getWidgetsByUser = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("project_widgets"),
      _creationTime: v.number(),
      widget_id: v.string(),
      project_id: v.id("projects"),
      user_id: v.string(),
      fingerprint_id: v.id("project_fingerprints"),
      widget_type: v.string(),
      title: v.string(),
      description: v.string(),
      category: v.string(),
      priority: v.number(),
      size: v.string(),
      theme: v.string(),
      position: v.number(),
      layout_type: v.string(),
      config: v.any(),
      data_sources: v.array(v.string()),
      update_frequency: v.string(),
      interactive: v.boolean(),
      editable: v.boolean(),
      shareable: v.boolean(),
      orbital_angle: v.number(),
      orbital_distance: v.number(),
      created_at: v.number(),
      updated_at: v.number(),
      generated_at: v.number(),
      version: v.string(),
      confidence: v.number(),
      status: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .collect();

    return widgets;
  },
});

/**
 * Get a specific widget by its widget_id
 */
export const getWidgetById = query({
  args: {
    widgetId: v.string(),
    userId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("project_widgets"),
      _creationTime: v.number(),
      widget_id: v.string(),
      project_id: v.id("projects"),
      user_id: v.string(),
      fingerprint_id: v.id("project_fingerprints"),
      widget_type: v.string(),
      title: v.string(),
      description: v.string(),
      category: v.string(),
      priority: v.number(),
      size: v.string(),
      theme: v.string(),
      position: v.number(),
      layout_type: v.string(),
      config: v.any(),
      data_sources: v.array(v.string()),
      update_frequency: v.string(),
      interactive: v.boolean(),
      editable: v.boolean(),
      shareable: v.boolean(),
      orbital_angle: v.number(),
      orbital_distance: v.number(),
      created_at: v.number(),
      updated_at: v.number(),
      generated_at: v.number(),
      version: v.string(),
      confidence: v.number(),
      status: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const widget = await ctx.db
      .query("project_widgets")
      .filter((q) => q.eq(q.field("widget_id"), args.widgetId))
      .first();

    if (!widget) {
      return null;
    }

    // Optional: Validate user access
    if (args.userId && widget.user_id !== args.userId) {
      throw new Error("Access denied: User doesn't own this widget");
    }

    return widget;
  },
});

/**
 * Get widgets by category for a specific project
 */
export const getWidgetsByCategory = query({
  args: {
    projectId: v.id("projects"),
    category: v.string(),
    userId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("project_widgets"),
      _creationTime: v.number(),
      widget_id: v.string(),
      project_id: v.id("projects"),
      user_id: v.string(),
      fingerprint_id: v.id("project_fingerprints"),
      widget_type: v.string(),
      title: v.string(),
      description: v.string(),
      category: v.string(),
      priority: v.number(),
      size: v.string(),
      theme: v.string(),
      position: v.number(),
      layout_type: v.string(),
      config: v.any(),
      data_sources: v.array(v.string()),
      update_frequency: v.string(),
      interactive: v.boolean(),
      editable: v.boolean(),
      shareable: v.boolean(),
      orbital_angle: v.number(),
      orbital_distance: v.number(),
      created_at: v.number(),
      updated_at: v.number(),
      generated_at: v.number(),
      version: v.string(),
      confidence: v.number(),
      status: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    // Optional: Validate user access to project
    if (args.userId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.userId !== args.userId) {
        throw new Error("Access denied: Project not found or user doesn't own this project");
      }
    }

    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .filter((q) => q.eq(q.field("category"), args.category))
      .collect();

    return widgets;
  },
});

/**
 * Get widgets by type for a specific project
 */
export const getWidgetsByType = query({
  args: {
    projectId: v.id("projects"),
    widgetType: v.string(),
    userId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("project_widgets"),
      _creationTime: v.number(),
      widget_id: v.string(),
      project_id: v.id("projects"),
      user_id: v.string(),
      fingerprint_id: v.id("project_fingerprints"),
      widget_type: v.string(),
      title: v.string(),
      description: v.string(),
      category: v.string(),
      priority: v.number(),
      size: v.string(),
      theme: v.string(),
      position: v.number(),
      layout_type: v.string(),
      config: v.any(),
      data_sources: v.array(v.string()),
      update_frequency: v.string(),
      interactive: v.boolean(),
      editable: v.boolean(),
      shareable: v.boolean(),
      orbital_angle: v.number(),
      orbital_distance: v.number(),
      created_at: v.number(),
      updated_at: v.number(),
      generated_at: v.number(),
      version: v.string(),
      confidence: v.number(),
      status: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    // Optional: Validate user access to project
    if (args.userId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.userId !== args.userId) {
        throw new Error("Access denied: Project not found or user doesn't own this project");
      }
    }

    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .filter((q) => q.eq(q.field("widget_type"), args.widgetType))
      .collect();

    return widgets;
  },
});

/**
 * Get widgets with their parent project information
 */
export const getWidgetsWithProjects = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      widget: v.object({
        _id: v.id("project_widgets"),
        _creationTime: v.number(),
        widget_id: v.string(),
        project_id: v.id("projects"),
        user_id: v.string(),
        fingerprint_id: v.id("project_fingerprints"),
        widget_type: v.string(),
        title: v.string(),
        description: v.string(),
        category: v.string(),
        priority: v.number(),
        size: v.string(),
        theme: v.string(),
        position: v.number(),
        layout_type: v.string(),
        config: v.any(),
        data_sources: v.array(v.string()),
        update_frequency: v.string(),
        interactive: v.boolean(),
        editable: v.boolean(),
        shareable: v.boolean(),
        orbital_angle: v.number(),
        orbital_distance: v.number(),
        created_at: v.number(),
        updated_at: v.number(),
        generated_at: v.number(),
        version: v.string(),
        confidence: v.number(),
        status: v.string(),
      }),
      project: v.object({
        _id: v.id("projects"),
        _creationTime: v.number(),
        userId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        position_x: v.number(),
        position_y: v.number(),
        space_radius: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    })
  ),
  handler: async (ctx, args) => {
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .collect();

    const widgetsWithProjects = await Promise.all(
      widgets.map(async (widget) => {
        const project = await ctx.db.get(widget.project_id);
        if (!project) {
          throw new Error(`Project not found for widget ${widget.widget_id}`);
        }
        return {
          widget,
          project: {
            _id: project._id,
            _creationTime: project._creationTime,
            userId: project.userId,
            name: project.name,
            description: project.description,
            position_x: project.position_x,
            position_y: project.position_y,
            space_radius: project.space_radius,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          },
        };
      })
    );

    return widgetsWithProjects;
  },
});

/**
 * Get unique categories for a specific project
 */
export const getProjectCategories = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    // Optional: Validate user access to project
    if (args.userId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.userId !== args.userId) {
        throw new Error("Access denied: Project not found or user doesn't own this project");
      }
    }

    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .collect();

    // Extract unique categories
    const categories = [...new Set(widgets.map(widget => widget.category))];
    return categories.sort();
  },
});