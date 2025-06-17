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
    username: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.string()),
  },
  handler: async ({ db }, args) => {
    const now = Date.now();
    return await db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      userId: args.userId,
      username: args.username ?? '',
      referralCode: args.referralCode ?? '',
      referredBy: args.referredBy ?? '',
      createdAt: now,
      updatedAt: now,
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

// Internal query to get embedding documents by IDs for vector search
export const getEmbeddingsByIds = internalQuery({
  args: { ids: v.array(v.id("vectorSearch")) },
  handler: async ({ db }, args) => {
    const results = [];
    for (const id of args.ids) {
      const doc = await db.get(id);
      if (doc !== null) {
        results.push(doc);
      }
    }
    return results;
  },
});

// Internal query to get single embedding by ID
export const getEmbeddingById = internalQuery({
  args: { id: v.id("vectorSearch") },
  handler: async ({ db }, args) => {
    return await db.get(args.id);
  },
}); 