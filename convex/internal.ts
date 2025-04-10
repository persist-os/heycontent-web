import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserByEmailInternal = internalQuery({
  args: { email: v.string() },
  handler: async ({ db }, { email }) => {
    return await db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
  },
});

export const createUserInternal = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async ({ db }, args) => {
    return await db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      userId: args.userId,
    });
  },
});

export const updateUserInternal = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async ({ db }, args) => {
    const existingUser = await db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();

    if (!existingUser) {
      throw new Error("User not found");
    }

    return await db.patch(existingUser._id, {
      name: args.name,
      image: args.image,
      userId: args.userId,
    });
  },
}); 