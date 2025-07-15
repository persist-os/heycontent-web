import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

type ExperienceLevel = "Beginner" | "Intermediate" | "Experienced" | "Professional";

// Constants
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

// Query to check if user can generate a new persona (cooldown check)
export const checkPersonaGenerationEligibility = query({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    canGenerate: v.boolean(),
    nextAvailable: v.optional(v.number()),
    lastGenerated: v.optional(v.number()),
    daysRemaining: v.optional(v.number()),
    mustUpdate: v.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      const { userId } = args;
      
      // Get the most recent persona for this user
      const mostRecentPersona = await ctx.db
        .query("personas")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .order("desc")
        .first();

      if (!mostRecentPersona) {
        // No previous persona, user can generate
        return {
          canGenerate: true,
          mustUpdate: false,
        };
      }

      const now = Date.now();
      // Use _creationTime for cooldown logic (Convex system field)
      const lastGenerated = mostRecentPersona._creationTime;
      const timeSinceLastGeneration = now - lastGenerated;
      const mustUpdate = timeSinceLastGeneration >= TWO_WEEKS_MS;
      console.log('[CHECK ELIGIBILITY] now:', now, 'lastGenerated:', lastGenerated, 'timeSinceLastGeneration:', timeSinceLastGeneration, 'TWO_WEEKS_MS:', TWO_WEEKS_MS);
      if (timeSinceLastGeneration >= TWO_WEEKS_MS) {
        // Cooldown period has passed
        console.log('[CHECK ELIGIBILITY] Returning canGenerate: true', { canGenerate: true, lastGenerated, mustUpdate });
        return {
          canGenerate: true,
          lastGenerated,
          mustUpdate,
        };
      } else {
        // Still in cooldown period
        const nextAvailable = lastGenerated + TWO_WEEKS_MS;
        const daysRemaining = Math.ceil((nextAvailable - now) / (24 * 60 * 60 * 1000));
        console.log('[CHECK ELIGIBILITY] Returning canGenerate: false', { canGenerate: false, nextAvailable, lastGenerated, daysRemaining, mustUpdate });
        return {
          canGenerate: false,
          nextAvailable,
          lastGenerated,
          daysRemaining,
          mustUpdate,
        };
      }
    } catch (error) {
      console.error("Error checking persona generation eligibility:", error);
      // Default to allowing generation on error
      return {
        canGenerate: true,
        mustUpdate: false,
      };
    }
  },
});

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

// Mutation to create a new persona (with two-week cooldown enforcement)
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
    bypassCooldown: v.optional(v.boolean()), // Admin override
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      personaId: v.id("personas"),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
      nextAvailable: v.optional(v.number()),
      daysRemaining: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const { bypassCooldown, ...personaArgs } = args;
    const timestamp = Date.now();
    
    // Check cooldown unless bypassed (for admin operations)
    if (!bypassCooldown) {
      const mostRecentPersona = await ctx.db
        .query("personas")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .first();

      if (mostRecentPersona) {
        // Use _creationTime for cooldown logic
        const lastGenerated = mostRecentPersona._creationTime;
        const timeSinceLastGeneration = timestamp - lastGenerated;
        if (timeSinceLastGeneration < TWO_WEEKS_MS) {
          const nextAvailable = lastGenerated + TWO_WEEKS_MS;
          const daysRemaining = Math.ceil((nextAvailable - timestamp) / (24 * 60 * 60 * 1000));
          return {
            success: false as const,
            error: `Your persona is currently in its growth phase! We'll help you evolve it again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} to track your amazing progress.`,
            nextAvailable,
            daysRemaining,
          };
        }
      }
    }
    
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
    const personaId = await ctx.db.insert("personas", {
      ...personaArgs,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

         return {
       success: true as const,
       personaId,
     };
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