import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

type ExperienceLevel = "Beginner" | "Intermediate" | "Experienced" | "Professional";

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

      return persona;
    } catch (error) {
      console.error("Error fetching persona:", error);
      return null;
    }
  },
});

// Query to get all personas for a user (for context and history)
export const getAllPersonas = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { userId } = args;

      const personas = await ctx.db
        .query("personas")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();

      return personas;
    } catch (error) {
      console.error("Error fetching all personas:", error);
      return [];
    }
  },
});

// Query to get persona history (inactive personas) for context
export const getPersonaHistory = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { userId } = args;

      const personas = await ctx.db
        .query("personas")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("isActive"), false))
        .order("desc")
        .collect();

      return personas;
    } catch (error) {
      console.error("Error fetching persona history:", error);
      return [];
    }
  },
});

// Optimized query to get all persona data in a single call
export const getPersonaData = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { userId } = args;

      // Single query to get all personas, sorted by creation date
      const allPersonas = await ctx.db
        .query("personas")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();

      // Separate active from inactive personas in memory (faster than separate queries)
      const activePersona = allPersonas.find(p => p.isActive) || null;
      const personaHistory = allPersonas.filter(p => !p.isActive);

      return {
        allPersonas,
        activePersona,
        personaHistory,
        count: allPersonas.length
      };
    } catch (error) {
      console.error("Error fetching persona data:", error);
      return {
        allPersonas: [],
        activePersona: null,
        personaHistory: [],
        count: 0
      };
    }
  },
});

// Mutation to create a new persona
export const createPersona = mutation({
  args: {
    userId: v.string(),
    current_name: v.string(),
    current_description: v.string(),
    experience_level: v.string(),
    content_formats: v.array(v.string()),
    content_tone: v.string(),
    content_voice: v.string(),
    content_pillars: v.array(v.string()),
    unique_value: v.string(),
    future_name: v.string(),
    future_description: v.string(),
    goals: v.array(v.string()),
    desired_impact: v.string(),
    primary_topics: v.array(v.string()),
    secondary_topics: v.array(v.string()),
    tone_descriptors: v.array(v.string()),
    style_descriptors: v.array(v.string()),
    audience_type: v.string(),
    engagement_style: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Deactivate all previous personas for this user
    const allPersonas = await ctx.db
      .query("personas")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const persona of allPersonas) {
      await ctx.db.patch(persona._id, {
        isActive: false,
        updatedAt: timestamp,
      });
    }

    // Create new persona with all fields
    return await ctx.db.insert("personas", {
      ...args,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

// Mutation to update an existing persona
export const updatePersona = mutation({
  args: {
    personaId: v.id("personas"),
    current_name: v.optional(v.string()),
    current_description: v.optional(v.string()),
    experience_level: v.optional(v.string()),
    content_formats: v.optional(v.array(v.string())),
    content_tone: v.optional(v.string()),
    content_voice: v.optional(v.string()),
    content_pillars: v.optional(v.array(v.string())),
    unique_value: v.optional(v.string()),
    future_name: v.optional(v.string()),
    future_description: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
    desired_impact: v.optional(v.string()),
    primary_topics: v.optional(v.array(v.string())),
    secondary_topics: v.optional(v.array(v.string())),
    tone_descriptors: v.optional(v.array(v.string())),
    style_descriptors: v.optional(v.array(v.string())),
    audience_type: v.optional(v.string()),
    engagement_style: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { personaId, ...updates } = args;
    const timestamp = Date.now();

    // Update the persona with new data
    await ctx.db.patch(personaId, {
      ...updates,
      updatedAt: timestamp,
    });

    return personaId;
  },
});

// Mutation to activate a specific persona (make it the active one)
export const activatePersona = mutation({
  args: {
    personaId: v.id("personas"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { personaId, userId } = args;
    const timestamp = Date.now();

    // Deactivate all other personas for this user
    const allPersonas = await ctx.db
      .query("personas")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const persona of allPersonas) {
      await ctx.db.patch(persona._id, {
        isActive: persona._id === personaId,
        updatedAt: timestamp,
      });
    }

    return personaId;
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

// Mutation to delete a persona (permanently)
export const deletePersona = mutation({
  args: {
    personaId: v.id("personas"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.personaId);
  },
});