import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getNotes = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();

    return notes;
  },
});

export const createNote = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    important: v.boolean(),
    tags: v.array(v.string()),
    references: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const noteId = await ctx.db.insert("notes", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    return noteId;
  },
}); 