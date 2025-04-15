"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const createUser = action({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(api.users.create, args);
  }
});

export const updateUser = action({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(api.users.update, args);
  }
}); 