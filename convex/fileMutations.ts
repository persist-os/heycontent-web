import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { fileCreateValidator } from "./types/file";
import { projectFileCreateValidator } from "./types/projectFile";

/**
 * Create a file record in Convex after upload to GCS
 * Called after successful file upload to backend
 */
export const createFile = mutation({
  args: {
    userId: v.string(),
    fileData: fileCreateValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const fileId = await ctx.db.insert("files", {
      userId: args.userId,
      originalFilename: args.fileData.originalFilename,
      filename: args.fileData.filename,
      contentType: args.fileData.contentType,
      fileSize: args.fileData.fileSize,
      gcsUrl: args.fileData.gcsUrl,
      fileUrl: args.fileData.fileUrl,
      conversationId: args.fileData.conversationId,
      createdAt: now,
      updatedAt: now,
    });

    return fileId;
  },
});

/**
 * Attach a file to a project (assignment)
 * Supports many-to-many: same file can be attached to multiple projects
 */
export const attachFileToProject = mutation({
  args: {
    projectId: v.id("projects"),
    fileId: v.id("files"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify file exists and belongs to user
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }
    if (file.userId !== args.userId) {
      throw new Error("Unauthorized: File does not belong to user");
    }

    // Check if already attached (prevent duplicates)
    const existing = await ctx.db
      .query("project_files")
      .withIndex("by_project_file", (q) =>
        q.eq("projectId", args.projectId).eq("fileId", args.fileId)
      )
      .first();

    if (existing) {
      return existing._id; // Return existing relationship
    }

    // Create new relationship
    const now = Date.now();
    const projectFileId = await ctx.db.insert("project_files", {
      projectId: args.projectId,
      fileId: args.fileId,
      userId: args.userId,
      attachedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return projectFileId;
  },
});

/**
 * Detach a file from a project
 */
export const detachFileFromProject = mutation({
  args: {
    projectId: v.id("projects"),
    fileId: v.id("files"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the relationship
    const projectFile = await ctx.db
      .query("project_files")
      .withIndex("by_project_file", (q) =>
        q.eq("projectId", args.projectId).eq("fileId", args.fileId)
      )
      .first();

    if (!projectFile) {
      throw new Error("File not attached to project");
    }

    // Verify user owns the relationship
    if (projectFile.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(projectFile._id);
    return true;
  },
});

/**
 * Delete a file (and all its project attachments)
 */
export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify file exists and belongs to user
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }
    if (file.userId !== args.userId) {
      throw new Error("Unauthorized: File does not belong to user");
    }

    // Delete all project attachments
    const projectFiles = await ctx.db
      .query("project_files")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .collect();

    await Promise.all(projectFiles.map((pf) => ctx.db.delete(pf._id)));

    // Delete the file record
    await ctx.db.delete(args.fileId);

    return true;
  },
});

/**
 * Batch attach multiple files to a project
 */
export const batchAttachFilesToProject = mutation({
  args: {
    projectId: v.id("projects"),
    fileIds: v.array(v.id("files")),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const results = await Promise.allSettled(
      args.fileIds.map((fileId) =>
        ctx.runMutation(api.fileMutations.attachFileToProject, {
          projectId: args.projectId,
          fileId,
          userId: args.userId,
        })
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return {
      success: true,
      successfulOperations: successful,
      failedOperations: failed,
    };
  },
});

