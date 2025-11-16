import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get all files for a user
 */
export const getUserFiles = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return files;
  },
});

/**
 * Get files for a specific project (assignment)
 */
export const getProjectFiles = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all project-file relationships
    const projectFiles = await ctx.db
      .query("project_files")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Fetch the actual file records
    const files = await Promise.all(
      projectFiles.map(async (pf) => {
        const file = await ctx.db.get(pf.fileId);
        if (!file || file.userId !== args.userId) {
          return null; // Filter out files not owned by user
        }
        return {
          ...file,
          attachedAt: pf.attachedAt || pf.createdAt,
        };
      })
    );

    return files.filter((f) => f !== null);
  },
});

/**
 * Get a single file by ID
 */
export const getFileById = query({
  args: {
    fileId: v.id("files"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file || file.userId !== args.userId) {
      return null;
    }
    return file;
  },
});

/**
 * Get all projects a file is attached to
 */
export const getFileProjects = query({
  args: {
    fileId: v.id("files"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify file exists and belongs to user
    const file = await ctx.db.get(args.fileId);
    if (!file || file.userId !== args.userId) {
      return [];
    }

    // Get all project-file relationships
    const projectFiles = await ctx.db
      .query("project_files")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .collect();

    // Fetch the actual project records
    const projects = await Promise.all(
      projectFiles.map(async (pf) => {
        const project = await ctx.db.get(pf.projectId);
        if (!project || project.userId !== args.userId) {
          return null;
        }
        return {
          ...project,
          attachedAt: pf.attachedAt || pf.createdAt,
        };
      })
    );

    return projects.filter((p) => p !== null);
  },
});

/**
 * Get file statistics for a user (for QuickEntryStats)
 */
export const getUserFileStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const count = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);

    return {
      count,
      totalSize,
    };
  },
});

