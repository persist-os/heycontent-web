import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

const noteType = v.union(
  v.literal("idea_bank"),
  v.literal("content_script"),
  v.literal("collaboration_note"),
  v.literal("analytics_insight"),
  v.literal("reflection_journal"),
  v.literal("task_checklist"),
  v.literal("email_draft")
);

export const createNote = mutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.optional(noteType),
    tags: v.optional(v.array(v.string())),
    platform: v.optional(v.string()),
    sourceConversationId: v.optional(v.string()),
    // Context fields for project/widget linkage
    widgetId: v.optional(v.union(v.string(), v.id("widgets"))),  // 🔄 Migration: supports both legacy string and Convex ID
    projectId: v.optional(v.id("projects")),
    isWidgetOutput: v.optional(v.boolean()),
    widgetOutputId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const noteId = await ctx.db.insert("notes", {
      userId: args.userId,
      title: args.title ?? "",
      content: args.content ?? "",
      type: args.type ?? "idea_bank",
      tags: args.tags ?? [],
      platform: args.platform ?? "",
      sourceConversationId: args.sourceConversationId,
      important: false,
      createdAt: now,
      updatedAt: now,
      // Include context fields if provided
      widgetId: args.widgetId,
      projectId: args.projectId,
      isWidgetOutput: args.isWidgetOutput,
      widgetOutputId: args.widgetOutputId,
    });

    const note = await ctx.db.get(noteId);

    return note;
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
    updates: v.object({
      content: v.optional(v.string()),
      title: v.optional(v.string()),
      type: v.optional(noteType),
      tags: v.optional(v.array(v.string())),
      important: v.optional(v.boolean()),
      titleGenerated: v.optional(v.boolean()),
      typeGenerated: v.optional(v.boolean()),
      images: v.optional(
        v.array(
          v.object({
            filename: v.string(),
            mimeType: v.string(),
            originalFilename: v.string(),
            size: v.number(),
            uploadedAt: v.number(),
            url: v.string(),
          })
        )
      ),
    }),
  },
  handler: async (ctx, { noteId, userId, updates }) => {
    const note = await ctx.db.get(noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    // Check if user owns the note
    if (note.userId === userId) {
      // Owner can update directly (no collision detection needed for single owner)
      await ctx.db.patch(noteId, {
        ...updates,
        updatedAt: Date.now(),
      });
      
      // 🆕 INCREMENT FINGERPRINT SIGNALS FOR ALL PROJECTS WITH THIS NOTE
      try {
        const projects = await ctx.db.query("projects").collect();
        const projectsWithNote = projects.filter(p => 
          (p.noteIds || []).includes(noteId)
        );
        
        for (const project of projectsWithNote) {
          await ctx.runMutation(api.fingerprintSignalsMutations.increment, {
            projectId: project._id,
            signalType: "note_modified",
            count: 1,
          });
        }
      } catch (error) {
        console.error("Failed to increment signals:", error);
      }
      
      return ctx.db.get(noteId);
    }

    // Check if user has edit permission through sharing
    const shareRecord = await ctx.db
      .query("shared_notes")
      .withIndex("by_note_user", (q) => 
        q.eq("noteId", noteId).eq("sharedWithUserId", userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    if (!shareRecord) {
      throw new Error("Note not found or unauthorized");
    }

    // Check if user has edit permission for content changes
    if (updates.content !== undefined && shareRecord.permission !== "edit") {
      throw new Error("You don't have permission to edit this note's content");
    }
    
    // Update shared note directly (future: add collision detection)
    await ctx.db.patch(noteId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    // 🆕 INCREMENT FINGERPRINT SIGNALS FOR ALL PROJECTS WITH THIS NOTE
    try {
      const projects = await ctx.db.query("projects").collect();
      const projectsWithNote = projects.filter(p => 
        (p.noteIds || []).includes(noteId)
      );
      
      for (const project of projectsWithNote) {
        await ctx.runMutation(api.fingerprintSignalsMutations.increment, {
          projectId: project._id,
          signalType: "note_modified",
          count: 1,
        });
      }
    } catch (error) {
      console.error("Failed to increment signals:", error);
    }
    
    return ctx.db.get(noteId);
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
  },
  handler: async (ctx, { noteId, userId }) => {
    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }
    
    await ctx.db.delete(noteId);
    return { success: true };
  },
});