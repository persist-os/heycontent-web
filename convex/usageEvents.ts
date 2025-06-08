import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getPriceInfo } from "./priceConfig";

export const logUsageEvent = mutation({
  args: {
    userId: v.string(),
    timestamp: v.number(),
    model: v.string(),
    status: v.string(),
    qty: v.number(),
    // New fields for better tracking
    endpoint: v.optional(v.string()),
    method: v.optional(v.string()),
    path: v.optional(v.string()),
    statusCode: v.optional(v.number()),
    userAgent: v.optional(v.string()),
    ip: v.optional(v.string()),
    requestId: v.optional(v.string()),  // Add requestId to the schema
  },
  handler: async (ctx, args) => {
    // Prepare the event data with default values for optional fields
    const eventData = {
      ...args,
      endpoint: args.endpoint || 'unknown',
      method: args.method || 'unknown',
      path: args.path || 'unknown',
      statusCode: args.statusCode || 0,
      userAgent: args.userAgent || 'unknown',
      ip: args.ip || '0.0.0.0',
      // Keep the original timestamp or use current time if not provided
      timestamp: args.timestamp || Date.now(),
    };
    
    await ctx.db.insert("usageEvents", eventData);
    
    // Log the event for debugging
    console.log(`[UsageEvent] User ${args.userId} - ${args.model} - ${args.status} - ${args.qty} units`);
    if (args.endpoint) {
      console.log(`[UsageEvent] Endpoint: ${args.method} ${args.endpoint}${args.path} - ${args.statusCode}`);
    }
  },
});

export const listUsageEvents = query({
  args: { 
    userId: v.string(), 
    limit: v.optional(v.number()),
    // Optional filters
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.string()),
    endpoint: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("usageEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));
    
    // Apply filters if provided
    if (args.startDate) {
      query = query.filter(q => q.gte(q.field("timestamp"), args.startDate));
    }
    if (args.endDate) {
      query = query.filter(q => q.lte(q.field("timestamp"), args.endDate));
    }
    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }
    if (args.endpoint) {
      query = query.filter(q => q.eq(q.field("endpoint"), args.endpoint));
    }
    
    // Apply ordering and limit
    const events = await query
      .order("desc")
      .take(args.limit ?? 500);
    
    // Format the response with additional calculated fields
    return events.map(event => ({
      ...event,
      // Add a formatted date string for display
      formattedDate: new Date(event.timestamp).toLocaleString(),
      // Calculate the full endpoint URL if available
      fullEndpoint: event.endpoint && event.path ? 
        `${event.endpoint}${event.path}` : 
        'Unknown endpoint'
    }));
  },
});

// Aggregate usage for a user for the current period
export const getUsageSummary = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Find the user and their subscription info
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
      
      // Defensive: handle missing user or missing subscription gracefully
      if (!user) {
        console.error(`User not found: ${args.userId}`);
        return { total: 0, included: 0, overage: 0 };
      }
      
      if (!user.subscription) {
        console.error(`No subscription found for user: ${args.userId}`);
        return { total: 0, included: 0, overage: 0 };
      }
      
      const { currentPeriodStart, currentPeriodEnd, includedRequests } = user.subscription;
      
      // Log subscription data for debugging
      console.log('Subscription data:', {
        currentPeriodStart,
        currentPeriodEnd,
        includedRequests,
        hasSubscription: !!user.subscription
      });
      
      // Defensive: handle missing fields with better defaults
      const periodStart = typeof currentPeriodStart === "number" ? currentPeriodStart : 0;
      const periodEnd = typeof currentPeriodEnd === "number" ? currentPeriodEnd : Date.now();
      
      // Get included requests from subscription using price config
      let included: number;
      if (typeof includedRequests === "number") {
        included = includedRequests;
      } else if (user.subscription.plan) {
        try {
          // Extract plan and interval from the subscription
          const plan = user.subscription.plan.toLowerCase();
          const interval = user.subscription.interval?.toLowerCase() || 'monthly';
          
          // Get included requests from price config
          const priceInfo = getPriceInfo(plan, interval as 'monthly' | 'yearly');
          included = priceInfo.included_requests;
          
          console.log(`Using included requests: ${included} for plan: ${plan} (${interval})`);
        } catch (error) {
          console.error('Error getting price info:', error);
          throw new Error('Failed to determine included requests from plan');
        }
      } else {
        throw new Error('No includedRequests or valid plan found in subscription');
      }
      
      console.log(`Using included requests: ${included} for user: ${args.userId}`);
      
      // Get all usage events for the user
      const events = await ctx.db
        .query("usageEvents")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      
      console.log(`Found ${events.length} total events for user`);
      
      // Filter events to current billing period
      const filteredEvents = events.filter(
        (event) => event.timestamp >= periodStart && event.timestamp < periodEnd
      );
      
      console.log(`Found ${filteredEvents.length} events in current period`);
      
      // Calculate total usage
      const total = filteredEvents.reduce((sum, e) => sum + (e.qty || 0), 0);
      
      // Calculate overage (anything above included)
      const overage = Math.max(0, total - included);
      
      console.log(`Usage summary: total=${total}, included=${included}, overage=${overage}`);
      
      return { 
        total, 
        included, 
        overage 
      };
    } catch (error) {
      console.error('Error in getUsageSummary:', error);
      return { total: 0, included: 0, overage: 0 };
    }
  },
});

// Reset usage for a new period (optionally called by a cron or admin)
export const resetUsageForPeriod = mutation({
  args: { userId: v.string(), periodStart: v.number(), periodEnd: v.number(), includedRequests: v.number() },
  handler: async (ctx, args) => {
    // Optionally archive usageEvents or just update the user's usage field
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!user) return { success: false };
    await ctx.db.patch(
      user._id,
      {
        subscription: {
          ...user.subscription,
          currentPeriodStart: args.periodStart,
          currentPeriodEnd: args.periodEnd,
          includedRequests: args.includedRequests,
          usedRequests: 0,
          lastSyncedAt: Date.now(),
        },
      }
    );
    return { success: true };
  },
});

// Update user's usage field (after logging an event)
export const updateUserUsage = mutation({
  args: { 
    userId: v.string(), 
    qty: v.number(),
    // Optional fields for better tracking
    endpoint: v.optional(v.string()),
    method: v.optional(v.string()),
    path: v.optional(v.string()),
    statusCode: v.optional(v.number()),
    userAgent: v.optional(v.string()),
    ip: v.optional(v.string()),
    requestId: v.optional(v.string()),  // Add requestId to the schema
  },
  handler: async (ctx, args) => {
    // Get the user's current subscription
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user || !user.subscription) {
      throw new Error("User or subscription not found");
    }

    const sub = user.subscription;
    const used = sub.usedRequests || 0;
    const quota = sub.includedRequests || 0;

    // Calculate new used requests and overage
    const newUsed = used + args.qty;
    const overage = Math.max(0, newUsed - quota);

    // Update the user's subscription usage
    await ctx.db.patch(user._id, {
      subscription: {
        ...sub,
        usedRequests: newUsed, // Track total usage including overage
      },
    });

    // Log the update for debugging
    console.log(`[UpdateUserUsage] User ${args.userId} - Used: ${newUsed}/${quota} (Overage: ${overage})`);
    if (args.endpoint) {
      console.log(`[UpdateUserUsage] Endpoint: ${args.method} ${args.endpoint}${args.path || ''} - ${args.statusCode || 200}`);
    }

    return {
      success: true,
      used: newUsed,
      quota,
      overage,
    };
  },
}); 