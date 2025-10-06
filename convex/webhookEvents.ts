import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Log a webhook event to the database for tracking and debugging
 */
export const logWebhookEvent = mutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    eventData: v.any(),
    apiVersion: v.optional(v.string()),
    userId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    customerId: v.optional(v.string()),
    invoiceId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if event already exists (deduplication)
    const existingEvent = await ctx.db
      .query("webhook_events")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .first();

    if (existingEvent) {
      console.log(`Webhook event ${args.eventId} already exists, skipping`);
      return {
        success: true,
        eventId: existingEvent._id,
        duplicate: true,
      };
    }

    // Create new webhook event record
    const eventId = await ctx.db.insert("webhook_events", {
      eventId: args.eventId,
      eventType: args.eventType,
      eventData: args.eventData,
      apiVersion: args.apiVersion,
      status: "pending",
      attemptCount: 0,
      userId: args.userId,
      subscriptionId: args.subscriptionId,
      customerId: args.customerId,
      invoiceId: args.invoiceId,
      receivedAt: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    return {
      success: true,
      eventId: eventId,
      duplicate: false,
    };
  },
});

/**
 * Update webhook event processing status
 */
export const updateWebhookStatus = mutation({
  args: {
    eventId: v.string(), // Stripe event ID
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
    errorStack: v.optional(v.string()),
    processingDuration: v.optional(v.number()),
    userId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    customerId: v.optional(v.string()),
    invoiceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the webhook event by Stripe event ID
    const webhookEvent = await ctx.db
      .query("webhook_events")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!webhookEvent) {
      throw new Error(`Webhook event ${args.eventId} not found`);
    }

    // Update the webhook event
    await ctx.db.patch(webhookEvent._id, {
      status: args.status,
      processedAt: Date.now(),
      processingDuration: args.processingDuration,
      error: args.error,
      errorStack: args.errorStack,
      attemptCount: webhookEvent.attemptCount + 1,
      // Update related entities if provided
      userId: args.userId ?? webhookEvent.userId,
      subscriptionId: args.subscriptionId ?? webhookEvent.subscriptionId,
      customerId: args.customerId ?? webhookEvent.customerId,
      invoiceId: args.invoiceId ?? webhookEvent.invoiceId,
    });

    return {
      success: true,
      eventId: webhookEvent._id,
    };
  },
});

/**
 * Get webhook event history for a user
 */
export const getWebhookHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const baseQuery = ctx.db
      .query("webhook_events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    const allEvents = args.limit
      ? await baseQuery.take(args.limit)
      : await baseQuery.collect();

    // Filter by event type if provided
    if (args.eventType) {
      return allEvents.filter((e) => e.eventType === args.eventType);
    }

    return allEvents;
  },
});

/**
 * Get failed webhook events for monitoring
 */
export const getFailedWebhooks = query({
  args: {
    limit: v.optional(v.number()),
    since: v.optional(v.number()), // Timestamp
  },
  handler: async (ctx, args) => {
    const baseQuery = ctx.db
      .query("webhook_events")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .order("desc");

    const allEvents = args.limit
      ? await baseQuery.take(args.limit)
      : await baseQuery.collect();

    // Filter by timestamp if provided
    if (args.since) {
      return allEvents.filter((e) => e.receivedAt >= args.since);
    }

    return allEvents;
  },
});

/**
 * Get webhook events for a specific subscription
 */
export const getSubscriptionWebhooks = query({
  args: {
    subscriptionId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const baseQuery = ctx.db
      .query("webhook_events")
      .withIndex("by_subscription", (q) =>
        q.eq("subscriptionId", args.subscriptionId)
      )
      .order("desc");

    return args.limit
      ? await baseQuery.take(args.limit)
      : await baseQuery.collect();
  },
});

/**
 * Get webhook event statistics
 */
export const getWebhookStats = query({
  args: {
    since: v.optional(v.number()), // Timestamp
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const events = args.eventType
      ? await ctx.db
          .query("webhook_events")
          .withIndex("by_event_type_status", (q) =>
            q.eq("eventType", args.eventType)
          )
          .collect()
      : await ctx.db.query("webhook_events").collect();

    // Filter by timestamp if provided
    const filteredEvents = args.since
      ? events.filter((e) => e.receivedAt >= args.since)
      : events;

    // Calculate statistics
    const stats = {
      total: filteredEvents.length,
      completed: filteredEvents.filter((e) => e.status === "completed").length,
      failed: filteredEvents.filter((e) => e.status === "failed").length,
      pending: filteredEvents.filter((e) => e.status === "pending").length,
      processing: filteredEvents.filter((e) => e.status === "processing")
        .length,
      averageProcessingTime:
        filteredEvents
          .filter((e) => e.processingDuration)
          .reduce((sum, e) => sum + (e.processingDuration || 0), 0) /
          filteredEvents.filter((e) => e.processingDuration).length || 0,
      eventTypes: Array.from(
        new Set(filteredEvents.map((e) => e.eventType))
      ).map((type) => ({
        type,
        count: filteredEvents.filter((e) => e.eventType === type).length,
      })),
    };

    return stats;
  },
});

/**
 * Retry a failed webhook event
 */
export const retryFailedWebhook = mutation({
  args: {
    eventId: v.string(), // Stripe event ID
  },
  handler: async (ctx, args) => {
    const webhookEvent = await ctx.db
      .query("webhook_events")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!webhookEvent) {
      throw new Error(`Webhook event ${args.eventId} not found`);
    }

    if (webhookEvent.status !== "failed") {
      throw new Error(
        `Cannot retry webhook event ${args.eventId} - status is ${webhookEvent.status}`
      );
    }

    // Reset status to pending for retry
    await ctx.db.patch(webhookEvent._id, {
      status: "pending",
      error: undefined,
      errorStack: undefined,
    });

    return {
      success: true,
      eventId: webhookEvent._id,
      message: "Webhook event queued for retry",
    };
  },
});

