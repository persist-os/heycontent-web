import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to generate unique widget IDs
function generateWidgetId(): string {
  return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to calculate orbital position for new widgets
function calculateOrbitalPosition(
  existingWidgets: Array<{ orbital_angle: number; orbital_distance: number }>,
  priority: number
): { orbital_angle: number; orbital_distance: number } {
  // Base distance based on priority (1-10 scale)
  const baseDistance = 80 + (priority * 15); // 80-230px range
  
  // Find the best angle to avoid overlaps
  const maxAttempts = 36; // Try every 10 degrees
  const angleStep = (2 * Math.PI) / maxAttempts;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateAngle = attempt * angleStep;
    
    // Check for collisions with existing widgets
    const hasCollision = existingWidgets.some(widget => {
      const angleDiff = Math.abs(candidateAngle - widget.orbital_angle);
      const minAngleDiff = Math.PI / 6; // 30 degrees minimum
      
      // Check if angles are too close
      if (angleDiff < minAngleDiff || angleDiff > (2 * Math.PI - minAngleDiff)) {
        return true;
      }
      
      // Check if distances are too close
      const distanceDiff = Math.abs(baseDistance - widget.orbital_distance);
      if (distanceDiff < 40) { // Minimum 40px separation
        return true;
      }
      
      return false;
    });
    
    if (!hasCollision) {
      return {
        orbital_angle: candidateAngle,
        orbital_distance: baseDistance,
      };
    }
  }
  
  // Fallback: use random position if no good spot found
  return {
    orbital_angle: Math.random() * 2 * Math.PI,
    orbital_distance: baseDistance,
  };
}

/**
 * Create a new individual widget
 */
export const createWidget = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    fingerprintId: v.id("project_fingerprints"),
    widgetType: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    priority: v.number(), // 1-10
    size: v.string(), // small, medium, large, xlarge
    theme: v.string(),
    position: v.number(), // Position in dashboard
    layoutType: v.string(),
    config: v.optional(v.any()),
    dataSources: v.optional(v.array(v.string())),
    updateFrequency: v.optional(v.string()),
    interactive: v.optional(v.boolean()),
    editable: v.optional(v.boolean()),
    shareable: v.optional(v.boolean()),
  },
  returns: v.id("project_widgets"),
  handler: async (ctx, args) => {
    // Validate project exists and user owns it
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== args.userId) {
      throw new Error("Access denied: You don't own this project");
    }

    // Validate priority range
    if (args.priority < 1 || args.priority > 10) {
      throw new Error("Priority must be between 1 and 10");
    }

    // Get existing widgets for this project to calculate orbital position
    const existingWidgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .collect();

    // Calculate orbital position
    const orbitalPosition = calculateOrbitalPosition(
      existingWidgets.map(w => ({ 
        orbital_angle: w.orbital_angle, 
        orbital_distance: w.orbital_distance 
      })),
      args.priority
    );

    const now = Date.now();
    const widgetId = generateWidgetId();

    const newWidgetId = await ctx.db.insert("project_widgets", {
      widget_id: widgetId,
      project_id: args.projectId,
      user_id: args.userId,
      fingerprint_id: args.fingerprintId,
      widget_type: args.widgetType,
      title: args.title,
      description: args.description,
      category: args.category,
      priority: args.priority,
      size: args.size,
      theme: args.theme,
      position: args.position,
      layout_type: args.layoutType,
      config: args.config || {},
      data_sources: args.dataSources || [],
      update_frequency: args.updateFrequency || "daily",
      interactive: args.interactive ?? true,
      editable: args.editable ?? true,
      shareable: args.shareable ?? false,
      orbital_angle: orbitalPosition.orbital_angle,
      orbital_distance: orbitalPosition.orbital_distance,
      created_at: now,
      updated_at: now,
      generated_at: now,
      version: "1.0.0",
      confidence: 0.8,
      status: "active",
    });

    // Update project space radius if needed
    const newWidgetCount = existingWidgets.length + 1;
    const newSpaceRadius = Math.max(200, newWidgetCount * 20); // Minimum 200px, +20px per widget
    
    if (project.space_radius < newSpaceRadius) {
      await ctx.db.patch(args.projectId, {
        space_radius: newSpaceRadius,
        updatedAt: now,
      });
    }

    return newWidgetId;
  },
});

/**
 * Create multiple widgets from AI agent generation
 */
export const createWidgetsFromAgent = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    fingerprintId: v.id("project_fingerprints"),
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
      layout_type: v.string(),
      config: v.any(),
      data_sources: v.array(v.string()),
      update_frequency: v.string(),
      interactive: v.boolean(),
      editable: v.boolean(),
      shareable: v.boolean(),
    })),
    version: v.string(),
    confidence: v.number(),
  },
  returns: v.array(v.id("project_widgets")),
  handler: async (ctx, args) => {
    // Validate project exists and user owns it
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== args.userId) {
      throw new Error("Access denied: You don't own this project");
    }

    // Get existing widgets for orbital positioning
    const existingWidgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .collect();

    const now = Date.now();
    const createdWidgetIds: Id<"project_widgets">[] = [];

    // Create each widget
    for (const widgetData of args.widgets) {
      // Calculate orbital position
      const orbitalPosition = calculateOrbitalPosition(
        existingWidgets.map(w => ({ 
          orbital_angle: w.orbital_angle, 
          orbital_distance: w.orbital_distance 
        })),
        widgetData.priority
      );

      const widgetId = await ctx.db.insert("project_widgets", {
        widget_id: widgetData.widget_id,
        project_id: args.projectId,
        user_id: args.userId,
        fingerprint_id: args.fingerprintId,
        widget_type: widgetData.widget_type,
        title: widgetData.title,
        description: widgetData.description,
        category: widgetData.category,
        priority: widgetData.priority,
        size: widgetData.size,
        theme: widgetData.theme,
        position: widgetData.position,
        layout_type: widgetData.layout_type,
        config: widgetData.config,
        data_sources: widgetData.data_sources,
        update_frequency: widgetData.update_frequency,
        interactive: widgetData.interactive,
        editable: widgetData.editable,
        shareable: widgetData.shareable,
        orbital_angle: orbitalPosition.orbital_angle,
        orbital_distance: orbitalPosition.orbital_distance,
        created_at: now,
        updated_at: now,
        generated_at: now,
        version: args.version,
        confidence: args.confidence,
        status: "active",
      });

      createdWidgetIds.push(widgetId);

      // Add to existing widgets for next calculation
      existingWidgets.push({
        orbital_angle: orbitalPosition.orbital_angle,
        orbital_distance: orbitalPosition.orbital_distance,
      });
    }

    // Update project space radius
    const totalWidgetCount = existingWidgets.length;
    const newSpaceRadius = Math.max(200, totalWidgetCount * 20);
    
    if (project.space_radius < newSpaceRadius) {
      await ctx.db.patch(args.projectId, {
        space_radius: newSpaceRadius,
        updatedAt: now,
      });
    }

    return createdWidgetIds;
  },
});

/**
 * Update an existing widget
 */
export const updateWidget = mutation({
  args: {
    widgetId: v.string(),
    userId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
      priority: v.optional(v.number()),
      size: v.optional(v.string()),
      theme: v.optional(v.string()),
      position: v.optional(v.number()),
      layout_type: v.optional(v.string()),
      config: v.optional(v.any()),
      data_sources: v.optional(v.array(v.string())),
      update_frequency: v.optional(v.string()),
      interactive: v.optional(v.boolean()),
      editable: v.optional(v.boolean()),
      shareable: v.optional(v.boolean()),
    }),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Find the widget
    const widget = await ctx.db
      .query("project_widgets")
      .filter((q) => q.eq(q.field("widget_id"), args.widgetId))
      .first();

    if (!widget) {
      throw new Error("Widget not found");
    }

    // Validate ownership
    if (widget.user_id !== args.userId) {
      throw new Error("Access denied: You don't own this widget");
    }

    // Validate priority if provided
    if (args.updates.priority !== undefined && (args.updates.priority < 1 || args.updates.priority > 10)) {
      throw new Error("Priority must be between 1 and 10");
    }

    // Prepare update object
    const updateData: any = {
      updated_at: Date.now(),
    };

    // Add provided fields
    if (args.updates.title !== undefined) updateData.title = args.updates.title;
    if (args.updates.description !== undefined) updateData.description = args.updates.description;
    if (args.updates.category !== undefined) updateData.category = args.updates.category;
    if (args.updates.priority !== undefined) updateData.priority = args.updates.priority;
    if (args.updates.size !== undefined) updateData.size = args.updates.size;
    if (args.updates.theme !== undefined) updateData.theme = args.updates.theme;
    if (args.updates.position !== undefined) updateData.position = args.updates.position;
    if (args.updates.layout_type !== undefined) updateData.layout_type = args.updates.layout_type;
    if (args.updates.config !== undefined) updateData.config = args.updates.config;
    if (args.updates.data_sources !== undefined) updateData.data_sources = args.updates.data_sources;
    if (args.updates.update_frequency !== undefined) updateData.update_frequency = args.updates.update_frequency;
    if (args.updates.interactive !== undefined) updateData.interactive = args.updates.interactive;
    if (args.updates.editable !== undefined) updateData.editable = args.updates.editable;
    if (args.updates.shareable !== undefined) updateData.shareable = args.updates.shareable;

    // If priority changed, recalculate orbital position
    if (args.updates.priority !== undefined && args.updates.priority !== widget.priority) {
      const existingWidgets = await ctx.db
        .query("project_widgets")
        .withIndex("by_project", (q) => q.eq("project_id", widget.project_id))
        .filter((q) => q.neq(q.field("widget_id"), args.widgetId)) // Exclude current widget
        .collect();

      const orbitalPosition = calculateOrbitalPosition(
        existingWidgets.map(w => ({ 
          orbital_angle: w.orbital_angle, 
          orbital_distance: w.orbital_distance 
        })),
        args.updates.priority
      );

      updateData.orbital_angle = orbitalPosition.orbital_angle;
      updateData.orbital_distance = orbitalPosition.orbital_distance;
    }

    await ctx.db.patch(widget._id, updateData);
    return true;
  },
});

/**
 * Delete a widget
 */
export const deleteWidget = mutation({
  args: {
    widgetId: v.string(),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Find the widget
    const widget = await ctx.db
      .query("project_widgets")
      .filter((q) => q.eq(q.field("widget_id"), args.widgetId))
      .first();

    if (!widget) {
      throw new Error("Widget not found");
    }

    // Validate ownership
    if (widget.user_id !== args.userId) {
      throw new Error("Access denied: You don't own this widget");
    }

    // Delete the widget
    await ctx.db.delete(widget._id);

    // Update project space radius if needed
    const remainingWidgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("project_id", widget.project_id))
      .collect();

    const project = await ctx.db.get(widget.project_id);
    if (project) {
      const newSpaceRadius = Math.max(200, remainingWidgets.length * 20);
      
      if (project.space_radius > newSpaceRadius) {
        await ctx.db.patch(widget.project_id, {
          space_radius: newSpaceRadius,
          updatedAt: Date.now(),
        });
      }
    }

    return true;
  },
});

/**
 * Delete all widgets for a project
 */
export const deleteProjectWidgets = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Validate project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== args.userId) {
      throw new Error("Access denied: You don't own this project");
    }

    // Get all widgets for this project
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .collect();

    // Delete all widgets
    for (const widget of widgets) {
      await ctx.db.delete(widget._id);
    }

    // Reset project space radius
    await ctx.db.patch(args.projectId, {
      space_radius: 200, // Default minimum radius
      updatedAt: Date.now(),
    });

    return true;
  },
});

/**
 * Recalculate orbital positions for all widgets in a project
 */
export const recalculateWidgetPositions = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Validate project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== args.userId) {
      throw new Error("Access denied: You don't own this project");
    }

    // Get all widgets for this project, sorted by priority
    const widgets = await ctx.db
      .query("project_widgets")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .collect();

    // Sort by priority (highest first)
    widgets.sort((a, b) => b.priority - a.priority);

    // Recalculate positions for each widget
    const updatedWidgets = [];
    for (let i = 0; i < widgets.length; i++) {
      const widget = widgets[i];
      const existingPositions = updatedWidgets.map(w => ({
        orbital_angle: w.orbital_angle,
        orbital_distance: w.orbital_distance,
      }));

      const newPosition = calculateOrbitalPosition(existingPositions, widget.priority);

      await ctx.db.patch(widget._id, {
        orbital_angle: newPosition.orbital_angle,
        orbital_distance: newPosition.orbital_distance,
        updated_at: Date.now(),
      });

      updatedWidgets.push({
        orbital_angle: newPosition.orbital_angle,
        orbital_distance: newPosition.orbital_distance,
      });
    }

    return true;
  },
});