import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getPriceInfo } from "./priceConfig";

/**
 * Usage Tracking and Analytics System
 * 
 * This module handles tracking of API usage, request logging, and usage analytics
 * for subscription management and billing purposes.
 * 
 * Key Features:
 * - Log individual API requests and usage events
 * - Track usage against subscription limits
 * - Provide usage analytics and reporting
 * - Support subscription enforcement and overage tracking
 */

/**
 * Log a usage event for API request tracking
 * 
 * Records detailed information about each API request including endpoint,
 * method, status, and user context for analytics and billing purposes.
 */
export const logUsageEvent = mutation({
  args: {
    userId: v.string(),           // User making the request
    timestamp: v.number(),        // When the request occurred
    model: v.string(),            // AI model or service used
    status: v.string(),           // Request status (success, error, etc.)
    qty: v.number(),              // Quantity of units consumed
    endpoint: v.optional(v.string()), // API endpoint base URL
    method: v.optional(v.string()),   // HTTP method (GET, POST, etc.)
    path: v.optional(v.string()),     // API path/route
    statusCode: v.optional(v.number()), // HTTP status code
    userAgent: v.optional(v.string()),  // User agent string
    ip: v.optional(v.string()),        // Client IP address
    requestId: v.optional(v.string()),  // Unique request identifier
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

/**
 * Check if a usage event with the given requestId already exists (idempotency check).
 * Returns true if exists, false otherwise.
 * 
 * BRUTAL IDEMPOTENCY: Prevents duplicate usage logs from retries or recursive calls.
 */
export const checkUsageEventExists = query({
  args: {
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    // Use filter query (no index needed for idempotency check)
    const existing = await ctx.db
      .query("usageEvents")
      .filter((q) => q.eq(q.field("requestId"), args.requestId))
      .first();
    
    return existing !== null;
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

/**
 * Get usage summary for a user including current period usage and limits
 * 
 * This function calculates the user's API usage for the current billing period
 * and compares it against their subscription limits. It integrates with the
 * pricing configuration to determine included requests and overage calculations.
 * 
 * @param userId - The user ID to get usage summary for
 * @returns Object containing total usage, included requests, and overage amount
 */
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
        return { total: 0, included: 50, overage: 0 };  // Default to free tier
      }
      
      if (!user.subscription) {
        console.error(`No subscription found for user: ${args.userId}`);
        return { total: 0, included: 50, overage: 0 };  // Default to free tier
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
      if (typeof includedRequests === "number" && includedRequests > 0) {
        included = includedRequests;
      } else if (user.subscription.plan) {
        try {
          // Extract plan and interval from the subscription
          const plan = user.subscription.plan.toLowerCase();
          const interval = user.subscription.interval?.toLowerCase() || 'monthly';
          
          // Get included requests from price config
          // This integrates with the pricing system to determine user limits
          const priceInfo = getPriceInfo(plan, interval as 'monthly' | 'yearly');
          included = priceInfo.includedRequests;
          
          console.log(`Using included requests: ${included} for plan: ${plan} (${interval})`);
        } catch (error) {
          console.error('Error getting price info:', error);
          // Default to free tier instead of throwing
          included = 50;
          console.log('Falling back to free tier: 50 requests');
        }
      } else {
        // Default to free tier instead of throwing
        console.log('No includedRequests or valid plan, defaulting to free tier: 50 requests');
        included = 50;
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

// Read overage settings (minimal surface change)
export const getOverageSettings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!user || !user.subscription) {
      // Only return defaults if user or subscription doesn't exist at all
      return { ubpEnabled: true, monthlyLimit: 25 };
    }
    const sub = user.subscription as any;
    // Only use defaults if the specific fields have never been set (are undefined)
    // If they were explicitly set to false/0, respect those values
    const ubpEnabled = sub.ubpEnabled !== undefined ? sub.ubpEnabled : true;
    const monthlyLimit = sub.monthlyLimit !== undefined ? sub.monthlyLimit : 25;
    return { ubpEnabled, monthlyLimit };
  }
});

// Update overage settings (toggle + cap) in users.subscription
export const updateOverageSettings = mutation({
  args: { userId: v.string(), ubpEnabled: v.boolean(), monthlyLimit: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!user) {
      throw new Error(`User not found: ${args.userId}`);
    }
    const cappedLimit = Math.max(0, Math.floor(args.monthlyLimit));
    const currentSub = (user as any).subscription || {};
    await ctx.db.patch(user._id, {
      subscription: {
        ...currentSub,
        ubpEnabled: args.ubpEnabled,
        monthlyLimit: cappedLimit,
      },
    });
    return { success: true, ubpEnabled: args.ubpEnabled, monthlyLimit: cappedLimit };
  }
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

    // Graceful handling: Skip subscription update if user doesn't exist or lacks subscription
    if (!user || !user.subscription) {
      console.warn(`[UpdateUserUsage] User ${args.userId} not found or no subscription - skipping update`);
      return { success: true, skipped: true, reason: "user_not_found" };
    }

    const sub = user.subscription as any;
    const used = sub.usedRequests || 0;
    const quota = sub.includedRequests || 0;
    const ubpEnabled = typeof sub.ubpEnabled === 'boolean' ? sub.ubpEnabled : true;

    let newUsed = used + args.qty;
    let blocked = false;

    // Enforce: if overage (extra requests) is disabled, cap at included quota
    if (!ubpEnabled) {
      newUsed = Math.min(quota, newUsed);
      // Block only if this request would push usage over the quota
      blocked = (used + args.qty) > quota;
    }

    const overage = Math.max(0, newUsed - quota);

    // Update the user's subscription usage
    await ctx.db.patch(user._id, {
      subscription: {
        ...sub,
        usedRequests: newUsed, // Track total usage including overage (or capped)
      },
    });

    // Log the update for debugging
    console.log(`[UpdateUserUsage] User ${args.userId} - Used: ${newUsed}/${quota} (Overage: ${overage}) ubpEnabled=${ubpEnabled} blocked=${blocked}`);
    if (args.endpoint) {
      console.log(`[UpdateUserUsage] Endpoint: ${args.method} ${args.endpoint}${args.path || ''} - ${args.statusCode || 200}`);
    }

    return {
      success: true,
      used: newUsed,
      quota,
      overage,
      blocked,
    };
  }
});

