import { v } from "convex/values";

export const webhookEventStatusValidator = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed")
);

export const webhookEventSchemaFields = {
  // Event Identification
  eventId: v.string(),              // Stripe event ID (e.g., evt_xxx)
  eventType: v.string(),            // Event type (e.g., customer.subscription.created)
  apiVersion: v.optional(v.string()), // Stripe API version
  
  // Event Data
  eventData: v.any(),               // Full event data from Stripe
  
  // Processing Status
  status: webhookEventStatusValidator,
  processedAt: v.optional(v.number()), // Timestamp when processed
  processingDuration: v.optional(v.number()), // Processing time in ms
  
  // Error Tracking
  error: v.optional(v.string()),       // Error message if failed
  errorStack: v.optional(v.string()),  // Full error stack trace
  attemptCount: v.number(),            // Number of processing attempts
  
  // Related Entities
  userId: v.optional(v.string()),        // User ID if resolved
  subscriptionId: v.optional(v.string()), // Stripe subscription ID if applicable
  customerId: v.optional(v.string()),    // Stripe customer ID if applicable
  invoiceId: v.optional(v.string()),     // Stripe invoice ID if applicable
  
  // Metadata
  receivedAt: v.number(),           // When webhook was received
  ipAddress: v.optional(v.string()), // Source IP for security
  userAgent: v.optional(v.string()), // Stripe's user agent
};

export const webhookEventValidator = v.object(webhookEventSchemaFields);

