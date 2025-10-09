/**
 * Briefing Room - Convex Mutations
 * 
 * Mutations for creating, updating, and managing briefing events.
 * Maintains state machines, spatial positioning, and agent lifecycle.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================================================
// Event Publishing
// ============================================================================

/**
 * Publish a new briefing event
 * 
 * Creates a new briefing agent entity with full state machine initialization.
 * This is the primary entry point for creating briefings from backend systems.
 */
export const publishEvent = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    category: v.union(
      v.literal("crystal"),
      v.literal("widget"),
      v.literal("collaboration"),
      v.literal("dream"),
      v.literal("system")
    ),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    data: v.any(), // Event-specific data
    metadata: v.optional(v.object({
      source: v.string(),
      version: v.string(),
      processingTime: v.optional(v.number())
    })),
    relatedBriefings: v.optional(v.array(v.string())),
    aiContext: v.optional(v.object({
      relatedCrystals: v.array(v.string()),
      relatedProjects: v.array(v.string()),
      relatedWidgets: v.array(v.string()),
      generatedSuggestions: v.array(v.string())
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Calculate initial spatial position based on category
    const initialPosition = calculateInitialPosition(args.category, args.priority);
    
    // Create briefing event
    const eventId = await ctx.db.insert("briefing_events", {
      userId: args.userId,
      type: args.type,
      category: args.category,
      priority: args.priority,
      urgencyLevel: calculateInitialUrgency(args.priority),
      
      // Temporal
      timestamp: now,
      timeWaiting: 0,
      
      // Event data
      data: args.data,
      
      // State machine - starts in "waiting" state
      state: "waiting",
      stateHistory: [{
        from: "forming",
        to: "waiting",
        timestamp: now,
        trigger: "initial_creation"
      }],
      
      // Spatial
      position: initialPosition,
      spatialPriority: calculateSpatialPriority(args.priority),
      
      // Relationships
      relatedBriefings: args.relatedBriefings || [],
      
      // User interaction
      viewed: false,
      archived: false,
      starred: false,
      actionsTaken: [],
      
      // AI context
      aiContext: args.aiContext,
      
      // Metadata
      metadata: args.metadata || {
        source: "unknown",
        version: "1.0",
      },
      
      createdAt: now,
      updatedAt: now,
    });
    
    return eventId;
  },
});

/**
 * Batch publish multiple events
 * More efficient for creating multiple briefings at once
 */
export const batchPublishEvents = mutation({
  args: {
    events: v.array(v.object({
      userId: v.string(),
      type: v.string(),
      category: v.union(
        v.literal("crystal"),
        v.literal("widget"),
        v.literal("collaboration"),
        v.literal("dream"),
        v.literal("system")
      ),
      priority: v.union(
        v.literal("critical"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      ),
      data: v.any(),
    }))
  },
  handler: async (ctx, args) => {
    const ids: Id<"briefing_events">[] = [];
    const now = Date.now();
    
    for (const event of args.events) {
      const initialPosition = calculateInitialPosition(event.category, event.priority);
      
      const eventId = await ctx.db.insert("briefing_events", {
        ...event,
        urgencyLevel: calculateInitialUrgency(event.priority),
        timestamp: now,
        timeWaiting: 0,
        state: "waiting",
        stateHistory: [{
          from: "forming",
          to: "waiting",
          timestamp: now,
          trigger: "batch_creation"
        }],
        position: initialPosition,
        spatialPriority: calculateSpatialPriority(event.priority),
        relatedBriefings: [],
        viewed: false,
        archived: false,
        starred: false,
        actionsTaken: [],
        metadata: {
          source: "batch",
          version: "1.0",
        },
        createdAt: now,
        updatedAt: now,
      });
      
      ids.push(eventId);
    }
    
    return ids;
  },
});

// ============================================================================
// State Transitions
// ============================================================================

/**
 * Update briefer state
 * Handles state machine transitions with history tracking
 */
export const updateBrieferState = mutation({
  args: {
    eventId: v.id("briefing_events"),
    userId: v.string(),
    newState: v.union(
      v.literal("forming"),
      v.literal("waiting"),
      v.literal("requesting"),
      v.literal("presenting"),
      v.literal("acknowledged"),
      v.literal("dormant"),
      v.literal("archived")
    ),
    trigger: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) {
      throw new Error("Event not found or access denied");
    }
    
    const now = Date.now();
    
    // Add to state history
    const newHistory = [
      ...event.stateHistory,
      {
        from: event.state,
        to: args.newState,
        timestamp: now,
        trigger: args.trigger
      }
    ];
    
    // Update event
    await ctx.db.patch(args.eventId, {
      state: args.newState,
      stateHistory: newHistory,
      updatedAt: now,
    });
    
    return { success: true };
  },
});

/**
 * Mark event as viewed
 * Automatically transitions from "requesting" or "presenting" to "acknowledged"
 */
export const markEventViewed = mutation({
  args: {
    eventId: v.id("briefing_events"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) {
      throw new Error("Event not found or access denied");
    }
    
    const now = Date.now();
    const updates: any = {
      viewed: true,
      viewedAt: now,
      updatedAt: now,
    };
    
    // Auto-transition to acknowledged if presenting or requesting
    if (event.state === "presenting" || event.state === "requesting") {
      updates.state = "acknowledged";
      updates.stateHistory = [
        ...event.stateHistory,
        {
          from: event.state,
          to: "acknowledged",
          timestamp: now,
          trigger: "user_viewed"
        }
      ];
    }
    
    await ctx.db.patch(args.eventId, updates);
    return { success: true };
  },
});

/**
 * Archive/dismiss event
 * Moves briefer out of active circulation
 */
export const archiveEvent = mutation({
  args: {
    eventId: v.id("briefing_events"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) {
      throw new Error("Event not found or access denied");
    }
    
    const now = Date.now();
    
    await ctx.db.patch(args.eventId, {
      archived: true,
      state: "archived",
      stateHistory: [
        ...event.stateHistory,
        {
          from: event.state,
          to: "archived",
          timestamp: now,
          trigger: "user_archived"
        }
      ],
      updatedAt: now,
    });
    
    return { success: true };
  },
});

/**
 * Star/unstar event
 */
export const toggleEventStar = mutation({
  args: {
    eventId: v.id("briefing_events"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) {
      throw new Error("Event not found or access denied");
    }
    
    await ctx.db.patch(args.eventId, {
      starred: !event.starred,
      updatedAt: Date.now(),
    });
    
    return { starred: !event.starred };
  },
});

// ============================================================================
// User Actions & Feedback
// ============================================================================

/**
 * Record user action on a briefing
 */
export const recordAction = mutation({
  args: {
    eventId: v.id("briefing_events"),
    userId: v.string(),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) {
      throw new Error("Event not found or access denied");
    }
    
    await ctx.db.patch(args.eventId, {
      actionsTaken: [...event.actionsTaken, args.action],
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Rate a briefing event
 */
export const rateEvent = mutation({
  args: {
    eventId: v.id("briefing_events"),
    userId: v.string(),
    rating: v.union(
      v.literal("helpful"),
      v.literal("not_helpful"),
      v.literal("irrelevant")
    ),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) {
      throw new Error("Event not found or access denied");
    }
    
    await ctx.db.patch(args.eventId, {
      userRating: args.rating,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// ============================================================================
// Spatial Management
// ============================================================================

/**
 * Update briefer position
 */
export const updateBrieferPosition = mutation({
  args: {
    eventId: v.id("briefing_events"),
    userId: v.string(),
    position: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) {
      throw new Error("Event not found or access denied");
    }
    
    await ctx.db.patch(args.eventId, {
      position: args.position,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Update urgency level
 * Used by orchestration system to escalate urgency over time
 */
export const updateUrgencyLevel = mutation({
  args: {
    eventId: v.id("briefing_events"),
    userId: v.string(),
    urgencyLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) {
      throw new Error("Event not found or access denied");
    }
    
    await ctx.db.patch(args.eventId, {
      urgencyLevel: Math.max(0, Math.min(1, args.urgencyLevel)), // Clamp to [0, 1]
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// ============================================================================
// Clustering
// ============================================================================

/**
 * Create a cluster of related briefings
 */
export const createCluster = mutation({
  args: {
    userId: v.string(),
    brieferIds: v.array(v.string()),
    reason: v.string(),
    confidence: v.number(),
    centerPosition: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create cluster
    const clusterId = await ctx.db.insert("briefing_clusters", {
      userId: args.userId,
      brieferIds: args.brieferIds,
      centerPosition: args.centerPosition,
      reason: args.reason,
      confidence: args.confidence,
      formed: now,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    
    // Update each briefer with cluster ID
    for (const brieferId of args.brieferIds) {
      const eventId = brieferId as Id<"briefing_events">;
      const event = await ctx.db.get(eventId);
      if (event && event.userId === args.userId) {
        await ctx.db.patch(eventId, {
          clusterId: clusterId,
          updatedAt: now,
        });
      }
    }
    
    return { clusterId, success: true };
  },
});

/**
 * Dissolve a cluster
 */
export const dissolveCluster = mutation({
  args: {
    clusterId: v.id("briefing_clusters"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const cluster = await ctx.db.get(args.clusterId);
    if (!cluster || cluster.userId !== args.userId) {
      throw new Error("Cluster not found or access denied");
    }
    
    const now = Date.now();
    
    // Mark cluster as inactive
    await ctx.db.patch(args.clusterId, {
      active: false,
      dissolved: now,
      updatedAt: now,
    });
    
    // Remove cluster ID from briefers
    for (const brieferId of cluster.brieferIds) {
      const eventId = brieferId as Id<"briefing_events">;
      const event = await ctx.db.get(eventId);
      if (event && event.userId === args.userId && event.clusterId === args.clusterId) {
        await ctx.db.patch(eventId, {
          clusterId: undefined,
          updatedAt: now,
        });
      }
    }
    
    return { success: true };
  },
});

// ============================================================================
// User Preferences
// ============================================================================

/**
 * Update user preferences
 */
export const updatePreferences = mutation({
  args: {
    userId: v.string(),
    preferences: v.object({
      enabledCategories: v.optional(v.object({
        crystal: v.boolean(),
        widget: v.boolean(),
        collaboration: v.boolean(),
        dream: v.boolean(),
        system: v.boolean(),
      })),
      minimumPriority: v.optional(v.union(
        v.literal("critical"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )),
      maxBriefersVisible: v.optional(v.number()),
      animationsEnabled: v.optional(v.boolean()),
      soundEnabled: v.optional(v.boolean()),
      notificationChannels: v.optional(v.object({
        inApp: v.boolean(),
        email: v.boolean(),
        push: v.boolean(),
      })),
      dailyDigest: v.optional(v.boolean()),
      digestTime: v.optional(v.string()),
      weeklyReport: v.optional(v.boolean()),
      enableDreamReports: v.optional(v.boolean()),
      dreamReportFrequency: v.optional(v.union(
        v.literal("nightly"),
        v.literal("weekly"),
        v.literal("never")
      )),
      aiSummarization: v.optional(v.boolean()),
      summaryDepth: v.optional(v.union(
        v.literal("brief"),
        v.literal("standard"),
        v.literal("detailed")
      )),
    }),
  },
  handler: async (ctx, args) => {
    // Get existing preferences
    const existing = await ctx.db
      .query("briefing_preferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    const now = Date.now();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        ...args.preferences,
        updatedAt: now,
      });
      return { success: true, created: false };
    } else {
      // Create new with defaults
      await ctx.db.insert("briefing_preferences", {
        userId: args.userId,
        enabledCategories: args.preferences.enabledCategories || {
          crystal: true,
          widget: true,
          collaboration: true,
          dream: true,
          system: true,
        },
        minimumPriority: args.preferences.minimumPriority || "low",
        maxBriefersVisible: args.preferences.maxBriefersVisible || 10,
        animationsEnabled: args.preferences.animationsEnabled !== false,
        soundEnabled: args.preferences.soundEnabled || false,
        notificationChannels: args.preferences.notificationChannels || {
          inApp: true,
          email: false,
          push: false,
        },
        dailyDigest: args.preferences.dailyDigest || false,
        digestTime: args.preferences.digestTime || "08:00",
        weeklyReport: args.preferences.weeklyReport || false,
        enableDreamReports: args.preferences.enableDreamReports !== false,
        dreamReportFrequency: args.preferences.dreamReportFrequency || "nightly",
        aiSummarization: args.preferences.aiSummarization !== false,
        summaryDepth: args.preferences.summaryDepth || "standard",
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, created: true };
    }
  },
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate initial spatial position based on category
 */
function calculateInitialPosition(
  category: "crystal" | "widget" | "collaboration" | "dream" | "system",
  priority: "critical" | "high" | "medium" | "low"
): { x: number; y: number; z: number } {
  // Base positions by category (left to right across stage)
  const categoryX = {
    crystal: -400,
    widget: -200,
    dream: 0,
    collaboration: 200,
    system: 400,
  };
  
  // Z-depth by priority (closer = more urgent)
  const priorityZ = {
    critical: 100,
    high: 200,
    medium: 300,
    low: 400,
  };
  
  // Random Y offset for natural variation
  const yOffset = Math.random() * 200 - 100;
  
  return {
    x: categoryX[category],
    y: yOffset,
    z: priorityZ[priority],
  };
}

/**
 * Calculate initial urgency level from priority
 */
function calculateInitialUrgency(
  priority: "critical" | "high" | "medium" | "low"
): number {
  const urgencyMap = {
    critical: 0.9,
    high: 0.7,
    medium: 0.4,
    low: 0.2,
  };
  return urgencyMap[priority];
}

/**
 * Calculate spatial priority (influences positioning in crowded room)
 */
function calculateSpatialPriority(
  priority: "critical" | "high" | "medium" | "low"
): number {
  const priorityMap = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return priorityMap[priority];
}

