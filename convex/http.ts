import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { cors } from "hono/cors";

/**
 * PARALLEL SYSTEM: Native Convex Actions + Hono Fallback
 * 
 * Native actions are integrated directly into Hono for pilot domains.
 * This ensures zero breaking changes while testing the new approach.
 * 
 * PILOT: notes domain (3 routes use native Convex, marked below)
 */
import { Id } from "./_generated/dataModel";
import * as usageEventsApi from "./usageEvents";
// Removed unused imports for httpRouter and httpAction

const app: HonoWithConvex<ActionCtx> = new Hono();

// Enhanced logging middleware with domain tracking
app.use('*', async (c, next) => {
  const startTime = Date.now();
  const { method, path } = c.req;
  
  // Determine domain for better tracking
  let domain = 'unknown';
  if (path.includes('/notes')) domain = 'notes';
  else if (path.includes('/users')) domain = 'users';
  else if (path.includes('/projectSeeds')) domain = 'project_seeds';
  else if (path.includes('/projects')) domain = 'projects';
  else if (path.includes('/widgets')) domain = 'widgets';
  else if (path.includes('/crystal')) domain = 'crystal';
  else if (path.includes('/contextEnrichmentBandit')) domain = 'context_mab';
  else if (path.includes('/intelligenceBandit') || path.includes('/intelligence')) domain = 'intelligence';
  else if (path.includes('/api-keys')) domain = 'api_keys';
  else if (path.includes('/rate')) domain = 'rate_limiting';
  else if (path.includes('/formation')) domain = 'formation';
  else if (path.includes('/vector')) domain = 'vector';
  else if (path.includes('/subscription') || path.includes('/stripe')) domain = 'subscription';
  else if (path.includes('/feedback')) domain = 'feedback';
  else if (path.includes('/backgroundJobs') || path.includes('/background')) domain = 'background_jobs';
  
  console.log(`🔵 [${domain.toUpperCase()}] ${method} ${path} - START`);
  
  await next();
  
  const duration = Date.now() - startTime;
  console.log(`✅ [${domain.toUpperCase()}] ${method} ${path} - ${c.res.status} (${duration}ms)`);
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

// Add message to conversation (LEGACY - uses old messages array)
// TODO: Remove after migration complete
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

// ===== NEW MESSAGES TABLE ENDPOINTS (Dual-write system) =====

// Add message to conversation (NEW - writes to messages table + legacy array)
app.post("/api/users/:id/messages/add", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const body = await c.req.json();
  
  const messageId = await ctx.runMutation(api.messagesMutations.addMessage, {
    conversationId: body.conversationId,
    userId,
    content: body.content,
    role: body.role,
    timestamp: body.timestamp || Date.now(),
    context: body.context,
    fileAttachments: body.fileAttachments,
    enrichment_metadata: body.enrichment_metadata,
  });
  
  return c.json({ messageId });
});

// Get messages for a conversation (NEW) - POST to pass conversationId in body
app.post("/api/users/:id/messages/get", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const body = await c.req.json();
  
  const messages = await ctx.runQuery(api.messagesQueries.getConversationMessages, {
    conversationId: body.conversationId,  // Convex ID from body
  });
  
  return c.json({ messages });
});

// Get paginated messages (NEW) - POST to pass conversationId in body
app.post("/api/users/:id/messages/paginated", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const body = await c.req.json();
  
  const messages = await ctx.runQuery(api.messagesQueries.getPaginatedMessages, {
    conversationId: body.conversationId,
    limit: body.limit || 20,
    beforeSequence: body.beforeSequence,
  });
  
  return c.json({ messages });
});

// Update message metadata (e.g., enrichment_metadata)
app.post("/api/users/:id/messages/update_metadata", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const body = await c.req.json();
  
  const result = await ctx.runMutation(api.messagesMutations.updateMessageMetadata, {
    messageId: body.messageId,  // Convex ID from body
    userId,
    enrichment_metadata: body.enrichment_metadata,
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
      widgetId: noteData.widgetId,
      projectId: noteData.projectId,
      isWidgetOutput: noteData.isWidgetOutput,
      widgetOutputId: noteData.widgetOutputId,
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
  const { userId, name, description, noteIds, conversationIds, crystalIds, shardIds } = await c.req.json();
  
  try {
    const projectId = await ctx.runMutation(api.projectsMutations.createProject, {
      userId,
      name,
      description,
      noteIds,
      conversationIds,
      crystalIds,
      shardIds
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
 * 
 * REDESIGNED: Now returns { layoutId, widgetIds[] } instead of single ID
 * Maintains backward compatibility with backend data format
 */
app.post("/api/project-widgets/upsert", async (c) => {
  const ctx = c.env;
  const widgetsData = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectWidgetsMutations.upsertProjectWidgets, widgetsData);
    
    return c.json({
      success: true,
      data: {
        layoutId: result.layoutId,
        widgetIds: result.widgetIds,
        widgetCount: result.widgetIds.length,
      }
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
 * Get a single widget by widget_id
 * Used by: Widget execution, individual widget operations
 */
app.get("/api/project-widgets/getWidget", async (c) => {
  const ctx = c.env;
  const projectId = c.req.query("projectId");
  const widgetId = c.req.query("widgetId");
  const userId = c.req.query("userId"); // Optional for backend queries
  
  try {
    if (!projectId) {
      return c.json({ 
        success: false, 
        error: "Missing projectId parameter" 
      }, 400);
    }

    if (!widgetId) {
      return c.json({ 
        success: false, 
        error: "Missing widgetId parameter" 
      }, 400);
    }

    const widget = await ctx.runQuery(api.projectWidgetsQueries.getWidgetById, { 
      projectId: projectId as Id<"projects">,
      widgetId,
      userId
    });

    if (!widget) {
      return c.json({ 
        success: false, 
        error: "Widget not found" 
      }, 404);
    }
    
    return c.json({
      success: true,
      data: widget
    });
  } catch (error: any) {
    console.error("Failed to get widget:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get widget",
      message: error.message 
    }, 500);
  }
});

/**
 * Delete project widgets by project ID
 * Used by: Project cleanup, widget deletion
 * REDESIGNED: Now deletes both layout and individual widgets
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

// ============================================================================
// INDIVIDUAL WIDGET ENDPOINTS (NEW - Optimized Operations)
// These endpoints work with individual widgets, each with its own Convex ID
// ============================================================================

/**
 * Create a single widget
 */
app.post("/api/widgets/create", async (c) => {
  const ctx = c.env;
  const widgetData = await c.req.json();
  
  try {
    const widgetId = await ctx.runMutation(api.widgetsMutations.createWidget, widgetData);
    
    return c.json({
      success: true,
      data: { widgetId }
    });
  } catch (error: any) {
    console.error("Failed to create widget:", error);
    return c.json({ 
      success: false, 
      error: "Failed to create widget",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

/**
 * Update a single widget by Convex ID
 */
app.patch("/api/widgets/:widgetId", async (c) => {
  const ctx = c.env;
  const widgetId = c.req.param("widgetId") as Id<"widgets">;
  const { userId, updates } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.widgetsMutations.updateWidget, {
      widgetId,
      userId,
      updates
    });
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Failed to update widget:", error);
    return c.json({ 
      success: false, 
      error: "Failed to update widget",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

/**
 * Delete a single widget by Convex ID
 */
app.delete("/api/widgets/:widgetId", async (c) => {
  const ctx = c.env;
  const widgetId = c.req.param("widgetId") as Id<"widgets">;
  const { userId, hardDelete } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.widgetsMutations.deleteWidget, {
      widgetId,
      userId,
      hardDelete
    });
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Failed to delete widget:", error);
    return c.json({ 
      success: false, 
      error: "Failed to delete widget",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

/**
 * Get a single widget by Convex ID
 */
app.get("/api/widgets/:widgetId", async (c) => {
  const ctx = c.env;
  const widgetId = c.req.param("widgetId") as Id<"widgets">;
  const userId = c.req.query("userId");
  
  try {
    const widget = await ctx.runQuery(api.widgetsQueries.getWidget, {
      widgetId,
      userId
    });
    
    if (!widget) {
      return c.json({ 
        success: false, 
        error: "Widget not found" 
      }, 404);
    }
    
    return c.json({
      success: true,
      data: widget
    });
  } catch (error: any) {
    console.error("Failed to get widget:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get widget",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

/**
 * Get all widgets for a project
 */
app.get("/api/widgets/project/:projectId", async (c) => {
  const ctx = c.env;
  const projectId = c.req.param("projectId") as Id<"projects">;
  const userId = c.req.query("userId");
  const includeArchived = c.req.query("includeArchived") === "true";
  
  try {
    const widgets = await ctx.runQuery(api.widgetsQueries.getProjectWidgets, {
      projectId,
      userId,
      includeArchived
    });
    
    return c.json({
      success: true,
      data: widgets,
      count: widgets.length
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
 * Batch create widgets
 */
app.post("/api/widgets/batch-create", async (c) => {
  const ctx = c.env;
  const batchData = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.widgetsMutations.batchCreateWidgets, batchData);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Failed to batch create widgets:", error);
    return c.json({ 
      success: false, 
      error: "Failed to batch create widgets",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

/**
 * Update widget execution status
 */
app.patch("/api/widgets/:widgetId/execution", async (c) => {
  const ctx = c.env;
  const widgetId = c.req.param("widgetId") as Id<"widgets">;
  const { userId, status } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.widgetsMutations.updateWidgetExecution, {
      widgetId,
      userId,
      status
    });
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Failed to update widget execution:", error);
    return c.json({ 
      success: false, 
      error: "Failed to update widget execution",
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

// ===== ATOMIC CRYSTAL OPERATIONS =====
// These endpoints ensure crystal creation and shard consumption happen atomically

/**
 * Atomically create a crystal and mark its shards as consumed.
 * This is the RECOMMENDED way to create crystals - it ensures consistency.
 */
app.post("/api/crystal/atomic-create", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.crystalAtomicMutations.createCrystalWithShardConsumption, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Atomically update a crystal and adjust shard associations.
 */
app.post("/api/crystal/atomic-update", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.crystalAtomicMutations.updateCrystalWithShardAdjustment, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Delete a crystal and optionally release its shards.
 */
app.post("/api/crystal/atomic-delete", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.crystalAtomicMutations.deleteCrystalAndReleaseShards, requestBody);
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

// POST /api/vectorSearch/action - Optimized generic action endpoint (supports ctx.runAction)
app.post("/api/vectorSearch/action", async (c) => {
  try {
    const requestBody = await c.req.json();
    const validation = vectorSearchQuerySchema.safeParse(requestBody);
    
    if (!validation.success) {
      return c.json({
        error: "Invalid vector search action parameters",
        details: validation.error.flatten()
      }, 400);
    }

    // Ensure required fields are present
    const { userId, operation, ...rest } = validation.data;
    if (!userId || !operation) {
      return c.json({ error: "userId and operation are required" }, 400);
    }
    
    // Call as action instead of query to support ctx.runAction calls
    const result = await c.env.runAction(api.vectorSearchQueries.getVectorSearchData, {
      userId,
      operation,
      ...rest
    });
    return c.json(result);
  } catch (error) {
    console.error('Vector search action error:', error);
    return c.json({ 
      success: false, 
      error: 'Vector search action failed',
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
// Called by Python backend (observatory) to track activity
app.post("/api/intelligence/trigger", async (c) => {
  const ctx = c.env;
  const { userId, event_type } = await c.req.json();
  
  // Early validation prevents unnecessary processing
  const VALID_ACTIVITY_TYPES = ["chat", "smart_note", "crystal_formation", "crystal_retrieval"];
  
  if (!userId || !event_type) {
    return c.json({
      success: false,
      error: "Missing required fields: userId, event_type"
    }, 400);
  }
  
  if (!VALID_ACTIVITY_TYPES.includes(event_type)) {
    return c.json({
      success: false,
      error: `Invalid event_type. Must be one of: ${VALID_ACTIVITY_TYPES.join(", ")}`
    }, 400);
  }
  
  try {
    // Call incrementActivity mutation which will:
    // 1. Increment activity counters
    // 2. Schedule intelligence check (via ctx.scheduler)
    await ctx.runMutation(api.intelligenceMutations.incrementActivity, {
      userId,
      activity_type: event_type,
    });
    
    return c.json({ success: true, data: { tracked: true } });
  } catch (error: any) {
    // Don't fail - activity tracking is non-critical
    console.log(`[INTELLIGENCE] Activity tracking error (non-critical): ${error.message}`);
    return c.json({ success: true, data: { tracked: false, error: error.message } });
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

// Update user intelligence config
app.post("/api/intelligence/config/update", async (c) => {
  const ctx = c.env;
  const { userId, updates } = await c.req.json();
  
  if (!userId || !updates) {
    return c.json({ 
      success: false, 
      error: "Missing required fields: userId and updates" 
    }, 400);
  }
  
  try {
    const result = await ctx.runMutation(api.intelligenceMutations.updateUserConfig, { 
      userId, 
      triggers: updates.triggers,
      preferences: updates.preferences,
      // Support direct field updates (last_analysis, last_analysis_triggered_at, etc.)
      ...(updates.last_analysis !== undefined && { last_analysis: updates.last_analysis }),
      ...(updates.last_analysis_triggered_at !== undefined && { last_analysis_triggered_at: updates.last_analysis_triggered_at }),
      ...(updates.last_analysis_snapshot !== undefined && { last_analysis_snapshot: updates.last_analysis_snapshot }),
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[INTELLIGENCE] Config update error:", error);
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


// === INTELLIGENCE BANDIT (MAB) ENDPOINTS ===
// Multi-Armed Bandit learning system for adaptive intelligence triggering

app.post("/api/intelligenceBandit/getUserArms", async (c) => {
  const ctx = c.env;
  const { userId } = await c.req.json();
  
  try {
    const arms = await ctx.runQuery(api.intelligenceBandit.getUserArms, { userId });
    // Return arms directly as array - backend expects this format
    return c.json(arms);
  } catch (error: any) {
    console.error("[MAB] Get arms error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/intelligenceBandit/initializeArms", async (c) => {
  const ctx = c.env;
  const { userId, arms } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.intelligenceBandit.initializeArms, { userId, arms });
    return c.json(result);
  } catch (error: any) {
    console.error("[MAB] Initialize arms error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/intelligenceBandit/createDecision", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const decisionId = await ctx.runMutation(api.intelligenceBandit.createDecision, requestBody);
    // Return decisionId at top level for Python to access as response.get("data")
    return c.json(decisionId);
  } catch (error: any) {
    console.error("[MAB] Create decision error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/intelligenceBandit/updateArmPerformance", async (c) => {
  const ctx = c.env;
  const { userId, decisionId, valueScore } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.intelligenceBandit.updateArmPerformance, {
      userId,
      decisionId,
      valueScore
    });
    return c.json(result);
  } catch (error: any) {
    console.error("[MAB] Update arm performance error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/intelligenceBandit/getBanditPerformance", async (c) => {
  const ctx = c.env;
  const { userId } = await c.req.json();
  
  try {
    const performance = await ctx.runQuery(api.intelligenceBandit.getBanditPerformance, { userId });
    return c.json({ success: true, data: performance });
  } catch (error: any) {
    console.error("[MAB] Get performance error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/intelligenceBandit/getRecentDecisions", async (c) => {
  const ctx = c.env;
  const { userId, limit } = await c.req.json();
  
  try {
    const decisions = await ctx.runQuery(api.intelligenceBandit.getRecentDecisions, { userId, limit });
    return c.json({ success: true, data: decisions });
  } catch (error: any) {
    console.error("[MAB] Get recent decisions error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/intelligenceBandit/getArmDecisionHistory", async (c) => {
  const ctx = c.env;
  const { userId, armId, limit } = await c.req.json();
  
  try {
    const decisions = await ctx.runQuery(api.intelligenceBandit.getArmDecisionHistory, { userId, armId, limit });
    return c.json({ success: true, data: decisions });
  } catch (error: any) {
    console.error("[MAB] Get arm decision history error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});


// === CONTEXT ENRICHMENT BANDIT (MAB) ENDPOINTS ===
// Multi-Armed Bandit learning system for adaptive context strategies

app.post("/api/contextEnrichmentBandit/getUserArms", async (c) => {
  const ctx = c.env;
  const { userId, agentType } = await c.req.json();
  
  try {
    const arms = await ctx.runQuery(api.contextEnrichmentBandit.getUserArms, { userId, agentType });
    // Return arms directly as array - backend expects this format
    return c.json(arms);
  } catch (error: any) {
    console.error("[ContextMAB] Get arms error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/contextEnrichmentBandit/initializeArms", async (c) => {
  const ctx = c.env;
  const { userId, agentType, arms } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.contextEnrichmentBandit.initializeArms, { userId, agentType, arms });
    return c.json(result);
  } catch (error: any) {
    console.error("[ContextMAB] Initialize arms error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/contextEnrichmentBandit/createDecision", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const decisionId = await ctx.runMutation(api.contextEnrichmentBandit.createDecision, requestBody);
    // Return decisionId at top level for Python to access
    return c.json(decisionId);
  } catch (error: any) {
    console.error("[ContextMAB] Create decision error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/contextEnrichmentBandit/updateDecisionContext", async (c) => {
  const ctx = c.env;
  const { decisionId, conversationId, messageIndex } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.contextEnrichmentBandit.updateDecisionContext, {
      decisionId,
      conversationId,
      messageIndex
    });
    return c.json(result);
  } catch (error: any) {
    console.error("[ContextMAB] Update decision context error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/contextEnrichmentBandit/updateArmPerformance", async (c) => {
  const ctx = c.env;
  const { userId, agentType, decisionId, engagementScore, gradingScore, finalReward } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.contextEnrichmentBandit.updateArmPerformance, {
      userId,
      agentType,
      decisionId,
      engagementScore,
      gradingScore,
      finalReward
    });
    return c.json(result);
  } catch (error: any) {
    console.error("[ContextMAB] Update arm performance error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/contextEnrichmentBandit/getBanditPerformance", async (c) => {
  const ctx = c.env;
  const { userId, agentType } = await c.req.json();
  
  try {
    const performance = await ctx.runQuery(api.contextEnrichmentBandit.getBanditPerformance, { userId, agentType });
    return c.json({ success: true, data: performance });
  } catch (error: any) {
    console.error("[ContextMAB] Get performance error:", error);
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

app.post("/api/query/searchShardsForInlineWriting", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.shardLifecycleQueries.searchShardsForInlineWriting, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[SHARD SEARCH] Error searching shards for inline writing:", error);
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

// Widget migration endpoints
app.post("/api/migrations/widgets/status", async (c) => {
  const ctx = c.env;

  try {
    const result = await ctx.runQuery(internal.migrations.migrateWidgetsToIndividualDocs.checkMigrationStatus, {});
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/migrations/widgets/migrate", async (c) => {
  const ctx = c.env;
  const { dryRun, batchSize } = await c.req.json();

  try {
    const result = await ctx.runMutation(internal.migrations.migrateWidgetsToIndividualDocs.runMigration, {
      dryRun: dryRun || false,
      batchSize: batchSize || 100
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/migrations/widgets/verify", async (c) => {
  const ctx = c.env;

  try {
    const result = await ctx.runQuery(internal.migrations.migrateWidgetsToIndividualDocs.verifyMigration, {});
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/migrations/widgets/cleanup", async (c) => {
  const ctx = c.env;
  const { dryRun } = await c.req.json();

  try {
    const result = await ctx.runMutation(internal.migrations.migrateWidgetsToIndividualDocs.cleanupEmptyWidgetsField, {
      dryRun: dryRun || false
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Legacy shard migration endpoints
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

// WIDGET OUTPUTS ROUTES - Generic pattern for widget execution outputs

/**
 * POST /api/widgetOutputs/query
 * Generic query endpoint for widget outputs with dynamic filtering
 */
app.post("/api/widgetOutputs/query", async (c) => {
  try {
    const requestBody = await c.req.json();
    
    // Validate required fields
    if (!requestBody.userId) {
      return c.json({
        error: "userId is required",
        success: false
      }, 400);
    }

    const result = await c.env.runQuery(api.widgetOutputsQueries.getWidgetOutputData, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Widget outputs query error:", error);
    return c.json({ 
      error: "Internal server error",
      message: error.message || "Unknown error"
    }, 500);
  }
});

/**
 * POST /api/widgetOutputs/mutate
 * Batch mutation endpoint for widget outputs (create/update/delete)
 */
app.post("/api/widgetOutputs/mutate", async (c) => {
  try {
    const requestBody = await c.req.json();
    
    // Validate operations array
    if (!Array.isArray(requestBody.operations) || requestBody.operations.length === 0) {
      return c.json({
        error: "operations array is required and must not be empty",
        success: false
      }, 400);
    }

    const result = await c.env.runMutation(api.widgetOutputsMutations.batchMutateWidgetOutputs, requestBody);
    
    if (result.success) {
      return c.json({ success: true, data: result });
    } else {
      return c.json({
        success: false,
        error: "Batch operation partially failed",
        details: result.results
      }, 400);
    }
  } catch (error: any) {
    console.error("Widget outputs mutation error:", error);
    return c.json({ 
      error: "Internal server error",
      message: error.message || "Unknown error"
    }, 500);
  }
});

// CHATGPT IMPORT ROUTES - One-time import tracking

/**
 * POST /api/chatgptImport/checkHasImported
 * Check if user has already completed a ChatGPT import
 */
app.post("/api/chatgptImport/checkHasImported", async (c) => {
  try {
    const ctx = c.env;
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ 
        success: false,
        error: "Missing required field: userId"
      }, 400);
    }
    
    const result = await ctx.runQuery(api.chatgptImport.checkHasImported, { userId });
    
    return c.json({ 
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Check ChatGPT import error:", error);
    return c.json({ 
      success: false,
      error: "Failed to check import status",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/chatgptImport/markImportComplete
 * Mark ChatGPT import as completed with content stats
 */
app.post("/api/chatgptImport/markImportComplete", async (c) => {
  try {
    const ctx = c.env;
    const { userId, contentProcessed } = await c.req.json();
    
    if (!userId) {
      return c.json({ 
        success: false,
        error: "Missing required field: userId"
      }, 400);
    }
    
    const result = await ctx.runMutation(api.chatgptImport.markImportComplete, {
      userId,
      contentProcessed
    });
    
    return c.json({ 
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Mark ChatGPT import complete error:", error);
    return c.json({ 
      success: false,
      error: "Failed to mark import complete",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/chatgptImport/recordImportAttempt
 * Record an import attempt (for failure tracking)
 */
app.post("/api/chatgptImport/recordImportAttempt", async (c) => {
  try {
    const ctx = c.env;
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ 
        success: false,
        error: "Missing required field: userId"
      }, 400);
    }
    
    const result = await ctx.runMutation(api.chatgptImport.recordImportAttempt, { userId });
    
    return c.json({ 
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Record ChatGPT import attempt error:", error);
    return c.json({ 
      success: false,
      error: "Failed to record import attempt",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/chatgptImport/updateImportStatus
 * Update import status in real-time (called by backend)
 * Includes detailed progress tracking for user visibility
 */
app.post("/api/chatgptImport/updateImportStatus", async (c) => {
  try {
    const ctx = c.env;
    const { userId, jobId, status, progress, error, progressDetails, contentProcessed } = await c.req.json();
    
    if (!userId || !status) {
      return c.json({ 
        success: false,
        error: "Missing required fields: userId and status"
      }, 400);
    }
    
    const result = await ctx.runMutation(api.chatgptImport.updateImportStatus, {
      userId,
      jobId,
      status,
      progress,
      error,
      progressDetails,
      contentProcessed
    });
    
    return c.json({ 
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Update ChatGPT import status error:", error);
    return c.json({ 
      success: false,
      error: "Failed to update import status",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/chatgptImport/cancelImport
 * Cancel ChatGPT import and all related jobs
 */
app.post("/api/chatgptImport/cancelImport", async (c) => {
  try {
    const ctx = c.env;
    const { userId, reason } = await c.req.json();
    
    if (!userId) {
      return c.json({ 
        success: false,
        error: "userId is required"
      }, 400);
    }
    
    const result = await ctx.runMutation(api.chatgptImport.cancelImport, {
      userId,
      reason: reason || undefined
    });
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Cancel ChatGPT import error:", error);
    return c.json({ 
      success: false,
      error: "Failed to cancel import",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/chatgptImport/getImportStatus
 * Get current import status (for reactive frontend)
 */
app.post("/api/chatgptImport/getImportStatus", async (c) => {
  try {
    const ctx = c.env;
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ 
        success: false,
        error: "Missing required field: userId"
      }, 400);
    }
    
    const result = await ctx.runQuery(api.chatgptImport.getImportStatus, { userId });
    
    return c.json({ 
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Get ChatGPT import status error:", error);
    return c.json({ 
      success: false,
      error: "Failed to get import status",
      message: error.message || "Internal server error"
    }, 500);
  }
});

// BACKGROUND JOBS ROUTES - Async job queue tracking

/**
 * POST /api/backgroundJobs/create
 * Create a new background job record and get Convex-generated job ID
 * Called BEFORE Redis enqueue to get the job ID
 */
app.post("/api/backgroundJobs/create", async (c) => {
  try {
    const ctx = c.env;
    const { userId, type, payload, priority } = await c.req.json();
    
    // Validate required fields
    if (!userId || !type) {
      return c.json({ 
        success: false,
        error: "Missing required fields: userId and type"
      }, 400);
    }
    
    const result = await ctx.runMutation(api.backgroundJobs.create, {
      userId,
      type,
      payload,
      priority: priority || "normal",
    });
    
    // result is { success: true, jobId: "..." }
    // Return jobId at top level for Python backend
    return c.json({ 
      success: result.success,
      jobId: result.jobId 
    });
  } catch (error: any) {
    console.error("Background job creation error:", error);
    return c.json({ 
      success: false,
      error: "Failed to create job record",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/backgroundJobs/updateStatus
 * Update job status (called by workers)
 */
app.post("/api/backgroundJobs/updateStatus", async (c) => {
  try {
    const ctx = c.env;
    const { jobId, status, workerId, result, error } = await c.req.json();
    
    const updateResult = await ctx.runMutation(api.backgroundJobs.updateStatus, {
      jobId,
      status,
      workerId,
      result,
      error,
    });
    
    return c.json({ success: true, data: updateResult });
  } catch (error: any) {
    console.error("Background job status update error:", error);
    return c.json({ 
      success: false,
      error: "Failed to update job status",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/backgroundJobs/getUserJobs
 * Get user's jobs with optional filtering
 */
app.post("/api/backgroundJobs/getUserJobs", async (c) => {
  try {
    const ctx = c.env;
    const { userId, jobType, status, limit } = await c.req.json();
    
    const jobs = await ctx.runQuery(api.backgroundJobs.getUserJobs, {
      userId,
      jobType,
      status,
      limit: limit || 10,
    });
    
    return c.json({ success: true, data: jobs });
  } catch (error: any) {
    console.error("Get user jobs error:", error);
    return c.json({ 
      success: false,
      error: "Failed to get user jobs",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/backgroundJobs/getJobStats
 * Get job statistics for a user
 */
app.post("/api/backgroundJobs/getJobStats", async (c) => {
  try {
    const ctx = c.env;
    const { userId } = await c.req.json();
    
    const stats = await ctx.runQuery(api.backgroundJobs.getJobStats, { userId });
    
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("Get job stats error:", error);
    return c.json({ 
      success: false,
      error: "Failed to get job stats",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/backgroundJobs/getStuckJobs
 * Find jobs stuck in RUNNING status (for recovery after backend restart)
 */
app.post("/api/backgroundJobs/getStuckJobs", async (c) => {
  try {
    const ctx = c.env;
    const { maxAgeMinutes } = await c.req.json();
    
    const result = await ctx.runQuery(api.backgroundJobs.getStuckJobs, {
      maxAgeMinutes: maxAgeMinutes || 30,
    });
    
    return c.json(result);
  } catch (error: any) {
    console.error("Get stuck jobs error:", error);
    return c.json({ 
      success: false,
      error: "Failed to get stuck jobs",
      message: error.message || "Internal server error",
      jobs: []
    }, 500);
  }
});

/**
 * POST /api/backgroundJobs/resetStuckJob
 * Reset a stuck job back to queued status
 */
app.post("/api/backgroundJobs/resetStuckJob", async (c) => {
  try {
    const ctx = c.env;
    const { jobId, reason } = await c.req.json();
    
    if (!jobId) {
      return c.json({ 
        success: false,
        error: "Missing required field: jobId"
      }, 400);
    }
    
    const result = await ctx.runMutation(api.backgroundJobs.resetStuckJob, {
      jobId,
      reason,
    });
    
    return c.json(result);
  } catch (error: any) {
    console.error("Reset stuck job error:", error);
    return c.json({ 
      success: false,
      error: "Failed to reset stuck job",
      message: error.message || "Internal server error"
    }, 500);
  }
});

// CONTENT SHARING ROUTES - Universal sharing for notes, projects, widgets, conversations

/**
 * POST /api/contentSharing/getSharedWithMe
 * Get all content shared with a user
 */
app.post("/api/contentSharing/getSharedWithMe", async (c) => {
  try {
    const ctx = c.env;
    const { userId, contentType } = await c.req.json();
    
    if (!userId) {
      return c.json({ 
        success: false,
        error: "Missing required field: userId"
      }, 400);
    }
    
    const result = await ctx.runQuery(api.contentSharingQueries.getSharedWithMe, {
      userId,
      contentType,
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Get shared with me error:", error);
    return c.json({ 
      success: false,
      error: "Failed to get shared content",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/contentSharing/getContentSharedUsers
 * Get all users who have access to specific content
 */
app.post("/api/contentSharing/getContentSharedUsers", async (c) => {
  try {
    const ctx = c.env;
    const { userId, contentType, contentId } = await c.req.json();
    
    if (!userId || !contentType || !contentId) {
      return c.json({ 
        success: false,
        error: "Missing required fields: userId, contentType, contentId"
      }, 400);
    }
    
    const result = await ctx.runQuery(api.contentSharingQueries.getContentSharedUsers, {
      userId,
      contentType,
      contentId,
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Get content shared users error:", error);
    return c.json({ 
      success: false,
      error: "Failed to get shared users",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/contentSharing/getMySharedContent
 * Get all content that a user has shared with others
 */
app.post("/api/contentSharing/getMySharedContent", async (c) => {
  try {
    const ctx = c.env;
    const { userId, contentType } = await c.req.json();
    
    if (!userId) {
      return c.json({ 
        success: false,
        error: "Missing required field: userId"
      }, 400);
    }
    
    const result = await ctx.runQuery(api.contentSharingQueries.getMySharedContent, {
      userId,
      contentType,
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Get my shared content error:", error);
    return c.json({ 
      success: false,
      error: "Failed to get shared content",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/contentSharing/checkContentAccess
 * Check if a user has access to specific content
 */
app.post("/api/contentSharing/checkContentAccess", async (c) => {
  try {
    const ctx = c.env;
    const { userId, contentType, contentId } = await c.req.json();
    
    if (!userId || !contentType || !contentId) {
      return c.json({ 
        success: false,
        error: "Missing required fields: userId, contentType, contentId"
      }, 400);
    }
    
    const result = await ctx.runQuery(api.contentSharingQueries.checkContentAccess, {
      userId,
      contentType,
      contentId,
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Check content access error:", error);
    return c.json({ 
      success: false,
      error: "Failed to check content access",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/contentSharing/share
 * Share content with another user
 */
app.post("/api/contentSharing/share", async (c) => {
  try {
    const ctx = c.env;
    const { userId, contentType, contentId, friendUserId, permission } = await c.req.json();
    
    if (!userId || !contentType || !contentId || !friendUserId || !permission) {
      return c.json({ 
        success: false,
        error: "Missing required fields: userId, contentType, contentId, friendUserId, permission"
      }, 400);
    }
    
    const result = await ctx.runMutation(api.contentSharingMutations.shareContent, {
      userId,
      contentType,
      contentId,
      friendUserId,
      permission,
    });
    
    return c.json(result);
  } catch (error: any) {
    console.error("Share content error:", error);
    return c.json({ 
      success: false,
      error: "Failed to share content",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/contentSharing/updatePermission
 * Update permission for shared content
 */
app.post("/api/contentSharing/updatePermission", async (c) => {
  try {
    const ctx = c.env;
    const { userId, contentType, contentId, targetUserId, newPermission } = await c.req.json();
    
    if (!userId || !contentType || !contentId || !targetUserId || !newPermission) {
      return c.json({ 
        success: false,
        error: "Missing required fields: userId, contentType, contentId, targetUserId, newPermission"
      }, 400);
    }
    
    const result = await ctx.runMutation(api.contentSharingMutations.updateContentPermission, {
      userId,
      contentType,
      contentId,
      targetUserId,
      newPermission,
    });
    
    return c.json(result);
  } catch (error: any) {
    console.error("Update content permission error:", error);
    return c.json({ 
      success: false,
      error: "Failed to update permission",
      message: error.message || "Internal server error"
    }, 500);
  }
});

/**
 * POST /api/contentSharing/revoke
 * Revoke access to shared content
 */
app.post("/api/contentSharing/revoke", async (c) => {
  try {
    const ctx = c.env;
    const { userId, contentType, contentId, targetUserId } = await c.req.json();
    
    if (!userId || !contentType || !contentId || !targetUserId) {
      return c.json({ 
        success: false,
        error: "Missing required fields: userId, contentType, contentId, targetUserId"
      }, 400);
    }
    
    const result = await ctx.runMutation(api.contentSharingMutations.revokeContentAccess, {
      userId,
      contentType,
      contentId,
      targetUserId,
    });
    
    return c.json(result);
  } catch (error: any) {
    console.error("Revoke content access error:", error);
    return c.json({ 
      success: false,
      error: "Failed to revoke access",
      message: error.message || "Internal server error"
    }, 500);
  }
});

// ============================================================================
// WEBHOOK EVENT TRACKING ROUTES
// ============================================================================

/**
 * Log a webhook event to the database
 */
app.post("/api/webhookEvents/log", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const result = await ctx.runMutation(api.webhookEvents.logWebhookEvent, {
      eventId: body.eventId,
      eventType: body.eventType,
      eventData: body.eventData,
      apiVersion: body.apiVersion,
      userId: body.userId,
      subscriptionId: body.subscriptionId,
      customerId: body.customerId,
      invoiceId: body.invoiceId,
      ipAddress: body.ipAddress,
      userAgent: body.userAgent,
    });
    
    return c.json(result);
  } catch (error: any) {
    console.error("[WEBHOOK_LOG] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to log webhook event"
    }, 500);
  }
});

/**
 * Update webhook event status
 */
app.post("/api/webhookEvents/updateStatus", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const result = await ctx.runMutation(api.webhookEvents.updateWebhookStatus, {
      eventId: body.eventId,
      status: body.status,
      error: body.error,
      errorStack: body.errorStack,
      processingDuration: body.processingDuration,
      userId: body.userId,
      subscriptionId: body.subscriptionId,
      customerId: body.customerId,
      invoiceId: body.invoiceId,
    });
    
    return c.json(result);
  } catch (error: any) {
    console.error("[WEBHOOK_STATUS] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to update webhook status"
    }, 500);
  }
});

/**
 * Get webhook history for a user
 */
app.get("/api/webhookEvents/history/:userId", async (c) => {
  try {
    const ctx = c.env;
    const userId = c.req.param("userId");
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined;
    const eventType = c.req.query("eventType");
    
    const events = await ctx.runQuery(api.webhookEvents.getWebhookHistory, {
      userId,
      limit,
      eventType,
    });
    
    return c.json(events);
  } catch (error: any) {
    console.error("[WEBHOOK_HISTORY] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to fetch webhook history"
    }, 500);
  }
});

/**
 * Get failed webhooks
 */
app.get("/api/webhookEvents/failed", async (c) => {
  try {
    const ctx = c.env;
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined;
    const since = c.req.query("since") ? parseInt(c.req.query("since")!) : undefined;
    
    const events = await ctx.runQuery(api.webhookEvents.getFailedWebhooks, {
      limit,
      since,
    });
    
    return c.json(events);
  } catch (error: any) {
    console.error("[WEBHOOK_FAILED] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to fetch failed webhooks"
    }, 500);
  }
});

/**
 * Get webhook statistics
 */
app.get("/api/webhookEvents/stats", async (c) => {
  try {
    const ctx = c.env;
    const since = c.req.query("since") ? parseInt(c.req.query("since")!) : undefined;
    const eventType = c.req.query("eventType");
    
    const stats = await ctx.runQuery(api.webhookEvents.getWebhookStats, {
      since,
      eventType,
    });
    
    return c.json(stats);
  } catch (error: any) {
    console.error("[WEBHOOK_STATS] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to fetch webhook statistics"
    }, 500);
  }
});

/**
 * Get webhooks for a subscription
 */
app.get("/api/webhookEvents/subscription/:subscriptionId", async (c) => {
  try {
    const ctx = c.env;
    const subscriptionId = c.req.param("subscriptionId");
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined;
    
    const events = await ctx.runQuery(api.webhookEvents.getSubscriptionWebhooks, {
      subscriptionId,
      limit,
    });
    
    return c.json(events);
  } catch (error: any) {
    console.error("[WEBHOOK_SUBSCRIPTION] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to fetch subscription webhooks"
    }, 500);
  }
});

/**
 * Retry a failed webhook
 */
app.post("/api/webhookEvents/retry", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const result = await ctx.runMutation(api.webhookEvents.retryFailedWebhook, {
      eventId: body.eventId,
    });
    
    return c.json(result);
  } catch (error: any) {
    console.error("[WEBHOOK_RETRY] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to retry webhook"
    }, 500);
  }
});

// ============================================================================
// PROJECT SEEDS - Code-based seed detection
// ============================================================================

/**
 * List project seeds for a user
 */
app.post("/api/projectSeeds/list", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const seeds = await ctx.runQuery(api.projectSeedsQueries.listProjectSeeds, {
      userId: body.userId,
      minConfidence: body.minConfidence,
      includePromoted: body.includePromoted ?? false,
      limit: body.limit,
    });
    
    return c.json({ success: true, data: seeds });
  } catch (error: any) {
    console.error("[PROJECT_SEEDS_LIST] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to list project seeds"
    }, 500);
  }
});

/**
 * Get a specific project seed
 */
app.post("/api/projectSeeds/get", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const seed = await ctx.runQuery(api.projectSeedsQueries.getProjectSeed, {
      seedId: body.seedId as Id<"projectSeeds">,
    });
    
    if (!seed) {
      return c.json({ success: false, error: "Seed not found" }, 404);
    }
    
    return c.json({ success: true, data: seed });
  } catch (error: any) {
    console.error("[PROJECT_SEEDS_GET] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get project seed"
    }, 500);
  }
});

/**
 * Get seeds ready for promotion
 */
app.post("/api/projectSeeds/readyForPromotion", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const seeds = await ctx.runQuery(api.projectSeedsQueries.getSeedsReadyForPromotion, {
      userId: body.userId,
      confidenceThreshold: body.confidenceThreshold,
    });
    
    return c.json({ success: true, data: seeds });
  } catch (error: any) {
    console.error("[PROJECT_SEEDS_READY] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get seeds ready for promotion"
    }, 500);
  }
});

/**
 * Get seed statistics
 */
app.post("/api/projectSeeds/statistics", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const stats = await ctx.runQuery(api.projectSeedsQueries.getSeedStatistics, {
      userId: body.userId,
    });
    
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("[PROJECT_SEEDS_STATS] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get seed statistics"
    }, 500);
  }
});

/**
 * Create a new project seed
 */
app.post("/api/projectSeeds/create", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const seedId = await ctx.runMutation(api.projectSeedsMutations.createProjectSeed, {
      userId: body.userId,
      seedId: body.seedId,
      name: body.name,
      description: body.description,
      confidence: body.confidence,
      sourceShardIds: body.sourceShardIds,
      keywords: body.keywords,
      dimension: body.dimension,
      suggestedProjectName: body.suggestedProjectName,
      suggestedProjectDescription: body.suggestedProjectDescription,
      suggestedDomain: body.suggestedDomain,
      suggestedComplexity: body.suggestedComplexity,
      suggestedTimeHorizon: body.suggestedTimeHorizon,
      relatedNoteIds: body.relatedNoteIds,
      relatedConversationIds: body.relatedConversationIds,
      shardCount: body.shardCount,
      evidenceStrength: body.evidenceStrength,
    });
    
    return c.json({ success: true, data: { seedId } });
  } catch (error: any) {
    console.error("[PROJECT_SEEDS_CREATE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to create project seed"
    }, 500);
  }
});

/**
 * Update a project seed
 */
app.post("/api/projectSeeds/update", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const seedId = await ctx.runMutation(api.projectSeedsMutations.updateProjectSeed, {
      seedId: body.seedId as Id<"projectSeeds">,
      updates: body.updates,
    });
    
    return c.json({ success: true, data: { seedId } });
  } catch (error: any) {
    console.error("[PROJECT_SEEDS_UPDATE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to update project seed"
    }, 500);
  }
});

/**
 * Promote a seed to project
 */
app.post("/api/projectSeeds/promote", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const seedId = await ctx.runMutation(api.projectSeedsMutations.promoteSeed, {
      seedId: body.seedId as Id<"projectSeeds">,
      projectId: body.projectId as Id<"projects">,
      confidenceAtPromotion: body.confidenceAtPromotion,
    });
    
    return c.json({ success: true, data: { seedId } });
  } catch (error: any) {
    console.error("[PROJECT_SEEDS_PROMOTE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to promote seed"
    }, 500);
  }
});

/**
 * Delete a project seed
 */
app.post("/api/projectSeeds/delete", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    await ctx.runMutation(api.projectSeedsMutations.deleteProjectSeed, {
      seedId: body.seedId as Id<"projectSeeds">,
    });
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error("[PROJECT_SEEDS_DELETE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to delete seed"
    }, 500);
  }
});

const router = new HttpRouterWithHono(app);
export default router;