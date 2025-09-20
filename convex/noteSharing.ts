import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get users that a note is shared with
 * @param noteId - The ID of the note
 * @param userId - The ID of the user making the request (for auth)
 */
export const getNoteSharedUsers = query({
  args: {
    noteId: v.string(),
    userId: v.string(),
  },
  returns: v.array(v.object({
    userId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    permission: v.union(v.literal("read"), v.literal("write")),
  })),
  handler: async (ctx, { noteId, userId }) => {
    try {
      const note = await ctx.db.get(noteId as Id<"notes">);
      
      // Verify ownership - only owner can see shared users
      if (!note || note.userId !== userId) {
        return [];
      }
      
      // For now, return empty array since sharing is not implemented
      // This can be expanded later when sharing functionality is added
      return [];
    } catch (error) {
      console.error('Error fetching note shared users:', error);
      return [];
    }
  },
});
