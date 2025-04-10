"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getUserByEmail = action({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.runQuery(api.users.getByEmail, { email });
  },
});

export const createUser = action({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(api.users.create, args);
  },
});

export const updateUser = action({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(api.users.update, args);
  },
}); 