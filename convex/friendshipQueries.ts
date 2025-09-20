import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get friends for a user
 * @param userId - The ID of the user to get friends for
 */
export const getMyFriends = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(v.object({
    userId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("blocked")),
    _id: v.string(),
    _creationTime: v.number(),
  })),
  handler: async (ctx, { userId }) => {
    try {
      // For now, return empty array since friendship system is not implemented
      // This can be expanded later when friendship functionality is added
      return [];
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  },
});
