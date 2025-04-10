import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async ({ db }) => {
    return await db.query("users").collect();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async ({ db }, { email }) => {
    return await db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

export const create = mutation({
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

export const update = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async ({ db }, args) => {
    const existingUser = await db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
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

export const getUserDetails = query({
  args: { email: v.string() },
  handler: async ({ db }, { email }) => {
    const user = await db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    if (!user) return null;
    
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      image: user.image,
      userId: user.userId,
      createdAt: new Date(user._creationTime).toISOString()
    };
  },
});

export const get = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
}); 