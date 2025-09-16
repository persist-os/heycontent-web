import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { cors } from "hono/cors";
import { Id } from "./_generated/dataModel";
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

// HEALTH CHECK ENDPOINT
app.get("/api/health", async (c) => {
    return c.json({
      status: "healthy",
      timestamp: Date.now(),
      service: "convex"
    });
});

// USER ROUTES

// List all users
app.get("/api/users", async (c) => {
  const ctx = c.env;
  const users = await ctx.runQuery(api.userQueries.list, {});
  return c.json(users);
});

// Log usage event for a user
app.post("/api/users/:id/usage/log", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.timestamp || !body.model || !body.status || body.qty === undefined) {
      return c.json({ 
        success: false, 
        error: "Missing required fields: timestamp, model, status, qty" 
      }, 400);
    }
    
    // Call the usage logging mutation
    await ctx.runMutation(api.usageEvents.logUsageEvent, {
      userId: body.userId || userId, // Use userId from body if provided, otherwise from URL
      timestamp: body.timestamp,
      model: body.model,
      status: body.status,
      qty: body.qty,
      endpoint: body.endpoint,
      method: body.method,
      path: body.path,
      statusCode: body.statusCode,
      userAgent: body.userAgent,
      ip: body.ip,
      requestId: body.requestId
    });
    
    return c.json({ success: true, message: "Usage event logged successfully" });
  } catch (error) {
    console.error("Failed to log usage event:", error);
    return c.json({ 
      success: false, 
      error: "Failed to log usage event",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get usage summary for a user
app.get("/api/users/:id/usage/summary", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  
  try {
    const summary = await ctx.runQuery(api.usageEvents.getUsageSummary, { userId });
    return c.json(summary);
  } catch (error) {
    console.error("Failed to get usage summary:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get usage summary",
      message: error.message || "Internal Server Error"
    }, 500);
  }
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

// Get ambient data bundle for a user
app.get("/api/users/:id/ambient-data-bundle", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  
  try {
    const dataBundle = await ctx.runQuery(api.ambientInsights.getUserDataBundle, { userId });
    return c.json({ 
      success: true, 
      data: dataBundle 
    });
  } catch (error: any) {
    console.error("Failed to get ambient data bundle:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get ambient data bundle",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Save ambient insights for a user
app.post("/api/users/:id/save_insights", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  
  try {
    const body = await c.req.json();
    const { insights } = body;
    
    if (!insights || !Array.isArray(insights)) {
      return c.json({ 
        success: false, 
        error: "Missing or invalid insights array" 
      }, 400);
    }
    
    const insightsId = await ctx.runMutation(api.ambientInsights.createInsights, {
      userId,
      insights
    });
    
    return c.json({ 
      success: true, 
      data: { insightsId } 
    });
  } catch (error: any) {
    console.error("Failed to save insights:", error);
    return c.json({ 
      success: false, 
      error: "Failed to save insights",
      message: error.message || "Internal Server Error"
    }, 500);
  }
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

// Access a persona
app.get("/api/users/:id/personas", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const persona = await ctx.runQuery(api.personas.getPersona, { userId });
  return c.json(persona);
});

// Create a new persona
app.post("/api/users/:id/personas", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const {
    current_name,
    current_description,
    experience_level,
    content_formats,
    content_tone,
    content_voice,
    content_pillars,
    unique_value,
    future_name,
    future_description,
    goals,
    desired_impact,
    primary_topics,
    secondary_topics,
    tone_descriptors,
    style_descriptors,
    audience_type,
    engagement_style
  } = await c.req.json();

  // Validate required fields
  const missing = [];
  if (!current_name) missing.push("current_name");
  if (!current_description) missing.push("current_description");
  if (!experience_level) missing.push("experience_level");
  if (!Array.isArray(content_formats)) missing.push("content_formats");
  if (!content_tone) missing.push("content_tone");
  if (!content_voice) missing.push("content_voice");
  if (!Array.isArray(content_pillars)) missing.push("content_pillars");
  if (!unique_value) missing.push("unique_value");
  if (!future_name) missing.push("future_name");
  if (!future_description) missing.push("future_description");
  if (!Array.isArray(goals)) missing.push("goals");
  if (!desired_impact) missing.push("desired_impact");
  if (!Array.isArray(primary_topics)) missing.push("primary_topics");
  if (!Array.isArray(secondary_topics)) missing.push("secondary_topics");
  if (!Array.isArray(tone_descriptors)) missing.push("tone_descriptors");
  if (!Array.isArray(style_descriptors)) missing.push("style_descriptors");
  if (!audience_type) missing.push("audience_type");
  if (!Array.isArray(engagement_style)) missing.push("engagement_style");

  if (missing.length > 0) {
    return c.json({ success: false, error: `Missing required fields: ${missing.join(", ")}` }, 400);
  }

  try {
    const result = await ctx.runMutation(api.personas.createPersona, {
      userId,
      current_name,
      current_description,
      experience_level,
      content_formats,
      content_tone,
      content_voice,
      content_pillars,
      unique_value,
      future_name,
      future_description,
      goals,
      desired_impact,
      primary_topics,
      secondary_topics,
      tone_descriptors,
      style_descriptors,
      audience_type,
      engagement_style
    });
    return c.json({ success: true, personaId: result });
  } catch (error) {
    console.error("Failed to create persona:", error);
    return c.json({ success: false, error: "Failed to create persona" }, 500);
  }
});

// Conversations
app.post("/api/users/:id/create_conversation", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { title, messages } = await c.req.json();
  const result = await ctx.runMutation(api.chatMutations.createConversation, {
    userId,
    title,
    messages,
  });
  return c.json(result);
});

// Add message to conversation
app.post("/api/users/:id/add_message_to_conversation", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { conversationId, message } = await c.req.json();
  const result = await ctx.runMutation(api.chatMutations.addMessageToConversation, {
    userId,
    conversationId,
    message,
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


// Chat with context - Enhanced chat that searches for relevant content
app.post("/api/users/:id/chat_with_context", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { query, conversationId } = await c.req.json();

  if (!query) {
    return c.json({ error: "Missing query in request body" }, 400);
  }

  try {
    const result = await ctx.runAction(api.chatMutations.chatWithContext, {
      userId,
      query,
      conversationId,
    });
    return c.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Failed to execute chat with context:", error);
    return c.json({ 
      success: false, 
      error: "Failed to process chat with context",
      message: error.message || "Internal Server Error"
    }, 500);
  }
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

// PROJECT FINGERPRINT ROUTES

// Create project fingerprint
app.post("/api/project-fingerprint/createFingerprint", async (c) => {
  const ctx = c.env;
  const fingerprintData = await c.req.json();
  
  try {
    const fingerprintId = await ctx.runMutation(api.projectFingerprintMutations.createFingerprint, fingerprintData);
    return c.json(fingerprintId);
  } catch (error: any) {
    console.error("Failed to create project fingerprint:", error);
    return c.json({ 
      success: false, 
      error: "Failed to create project fingerprint",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get project fingerprint by ID
app.post("/api/project-fingerprint/getFingerprint", async (c) => {
  const ctx = c.env;
  const { fingerprintId, userId } = await c.req.json();
  
  try {
    const fingerprint = await ctx.runQuery(api.projectFingerprintQueries.getFingerprint, { 
      fingerprintId, 
      userId 
    });
    return c.json(fingerprint);
  } catch (error: any) {
    console.error("Failed to get project fingerprint:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get project fingerprint",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get project fingerprint by project ID
app.post("/api/project-fingerprint/getFingerprintByProject", async (c) => {
  const ctx = c.env;
  const { projectId, userId } = await c.req.json();
  
  try {
    const fingerprint = await ctx.runQuery(api.projectFingerprintQueries.getFingerprintByProject, { 
      projectId, 
      userId 
    });
    return c.json(fingerprint);
  } catch (error: any) {
    console.error("Failed to get project fingerprint by project:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get project fingerprint by project",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Update project fingerprint
app.post("/api/project-fingerprint/updateFingerprint", async (c) => {
  const ctx = c.env;
  const { fingerprintId, userId, updates } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectFingerprintMutations.updateFingerprint, {
      fingerprintId,
      userId,
      updates
    });
    return c.json(result);
  } catch (error: any) {
    console.error("Failed to update project fingerprint:", error);
    return c.json({ 
      success: false, 
      error: "Failed to update project fingerprint",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Delete project fingerprint
app.post("/api/project-fingerprint/deleteFingerprint", async (c) => {
  const ctx = c.env;
  const { fingerprintId, userId } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectFingerprintMutations.deleteFingerprint, {
      fingerprintId,
      userId
    });
    return c.json(result);
  } catch (error: any) {
    console.error("Failed to delete project fingerprint:", error);
    return c.json({ 
      success: false, 
      error: "Failed to delete project fingerprint",
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

// Update project fingerprint ID
app.post("/api/projects/updateProjectFingerprintId", async (c) => {
  const ctx = c.env;
  const { projectId, userId, fingerprintId } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectsMutations.updateProjectFingerprintId, {
      projectId,
      userId,
      fingerprintId
    });
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Failed to update project fingerprint ID:", error);
    return c.json({ 
      success: false, 
      error: "Failed to update project fingerprint ID",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// PROJECT WIDGETS ROUTES

// Create project widgets
app.post("/api/projects/:projectId/widgets", async (c) => {
  const ctx = c.env;
  const projectId = c.req.param("projectId") as Id<"projects">;
  const widgetsData = await c.req.json();
  
  try {
    const widgetsId = await ctx.runMutation(api.projectWidgetsMutations.createProjectWidgets, {
      projectId,
      ...widgetsData
    });
    return c.json({ success: true, widgetsId });
  } catch (error: any) {
    console.error("Failed to create project widgets:", error);
    return c.json({ 
      success: false, 
      error: "Failed to create project widgets",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get project widgets
app.get("/api/projects/:projectId/widgets", async (c) => {
  const ctx = c.env;
  const projectId = c.req.param("projectId") as Id<"projects">;
  
  try {
    const widgets = await ctx.runQuery(api.projectWidgetsQueries.getProjectWidgetsByProject, { projectId });
    return c.json({ success: true, widgets });
  } catch (error: any) {
    console.error("Failed to get project widgets:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get project widgets",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Update project widgets
app.patch("/api/projects/:projectId/widgets/:widgetsId", async (c) => {
  const ctx = c.env;
  const widgetsId = c.req.param("widgetsId") as Id<"project_widgets">;
  const updates = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectWidgetsMutations.updateProjectWidgets, {
      widgetsId,
      updates
    });
    return c.json({ success: true, widgetsId: result });
  } catch (error: any) {
    console.error("Failed to update project widgets:", error);
    return c.json({ 
      success: false, 
      error: "Failed to update project widgets",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Update widget configuration
app.patch("/api/projects/:projectId/widgets/:widgetsId/config/:widgetId", async (c) => {
  const ctx = c.env;
  const widgetsId = c.req.param("widgetsId") as Id<"project_widgets">;
  const widgetId = c.req.param("widgetId");
  const { config } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectWidgetsMutations.updateWidgetConfig, {
      widgetsId,
      widgetId,
      config
    });
    return c.json({ success: true, result });
  } catch (error: any) {
    console.error("Failed to update widget config:", error);
    return c.json({ 
      success: false, 
      error: "Failed to update widget config",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Reorder widgets
app.post("/api/projects/:projectId/widgets/:widgetsId/reorder", async (c) => {
  const ctx = c.env;
  const widgetsId = c.req.param("widgetsId") as Id<"project_widgets">;
  const { widgetOrder } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.projectWidgetsMutations.reorderWidgets, {
      widgetsId,
      widgetOrder
    });
    return c.json({ success: true, result });
  } catch (error: any) {
    console.error("Failed to reorder widgets:", error);
    return c.json({ 
      success: false, 
      error: "Failed to reorder widgets",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Delete project widgets
app.delete("/api/projects/:projectId/widgets/:widgetsId", async (c) => {
  const ctx = c.env;
  const widgetsId = c.req.param("widgetsId") as Id<"project_widgets">;
  
  try {
    const result = await ctx.runMutation(api.projectWidgetsMutations.deleteProjectWidgets, { widgetsId });
    return c.json({ success: true, result });
  } catch (error: any) {
    console.error("Failed to delete project widgets:", error);
    return c.json({ 
      success: false, 
      error: "Failed to delete project widgets",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// PERSONA CRYSTALLIZATION ROUTES

// Store crystallized insights
app.post("/api/persona-crystallization/store-insights", async (c) => {
  const ctx = c.env;
  const { insights } = await c.req.json();
  
  try {
    console.log(`⚠️  [HTTP-CONVEX] storeCrystallizedInsightsAction called with insights count: ${insights?.length || 0}`);
    
    // Validate that insights array contains proper data
    if (!insights || !Array.isArray(insights)) {
      return c.json({
        success: false,
        error: "Missing or invalid insights array"
      }, 400);
    }

    // Validate each insight has required fields for simplified schema
    for (const insight of insights) {
      if (!insight.userId || !insight.content || !insight.category) {
        return c.json({
          success: false,
          error: "Each insight must have userId, content, and category fields"
        }, 400);
      }
    }
    
    const result = await ctx.runAction(api.personaCrystallizationMutations.storeCrystallizedInsightsAction, {
      insights
    });
    
    console.log(`⚠️  [HTTP-CONVEX] storeCrystallizedInsightsAction result:`, result);
    
    return c.json({ 
      success: true, 
      data: result
    });
  } catch (error: any) {
    console.error("⚠️  [HTTP-CONVEX] Failed to store crystallized insights:", error);
    return c.json({ 
      success: false, 
      error: "Failed to store crystallized insights",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Store persona traces
app.post("/api/persona-crystallization/store-traces", async (c) => {
  const ctx = c.env;
  const { traces } = await c.req.json();
  
  try {
    console.log(`⚠️  [HTTP-CONVEX] storePersonaTracesAction called with traces count: ${traces?.length || 0}`);
    
    // Validate that traces array contains proper data
    if (!traces || !Array.isArray(traces)) {
      return c.json({
        success: false,
        error: "Missing or invalid traces array"
      }, 400);
    }

    // Validate each trace has required fields for simplified schema
    for (const trace of traces) {
      if (!trace.userId || trace.content === undefined || typeof trace.confidence !== 'number') {
        return c.json({
          success: false,
          error: "Each trace must have userId, content, and confidence fields"
        }, 400);
      }
    }
    
    const result = await ctx.runAction(api.personaCrystallizationMutations.storePersonaTracesAction, {
      traces
    });
    
    console.log(`⚠️  [HTTP-CONVEX] storePersonaTracesAction result:`, result);
    
    return c.json({ 
      success: true, 
      data: result 
    });
  } catch (error: any) {
    console.error("⚠️  [HTTP-CONVEX] Failed to store persona traces:", error);
    return c.json({ 
      success: false, 
      error: "Failed to store persona traces",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get persona traces
app.get("/api/persona-crystallization/get-traces", async (c) => {
  const ctx = c.env;
  const userId = c.req.query("userId");
  const limit = c.req.query("limit") ? parseInt(c.req.query("limit") as string) : 50;
  const minConfidence = c.req.query("minConfidence") ? parseFloat(c.req.query("minConfidence") as string) : undefined;
  
  try {
    console.log(`⚠️  [HTTP-CONVEX] get-traces called with userId: ${userId}, limit: ${limit}, minConfidence: ${minConfidence}`);
    
    if (!userId) {
      return c.json({
        success: false,
        error: "Missing required parameter: userId"
      }, 400);
    }
    
    const result = await ctx.runQuery(api.personaCrystallizationQueries.getPersonaTraces, {
      userId,
      limit,
      minConfidence
    });
    
    console.log(`⚠️  [HTTP-CONVEX] getPersonaTraces result: ${result.length} traces`);
    
    return c.json({ 
      success: true, 
      data: {
        traces: result,
        pagination: { hasMore: false } // Simplified pagination
      }
    });
  } catch (error: any) {
    console.error("⚠️  [HTTP-CONVEX] Failed to get persona traces:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get persona traces",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get crystallized insights
app.get("/api/persona-crystallization/get-insights", async (c) => {
  const ctx = c.env;
  const userId = c.req.query("userId");
  const category = c.req.query("category");
  const minConfidence = c.req.query("minConfidence") ? parseFloat(c.req.query("minConfidence") as string) : undefined;
  const limit = c.req.query("limit") ? parseInt(c.req.query("limit") as string) : 20;
  
  try {
    console.log(`⚠️  [HTTP-CONVEX] getCrystallizedInsights called with userId: ${userId}, category: ${category}, minConfidence: ${minConfidence}, limit: ${limit}`);
    
    if (!userId) {
      return c.json({
        success: false,
        error: "Missing required parameter: userId"
      }, 400);
    }
    
    const result = await ctx.runQuery(api.personaCrystallizationQueries.getCrystallizedInsights, {
      userId,
      category,
      minConfidence,
      limit
    });
    
    console.log(`⚠️  [HTTP-CONVEX] getCrystallizedInsights result: ${result.length} insights`);
    
    return c.json({ 
      success: true, 
      data: {
        insights: result,
        pagination: { hasMore: false } // Simplified pagination
      }
    });
  } catch (error: any) {
    console.error("⚠️  [HTTP-CONVEX] Failed to get crystallized insights:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get crystallized insights",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get user persona profile for AI context injection
app.get("/api/persona-crystallization/get-profile", async (c) => {
  const ctx = c.env;
  const userId = c.req.query("userId");
  const includeRecentTraces = c.req.query("includeRecentTraces") !== "false"; // Default to true
  const traceLimit = c.req.query("traceLimit") ? parseInt(c.req.query("traceLimit") as string) : 20;
  const insightLimit = c.req.query("insightLimit") ? parseInt(c.req.query("insightLimit") as string) : 10;
  
  try {
    console.log(`⚠️  [HTTP-CONVEX] getUserPersonaProfile called with userId: ${userId}`);
    
    if (!userId) {
      return c.json({
        success: false,
        error: "Missing required parameter: userId"
      }, 400);
    }
    
    const result = await ctx.runQuery(api.personaCrystallizationQueries.getUserPersonaProfile, {
      userId,
      includeRecentTraces,
      traceLimit,
      insightLimit
    });
    
    console.log(`⚠️  [HTTP-CONVEX] getUserPersonaProfile result: ${result.summary.totalTraces} traces, ${result.summary.totalInsights} insights`);
    
    return c.json({ 
      success: true, 
      data: result
    });
  } catch (error: any) {
    console.error("⚠️  [HTTP-CONVEX] Failed to get user persona profile:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get user persona profile",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

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

// TOKEN DAM ROUTES

// Check if processing is allowed for a user's token dam
app.get("/api/token-dam/is-processing-allowed", async (c) => {
  const ctx = c.env;
  const userId = c.req.query("userId");
  
  if (!userId) {
    return c.json({ 
      success: false, 
      error: "Missing required parameter: userId" 
    }, 400);
  }
  
  try {
    const result = await ctx.runQuery(api.tokenDamQueries.isProcessingAllowed, { 
      userId 
    });
    
    return c.json({ 
      success: true, 
      data: result 
    });
  } catch (error: any) {
    console.error("Failed to check processing allowed:", error);
    return c.json({ 
      success: false, 
      error: "Failed to check processing status",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get token dam status for a user
app.get("/api/token-dam/status", async (c) => {
  const ctx = c.env;
  const userId = c.req.query("userId");
  
  if (!userId) {
    return c.json({ 
      success: false, 
      error: "Missing required parameter: userId" 
    }, 400);
  }
  
  try {
    const result = await ctx.runQuery(api.tokenDamQueries.getDamStatus, { 
      userId 
    });
    
    return c.json({ 
      success: true, 
      data: result 
    });
  } catch (error: any) {
    console.error("Failed to get dam status:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get dam status",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get user dam overview
app.get("/api/token-dam/overview", async (c) => {
  const ctx = c.env;
  const userId = c.req.query("userId");
  
  if (!userId) {
    return c.json({ 
      success: false, 
      error: "Missing required parameter: userId" 
    }, 400);
  }
  
  try {
    const result = await ctx.runQuery(api.tokenDamQueries.getUserDamOverview, { 
      userId 
    });
    
    return c.json({ 
      success: true, 
      data: result 
    });
  } catch (error: any) {
    console.error("Failed to get dam overview:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get dam overview",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get token usage statistics for a user
app.get("/api/token-dam/usage-stats", async (c) => {
  const ctx = c.env;
  const userId = c.req.query("userId");
  const timeRange = c.req.query("timeRange") || "24h"; // Default to 24 hours
  
  if (!userId) {
    return c.json({ 
      success: false, 
      error: "Missing required parameter: userId" 
    }, 400);
  }
  
  try {
    const result = await ctx.runQuery(api.tokenDamQueries.getTokenUsageStats, { 
      userId,
      timeRange
    });
    
    return c.json({ 
      success: true, 
      data: result 
    });
  } catch (error: any) {
    console.error("Failed to get token usage stats:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get token usage stats",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Token dam health check
app.get("/api/token-dam/health", async (c) => {
  const ctx = c.env;
  
  try {
    // Test token dam system health by running a simple query
    const testUserId = "health_test";
    const result = await ctx.runQuery(api.tokenDamQueries.isProcessingAllowed, { 
      userId: testUserId 
    });
    
    return c.json({ 
      success: true, 
      status: "healthy",
      timestamp: Date.now(),
      service: "token_dam"
    });
  } catch (error: any) {
    console.error("Token dam health check failed:", error);
    return c.json({ 
      success: false, 
      status: "unhealthy",
      error: "Token dam system unavailable",
      message: error.message || "Internal Server Error",
      timestamp: Date.now(),
      service: "token_dam"
    }, 500);
  }
});

// HTTP Routes for Backend Integration
app.post("/api/project-widgets/createProjectWidgets", async (c) => {
  const ctx = c.env;
  const widgetsData = await c.req.json();
  
  try {
    const widgetsId = await ctx.runMutation(api.projectWidgetsMutations.createProjectWidgets, widgetsData);
    
    return c.json({
      success: true,
      data: widgetsId
    });
  } catch (error: any) {
    console.error("Failed to create project widgets:", error);
    return c.json({ 
      success: false, 
      error: "Failed to create project widgets",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

app.get("/api/project-widgets/getProjectWidgets", async (c) => {
  const ctx = c.env;
  const widgetsId = c.req.query("widgetsId");
  
  try {
    if (!widgetsId) {
      return c.json({ 
        success: false, 
        error: "Missing widgetsId parameter" 
      }, 400);
    }

    const widgets = await ctx.runQuery(api.projectWidgetsQueries.getProjectWidgets, { widgetsId: widgetsId as Id<"project_widgets"> });
    
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

app.get("/api/project-widgets/getProjectWidgetsByProject", async (c) => {
  const ctx = c.env;
  const projectId = c.req.query("projectId");
  
  try {
    if (!projectId) {
      return c.json({ 
        success: false, 
        error: "Missing projectId parameter" 
      }, 400);
    }

    const widgets = await ctx.runQuery(api.projectWidgetsQueries.getProjectWidgetsByProject, { projectId: projectId as Id<"projects"> });
    
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

app.post("/api/project-widgets/updateProjectWidgets", async (c) => {
  const ctx = c.env;
  const { widgetsId, ...updates } = await c.req.json();
  
  try {
    if (!widgetsId) {
      return c.json({ 
        success: false, 
        error: "Missing widgetsId" 
      }, 400);
    }

    const result = await ctx.runMutation(api.projectWidgetsMutations.updateProjectWidgets, { widgetsId, updates });
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Failed to update project widgets:", error);
    return c.json({ 
      success: false, 
      error: "Failed to update project widgets",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

app.post("/api/project-widgets/deleteProjectWidgets", async (c) => {
  const ctx = c.env;
  const { widgetsId } = await c.req.json();
  
  try {
    if (!widgetsId) {
      return c.json({ 
        success: false, 
        error: "Missing widgetsId" 
      }, 400);
    }

    const result = await ctx.runMutation(api.projectWidgetsMutations.deleteProjectWidgets, { widgetsId });
    
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

// Get projects for user route
app.get("/api/projects/getProjectsForUser", async (c) => {
  const ctx = c.env;
  const userId = c.req.query("userId");
  
  try {
    if (!userId) {
      return c.json({
        success: false,
        error: "Missing required parameter: userId"
      }, 400);
    }

    const projects = await ctx.runQuery(api.projectsQueries.getProjectsForUser, {
      userId
    });

    return c.json({
      success: true,
      data: projects
    });
  } catch (error: any) {
    console.error("Error getting projects for user:", error);
    return c.json({
      success: false, 
      error: "Failed to get projects for user",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});


const router = new HttpRouterWithHono(app);
export default router;