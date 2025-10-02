import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';

// Type for an individual insight
export interface Insight {
  title: string;
  content: string;
  category: string;
  recommendation: string;
}

// Type for the stored document
export interface AmbientInsightsDocument extends Doc<'ambientInsights'> {
  userId: string;
  data: Insight[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Get all insights for a user, ordered by most recent first
 */
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<AmbientInsightsDocument[]> => {
    const insights = await ctx.db
      .query('ambientInsights')
      .withIndex('by_userId', q => q.eq('userId', args.userId))
      .order('desc')
      .collect();
    return insights;
  },
});

/**
 * Get the most recent ambient insights document for a user
 */
export const getMostRecentByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<AmbientInsightsDocument | null> => {
    const insights = await ctx.db
      .query('ambientInsights')
      .withIndex('by_userId', q => q.eq('userId', args.userId))
      .order('desc')
      .collect();
    if (insights.length > 0) {
      return insights[0];
    }
    return null;
  },
});

/**
 * Create a new insights document for a user
 */
export const createInsights = mutation({
  args: {
    userId: v.string(),
    insights: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
        category: v.string(),
        recommendation: v.string(),
      })
    ),
  },
  handler: async (ctx, args): Promise<Id<'ambientInsights'>> => {
    const now = Date.now();
    const insightsId = await ctx.db.insert('ambientInsights', {
      userId: args.userId,
      data: args.insights,
      createdAt: now,
      updatedAt: now,
    });
    return insightsId;
  },
});

/**
 * Delete all insights for a user
 */
export const removeInsights = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const allInsights = await ctx.db
      .query('ambientInsights')
      .withIndex('by_userId', q => q.eq('userId', args.userId))
      .collect();
    
    await Promise.all(allInsights.map(insight => ctx.db.delete(insight._id)));
  },
});

/**
 * Internal mutation to create a new insights document
 */
export const createNewInsightsDocument = internalMutation({
  args: { 
    userId: v.string(),
    insights: v.optional(v.array(
      v.object({
        title: v.string(),
        content: v.string(),
        category: v.string(),
        recommendation: v.string(),
      })
    )) 
  },
  handler: async (ctx, args): Promise<Id<'ambientInsights'>> => {
    const now = Date.now();
    return await ctx.db.insert('ambientInsights', {
      userId: args.userId,
      data: args.insights || [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Aggregate user data for Ambient Insights agent (single call)
 * Robust error handling ensures system never fails due to data fetch issues
 */
export const getUserDataBundle = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId;
    
    // Initialize all data arrays to ensure they always exist
    let conversations: any[] = [];
    let notes: any[] = [];
    let crystals: any[] = [];
    let crystalShards: any[] = [];
    let projects: any[] = [];
    
    // Fetch last 3 conversations with robust error handling
    try {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user", q => q.eq("userId", userId))
        .order("desc")
        .take(3);
    } catch (error) {
      console.warn(`Failed to fetch conversations for user ${userId}:`, error);
      conversations = [];
    }

    // Fetch last 3 notes with robust error handling
    try {
      notes = await ctx.db
        .query("notes")
        .withIndex("by_user", q => q.eq("userId", userId))
        .order("desc")
        .take(3);
    } catch (error) {
      console.warn(`Failed to fetch notes for user ${userId}:`, error);
      notes = [];
    }

    // Fetch all crystals for the user with robust error handling
    try {
      crystals = await ctx.db
        .query("crystals")
        .withIndex("by_user", q => q.eq("userId", userId))
        .collect();
    } catch (error) {
      console.warn(`Failed to fetch crystals for user ${userId}:`, error);
      crystals = [];
    }

    // Fetch 10 most recent crystal shards with robust error handling
    try {
      crystalShards = await ctx.db
        .query("crystal_shards")
        .withIndex("by_user", q => q.eq("userId", userId))
        .order("desc")
        .take(10);
    } catch (error) {
      console.warn(`Failed to fetch crystal shards for user ${userId}:`, error);
      crystalShards = [];
    }

    // Fetch projects with structured summary and robust error handling
    try {
      const allProjects = await ctx.db
        .query("projects")
        .withIndex("by_user", q => q.eq("userId", userId))
        .order("desc")
        .collect();
      
      // Create structured summaries for each project (removed YouTube, Instagram, Gmail)
      projects = allProjects.map(project => ({
        _id: project._id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        summary: {
          totalItems: (project.noteIds?.length || 0) + 
                     (project.conversationIds?.length || 0),
          itemTypes: {
            notes: project.noteIds?.length || 0,
            conversations: project.conversationIds?.length || 0,
          },
          hasFingerprint: !!project.fingerprintId,
          lastActivity: project.updatedAt,
        }
      }));
    } catch (error) {
      console.warn(`Failed to fetch projects for user ${userId}:`, error);
      projects = [];
    }

    // Always return a valid data structure, even if all fetches fail
    return {
      conversations,
      notes,
      crystals,
      crystalShards,
      projects,
    };
  },
});