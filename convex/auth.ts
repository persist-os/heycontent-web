"use node";

import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const createUser = action({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(api.users.create, args);
  },
});

export const updateUser = action({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(api.users.update, args);
  },
});

export const getUserIdFromToken = query({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<string> => {
    // In a real implementation, you would verify the token with Firebase Admin SDK
    // For now, we'll just return the token as the user ID since we're using Firebase auth
    return args.token;
  },
}); 