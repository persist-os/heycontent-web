import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new project
export const createProject = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const projectId = await ctx.db.insert("projects", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      noteIds: [],
      conversationIds: [],
      instagramPostIds: [],
      youtubeVideoIds: [],
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

// Update a project
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.description !== undefined) {
      updates.description = args.description;
    }

    await ctx.db.patch(args.projectId, updates);
    return args.projectId;
  },
});

// Delete a project
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.projectId);
    return true;
  },
});

// Add an item to a project
export const addItemToProject = mutation({
  args: {
    projectId: v.id("projects"),
    itemType: v.union(v.literal("note"), v.literal("conversation"), v.literal("instagramPost"), v.literal("youtubeVideo")),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    let updates: any = {
      updatedAt: Date.now(),
    };

    switch (args.itemType) {
      case "note":
        const noteIds = project.noteIds || [];
        if (!noteIds.includes(args.itemId)) {
          updates.noteIds = [...noteIds, args.itemId];
        }
        break;
      case "conversation":
        const conversationIds = project.conversationIds || [];
        if (!conversationIds.includes(args.itemId)) {
          updates.conversationIds = [...conversationIds, args.itemId];
        }
        break;
      case "instagramPost":
        const instagramPostIds = project.instagramPostIds || [];
        if (!instagramPostIds.includes(args.itemId)) {
          updates.instagramPostIds = [...instagramPostIds, args.itemId];
        }
        break;
      case "youtubeVideo":
        const youtubeVideoIds = project.youtubeVideoIds || [];
        if (!youtubeVideoIds.includes(args.itemId)) {
          updates.youtubeVideoIds = [...youtubeVideoIds, args.itemId];
        }
        break;
    }

    await ctx.db.patch(args.projectId, updates);
    return args.projectId;
  },
});

// Remove an item from a project
export const removeItemFromProject = mutation({
  args: {
    projectId: v.id("projects"),
    itemType: v.union(v.literal("note"), v.literal("conversation"), v.literal("instagramPost"), v.literal("youtubeVideo")),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    let updates: any = {
      updatedAt: Date.now(),
    };

    switch (args.itemType) {
      case "note":
        const noteIds = project.noteIds || [];
        updates.noteIds = noteIds.filter(id => id !== args.itemId);
        break;
      case "conversation":
        const conversationIds = project.conversationIds || [];
        updates.conversationIds = conversationIds.filter(id => id !== args.itemId);
        break;
      case "instagramPost":
        const instagramPostIds = project.instagramPostIds || [];
        updates.instagramPostIds = instagramPostIds.filter(id => id !== args.itemId);
        break;
      case "youtubeVideo":
        const youtubeVideoIds = project.youtubeVideoIds || [];
        updates.youtubeVideoIds = youtubeVideoIds.filter(id => id !== args.itemId);
        break;
    }

    await ctx.db.patch(args.projectId, updates);
    return args.projectId;
  },
});

// Get all projects for a user
export const getProjectsForUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return projects;
  },
});

// Get project details with all attached items
export const getProjectDetails = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    // Batch fetch all attached notes
    const notes = [];
    if (project.noteIds && project.noteIds.length > 0) {
      const notePromises = project.noteIds.map(async (noteId) => {
        try {
          const note = await ctx.db.get(noteId as Id<"notes">);
          return note;
        } catch {
          return null; // Handle case where note might be deleted
        }
      });
      const noteResults = await Promise.all(notePromises);
      notes.push(...noteResults.filter(Boolean));
    }

    // Batch fetch conversations
    const conversations = [];
    if (project.conversationIds && project.conversationIds.length > 0) {
      const conversationPromises = project.conversationIds.map(async (conversationId) => {
        try {
          const conversation = await ctx.db.get(conversationId as Id<"conversations">);
          return conversation;
        } catch {
          return null;
        }
      });
      const conversationResults = await Promise.all(conversationPromises);
      conversations.push(...conversationResults.filter(Boolean));
    }

    // Batch fetch Instagram posts
    const instagramPosts = [];
    if (project.instagramPostIds && project.instagramPostIds.length > 0) {
      const instagramPromises = project.instagramPostIds.map(async (postId) => {
        try {
          const post = await ctx.db.get(postId as Id<"instagramPosts">);
          return post;
        } catch {
          return null;
        }
      });
      const instagramResults = await Promise.all(instagramPromises);
      instagramPosts.push(...instagramResults.filter(Boolean));
    }

    // Batch fetch YouTube videos
    const youtubeVideos = [];
    if (project.youtubeVideoIds && project.youtubeVideoIds.length > 0) {
      const youtubePromises = project.youtubeVideoIds.map(async (videoId) => {
        try {
          const video = await ctx.db.get(videoId as Id<"youtubeVideos">);
          return video;
        } catch {
          return null;
        }
      });
      const youtubeResults = await Promise.all(youtubePromises);
      youtubeVideos.push(...youtubeResults.filter(Boolean));
    }

    return {
      ...project,
      attachedItems: {
        notes,
        conversations,
        instagramPosts,
        youtubeVideos,
      },
    };
  },
});

// Get projects that contain a specific note
export const getProjectsContainingNote = query({
  args: {
    userId: v.string(),
    noteId: v.string(),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return projects.filter(project => 
      project.noteIds && project.noteIds.includes(args.noteId)
    );
  },
}); 