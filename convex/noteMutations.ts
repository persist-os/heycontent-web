import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
    });
    return ctx.db.get(noteId);
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
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }
    
    await ctx.db.patch(noteId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
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