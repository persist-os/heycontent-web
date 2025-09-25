import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { generateNextGridPosition } from "./gridPositioningUtils";
import { internal } from "./_generated/api";

/**
 * Migration to convert existing projects from circular positioning to grid positioning
 * This should be run once to migrate all existing projects
 */
export const migrateProjectsToGrid = internalMutation({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all projects for the user that don't have grid coordinates yet
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("grid_x"), undefined))
      .collect();

    console.log(`[MIGRATION] Found ${projects.length} projects to migrate for user ${args.userId}`);

    // Convert each project to grid positioning
    for (const project of projects) {
      try {
        // Get all existing projects (including already migrated ones) for collision detection
        const allProjects = await ctx.db
          .query("projects")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();

        // Generate next available grid position
        const gridPosition = generateNextGridPosition(allProjects);

        // Calculate pixel position from grid coordinates
        const GRID_CELL_WIDTH = 1200;
        const GRID_CELL_HEIGHT = 800;
        const GRID_SPACING = 50;
        const CANVAS_WIDTH = 2400;
        const CANVAS_HEIGHT = 1600;
        const GRID_ORIGIN_X = CANVAS_WIDTH / 2;
        const GRID_ORIGIN_Y = CANVAS_HEIGHT / 2;

        const newPosition_x = GRID_ORIGIN_X + gridPosition.grid_x * (GRID_CELL_WIDTH + GRID_SPACING);
        const newPosition_y = GRID_ORIGIN_Y + gridPosition.grid_y * (GRID_CELL_HEIGHT + GRID_SPACING);

        // Update the project with grid coordinates
        await ctx.db.patch(project._id, {
          grid_x: gridPosition.grid_x,
          grid_y: gridPosition.grid_y,
          grid_width: GRID_CELL_WIDTH,
          grid_height: GRID_CELL_HEIGHT,
          // Update legacy position fields to match grid position
          position_x: newPosition_x,
          position_y: newPosition_y,
          updatedAt: Date.now(),
        });

        console.log(`[MIGRATION] Migrated project ${project.name} to grid position (${gridPosition.grid_x}, ${gridPosition.grid_y})`);
      } catch (error) {
        console.error(`[MIGRATION] Failed to migrate project ${project.name}:`, error);
      }
    }

    console.log(`[MIGRATION] Completed migration for user ${args.userId}`);
    return null;
  },
});

/**
 * Migration to convert all projects across all users to grid positioning
 * This should be run once by an admin to migrate the entire system
 */
export const migrateAllProjectsToGrid = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all users
    const users = await ctx.db.query("users").collect();
    
    console.log(`[MIGRATION] Starting migration for ${users.length} users`);

    for (const user of users) {
      try {
        await ctx.runMutation(internal.migrations.migrateProjectsToGrid, {
          userId: user._id,
        });
      } catch (error) {
        console.error(`[MIGRATION] Failed to migrate user ${user._id}:`, error);
      }
    }

    console.log(`[MIGRATION] Completed migration for all users`);
    return null;
  },
});