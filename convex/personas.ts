import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Query to get the active persona for a user
export const getPersona = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { userId } = args;

      const persona = await ctx.db
        .query("personas")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();

      if (!persona) {
        return null;
      }

      // Defensive: fallback to empty string if fields are missing or malformed
      const currentPersonaDesc = persona.currentPersona?.description ?? '';
      const futureVisionDesc = persona.futureVision?.description ?? '';
      const personaData = {
        userId: persona.userId ?? '',
        name: persona.name ?? '',
        currentPersona: currentPersonaDesc,
        futureVision: futureVisionDesc,
      };

      return personaData;
    } catch (error) {
      // Always return a safe object if anything goes wrong
      return {
        userId: '',
        name: '',
        currentPersona: '',
        futureVision: '',
      };
    }
  },
});

// Mutation to create a new persona
export const createPersona = mutation({
  args: {
    userId: v.string(),
    preferredName: v.string(),
    currentPersona: v.string(),
    futureVision: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, preferredName, currentPersona, futureVision } = args;

    // Delete all previous personas for this user
    const allPersonas = await ctx.db
      .query("personas")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const persona of allPersonas) {
      await ctx.db.delete(persona._id);
    }

    // Create new persona
    return await ctx.db.insert("personas", {
      name: preferredName,
      userId: userId,
      currentPersona: {
        description: currentPersona
      },
      futureVision: {
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
