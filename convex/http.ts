import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { cors } from "hono/cors";
import { Id } from "./_generated/dataModel";
import * as usageEventsApi from "./usageEvents";
// Removed unused imports for httpRouter and httpAction

const app: HonoWithConvex<ActionCtx> = new Hono();

// Add global logging middleware
app.use('*', async (c, next) => {
  console.log(`HTTP_TS_DEBUG: Request received: Method=${c.req.method}, Path=${c.req.path}`);
  await next();
  console.log(`HTTP_TS_DEBUG: Response sent for: Method=${c.req.method}, Path=${c.req.path}, Status=${c.res.status}`);
});

// Add CORS middleware
app.use("*", cors());

// USER ROUTES

// List all users
app.get("/api/users", async (c) => {
  const ctx = c.env;
  const users = await ctx.runQuery(api.userQueries.list, {});
  return c.json(users);
});

// Get user by ID
app.get("/api/users/:id", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const user = await ctx.runQuery(api.userQueries.getUser, { userId });
  return c.json(user);
});

// Get user by email
app.get("/api/users/email/:email", async (c) => {
  const ctx = c.env;
  const email = c.req.param("email");
  const user = await ctx.runQuery(api.userQueries.getUserByEmail, { email });
  return c.json(user);
});

// NEW LOOKUP ROUTES
app.get("/api/users/lookup/customer/:customerId", async (c) => {
  const ctx = c.env;
  const customerId = c.req.param("customerId");
  const user = await ctx.runQuery(api.userQueries.getUserByStripeCustomerId, { stripeCustomerId: customerId });
  if (user && user.userId) {
    return c.json({ userId: user.userId.toString() });
  }
  return c.json({ userId: null, message: "User not found or userId field missing for the given Stripe Customer ID" }, 404); 
});

app.get("/api/users/lookup/subscription/:subscriptionId", async (c) => {
  const ctx = c.env;
  const subscriptionId = c.req.param("subscriptionId");
  const subscription = await ctx.runQuery(api.userQueries.getUserByStripeSubscriptionId, { stripeSubscriptionId: subscriptionId });
  if (subscription && subscription.userId) {
    return c.json({ userId: subscription.userId.toString() });
  }
  return c.json({ userId: null, message: "User not found for the given Stripe Subscription ID" }, 404); 
});

// Persona system has been deprecated and removed

// Conversations
app.post("/api/users/:id/create_conversation", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { title, messages } = await c.req.json();
  
  // Add timestamps to messages if they don't have them
  const messagesWithTimestamps = messages.map((message: any) => ({
    ...message,
    timestamp: message.timestamp || Date.now(),
  }));
  
  const result = await ctx.runMutation(api.chatMutations.createConversation, {
    userId,
    title,
    messages: messagesWithTimestamps,
  });
  return c.json(result);
});

// Add message to conversation
app.post("/api/users/:id/add_message_to_conversation", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { conversationId, message } = await c.req.json();
  
  // Add timestamp to message if it doesn't have one
  const messageWithTimestamp = {
    ...message,
    timestamp: message.timestamp || Date.now(),
  };
  
  const result = await ctx.runMutation(api.chatMutations.addMessageToConversation, {
    userId,
    conversationId,
    message: messageWithTimestamp,
  });
  return c.json(result);
});

// Get conversations for a user
app.get("/api/users/:id/conversations", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit') as string) : undefined;
  const result = await ctx.runQuery(api.chatQueries.getHistory, { 
    userId,
    limit
  });
  return c.json(result);
});

// ⚠️ DEPRECATED: Gmail integration endpoints removed - use crystal system for email insights

// Save insights for a user
app.post("/api/users/:id/save_insights", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { insights } = await c.req.json();
  const result = await ctx.runMutation(api.ambientInsights.createInsights, {
    userId,
    insights,
  });
  return c.json(result);
});

// API KEY ROUTES

// Insert API key
app.post("/api/api-keys", async (c) => {
  const ctx = c.env;
  const { user_id, key_hash, scopes, rate_tier, clientType } = await c.req.json();
  if (!user_id || !key_hash) {
    return c.json({ error: "Missing user_id or key_hash" }, 400);
  }
  try {
    await ctx.runMutation(api.apiKeysMutations.insert_api_key, {
      user_id,
      key_hash,
      scopes,
      rate_tier,
      clientType: clientType || "web", // Default to "web" if not specified
    });
    return c.json({ success: true }, 201); // 201 Created status
  } catch (error) {
    console.error("Failed to create API key:", error);
    return c.json({ success: false, error: "Failed to create API key" }, 500);
  }
});

// Validate API key
app.post("/api/api-keys/validate", async (c) => {
  const ctx = c.env;
  const { key_hash } = await c.req.json();

  if (!key_hash) {
    return c.json({ error: "Missing key_hash" }, 400);
  }

  try {
    // Use the validate_api_key query
    const userId = await ctx.runQuery(api.apiKeysQueries.validate_api_key, {
      key_hash: key_hash, 
    });

    if (userId) {
      // Key is valid, return success and potentially the user ID
      return c.json({ success: true, userId });
    } else {
      // Key is invalid
      return c.json({ success: false, error: "Invalid API key" }, 401); // 401 Unauthorized
    }
  } catch (error) {
    console.error("Failed to validate API key:", error);
    return c.json({ success: false, error: "Failed to validate API key" }, 500);
  }
});

// Get user API keys
app.get("/api/api-keys/user/:userId", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("userId");
  
  try {
    const keys = await ctx.runQuery(api.apiKeysQueries.getUserKeys, { userId });
    return c.json({ success: true, keys });
  } catch (error) {
    console.error("Failed to get user API keys:", error);
    return c.json({ success: false, error: "Failed to retrieve API keys" }, 500);
  }
});

// Delete API key endpoint (with request body)
app.delete("/api/api-keys/delete", async (c) => {
  const ctx = c.env;
  const { key_id, user_id } = await c.req.json();
  
  if (!key_id) {
    return c.json({ success: false, error: "Missing key_id" }, 400);
  }
  try {
    await ctx.runAction(api.apiKeys.deleteByStringId, { keyIdStr: key_id });
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return c.json({ success: false, error: "Failed to delete API key" }, 500);
  }
});

// NOTES ROUTES

app.get("/api/notes/:noteId", async (c) => {
  const ctx = c.env;
  const noteId = c.req.param("noteId");
  const userId = c.req.query("userId"); // Get userId from query parameter

  if (!userId) {
    return c.json({ error: "Missing required query parameter: userId" }, 400);
  }
  if (!noteId) {
    return c.json({ error: "Missing noteId in path" }, 400);
  }

  try {
    const note = await ctx.runQuery(api.noteQueries.getNote, { noteId, userId });
    if (note) {
      return c.json({ success: true, note });
    } else {
      return c.json({ success: false, error: "Note not found or unauthorized" }, 404);
    }
  } catch (error: any) {
    console.error("Failed to get note:", error);
    if (error.data) {
        return c.json({ success: false, error: "Failed to get note", details: error.data }, 500);
    }
    return c.json({ success: false, error: "Failed to get note", message: error.message || "Internal Server Error" }, 500);
  }
});

app.get("/api/users/:userId/notes", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("userId");

  if (!userId) {
    return c.json({ error: "Missing userId in path" }, 400);
  }

  // Get query parameters for pagination and filtering
  const cursor = c.req.query("cursor");
  const numItems = c.req.query("numItems");
  const sortField = c.req.query("sortField");
  const sortOrder = c.req.query("sortOrder");
  const type = c.req.query("type");
  const important = c.req.query("important");
  const tags = c.req.query("tags");

  // Build filters object
  const filters: any = {};
  if (type) filters.type = type;
  if (important !== undefined) filters.important = important === 'true';
  if (tags) filters.tags = tags.split(',');

  try {
    const result = await ctx.runQuery(api.noteQueries.getUserNotes, { 
      userId,
      ...(cursor && { cursor }),
      ...(numItems && { numItems: parseInt(numItems) }),
      ...(sortField && { sortField }),
      ...(sortOrder && { sortOrder: sortOrder as 'asc' | 'desc' }),
      ...(Object.keys(filters).length > 0 && { filters }),
    });
    
    return c.json({ 
      success: true, 
      notes: result.page,
      pagination: {
        nextCursor: result.nextCursor,
        isDone: result.isDone,
        hasMore: !result.isDone
      }
    }); 
  } catch (error: any) {
    console.error("Failed to get notes by user:", error);
    if (error.data) {
        return c.json({ success: false, error: "Failed to get notes by user", details: error.data }, 500);
    }
    return c.json({ success: false, error: "Failed to get notes by user", message: error.message || "Internal Server Error" }, 500);
  }
});

app.patch("/api/notes/:noteId", async (c) => {
  const ctx = c.env;
  const noteId = c.req.param("noteId"); // noteId from path
  
  try {
    const { userId, updates } = await c.req.json(); // userId and updates from body

    if (!userId) {
      return c.json({ error: "Missing required field in body: userId" }, 400);
    }
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return c.json({ error: "Missing or empty 'updates' object in request body" }, 400);
    }

    const updatedNote = await ctx.runMutation(api.noteMutations.updateNote, {
      noteId: noteId as Id<"notes">, // Cast string from path to Id<"notes">
      userId,
      updates,
    });
    
    return c.json({ success: true, note: updatedNote });

  } catch (error: any) {
    console.error("Failed to update note:", error);
    if (error.message) {
        if (error.message.includes("Note not found")) {
            return c.json({ success: false, error: "Note not found" }, 404);
        }
        if (error.message.includes("Unauthorized")) {
            return c.json({ success: false, error: "Unauthorized to update this note" }, 403);
        }
    }
    if (error.data) { 
        return c.json({ success: false, error: "Failed to update note", details: error.data }, 500);
    }
    return c.json({ success: false, error: "Failed to update note", message: error.message || "Internal Server Error" }, 500);
  }
});

app.delete("/api/notes/:noteId", async (c) => {
  const ctx = c.env;
  const noteIdStr = c.req.param("noteId");
  
  try {
    const { userId } = await c.req.json(); 

    if (!userId) {
      return c.json({ error: "Missing required field in body: userId" }, 400);
    }

    // Run the delete mutation (api.noteMutations.deleteNote now expects noteId as v.id("notes"))
    // Convex handles string to Id conversion, but we cast for TypeScript type safety.
    const deleteResult = await ctx.runMutation(api.noteMutations.deleteNote, {
      noteId: noteIdStr as Id<"notes">,
      userId,
    });
    
    if (!deleteResult || !deleteResult.success) {
      return c.json({ success: false, error: "Mutation reported failure to delete note" }, 500);
    }

    // Verification Step: Attempt to fetch the note to confirm deletion
    // (api.noteQueries.getNote expects noteId as string)
    const stillExists = await ctx.runQuery(api.noteQueries.getNote, { 
      noteId: noteIdStr, 
      userId // Pass userId, as getNote might require it for auth, though for a deleted note it should be null regardless
    });

    if (stillExists) {
      console.error(`CRITICAL_VERIFICATION_FAILURE: Note ${noteIdStr} still found after supposed deletion.`);
      return c.json({ success: false, error: "Note still found after deletion attempt, verification failed" }, 500);
    }

    // If we reach here, delete was successful and verification passed
    return c.json({ success: true, message: "Note deleted successfully and verified" });

  } catch (error: any) {
    console.error("Failed to delete note or verify deletion:", error);
    // Check if the error is from the initial delete attempt (e.g., note didn't exist)
    if (error.message && error.message.includes("Note not found or unauthorized")) {
        return c.json({ success: false, error: "Note not found or unauthorized to delete" }, 404);
    }
    // Generic error handling
    if (error.data) {
        return c.json({ success: false, error: "Failed to delete note", details: error.data }, 500);
    }
    return c.json({ success: false, error: "Failed to delete note", message: error.message || "Internal Server Error" }, 500);
  }
});

app.post("/api/notes", async (c) => {
  const ctx = c.env;
  const { userId, ...noteData } = await c.req.json();
  if (!userId) {
    return c.json({ error: "Missing userId" }, 400);
  }
  try {
    const newNote = await ctx.runMutation(api.noteMutations.createNote, {
      userId,
      title: noteData.title,
      content: noteData.content,
      type: noteData.type,
      tags: noteData.tags,
      platform: noteData.platform,
    });
    return c.json({ success: true, note: newNote });
  } catch (error: any) {
    console.error("Failed to create note:", error);
    return c.json({ 
      success: false, 
      error: "Failed to create note",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// SUBSCRIPTION ENDPOINTS

// Get user's subscription
app.get("/api/users/:id/stripe/subscription", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  
  try {
    const subscription = await ctx.runQuery(api.subscriptionQueries.getUserSubscription, { userId });
    return c.json(subscription);
  } catch (error) {
    console.error("Failed to get subscription:", error);
    return c.json({ success: false, error: "Failed to retrieve subscription" }, 500);
  }
});

// Save customer
app.post("/api/users/:id/stripe/customer", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { stripeCustomerId } = await c.req.json();
  
  if (!stripeCustomerId) {
    return c.json({ success: false, error: "Missing Stripe customer ID" }, 400);
  }
  
  try {
    // Check if any user already has this Stripe customer ID
    const existingUser = await ctx.runQuery(api.userQueries.getUserByStripeCustomerId, {
      stripeCustomerId
    });
    
    // If a user with this Stripe customer ID exists and it's not the current user
    if (existingUser && existingUser.userId !== userId) {
      return c.json({
        success: false,
        error: "This Stripe customer ID is already associated with another user"
      }, 409); // 409 Conflict status code
    }
    
    // Update user with Stripe customer ID
    await ctx.runMutation(api.userMutations.updateUserStripeData, {
      userId,
      updates: { stripeCustomerId }
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to save customer:", error);
    return c.json({ success: false, error: "Failed to save customer" }, 500);
  }
});

// Get customer
app.get("/api/users/:id/stripe/customer", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");

  try {
    const user = await ctx.runQuery(api.userQueries.getUser, { userId });
    console.log("Fetched user for customer lookup:", user);
    if (!user) {
      return c.json({ success: false, error: "User not found" }, 404);
    }
    if (!user.stripeCustomerId) {
      return c.json({ stripeCustomerId: null });
    }
    return c.json({ stripeCustomerId: user.stripeCustomerId });
  } catch (error) {
    console.error("Failed to get customer:", error);
    return c.json({ success: false, error: "Failed to retrieve customer" }, 500);
  }
});

// Update Stripe customer details (email, name, default_payment_method, etc)
app.post("/api/users/:id/stripe/customer/update", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const updates = await c.req.json();

  if (!userId) {
    return c.json({ success: false, error: "Missing user ID" }, 400);
  }
  if (!updates || typeof updates !== "object") {
    return c.json({ success: false, error: "Missing or invalid update data" }, 400);
  }

  try {
    await ctx.runMutation(api.userMutations.updateUserStripeData, {
      userId,
      updates
    });
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to update Stripe customer:", error);
    return c.json({ success: false, error: "Failed to update Stripe customer" }, 500);
  }
});

// Save subscription
app.post("/api/users/:id/stripe/subscription", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { 
    plan, 
    priceId,
    status, 
    includedRequests,
    stripeSubscriptionId, 
    stripeCustomerId,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    canceledAt
  } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.subscriptionQueries.saveSubscription, {
      userId,
      plan,
      priceId,
      status,
      includedRequests,
      stripeSubscriptionId,
      stripeCustomerId,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      canceledAt
    });
    
    return c.json({ success: true, subscriptionId: result });
  } catch (error) {
    console.error("Failed to save subscription:", error);
    return c.json({ success: false, error: "Failed to save subscription" }, 500);
  }
});

// Update subscription
app.patch("/api/stripe/subscriptions/:id", async (c) => {
  const ctx = c.env;
  const stripeSubscriptionId = c.req.param("id");
  const requestBody = await c.req.json();
  
  try {
    // Extract the 'data' field from the request body to avoid double-wrapping
    // The backend sends: {"data": {includedRequests: 100, ...}}
    // We need to pass just the inner data object to the mutation
    const data = requestBody.data || requestBody;
    
    // Use the dedicated subscription actions module to handle the update
    const result = await ctx.runMutation(api.subscriptionActions.updateSubscriptionFromStripe, {
      stripeSubscriptionId,
      data
    });
    
    if (!result.success) {
      console.error(`Failed to update subscription: ${result.error}`);
      return c.json({ success: false, error: result.error }, 404);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return c.json({ success: false, error: "Failed to update subscription" }, 500);
  }
});

// Get subscription item
app.get("/api/users/:id/stripe/subscription/item", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const meterName = c.req.query("meterName");
  
  if (!meterName) {
    return c.json({ success: false, error: "Missing meter name" }, 400);
  }
  
  try {
    const subscription = await ctx.runQuery(api.subscriptionQueries.getUserSubscription, { userId });
    
    if (!subscription) {
      return c.json({ success: false, error: "Subscription not found" }, 404);
    }
    
    // Check if subscription has items array (new structure)
    if (subscription.items && Array.isArray(subscription.items)) {
      // Find the item with the matching meter name
      const item = subscription.items.find(item => item.meterName === meterName);
      
      if (!item) {
        return c.json({ success: false, error: "Subscription item not found" }, 404);
      }
      
      return c.json({ subscriptionItemId: item.stripeItemId });
    }
    
    // Fallback for subscriptions without items array (legacy structure)
    // For the dual pricing model, generate subscription item IDs based on pattern
    const stripeSubscriptionId = subscription.stripeSubscriptionId;
    
    if (!stripeSubscriptionId) {
      return c.json({ success: false, error: "No Stripe subscription ID found" }, 404);
    }
    
    // For API requests meter, return the metered component item ID
    if (meterName === "api_requests") {
      const meteredItemId = `si_metered_${stripeSubscriptionId}`;
      return c.json({ subscriptionItemId: meteredItemId });
    }
    
    // For other meters, we might need different handling
    return c.json({ success: false, error: `Unsupported meter name: ${meterName}` }, 400);
    
  } catch (error) {
    console.error("Failed to get subscription item:", error);
    return c.json({ success: false, error: "Failed to retrieve subscription item" }, 500);
  }
});

// RATE LIMITING ENDPOINTS

// Get rate limit data
app.post("/getRateLimitData", async (c) => {
  const ctx = c.env;
  const { id, window_start } = await c.req.json();
  
  if (!id) {
    return c.json({ error: "Missing rate limit key" }, 400);
  }
  
  try {
    const rateLimitData = await ctx.runQuery(api.rateLimiting.getRateLimitData, { 
      id, 
      window_start: window_start || (Date.now() / 1000 - 900) // Default 15 min window
    });
    
    return c.json(rateLimitData);
  } catch (error) {
    console.error("Failed to get rate limit data:", error);
    return c.json({ error: "Failed to retrieve rate limit data", timestamps: [] }, 500);
  }
});

// Store rate limit request
app.post("/addRateLimitRequest", async (c) => {
  const ctx = c.env;
  const { id, timestamp } = await c.req.json();
  
  if (!id) {
    return c.json({ error: "Missing rate limit key" }, 400);
  }
  
  try {

    const result = await ctx.runMutation(api.rateLimiting.storeRateLimitRequest, { 
      id, 
      timestamp: timestamp || Math.floor(Date.now() / 1000)
    });
    
    return c.json({ success: true, result });
  } catch (error) {
    console.error("Failed to store rate limit request:", error);
    return c.json({ success: false, error: "Failed to store rate limit request" }, 500);
  }
});

// USAGE EVENTS ROUTES

// Log a usage event
app.post("/api/users/:id/usage/log", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { 
    timestamp, 
    model, 
    status, 
    qty, 
    // New optional fields
    endpoint,
    method,
    path,
    statusCode,
    userAgent,
    ip,
    requestId, // For tracking individual requests
  } = await c.req.json();
  
  // Validate required fields
  if (!userId || !timestamp || !model || !status || typeof qty !== "number") {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }
  
  // Log the event with all available metadata
  const eventData = {
    userId,
    timestamp,
    model,
    status,
    qty,
    // Include optional fields if provided
    ...(endpoint && { endpoint }),
    ...(method && { method }),
    ...(path && { path }),
    ...(statusCode && { statusCode: Number(statusCode) }),
    ...(userAgent && { userAgent }),
    ...(ip && { ip }),
    ...(requestId && { requestId }),
  };
  
  await ctx.runMutation(api.usageEvents.logUsageEvent, eventData);
  
  // Update user's usage field with all available context
  await ctx.runMutation(api.usageEvents.updateUserUsage, { 
    userId, 
    qty,
    endpoint,
    method,
    path,
    statusCode: statusCode ? Number(statusCode) : undefined,
    userAgent,
    ip,
    requestId,  // Pass through the requestId
  });
  
  return c.json({ success: true });
});

// Get usage summary for a user
app.get("/api/users/:id/usage/summary", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  if (!userId) return c.json({ success: false, error: "Missing userId" }, 400);
  const summary = await ctx.runQuery(api.usageEvents.getUsageSummary, { userId });
  return c.json({ success: true, ...summary });
});

// Reset usage for a new period (admin/cron)
app.post("/api/users/:id/usage/reset", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { periodStart, periodEnd, includedRequests } = await c.req.json();
  if (!userId || !periodStart || !periodEnd || typeof includedRequests !== "number") {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }
  const result = await ctx.runMutation(api.usageEvents.resetUsageForPeriod, {
    userId,
    periodStart,
    periodEnd,
    includedRequests,
  });
  return c.json(result);
});

// Get user data bundle for ambient insights (single call)
app.get("/api/users/:id/ambient-data-bundle", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  try {
    const bundle = await ctx.runQuery(api.ambientInsights.getUserDataBundle, { userId });
    return c.json({ success: true, data: bundle });
  } catch (error) {
    console.error("Failed to get user data bundle:", error);
    return c.json({ success: false, error: "Failed to get user data bundle" }, 500);
  }
});

// FEEDBACK ROUTES

// Create new feedback
app.post("/api/feedback/createFeedback", async (c) => {
  const ctx = c.env;
  const feedbackData = await c.req.json();
  
  try {
    const feedbackId = await ctx.runMutation(api.feedback.createFeedback, feedbackData);
    return c.json({ success: true, feedbackId });
  } catch (error: any) {
    console.error("Failed to create feedback:", error);
    return c.json({ 
      success: false, 
      error: "Failed to create feedback",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// List feedback with filters
app.get("/api/feedback/list", async (c) => {
  const ctx = c.env;
  const { status, type, priority, assignedTo, limit, cursor } = c.req.query();
  
  try {
    const result = await ctx.runQuery(api.feedback.listFeedback, {
      status: status || undefined,
      type: type || undefined,
      priority: priority || undefined,
      assignedTo: assignedTo || undefined,
      limit: limit ? parseInt(limit) : undefined,
      cursor: cursor || undefined,
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to list feedback:", error);
    return c.json({ 
      success: false, 
      error: "Failed to list feedback",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get single feedback by ID
app.get("/api/feedback/:id", async (c) => {
  const ctx = c.env;
  const feedbackId = c.req.param("id") as Id<"feedback">;
  
  try {
    const feedback = await ctx.runQuery(api.feedback.getFeedback, { feedbackId });
    if (!feedback) {
      return c.json({ success: false, error: "Feedback not found" }, 404);
    }
    return c.json({ success: true, data: feedback });
  } catch (error: any) {
    console.error("Failed to get feedback:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get feedback",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Update feedback status, priority, assignedTo, and tags
app.patch("/api/feedback/:id", async (c) => {
  const ctx = c.env;
  const feedbackId = c.req.param("id") as Id<"feedback">;
  const updateData = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.feedback.updateFeedbackStatus, {
      feedbackId,
      status: updateData.status,
      priority: updateData.priority,
      assignedTo: updateData.assignedTo,
      tags: updateData.tags,
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to update feedback:", error);
    return c.json({ 
      success: false, 
      error: "Failed to update feedback",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get feedback statistics
app.get("/api/feedback/stats", async (c) => {
  const ctx = c.env;
  
  try {
    const stats = await ctx.runQuery(api.feedback.getFeedbackStats, {});
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("Failed to get feedback stats:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get feedback stats",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Delete feedback
app.delete("/api/feedback/:id", async (c) => {
  const ctx = c.env;
  const feedbackId = c.req.param("id") as Id<"feedback">;
  
  try {
    const result = await ctx.runMutation(api.feedback.deleteFeedback, { feedbackId });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to delete feedback:", error);
    return c.json({ 
      success: false, 
      error: "Failed to delete feedback",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// CONVERSATION SUMMARIES ROUTES

// Create conversation summary
app.post("/api/conversation-summaries", async (c) => {
  const ctx = c.env;
  const summaryData = await c.req.json();
  
  try {
    const summaryId = await ctx.runMutation(api.conversationSummariesMutations.createConversationSummary, summaryData);
    return c.json({ success: true, summaryId });
  } catch (error: any) {
    console.error("Failed to create conversation summary:", error);
    return c.json({ 
      success: false, 
      error: "Failed to create conversation summary",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get conversation summaries for a user
app.get("/api/users/:userId/conversation-summaries", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("userId");
  const limit = c.req.query("limit") ? parseInt(c.req.query("limit") as string) : undefined;
  
  try {
    const summaries = await ctx.runQuery(api.conversationSummariesQueries.getUserConversationSummaries, { 
      userId, 
      limit 
    });
    return c.json({ success: true, summaries });
  } catch (error: any) {
    console.error("Failed to get conversation summaries:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get conversation summaries",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get conversation summaries for a project
app.get("/api/projects/:projectId/conversation-summaries", async (c) => {
  const ctx = c.env;
  const projectId = c.req.param("projectId") as Id<"projects">;
  const limit = c.req.query("limit") ? parseInt(c.req.query("limit") as string) : undefined;
  
  try {
    const summaries = await ctx.runQuery(api.conversationSummariesQueries.getProjectConversationSummaries, { 
      projectId, 
      limit 
    });
    return c.json({ success: true, summaries });
  } catch (error: any) {
    console.error("Failed to get project conversation summaries:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get project conversation summaries",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// PROJECT ROUTES

// Update project
app.post("/api/projects/updateProject", async (c) => {
  const ctx = c.env;
  const projectData = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectsMutations.updateProject, projectData);
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Failed to update project:", error);
    return c.json({ 
      success: false, 
      error: "Failed to update project",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// PROJECT ROUTES - Core Operations (Insert at line 1166 in http.ts)

// Create project
app.post("/api/projects/create", async (c) => {
  const ctx = c.env;
  const { userId, name, description } = await c.req.json();
  
  try {
    const projectId = await ctx.runMutation(api.projectsMutations.createProject, {
      userId,
      name,
      description
    });
    return c.json({ success: true, projectId });
  } catch (error: any) {
    console.error("Failed to create project:", error);
    return c.json({ 
      success: false, 
      error: "Failed to create project",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get project by ID
app.post("/api/projects/getById", async (c) => {
  const ctx = c.env;
  const { projectId, userId } = await c.req.json();
  
  try {
    const project = await ctx.runQuery(api.projectsQueries.getById, { projectId, userId });
    return c.json({ success: true, data: project });
  } catch (error: any) {
    console.error("Failed to get project:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get project",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get projects by user
app.post("/api/projects/getByUser", async (c) => {
  const ctx = c.env;
  const { userId, limit } = await c.req.json();
  
  try {
    const projects = await ctx.runQuery(api.projectsQueries.getByUser, { 
      userId,
      limit
    });
    return c.json({ success: true, data: projects });
  } catch (error: any) {
    console.error("Failed to get user projects:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get user projects",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Check if project exists
app.post("/api/projects/exists", async (c) => {
  const ctx = c.env;
  const { projectId, userId } = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.projectsQueries.exists, { 
      projectId,
      userId
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to check project existence:", error);
    return c.json({ 
      success: false, 
      error: "Failed to check project existence",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get recent projects
app.post("/api/projects/getRecent", async (c) => {
  const ctx = c.env;
  const { userId, limit } = await c.req.json();
  
  try {
    const projects = await ctx.runQuery(api.projectsQueries.getRecent, { 
      userId,
      limit
    });
    return c.json({ success: true, data: projects });
  } catch (error: any) {
    console.error("Failed to get recent projects:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get recent projects",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Add content to project
app.post("/api/projects/addContent", async (c) => {
  const ctx = c.env;
  const { projectId, userId, contentType, contentId } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectsMutations.addContent, {
      projectId,
      userId,
      contentType,
      contentId
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to add content to project:", error);
    return c.json({ 
      success: false, 
      error: "Failed to add content to project",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Link fingerprint to project
app.post("/api/projects/linkFingerprint", async (c) => {
  const ctx = c.env;
  const { projectId, userId, fingerprintId } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectsMutations.linkFingerprint, {
      projectId,
      userId,
      fingerprintId
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to link fingerprint:", error);
    return c.json({ 
      success: false, 
      error: "Failed to link fingerprint",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Delete project
app.post("/api/projects/delete", async (c) => {
  const ctx = c.env;
  const { projectId, userId } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectsMutations.deleteProject, {
      projectId,
      userId
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to delete project:", error);
    return c.json({ 
      success: false, 
      error: "Failed to delete project",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});




// PROJECT WIDGETS ROUTES - Clean and Optimized
// 4 endpoints that map 1:1 to Convex functions

// AGENT WORKFLOW ROUTES

// Process conversation message (summarize and evolve fingerprint)
app.post("/api/users/:userId/projects/:projectId/process-message", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("userId");
  const projectId = c.req.param("projectId") as Id<"projects">;
  const { message, conversationHistory } = await c.req.json();
  
  try {
    // This would call the backend agent services
    // For now, return a placeholder response
    return c.json({ 
      success: true, 
      message: "Message processing not yet implemented",
      data: {
        userId,
        projectId,
        message,
        conversationHistory
      }
    });
  } catch (error: any) {
    console.error("Failed to process message:", error);
    return c.json({ 
      success: false, 
      error: "Failed to process message",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Generate project widgets
app.post("/api/users/:userId/projects/:projectId/generate-widgets", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("userId");
  const projectId = c.req.param("projectId") as Id<"projects">;
  const { fingerprintId } = await c.req.json();
  
  try {
    // This would call the backend agent services
    // For now, return a placeholder response
    return c.json({ 
      success: true, 
      message: "Widget generation not yet implemented",
      data: {
        userId,
        projectId,
        fingerprintId
      }
    });
  } catch (error: any) {
    console.error("Failed to generate widgets:", error);
    return c.json({ 
      success: false, 
      error: "Failed to generate widgets",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// ============================================================================
// CLEAN PROJECT WIDGETS ENDPOINTS - Backend Integration
// 4 endpoints that map 1:1 to Convex functions, no redundancy
// ============================================================================

/**
 * Upsert project widgets - handles create and update
 * Used by: Backend widget generation, frontend updates
 */
app.post("/api/project-widgets/upsert", async (c) => {
  const ctx = c.env;
  const widgetsData = await c.req.json();
  
  try {
    const widgetsId = await ctx.runMutation(api.projectWidgetsMutations.upsertProjectWidgets, widgetsData);
    
    return c.json({
      success: true,
      data: widgetsId
    });
  } catch (error: any) {
    console.error("Failed to upsert project widgets:", error);
    return c.json({ 
      success: false, 
      error: "Failed to upsert project widgets",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

/**
 * Get project widgets by widgets ID
 * Used by: Direct widget access, updates
 */
app.get("/api/project-widgets/get", async (c) => {
  const ctx = c.env;
  const widgetsId = c.req.query("widgetsId");
  const userId = c.req.query("userId"); // Optional for backend queries
  
  try {
    if (!widgetsId) {
      return c.json({ 
        success: false, 
        error: "Missing widgetsId parameter" 
      }, 400);
    }

    const widgets = await ctx.runQuery(api.projectWidgetsQueries.getProjectWidgets, { 
      widgetsId: widgetsId as Id<"project_widgets">,
      userId
    });
    
    return c.json({
      success: true,
      data: widgets
    });
  } catch (error: any) {
    console.error("Failed to get project widgets:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get project widgets",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

/**
 * Get project widgets by project ID - Primary access pattern
 * Used by: Project dashboard, widget display
 */
app.get("/api/project-widgets/getByProject", async (c) => {
  const ctx = c.env;
  const projectId = c.req.query("projectId");
  const userId = c.req.query("userId"); // Optional for backend queries
  
  try {
    if (!projectId) {
      return c.json({ 
        success: false, 
        error: "Missing projectId parameter" 
      }, 400);
    }

    const widgets = await ctx.runQuery(api.projectWidgetsQueries.getProjectWidgetsByProject, { 
      projectId: projectId as Id<"projects">,
      userId
    });
    
    return c.json({
      success: true,
      data: widgets
    });
  } catch (error: any) {
    console.error("Failed to get project widgets by project:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get project widgets by project",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

/**
 * Delete project widgets by project ID
 * Used by: Project cleanup, widget deletion
 */
app.delete("/api/project-widgets/delete", async (c) => {
  const ctx = c.env;
  const { projectId, userId } = await c.req.json();
  
  try {
    if (!projectId) {
      return c.json({ 
        success: false, 
        error: "Missing projectId" 
      }, 400);
    }

    if (!userId) {
      return c.json({ 
        success: false, 
        error: "Missing userId" 
      }, 400);
    }

    const result = await ctx.runMutation(api.projectWidgetsMutations.deleteProjectWidgets, { 
      projectId,
      userId 
    });
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Failed to delete project widgets:", error);
    return c.json({ 
      success: false, 
      error: "Failed to delete project widgets",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});


// Single query endpoint that mirrors getCrystalData exactly
app.post("/api/crystal/query", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.crystalQueries.getCrystalData, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Single mutation endpoint that mirrors mutateCrystalData exactly
app.post("/api/crystal/mutate", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.crystalMutations.mutateCrystalData, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Batch mutation endpoint for efficient bulk operations
app.post("/api/crystal/batch-mutate", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.crystalMutations.batchMutateCrystalData, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Crystal data convenience endpoint
app.post("/api/crystal/persona", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.crystalQueries.getPersonaData, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Formation query endpoint that mirrors queryFormation exactly
app.post("/api/formation/query", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.formationQueries.queryFormation, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Formation mutation endpoint that mirrors mutateFormation exactly 
app.post("/api/formation/mutate", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.formationMutations.mutateFormation, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});


// === OPTIMIZED VECTOR SEARCH HTTP ROUTES ===
// Following convex-http-integration.mdc and performance optimization patterns

// Input validation schemas for performance and security
import { z } from 'zod';

const vectorSearchQuerySchema = z.object({
  userId: z.string().min(1),
  operation: z.string().min(1),
  table: z.string().optional(),
  
  // Search parameters
  query: z.string().optional(),
  contentTypes: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(50).optional(),
  threshold: z.number().min(0).max(1).optional(),
  
  // Query optimization
  useIndex: z.string().optional(),
  indexFields: z.record(z.any()).optional(),
  filters: z.record(z.any()).optional(),
  orderBy: z.enum(["asc", "desc"]).optional(),
  
  // Batch operations
  queries: z.array(z.any()).optional(),
  maxConcurrent: z.number().int().positive().max(10).optional(),
  includeGrading: z.boolean().optional(),
});

const vectorSearchMutationSchema = z.object({
  operation: z.string().min(1),
  userId: z.string().min(1),
  table: z.string().optional(),
  
  // Direct operation parameters
  text: z.string().optional(),
  contentId: z.string().optional(),
  contentType: z.string().optional(),
  embedding: z.array(z.number()).optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  metadata: z.any().optional(),
  
  // Batch parameters
  items: z.array(z.any()).optional(),
  contentIds: z.array(z.string()).optional(),
  maxConcurrent: z.number().int().positive().max(10).optional(),
});

// POST /api/vectorSearch/query - Optimized generic query endpoint
app.post("/api/vectorSearch/query", async (c) => {
  try {
    const requestBody = await c.req.json();
    const validation = vectorSearchQuerySchema.safeParse(requestBody);
    
    if (!validation.success) {
      return c.json({
        error: "Invalid vector search query parameters",
        details: validation.error.flatten()
      }, 400);
    }

    // Ensure required fields are present
    const { userId, operation, ...rest } = validation.data;
    if (!userId || !operation) {
      return c.json({ error: "userId and operation are required" }, 400);
    }
    
    const result = await c.env.runQuery(api.vectorSearchQueries.getVectorSearchData, {
      userId,
      operation,
      ...rest
    });
    return c.json(result);
  } catch (error) {
    console.error('Vector search query error:', error);
    return c.json({ 
      success: false, 
      error: 'Vector search query failed',
      data: null 
    }, 500);
  }
});

// POST /api/vectorSearch/mutate - Optimized batch mutation endpoint
app.post("/api/vectorSearch/mutate", async (c) => {
  try {
    const requestBody = await c.req.json();
    const validation = vectorSearchMutationSchema.safeParse(requestBody);
    
    if (!validation.success) {
      return c.json({
        error: "Invalid vector search mutation parameters",
        details: validation.error.flatten()
      }, 400);
    }

    // Ensure required fields are present
    const { userId, operation, ...rest } = validation.data;
    if (!userId || !operation) {
      return c.json({ error: "userId and operation are required" }, 400);
    }
    
    const result = await c.env.runMutation(api.vectorSearchMutations.batchMutateVectorSearchData, {
      userId,
      operation,
      ...rest
    });
    return c.json(result);
  } catch (error) {
    console.error('Vector search mutation error:', error);
    return c.json({ 
      success: false, 
      error: 'Vector search mutation failed',
      data: null 
    }, 500);
  }
});

// Legacy embedding generation route (for backward compatibility)
app.post("/api/vector-search/generate-embedding", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  const text = requestBody.text;
  try {
    const result = await ctx.runAction(api.vectorSearchEmbeddings.generateEmbedding, { text: text });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Vector search crystals route
app.post("/api/vector-search/crystals", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runAction(api.crystalQueries.vectorSearchCrystals, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to perform vector search on crystals:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});



// BATCH OPERATIONS AND OPTIMIZATION ENDPOINTS

// Batch vector search operations
app.post("/api/vector/batch-search", async (c) => {
  const ctx = c.env;
  const body = await c.req.json();
  const { userId, queries } = body;
  
  console.log(`🔍 [HTTP] Batch vector search for user ${userId} with ${queries?.length || 0} queries`);
  
  try {
    const result = await ctx.runAction(api.vectorSearchBatch.batchVectorSearch, {
      userId,
      queries: queries || []
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ [HTTP] Batch vector search error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Batch embedding generation
app.post("/api/vector/batch-embeddings", async (c) => {
  const ctx = c.env;
  const body = await c.req.json();
  const { userId, items, maxConcurrency } = body;
  
  console.log(`🚀 [HTTP] Batch embeddings for user ${userId} with ${items?.length || 0} items`);
  
  try {
    const result = await ctx.runAction(api.vectorSearchBatch.batchGenerateEmbeddings, {
      userId,
      items: items || [],
      maxConcurrency: maxConcurrency || 5
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ [HTTP] Batch embeddings error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Optimized crystal context
app.post("/api/crystal/optimized-context", async (c) => {
  const ctx = c.env;
  const body = await c.req.json();
  const { userId, contextQueries, includeRelated, cacheKey } = body;
  
  console.log(`🔍 [HTTP] Optimized crystal context for user ${userId}`);
  
  try {
    const result = await ctx.runQuery(api.crystalContextOptimized.getBatchCrystalContext, {
      userId,
      contextQueries: contextQueries || [],
      includeRelated: includeRelated || false,
      cacheKey
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ [HTTP] Optimized crystal context error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Formation context
app.post("/api/crystal/formation-context", async (c) => {
  const ctx = c.env;
  const body = await c.req.json();
  const { userId, shardCount, dimensions } = body;
  
  console.log(`🔮 [HTTP] Formation context for user ${userId} with ${shardCount} shards`);
  
  try {
    const result = await ctx.runQuery(api.crystalContextOptimized.getFormationContext, {
      userId,
      shardCount: shardCount || 0,
      dimensions: dimensions || []
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ [HTTP] Formation context error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Cache management endpoints
app.get("/api/cache/stats/:userId", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("userId");
  
  console.log(`📊 [HTTP] Cache stats for user ${userId}`);
  
  try {
    const result = await ctx.runQuery(api.crystalCache.getCacheStats, { userId });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ [HTTP] Cache stats error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Paginated crystals
app.post("/api/crystal/paginated", async (c) => {
  const ctx = c.env;
  const body = await c.req.json();
  const { userId, paginationOpts, filters, sortBy, sortOrder } = body;
  
  console.log(`📄 [HTTP] Paginated crystals for user ${userId}`);
  
  try {
    const result = await ctx.runQuery(api.paginatedQueries.getPaginatedCrystals, {
      userId,
      paginationOpts: paginationOpts || { numItems: 20, cursor: null },
      filters,
      sortBy,
      sortOrder
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ [HTTP] Paginated crystals error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});


// === INTELLIGENCE SYSTEM ENDPOINTS ===

// Trigger intelligence check (non-blocking)
app.post("/api/intelligence/trigger", async (c) => {
  const ctx = c.env;
  const { userId, event_type } = await c.req.json();
  
  try {
    // Fire and forget - trigger internal action without awaiting
    // Use internal.* for internalAction (not api.*)
    ctx.runAction(internal.intelligenceActions.checkIntelligenceTriggers, {
      userId,
      event_type
    }).catch((error: any) => {
      console.log(`[INTELLIGENCE] Trigger check failed (non-critical): ${error}`);
    });
    
    // Return immediately
    return c.json({ success: true, data: { queued: true } });
  } catch (error: any) {
    // Don't fail - trigger checks are non-critical
    console.log(`[INTELLIGENCE] Trigger error (non-critical): ${error.message}`);
    return c.json({ success: true, data: { queued: false } });
  }
});

// Get user intelligence config
app.post("/api/intelligence/config", async (c) => {
  const ctx = c.env;
  const { userId } = await c.req.json();
  
  try {
    const config = await ctx.runQuery(api.intelligenceQueries.getUserConfig, { userId });
    return c.json({ success: true, data: config });
  } catch (error: any) {
    console.error("[INTELLIGENCE] Config fetch error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get pending jobs
app.post("/api/intelligence/jobs/pending", async (c) => {
  const ctx = c.env;
  const { limit } = await c.req.json();
  
  try {
    const jobs = await ctx.runQuery(api.intelligenceQueries.getPendingJobs, { limit: limit || 10 });
    return c.json({ success: true, data: jobs });
  } catch (error: any) {
    console.error("[INTELLIGENCE] Jobs fetch error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update job status
app.post("/api/intelligence/job/update", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.intelligenceMutations.updateJobStatus, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[INTELLIGENCE] Job update error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update crystal intelligence state
app.post("/api/intelligence/update", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.intelligenceMutations.updateIntelligenceState, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[INTELLIGENCE] Intelligence update error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});


// === SHARD LIFECYCLE QUERY ENDPOINTS ===
// Query endpoints for shard data (read-only operations)

app.post("/api/shard-lifecycle/unprocessed", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.shardLifecycleQueries.getUnprocessedShards, requestBody);
    // Return raw result - backend's call_convex_api will wrap it in { success, data }
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/shard-lifecycle/stats", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.shardLifecycleQueries.getShardConsumptionStats, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/shard-lifecycle/validate", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.shardLifecycleQueries.validateShardAvailability, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/shard-lifecycle/initialize-legacy", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.shardLifecycleMutations.initializeLegacyShardStatus, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/shard-lifecycle/release-stuck", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.shardLifecycleMutations.releaseStuckReservedShards, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// === MIGRATIONS ===
app.post("/api/migrations/reserved-shards", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.migrations.migrateReservedShards.migrateReservedShardsToUnprocessed, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get("/api/migrations/shard-status-distribution", async (c) => {
  const ctx = c.env;
  
  try {
    const result = await ctx.runMutation(api.migrations.migrateReservedShards.getShardStatusDistribution, {});
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// === SHARD STATUS MANAGEMENT ===
// Atomic shard lifecycle state transitions with validation

app.post("/api/shard-status/update", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.shardStatusManager.updateShardStatus, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/shard-status/release", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.shardStatusManager.releaseReservedShards, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/shard-status/reserve", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.shardStatusManager.reserveShards, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/shard-status/consume", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.shardStatusManager.consumeShards, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/shard-status/archive", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.shardStatusManager.archiveShards, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// PROJECT FINGERPRINT ROUTES - Optimized for Discovery Flow
// ============================================================================

// Create fingerprint when starting discovery process
app.post("/api/project-fingerprint/create", async (c) => {
  const ctx = c.env;
  const { projectId, userId, name, description } = await c.req.json();
  
  try {
    const fingerprintId = await ctx.runMutation(api.projectFingerprintMutations.create, {
      projectId,
      userId,
      name,
      description
    });
    return c.json({ success: true, fingerprintId });
  } catch (error: any) {
    console.error("Failed to create project fingerprint:", error);
    return c.json({ 
      success: false, 
      error: "Failed to create project fingerprint",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get fingerprint by project ID - Primary access pattern
app.post("/api/project-fingerprint/getByProject", async (c) => {
  const ctx = c.env;
  const { projectId } = await c.req.json();
  
  try {
    const fingerprint = await ctx.runQuery(api.projectFingerprintQueries.getByProject, { 
      projectId 
    });
    return c.json({ success: true, data: fingerprint });
  } catch (error: any) {
    console.error("Failed to get project fingerprint:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get project fingerprint",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get full context for AI agents
app.post("/api/project-fingerprint/getFullContext", async (c) => {
  const ctx = c.env;
  const { projectId } = await c.req.json();
  
  try {
    const fingerprint = await ctx.runQuery(api.projectFingerprintQueries.getFullContext, { 
      projectId 
    });
    return c.json({ success: true, data: fingerprint });
  } catch (error: any) {
    console.error("Failed to get fingerprint full context:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get fingerprint full context",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Update discovery progress after each AI conversation turn
app.post("/api/project-fingerprint/updateProgress", async (c) => {
  const ctx = c.env;
  const { 
    projectId, 
    fieldsUpdate, 
    trigger, 
    confidence_scores, 
    conversationMessageId 
  } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectFingerprintMutations.updateDiscoveryProgress, {
      projectId,
      fieldsUpdate,
      trigger,
      confidence_scores,
      conversationMessageId
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to update discovery progress:", error);
    return c.json({ 
      success: false, 
      error: "Failed to update discovery progress",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Mark discovery as complete
app.post("/api/project-fingerprint/complete", async (c) => {
  const ctx = c.env;
  const { projectId, finalFields } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectFingerprintMutations.completeDiscovery, {
      projectId,
      finalFields
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to complete discovery:", error);
    return c.json({ 
      success: false, 
      error: "Failed to complete discovery",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Quick existence check
app.post("/api/project-fingerprint/exists", async (c) => {
  const ctx = c.env;
  const { projectId } = await c.req.json();
  
  try {
    const exists = await ctx.runQuery(api.projectFingerprintQueries.exists, { 
      projectId 
    });
    return c.json({ success: true, exists });
  } catch (error: any) {
    console.error("Failed to check fingerprint existence:", error);
    return c.json({ 
      success: false, 
      error: "Failed to check fingerprint existence",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get completion status for UI progress indicators
app.post("/api/project-fingerprint/getCompletionStatus", async (c) => {
  const ctx = c.env;
  const { projectId } = await c.req.json();
  
  try {
    const status = await ctx.runQuery(api.projectFingerprintQueries.getCompletionStatus, { 
      projectId 
    });
    return c.json({ success: true, data: status });
  } catch (error: any) {
    console.error("Failed to get completion status:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get completion status",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Update fingerprint status (active, archived, etc.)
app.post("/api/project-fingerprint/updateStatus", async (c) => {
  const ctx = c.env;
  const { fingerprintId, status, reason } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectFingerprintMutations.updateStatus, {
      fingerprintId,
      status,
      reason
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to update fingerprint status:", error);
    return c.json({ 
      success: false, 
      error: "Failed to update fingerprint status",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Delete fingerprint and evolution history
app.post("/api/project-fingerprint/delete", async (c) => {
  const ctx = c.env;
  const { fingerprintId, userId } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectFingerprintMutations.deleteFingerprint, {
      fingerprintId,
      userId
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to delete fingerprint:", error);
    return c.json({ 
      success: false, 
      error: "Failed to delete fingerprint",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get evolution history for debugging/analysis
app.post("/api/project-fingerprint/getEvolutionHistory", async (c) => {
  const ctx = c.env;
  const { fingerprintId, limit } = await c.req.json();
  
  try {
    const history = await ctx.runQuery(api.projectFingerprintQueries.getEvolutionHistory, { 
      fingerprintId,
      limit
    });
    return c.json({ success: true, data: history });
  } catch (error: any) {
    console.error("Failed to get evolution history:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get evolution history",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get user's fingerprints for dashboard
app.post("/api/project-fingerprint/getByUser", async (c) => {
  const ctx = c.env;
  const { userId, limit } = await c.req.json();
  
  try {
    const fingerprints = await ctx.runQuery(api.projectFingerprintQueries.getByUser, { 
      userId,
      limit
    });
    return c.json({ success: true, data: fingerprints });
  } catch (error: any) {
    console.error("Failed to get user fingerprints:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get user fingerprints",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Batch update multiple fields efficiently
app.post("/api/project-fingerprint/batchUpdate", async (c) => {
  const ctx = c.env;
  const { fingerprintId, fieldUpdates, trigger } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectFingerprintMutations.batchUpdateFields, {
      fingerprintId,
      fieldUpdates,
      trigger
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to batch update fields:", error);
    return c.json({ 
      success: false, 
      error: "Failed to batch update fields",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

const router = new HttpRouterWithHono(app);
export default router;