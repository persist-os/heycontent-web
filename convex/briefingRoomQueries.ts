/**
 * Briefing Room - Convex Queries
 * 
 * Queries for retrieving briefing events, preferences, and clusters.
 * Follows privacy-first design with strict user isolation.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================================================
// Core Briefing Event Queries
// ============================================================================

/**
 * Get briefing events for a user with filtering and pagination
 * 
 * Supports filtering by:
 * - Category (crystal, widget, dream, etc.)
 * - Priority (critical, high, medium, low)
 * - State (waiting, presenting, acknowledged, etc.)
 * - Viewed status
 * - Date range
 */
export const getEvents = query({
  args: {
    userId: v.string(),
    category: v.optional(v.union(
      v.literal("crystal"),
      v.literal("widget"),
      v.literal("collaboration"),
      v.literal("dream"),
      v.literal("system")
    )),
    priority: v.optional(v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    )),
    state: v.optional(v.union(
      v.literal("forming"),
      v.literal("waiting"),
      v.literal("requesting"),
      v.literal("presenting"),
      v.literal("acknowledged"),
      v.literal("dormant"),
      v.literal("archived")
    )),
    viewedFilter: v.optional(v.union(
      v.literal("all"),
      v.literal("unread"),
      v.literal("read")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Start with user-scoped query
    let query = ctx.db
      .query("briefing_events")
      .withIndex("by_user_timestamp", (q) => 
        q.eq("userId", args.userId)
      )
      .order("desc"); // Most recent first
    
    // Collect results
    let events = await query.collect();
    
    // Filter by category
    if (args.category) {
      events = events.filter(e => e.category === args.category);
    }
    
    // Filter by priority
    if (args.priority) {
      events = events.filter(e => e.priority === args.priority);
    }
    
    // Filter by state
    if (args.state) {
      events = events.filter(e => e.state === args.state);
    }
    
    // Filter by viewed status
    if (args.viewedFilter === "unread") {
      events = events.filter(e => !e.viewed);
    } else if (args.viewedFilter === "read") {
      events = events.filter(e => e.viewed);
    }
    
    // Filter out archived (unless explicitly requested)
    if (args.state !== "archived") {
      events = events.filter(e => !e.archived);
    }
    
    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    events = events.slice(offset, offset + limit);
    
    return events;
  },
});

/**
 * Get a single briefing event by ID
 */
export const getEventById = query({
  args: {
    eventId: v.id("briefing_events"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    
    // Verify user owns this event
    if (!event || event.userId !== args.userId) {
      return null;
    }
    
    return event;
  },
});

/**
 * Get event counts and statistics
 * 
 * Returns aggregate counts for:
 * - Total events
 * - Unread events
 * - Events by priority
 * - Events by category
 * - Events by state
 */
export const getEventCounts = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("briefing_events")
      .withIndex("by_user_timestamp", (q) => 
        q.eq("userId", args.userId)
      )
      .filter((q) => q.eq(q.field("archived"), false))
      .collect();
    
    return {
      total: events.length,
      unread: events.filter(e => !e.viewed).length,
      byPriority: {
        critical: events.filter(e => e.priority === "critical").length,
        high: events.filter(e => e.priority === "high").length,
        medium: events.filter(e => e.priority === "medium").length,
        low: events.filter(e => e.priority === "low").length,
      },
      byCategory: {
        crystal: events.filter(e => e.category === "crystal").length,
        widget: events.filter(e => e.category === "widget").length,
        collaboration: events.filter(e => e.category === "collaboration").length,
        dream: events.filter(e => e.category === "dream").length,
        system: events.filter(e => e.category === "system").length,
      },
      byState: {
        forming: events.filter(e => e.state === "forming").length,
        waiting: events.filter(e => e.state === "waiting").length,
        requesting: events.filter(e => e.state === "requesting").length,
        presenting: events.filter(e => e.state === "presenting").length,
        acknowledged: events.filter(e => e.state === "acknowledged").length,
        dormant: events.filter(e => e.state === "dormant").length,
      },
    };
  },
});

/**
 * Get related briefing events
 * 
 * Finds events that are related to a given event through:
 * - Explicit relatedBriefings array
 * - Same clusterId
 * - Similar content (same category + recent)
 */
export const getRelatedEvents = query({
  args: {
    eventId: v.id("briefing_events"),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) {
      return [];
    }
    
    const relatedIds = new Set<string>();
    
    // Add explicitly related events
    if (event.relatedBriefings) {
      event.relatedBriefings.forEach(id => relatedIds.add(id));
    }
    
    // Add events in same cluster
    if (event.clusterId) {
      const clusterEvents = await ctx.db
        .query("briefing_events")
        .withIndex("by_cluster", (q) => q.eq("clusterId", event.clusterId))
        .filter((q) => 
          q.and(
            q.eq(q.field("userId"), args.userId),
            q.neq(q.field("_id"), args.eventId)
          )
        )
        .take(5);
      
      clusterEvents.forEach(e => relatedIds.add(e._id));
    }
    
    // Get the actual events
    const related = await Promise.all(
      Array.from(relatedIds).map(id => ctx.db.get(id as Id<"briefing_events">))
    );
    
    // Filter out nulls and apply limit
    const validRelated = related.filter(e => e !== null);
    const limit = args.limit || 10;
    
    return validRelated.slice(0, limit);
  },
});

// ============================================================================
// User Preferences Queries
// ============================================================================

/**
 * Get user's briefing room preferences
 * Creates default preferences if none exist
 */
export const getUserPreferences = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("briefing_preferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    // Return default preferences if none exist
    if (!prefs) {
      return {
        userId: args.userId,
        enabledCategories: {
          crystal: true,
          widget: true,
          collaboration: true,
          dream: true,
          system: true,
        },
        minimumPriority: "low" as const,
        maxBriefersVisible: 10,
        animationsEnabled: true,
        soundEnabled: false,
        notificationChannels: {
          inApp: true,
          email: false,
          push: false,
        },
        dailyDigest: false,
        digestTime: "08:00",
        weeklyReport: false,
        enableDreamReports: true,
        dreamReportFrequency: "nightly" as const,
        aiSummarization: true,
        summaryDepth: "standard" as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    
    return prefs;
  },
});

// ============================================================================
// Cluster Queries
// ============================================================================

/**
 * Get active clusters for a user
 */
export const getActiveClusters = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("briefing_clusters")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("active", true)
      )
      .collect();
  },
});

/**
 * Get cluster by ID
 */
export const getClusterById = query({
  args: {
    clusterId: v.id("briefing_clusters"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const cluster = await ctx.db.get(args.clusterId);
    
    // Verify user owns this cluster
    if (!cluster || cluster.userId !== args.userId) {
      return null;
    }
    
    return cluster;
  },
});

/**
 * Get events in a cluster
 */
export const getClusterEvents = query({
  args: {
    clusterId: v.id("briefing_clusters"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const cluster = await ctx.db.get(args.clusterId);
    if (!cluster || cluster.userId !== args.userId) {
      return [];
    }
    
    // Get all events in the cluster
    return await ctx.db
      .query("briefing_events")
      .withIndex("by_cluster", (q) => q.eq("clusterId", args.clusterId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

// ============================================================================
// Analytics & Insights Queries
// ============================================================================

/**
 * Get briefing room activity summary
 * 
 * Provides analytics on user's briefing room usage:
 * - Events received over time
 * - Engagement rates (viewed, acted upon, dismissed)
 * - Category distribution
 * - Average response time
 */
export const getActivitySummary = query({
  args: {
    userId: v.string(),
    days: v.optional(v.number()), // Number of days to analyze (default 7)
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const events = await ctx.db
      .query("briefing_events")
      .withIndex("by_user_timestamp", (q) => 
        q.eq("userId", args.userId)
      )
      .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
      .collect();
    
    const totalEvents = events.length;
    const viewedEvents = events.filter(e => e.viewed).length;
    const actedEvents = events.filter(e => e.actionsTaken.length > 0).length;
    const archivedEvents = events.filter(e => e.archived).length;
    
    return {
      period: {
        days,
        startDate: cutoffTime,
        endDate: Date.now(),
      },
      totals: {
        received: totalEvents,
        viewed: viewedEvents,
        actedUpon: actedEvents,
        dismissed: archivedEvents,
      },
      rates: {
        viewRate: totalEvents > 0 ? viewedEvents / totalEvents : 0,
        actionRate: totalEvents > 0 ? actedEvents / totalEvents : 0,
        dismissalRate: totalEvents > 0 ? archivedEvents / totalEvents : 0,
      },
      byCategory: {
        crystal: events.filter(e => e.category === "crystal").length,
        widget: events.filter(e => e.category === "widget").length,
        collaboration: events.filter(e => e.category === "collaboration").length,
        dream: events.filter(e => e.category === "dream").length,
        system: events.filter(e => e.category === "system").length,
      },
      averageResponseTime: (() => {
        const viewedWithTime = events.filter(e => e.viewed && e.viewedAt);
        if (viewedWithTime.length === 0) return 0;
        
        const totalResponseTime = viewedWithTime.reduce((sum, e) => {
          return sum + (e.viewedAt! - e.timestamp);
        }, 0);
        
        return totalResponseTime / viewedWithTime.length;
      })(),
    };
  },
});

/**
 * Get urgent/requesting attention events
 * 
 * Returns events that are actively requesting user attention,
 * ordered by urgency level (descending)
 */
export const getUrgentEvents = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("briefing_events")
      .withIndex("by_user_state", (q) => 
        q.eq("userId", args.userId).eq("state", "requesting")
      )
      .filter((q) => q.eq(q.field("archived"), false))
      .collect();
    
    // Sort by urgency level (descending)
    const sorted = events.sort((a, b) => b.urgencyLevel - a.urgencyLevel);
    
    // Apply limit
    const limit = args.limit || 10;
    return sorted.slice(0, limit);
  },
});

