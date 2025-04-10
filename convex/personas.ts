import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Query to get the active persona for a user
export const getPersona = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    const persona = await ctx.db
      .query("personas")
      .withIndex("by_user", (q) => q.eq("creatorId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return persona || null;
  },
});

// Mutation to create a new persona
export const createPersona = mutation({
  args: {
    userId: v.string(),
    currentPersona: v.string(),
    futureVision: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, currentPersona, futureVision } = args;
    
    return await ctx.db.insert("personas", {
      name: currentPersona,
      creatorId: userId,
      currentState: {
        description: currentPersona
      },
      currentActivities: {
        description: currentPersona
      },
      aspirations: {
        description: futureVision || currentPersona
      },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Mutation to deactivate a persona
export const deactivatePersona = mutation({
  args: {
    personaId: v.id("personas"),
  },
  handler: async (ctx, args) => {
    const { personaId } = args;
    await ctx.db.patch(personaId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// Mutation to update a persona (deactivates old one and creates new one)
export const updatePersona = mutation({
  args: {
    userId: v.string(),
    currentPersona: v.string(),
    futureVision: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"personas">> => {
    const { userId, currentPersona, futureVision } = args;

    // Deactivate old personas
    const oldPersonas = await ctx.db
      .query("personas")
      .withIndex("by_user", (q) => q.eq("creatorId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (oldPersonas) {
      await ctx.db.patch(oldPersonas._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }

    // Create new active persona
    return await ctx.db.insert("personas", {
      name: currentPersona,
      creatorId: userId,
      currentState: {
        description: currentPersona
      },
      currentActivities: {
        description: currentPersona
      },
      aspirations: {
        description: futureVision || currentPersona
      },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Note: We'll need to create a separate file for the query function
// This will be in convex/personas.query.ts 