import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

// Get all personas for a user
export const getPersonasByUser = query({
  args: { creatorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("personas")
      .withIndex("by_userId", q => q.eq("userId", args.creatorId))
      .collect();
  },
});

// Get all active personas for a user
export const getActivePersonasByUser = query({
  args: { creatorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("personas")
      .withIndex("by_userId", q => q.eq("userId", args.creatorId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get a persona by its id
export const getPersonaById = query({
  args: { personaId: v.id("personas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.personaId);
  },
});