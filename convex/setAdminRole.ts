import { mutation } from "./_generated/server";
import { v } from "convex/values";

// One-time migration to set admin roles
export const setAdminRole = mutation({
  args: {
    userEmail: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("admin"),
      v.literal("super_admin"),
      v.literal("ambassador"),
      v.literal("affiliate"),
      v.literal("partner")
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .unique();

    if (!user) {
      throw new Error(`User with email ${args.userEmail} not found`);
    }

    // Update the user's role
    await ctx.db.patch(user._id, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return true;
  },
}); 