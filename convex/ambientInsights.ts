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
 */
export const getUserDataBundle = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId;
    // Fetch last 3 conversations
    let conversations: any[] = [];
    try {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user", q => q.eq("userId", userId))
        .order("desc")
        .take(3);
    } catch (e) {
      conversations = [];
    }

    // Fetch last 3 notes
    let notes: any[] = [];
    try {
      notes = await ctx.db
        .query("notes")
        .withIndex("by_user", q => q.eq("userId", userId))
        .order("desc")
        .take(3);
    } catch (e) {
      notes = [];
    }

    // Fetch last 3 YouTube video analyses
    let youtubeAnalyses: any[] = [];
    try {
      youtubeAnalyses = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.neq(q.field("analysis"), null))
        .order("desc")
        .take(3);
    } catch (e) {
      youtubeAnalyses = [];
    }

    // Fetch current persona
    let persona = null;
    try {
      persona = await ctx.db
        .query("personas")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("isActive"), true))
        .first();
    } catch (e) {
      persona = null;
    }

    // Fetch most recent ambient insights
    let ambientInsights = null;
    try {
      const insights = await ctx.db
        .query("ambientInsights")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .order("desc")
        .take(1);
      ambientInsights = insights.length > 0 ? insights[0] : null;
    } catch (e) {
      ambientInsights = null;
    }

    return {
      conversations,
      notes,
      youtubeAnalyses,
      persona,
      ambientInsights,
    };
  },
});