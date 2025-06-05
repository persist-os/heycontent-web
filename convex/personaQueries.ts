import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all personas for a user (both active and inactive)
export const getPersonasByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("personas")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get all active personas for a user
export const getActivePersonasByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("personas")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

// Get a persona by its ID
export const getPersonaById = query({
  args: { personaId: v.id("personas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.personaId);
  },
});

// Get personas by content pillars
export const getPersonasByContentPillar = query({
  args: { 
    userId: v.string(),
    pillar: v.string() 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("personas")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .filter(q => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("content_pillars"), [args.pillar])
        )
      )
      .collect();
  },
});

// Get personas by experience level
export const getPersonasByExperienceLevel = query({
  args: { 
    userId: v.string(),
    level: v.string() 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("personas")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .filter(q => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("experience_level"), args.level)
        )
      )
      .collect();
  },
});

// Search personas by name or description
export const searchPersonas = query({
  args: { 
    userId: v.string(),
    query: v.string() 
  },
  handler: async (ctx, args) => {
    const allPersonas = await ctx.db
      .query("personas")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    const searchTerm = args.query.toLowerCase();
    
    return allPersonas.filter(persona => 
      persona.current_name.toLowerCase().includes(searchTerm) ||
      persona.current_description.toLowerCase().includes(searchTerm) ||
      persona.future_name.toLowerCase().includes(searchTerm) ||
      persona.future_description.toLowerCase().includes(searchTerm)
    );
  },
});