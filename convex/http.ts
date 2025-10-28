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
  else if (path.includes('/stardust')) domain = 'stardust';
  else if (path.includes('/projectSeeds')) domain = 'project_seeds';
  else if (path.includes('/projects')) domain = 'projects';
  else if (path.includes('/widgets')) domain = 'widgets';
  else if (path.includes('/fingerprintSignals')) domain = 'fingerprint_signals';
  else if (path.includes('/project-fingerprint')) domain = 'fingerprint';
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
  else if (path.includes('/briefing')) domain = 'briefing';
  
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
  try {
    const ctx = c.env;
    const userId = c.req.param("id");
    const { title, messages } = await c.req.json();
    
    // Validate required fields
    if (!title || !messages || !Array.isArray(messages)) {
      return c.json({ 
        success: false, 
        error: "title and messages are required" 
      }, 400);
    }
    
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
  } catch (error) {
    console.error('Create conversation error:', error);
    console.error('Create conversation error details:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack',
      userId: c.req.param("id"),
      requestBody: await c.req.json().catch(() => 'Failed to parse request body')
    });
    return c.json({ 
      success: false, 
      error: `Create conversation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null 
    }, 500);
  }
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

// Update conversation title (async generation in background)
app.post("/api/users/:id/update_conversation_title", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { conversationId, title } = await c.req.json();
  
  const result = await ctx.runMutation(api.chatMutations.updateConversationTitle, {
    userId,
    conversationId,
    title
  });
  return c.json(result);
});

// Update conversation suggestions (async generation)
app.post("/api/chat/updateSuggestions", async (c) => {
  const ctx = c.env;
  const { conversationId, suggestions } = await c.req.json();
  
  const result = await ctx.runMutation(api.chatMutations.updateConversationSuggestions, {
    conversationId,
    suggestions
  });
  return c.json(result);
});

// Update message suggestions (async generation)
app.post("/api/chat/updateMessageSuggestions", async (c) => {
  const ctx = c.env;
  const { messageId, suggestions } = await c.req.json();
  
  const result = await ctx.runMutation(api.chatMutations.updateMessageSuggestions, {
    messageId,
    suggestions
  });
  return c.json(result);
});

// Batch fetch multiple conversations (for context enrichment)
app.post("/api/chat/getMultiple", async (c) => {
  const ctx = c.env;
  
  try {
    const { conversationIds, userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: "Missing required field: userId" }, 400);
    }
    if (!conversationIds || !Array.isArray(conversationIds)) {
      return c.json({ error: "Missing or invalid conversationIds array" }, 400);
    }
    
    const conversations = await ctx.runQuery(api.chatQueries.getMultiple, { conversationIds, userId });
    return c.json({ success: true, data: conversations });
  } catch (error: any) {
    console.error("Failed to get multiple conversations:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get multiple conversations",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get single conversation by ID (for backend toolkit access)
app.post("/api/chat/conversation/get", async (c) => {
  const ctx = c.env;
  
  try {
    const { userId, conversationId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: "Missing required field: userId" }, 400);
    }
    if (!conversationId) {
      return c.json({ error: "Missing required field: conversationId" }, 400);
    }
    
    const conversation = await ctx.runQuery(api.chatQueries.getConversation, { 
      userId, 
      conversationId 
    });
    
    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }
    
    return c.json(conversation);
  } catch (error: any) {
    console.error("Failed to get conversation:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get conversation",
      message: error.message || "Internal Server Error"
    }, 500);
  }
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
    context_summary: body.context_summary,
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

// Update message suggestions
app.post("/api/users/:id/update_message_suggestions", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const body = await c.req.json();
  
  const result = await ctx.runMutation(api.messagesMutations.updateMessageSuggestions, {
    messageId: body.messageId,
    userId,
    suggestions: body.suggestions,
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
  const { insights, greetings } = await c.req.json();
  const result = await ctx.runMutation(api.ambientInsights.createInsights, {
    userId,
    insights,
    greetings: greetings || undefined,
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
  
  // Retry logic with exponential backoff for OCC conflicts
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await ctx.runMutation(api.apiKeysMutations.insert_api_key, {
        user_id,
        key_hash,
        scopes,
        rate_tier,
        clientType: clientType || "web",
      });
      return c.json({ success: true }, 201);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's an OCC error (Convex error code 1)
      const isOCCError = error?.message?.includes("changed while this mutation was being run") ||
                         error?.message?.includes("https://docs.convex.dev/error#1");
      
      if (isOCCError && attempt < maxRetries - 1) {
        // Exponential backoff: 50ms, 100ms, 200ms
        const delay = 50 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Non-OCC error or final attempt - fail
      break;
    }
  }
  
  console.error("Failed to create API key after retries:", lastError);
  return c.json({ success: false, error: "Failed to create API key" }, 500);
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

// Batch fetch multiple notes (for context enrichment)
app.post("/api/notes/getMultiple", async (c) => {
  const ctx = c.env;
  
  try {
    const { noteIds, userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: "Missing required field: userId" }, 400);
    }
    if (!noteIds || !Array.isArray(noteIds)) {
      return c.json({ error: "Missing or invalid noteIds array" }, 400);
    }
    
    const notes = await ctx.runQuery(api.noteQueries.getMultiple, { noteIds, userId });
    return c.json({ success: true, data: notes });
  } catch (error: any) {
    console.error("Failed to get multiple notes:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get multiple notes",
      message: error.message || "Internal Server Error"
    }, 500);
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

// ===== SUBSCRIPTION PLANS (STATIC DATA CACHING) =====

// Get all subscription plans (cached)
app.get("/api/subscription/plans", async (c) => {
  const ctx = c.env;
  
  try {
    const plans = await ctx.runQuery(api.subscriptionPlansQueries.getAllPlans, {});
    return c.json({ success: true, data: plans });
  } catch (error: any) {
    console.error("Failed to get subscription plans:", error);
    return c.json({ 
      success: false, 
      error: "Failed to retrieve subscription plans",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Sync plans from backend (backend only)
app.post("/api/subscription/plans/sync", async (c) => {
  const ctx = c.env;
  
  try {
    const { plans } = await c.req.json();
    
    if (!plans || !Array.isArray(plans)) {
      return c.json({ 
        success: false, 
        error: "Missing or invalid plans array" 
      }, 400);
    }
    
    const result = await ctx.runMutation(api.subscriptionPlansMutations.syncPlans, { plans });
    return c.json(result);
  } catch (error: any) {
    console.error("Failed to sync subscription plans:", error);
    return c.json({ 
      success: false, 
      error: "Failed to sync subscription plans",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Check if plans are initialized
app.get("/api/subscription/plans/status", async (c) => {
  const ctx = c.env;
  
  try {
    const status = await ctx.runQuery(api.subscriptionPlansQueries.arePlansInitialized, {});
    return c.json(status);
  } catch (error: any) {
    console.error("Failed to check plans status:", error);
    return c.json({ 
      success: false, 
      error: "Failed to check plans status",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// ===== USER SUBSCRIPTIONS =====

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

// Get custom command prompts for a user
app.get("/api/users/:id/custom-command-prompts", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  try {
    const prompts = await ctx.runQuery(api.ambientInsights.getCustomCommandPrompts, { userId });
    return c.json({ success: true, data: prompts });
  } catch (error) {
    console.error("Failed to get custom command prompts:", error);
    return c.json({ success: false, error: "Failed to get custom command prompts" }, 500);
  }
});

// Update custom command prompts for a user
app.post("/api/users/:id/custom-command-prompts", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { customCommandPrompts } = await c.req.json();
  try {
    await ctx.runMutation(api.ambientInsights.updateCustomCommandPrompts, {
      userId,
      customCommandPrompts,
    });
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to update custom command prompts:", error);
    return c.json({ success: false, error: "Failed to update custom command prompts" }, 500);
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

// ============================================================================
// CONTENT FEEDBACK ROUTES - For chat, notes, and widgets
// ============================================================================

/**
 * POST /api/feedback/content
 * Create content feedback (ratings for AI-generated content)
 */
app.post("/api/feedback/content", async (c) => {
  const ctx = c.env;
  const feedbackData = await c.req.json();
  
  try {
    const feedbackId = await ctx.runMutation(
      api.feedback.createContentFeedback, 
      feedbackData
    );
    return c.json({ success: true, feedbackId });
  } catch (error: any) {
    console.error("Failed to create content feedback:", error);
    return c.json({ 
      success: false, 
      error: "Failed to create content feedback",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

/**
 * GET /api/feedback/entity
 * Get feedback for specific entity (message, note, or widget)
 * Query params: entityType, entityId
 */
app.get("/api/feedback/entity", async (c) => {
  const ctx = c.env;
  const { entityType, entityId } = c.req.query();
  
  if (!entityType || !entityId) {
    return c.json({
      success: false,
      error: "entityType and entityId are required"
    }, 400);
  }
  
  try {
    const feedback = await ctx.runQuery(api.feedback.getFeedbackByEntity, {
      entityType,
      entityId,
    });
    return c.json({ success: true, data: feedback });
  } catch (error: any) {
    console.error("Failed to get entity feedback:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get entity feedback",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

/**
 * GET /api/feedback/stats/:entityType
 * Get feedback statistics by entity type
 * Query params: userId (optional)
 */
app.get("/api/feedback/stats/:entityType", async (c) => {
  const ctx = c.env;
  const entityType = c.req.param("entityType");
  const { userId } = c.req.query();
  
  if (!["chat_message", "note_generation", "widget_output"].includes(entityType)) {
    return c.json({
      success: false,
      error: "Invalid entityType"
    }, 400);
  }
  
  try {
    const stats = await ctx.runQuery(api.feedback.getFeedbackStatsByType, {
      entityType: entityType as any,
      userId: userId || undefined,
    });
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

/**
 * GET /api/feedback/low-rated
 * Get recent low-rated content for monitoring
 * Query params: entityType (optional), maxRating (optional), limit (optional)
 */
app.get("/api/feedback/low-rated", async (c) => {
  const ctx = c.env;
  const { entityType, maxRating, limit } = c.req.query();
  
  try {
    const lowRated = await ctx.runQuery(api.feedback.getLowRatedContent, {
      entityType: entityType as any || undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return c.json({ success: true, data: lowRated });
  } catch (error: any) {
    console.error("Failed to get low-rated content:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get low-rated content",
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

app.post("/api/projects/getAllByUser", async (c) => {
  const ctx = c.env;
  const { userId } = await c.req.json();
  
  try {
    const projects = await ctx.runQuery(api.projectsQueries.getAllByUser, { 
      userId
    });
    return c.json({ success: true, data: projects });
  } catch (error: any) {
    console.error("Failed to get all user projects:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get all user projects",
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

// Batch fetch crystals by IDs (for context enrichment)
app.post("/api/crystal/getBatch", async (c) => {
  const ctx = c.env;
  
  try {
    const { userId, crystalIds, includeShards, includeRelated } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: "Missing required field: userId" }, 400);
    }
    if (!crystalIds || !Array.isArray(crystalIds)) {
      return c.json({ error: "Missing or invalid crystalIds array" }, 400);
    }
    
    const result = await ctx.runQuery(api.crystalContextOptimized.getBatchCrystalData, { 
      userId, 
      crystalIds,
      ...(includeShards !== undefined && { includeShards }),
      ...(includeRelated !== undefined && { includeRelated })
    });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to get batch crystal data:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get batch crystal data",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Single mutation endpoint that mirrors mutateCrystalData exactly
app.post("/api/crystal/mutate", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.crystalMutations.mutateCrystal, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Batch mutation endpoint for efficient bulk crystal operations
app.post("/api/crystal/batch-mutate", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.crystalMutations.batchMutateCrystals, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get crystals by user ID
 * Parallel to /api/shard/getByUser endpoint
 */
app.post("/api/crystal/getByUser", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.crystalQueries.getCrystalsByUser, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[GET CRYSTALS BY USER] Error fetching crystals:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/crystal/getAllByUser", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.crystalQueries.getAllCrystalsByUser, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[GET ALL CRYSTALS BY USER] Error fetching all crystals:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Query crystals with flexible filtering and indexing options
 * Connects to queryCrystal function in crystalQueries.ts
 */
app.post("/api/crystal/query", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.crystalQueries.queryCrystal, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[QUERY CRYSTALS] Error querying crystals:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});



// ===== SHARD OPERATIONS =====
// Separate endpoints for shard-specific operations

/**
 * Batch mutation endpoint for efficient bulk shard operations
 */
app.post("/api/shard/batch-mutate", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.shardMutations.batchMutateShards, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Single shard mutation endpoint (create, update, or delete)
 */
app.post("/api/shard/mutate", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.shardMutations.mutateShard, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Query shards with flexible parameters
 */
app.post("/api/shard/query", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.shardQueries.queryShard, requestBody);
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


// POST /api/vectorSearch/action - Direct action endpoint (calls hybridSearchContent or operations)
app.post("/api/vectorSearch/action", async (c) => {
  try {
    const requestBody = await c.req.json();
    const { userId, operation, query, contentType, contentIds, contentTypes, limit, threshold } = requestBody;
    
    if (!userId || !operation) {
      return c.json({ error: "userId and operation are required" }, 400);
    }
    
    // Handle get_by_content_ids operation
    if (operation === "get_by_content_ids") {
      if (!contentType || !contentIds) {
        return c.json({ error: "contentType and contentIds required for get_by_content_ids" }, 400);
      }
      
      const embeddings = await c.env.runQuery(internal.vectorSearch.getEmbeddingsByContentIds, {
        userId,
        contentType,
        contentIds
      });
      
      return c.json({
        success: true,
        data: embeddings || []
      });
    }
    
    // Handle similarity_search operation (default to hybridSearchContent)
    if (!query) {
      return c.json({ error: "query is required for similarity search" }, 400);
    }
    
    const results = await c.env.runAction(api.vectorSearch.hybridSearchContent, {
      userId,
      query,
      contentTypes: contentTypes || ["note", "crystal", "conversation", "shard", "stardust"],
      limit: limit || 10,
      minSimilarity: threshold || 0.35
    });
    
    return c.json({
      success: true,
      data: results || []
    });
  } catch (error) {
    console.error('Vector search action error:', error);
    return c.json({ 
      success: false, 
      error: `Vector search action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null 
    }, 500);
  }
});

// POST /api/vectorSearch/getEmbeddingsByContentIds - Get embeddings by content IDs (for clustering reuse)
app.post("/api/vectorSearch/getEmbeddingsByContentIds", async (c) => {
  try {
    const requestBody = await c.req.json();
    const { userId, contentType, contentIds } = requestBody;
    
    if (!userId || !contentType || !contentIds || !Array.isArray(contentIds)) {
      return c.json({ 
        success: false, 
        error: "userId, contentType, and contentIds array are required" 
      }, 400);
    }
    
    console.log(`🔍 [VECTOR_SEARCH] Getting embeddings by IDs for user ${userId}, type ${contentType}, count ${contentIds.length}`);
    
    const embeddings = await c.env.runQuery(internal.vectorSearch.getEmbeddingsByContentIds, {
      userId,
      contentType,
      contentIds
    });
    
    return c.json({
      success: true,
      data: embeddings || []
    });
  } catch (error) {
    console.error('Get embeddings by content IDs error:', error);
    return c.json({ 
      success: false, 
      error: `Failed to get embeddings by content IDs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null 
    }, 500);
  }
});

// POST /api/vectorSearch/similaritySearch - Direct similarity search endpoint
app.post("/api/vectorSearch/similaritySearch", async (c) => {
  try {
    const requestBody = await c.req.json();
    const { userId, query, contentTypes, limit, threshold } = requestBody;
    
    if (!userId || !query) {
      return c.json({ 
        success: false, 
        error: "userId and query are required" 
      }, 400);
    }
    
    console.log(`🔍 [VECTOR_SEARCH] Similarity search for user ${userId}, query: ${query.substring(0, 100)}...`);
    
    const results = await c.env.runAction(api.vectorSearch.hybridSearchContent, {
      userId,
      query,
      contentTypes: contentTypes || ["note", "crystal", "conversation", "shard", "stardust"],
      limit: limit || 10,
      minSimilarity: threshold || 0.35
    });
    
    return c.json({
      success: true,
      data: results || []
    });
  } catch (error) {
    console.error('Similarity search error:', error);
    return c.json({ 
      success: false, 
      error: `Similarity search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null 
    }, 500);
  }
});

// POST /api/vectorSearch/mutate - Store embeddings from backend
app.post("/api/vectorSearch/mutate", async (c) => {
  try {
    const requestBody = await c.req.json();
    const { userId, operation, contentId, contentType, ...rest } = requestBody;
    
    console.log(`🔵 [VECTOR] POST /api/vectorSearch/mutate - START`);
    console.log(`🔍 [VECTOR] Operation: ${operation}, User: ${userId}, ContentId: ${contentId}, ContentType: ${contentType}`);
    
    if (!userId || !operation) {
      console.error(`❌ [VECTOR] Missing required fields - userId: ${!!userId}, operation: ${!!operation}`);
      return c.json({ error: "userId and operation are required" }, 400);
    }
    
    const result = await c.env.runMutation(api.vectorSearchMutations.mutateEmbedding, {
      userId,
      operation,
      contentId,
      contentType,
      ...rest
    });
    
    console.log(`✅ [VECTOR] POST /api/vectorSearch/mutate - ${result.success ? 'SUCCESS' : 'FAILED'} (${result.success ? '200' : '400'})`);
    if (!result.success) {
      console.error(`❌ [VECTOR] Mutation failed: ${result.error}`);
    }
    
    return c.json(result);
  } catch (error) {
    console.error('❌ [VECTOR] Embedding mutation error:', error);
    return c.json({ 
      success: false, 
      error: 'Embedding mutation failed',
      data: null 
    }, 500);
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

// POST /api/vectorSearch/getAverageEmbedding - Get average embedding for content items (NO generation)
app.post("/api/vectorSearch/getAverageEmbedding", async (c) => {
  try {
    const requestBody = await c.req.json();
    const { userId, contentType, contentIds } = requestBody;
    
    if (!userId || !contentType || !contentIds || !Array.isArray(contentIds)) {
      return c.json({ 
        success: false, 
        error: "Missing required fields: userId, contentType, contentIds (array)" 
      }, 400);
    }
    
    console.log(`🔍 [GET_AVG_EMBEDDING] Getting average for ${contentIds.length} ${contentType} items`);
    
    const result = await c.env.runAction(internal.vectorSearch.getAverageEmbedding, {
      userId,
      contentType,
      contentIds
    });
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("❌ [GET_AVG_EMBEDDING] Error:", error);
    return c.json({
      success: false,
      error: error.message || "Failed to get average embedding"
    }, 500);
  }
});

// POST /api/vectorSearch/searchByEmbedding - Search using pre-computed embedding (NO generation)
app.post("/api/vectorSearch/searchByEmbedding", async (c) => {
  try {
    const requestBody = await c.req.json();
    const { userId, embedding, contentTypes, limit, threshold } = requestBody;
    
    if (!userId || !embedding || !Array.isArray(embedding)) {
      return c.json({ 
        success: false, 
        error: "Missing required fields: userId, embedding (array)" 
      }, 400);
    }
    
    console.log(`🔍 [SEARCH_BY_EMBEDDING] Searching with pre-computed embedding for user ${userId}`);
    
    const result = await c.env.runAction(internal.vectorSearch.searchByEmbedding, {
      userId,
      embedding,
      contentTypes: contentTypes || ["note", "crystal", "conversation", "shard", "stardust"],
      limit: limit || 10,
      threshold: threshold || 0.35
    });
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("❌ [SEARCH_BY_EMBEDDING] Error:", error);
    return c.json({
      success: false,
      error: error.message || "Failed to search by embedding"
    }, 500);
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

app.post("/api/contextEnrichmentBandit/deleteUserArms", async (c) => {
  const ctx = c.env;
  const { userId, agentType } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.contextEnrichmentBandit.deleteUserArms, { userId, agentType });
    return c.json(result);
  } catch (error: any) {
    console.error("[ContextMAB] Delete user arms error:", error);
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

/**
 * Get decision by ID
 */
app.post("/api/contextEnrichmentBandit/getDecisionById", async (c) => {
  const ctx = c.env;
  try {
    const { decisionId } = await c.req.json();
    
    const decision = await ctx.runQuery(api.contextEnrichmentBandit.getDecisionById, { decisionId });
    return c.json({ success: true, data: decision });
  } catch (error: any) {
    console.error("[ContextMAB] Get decision error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// === CONTEXT USAGE TRACKING ENDPOINTS ===
// Track which context items powered which outputs (chat, widgets, etc.)

/**
 * Track context usage for outputs
 */
app.post("/api/context/track_usage", async (c) => {
  const ctx = c.env;
  try {
    const args = await c.req.json();
    const result = await ctx.runMutation(api.contextUsageMutations.trackContextUsage, args);
    return c.json(result);
  } catch (error: any) {
    console.error("[ContextUsage] Track usage error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Update engagement score for a context usage log
 */
app.post("/api/context/update_engagement", async (c) => {
  const ctx = c.env;
  try {
    const args = await c.req.json();
    
    const result = await ctx.runMutation(api.contextUsageMutations.updateContextUsageEngagement, args);
    return c.json(result);
  } catch (error: any) {
    console.error("[ContextUsage] Update engagement error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get recent context usage logs (for debugging/verification)
 */
app.get("/api/context/recent", async (c) => {
  const ctx = c.env;
  try {
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 20;
    
    const result = await ctx.runQuery(api.contextUsageQueries.getRecentContextUsage, { limit });
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[ContextUsage] Get recent error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Count context usage logs
 */
app.get("/api/context/count", async (c) => {
  const ctx = c.env;
  try {
    const result = await ctx.runQuery(api.contextUsageQueries.countContextUsageLogs, {});
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[ContextUsage] Count error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get context usage logs with time window filtering
 * Used by fitness calculator for natural selection evolution
 */
app.post("/api/context-usage/get-usage-logs", async (c) => {
  const ctx = c.env;
  try {
    const args = await c.req.json();
    const result = await ctx.runQuery(api.contextUsageQueries.getUsageLogs, args);
    return c.json(result);
  } catch (error: any) {
    console.error("[ContextUsage] Get usage logs error:", error);
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

app.post("/api/shard/getByUser", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.shardQueries.getShardsByUser, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[GET SHARDS BY USER] Error fetching shards:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/api/shard/getAllByUser", async (c) => {
  const ctx = c.env;
  const requestBody = await c.req.json();
  
  try {
    const result = await ctx.runQuery(api.shardQueries.getAllShardsByUser, requestBody);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[GET ALL SHARDS BY USER] Error fetching all shards:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});




/**
 * Get unprocessed shards count
 */



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

// FINGERPRINT EVOLUTION SIGNALS ROUTES - MAB-driven evolution tracking

// Initialize signals for a fingerprint
app.post("/api/fingerprintSignals/initialize", async (c) => {
  try {
    const { fingerprintId, projectId, userId } = await c.req.json();
    const result = await c.env.runMutation(api.fingerprintSignalsMutations.initialize, {
      fingerprintId,
      projectId,
      userId
    });
    return c.json(result);
  } catch (error: any) {
    console.error("Failed to initialize signals:", error);
    return c.json({ 
      success: false, 
      error: "Failed to initialize signals",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Increment signal counter
app.post("/api/fingerprintSignals/increment", async (c) => {
  try {
    const { projectId, signalType, count } = await c.req.json();
    const result = await c.env.runMutation(api.fingerprintSignalsMutations.increment, {
      projectId,
      signalType,
      count
    });
    return c.json(result);
  } catch (error: any) {
    console.error("Failed to increment signal:", error);
    return c.json({ 
      success: false, 
      error: "Failed to increment signal",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Reset signals after evolution
app.post("/api/fingerprintSignals/reset", async (c) => {
  try {
    const { fingerprintId } = await c.req.json();
    const result = await c.env.runMutation(api.fingerprintSignalsMutations.reset, {
      fingerprintId
    });
    return c.json(result);
  } catch (error: any) {
    console.error("Failed to reset signals:", error);
    return c.json({ 
      success: false, 
      error: "Failed to reset signals",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get signals for a fingerprint
app.post("/api/fingerprintSignals/getByFingerprint", async (c) => {
  try {
    const { fingerprintId } = await c.req.json();
    const signals = await c.env.runQuery(api.fingerprintSignalsQueries.getByFingerprint, {
      fingerprintId
    });
    return c.json({ success: true, data: signals });
  } catch (error: any) {
    console.error("Failed to get signals:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get signals",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get signals for a project
app.post("/api/fingerprintSignals/getByProject", async (c) => {
  try {
    const { projectId } = await c.req.json();
    const signals = await c.env.runQuery(api.fingerprintSignalsQueries.getByProject, {
      projectId
    });
    return c.json({ success: true, data: signals });
  } catch (error: any) {
    console.error("Failed to get signals:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get signals",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get high signal fingerprints for MAB processing
app.post("/api/fingerprintSignals/getHighSignals", async (c) => {
  try {
    const { userId, threshold } = await c.req.json();
    const signals = await c.env.runQuery(api.fingerprintSignalsQueries.getHighSignals, {
      userId,
      threshold
    });
    return c.json({ success: true, data: signals });
  } catch (error: any) {
    console.error("Failed to get high signals:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get high signals",
      message: error.message || "Internal Server Error"
    }, 500);
  }
});

// Get all signals for a user
app.post("/api/fingerprintSignals/getAllByUser", async (c) => {
  try {
    const { userId } = await c.req.json();
    const signals = await c.env.runQuery(api.fingerprintSignalsQueries.getAllByUser, {
      userId
    });
    return c.json({ success: true, data: signals });
  } catch (error: any) {
    console.error("Failed to get user signals:", error);
    return c.json({ 
      success: false, 
      error: "Failed to get user signals",
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
// STARDUST ROUTES - Parallel Species ("What You Do")
// ============================================================================
// Stardust represents concrete project potentials that evolve into star organisms
// Parallel species to Crystals: Crystals = "Who You Are", Stardust = "What You Do"
// Code-based detection (zero LLM cost), flows through crystal dam alongside shards

/**
 * List stardust for a user
 */
app.post("/api/stardust/list", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const stardust = await ctx.runQuery(api.stardustQueries.listStardust, {
      userId: body.userId,
      minConfidence: body.minConfidence,
      includePromoted: body.includePromoted ?? false,
      limit: body.limit,
    });
    
    return c.json({ success: true, data: stardust });
  } catch (error: any) {
    console.error("[STARDUST_LIST] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to list stardust"
    }, 500);
  }
});


/**
 * Get a specific stardust by ID
 */
app.post("/api/stardust/get", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const stardust = await ctx.runQuery(api.stardustQueries.getStardust, {
      stardustId: body.stardustId as Id<"stardust">,
    });
    
    if (!stardust) {
      return c.json({ 
        success: false,
        error: "Stardust not found"
      }, 404);
    }
    
    return c.json({ success: true, data: stardust });
  } catch (error: any) {
    console.error("[STARDUST_GET] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get stardust"
    }, 500);
  }
});


/**
 * Get stardust ready for promotion
 */
app.post("/api/stardust/readyForPromotion", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const stardust = await ctx.runQuery(api.stardustQueries.getStardustReadyForPromotion, {
      userId: body.userId,
      confidenceThreshold: body.confidenceThreshold,
    });
    
    return c.json({ success: true, data: stardust });
  } catch (error: any) {
    console.error("[STARDUST_READY_FOR_PROMOTION] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get stardust ready for promotion"
    }, 500);
  }
});


/**
 * Get stardust statistics
 */
app.post("/api/stardust/statistics", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const stats = await ctx.runQuery(api.stardustQueries.getStardustStatistics, {
      userId: body.userId,
    });
    
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("[STARDUST_STATISTICS] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get stardust statistics"
    }, 500);
  }
});


/**
 * Create a new stardust - Crystal Pattern (direct passthrough)
 * 
 * Following established Crystal atomic pattern:
 * - No manual field mapping
 * - Direct passthrough to mutation
 * - Schema validates at insert time
 */
app.post("/api/stardust/create", async (c) => {
  try {
    const ctx = c.env;
    const requestBody = await c.req.json();
    
    // Validate userId is provided
    if (!requestBody.userId) {
      return c.json({ 
        success: false,
        error: "userId is required in request body"
      }, 400);
    }
    
    const result = await ctx.runMutation(
      api.stardustMutations.createStardust,
      { stardustData: requestBody }
    );
    
    return c.json({ success: true, data: { stardustId: result } });
  } catch (error: any) {
    console.error("[STARDUST_CREATE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to create stardust"
    }, 500);
  }
});


/**
 * Update a stardust - Crystal Pattern (direct passthrough)
 */
app.post("/api/stardust/update", async (c) => {
  try {
    const ctx = c.env;
    const requestBody = await c.req.json();
    
    const result = await ctx.runMutation(api.stardustMutations.updateStardust, {
      stardustId: requestBody.stardustId as Id<"stardust">,
      updates: requestBody.updates,
    });
    
    return c.json({ success: true, data: { stardustId: result } });
  } catch (error: any) {
    console.error("[STARDUST_UPDATE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to update stardust"
    }, 500);
  }
});


/**
 * Promote a stardust to project
 */
app.post("/api/stardust/promote", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const stardustId = await ctx.runMutation(api.stardustMutations.promoteStardust, {
      stardustId: body.stardustId as Id<"stardust">,
      projectId: body.projectId as Id<"projects">,
      confidenceAtPromotion: body.confidenceAtPromotion,
    });
    
    return c.json({ success: true, data: { stardustId } });
  } catch (error: any) {
    console.error("[STARDUST_PROMOTE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to promote stardust"
    }, 500);
  }
});


/**
 * Delete a stardust
 */
app.post("/api/stardust/delete", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    await ctx.runMutation(api.stardustMutations.deleteStardust, {
      stardustId: body.stardustId as Id<"stardust">,
    });
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error("[STARDUST_DELETE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to delete stardust"
    }, 500);
  }
});


/**
 * Get stardust by lifecycle stage
 */
app.post("/api/stardust/byLifecycleStage", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const stardust = await ctx.runQuery(api.stardustQueries.getStardustByLifecycleStage, {
      userId: body.userId,
      lifecycleStage: body.lifecycleStage,
    });
    
    return c.json({ success: true, data: stardust });
  } catch (error: any) {
    console.error("[STARDUST_BY_LIFECYCLE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get stardust by lifecycle stage"
    }, 500);
  }
});


/**
 * Get stardust by domain
 */
app.post("/api/stardust/byDomain", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const stardust = await ctx.runQuery(api.stardustQueries.getStardustByDomain, {
      userId: body.userId,
      domain: body.domain,
    });
    
    return c.json({ success: true, data: stardust });
  } catch (error: any) {
    console.error("[STARDUST_BY_DOMAIN] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get stardust by domain"
    }, 500);
  }
});


/**
 * Batch create stardust
 * 
 * CRITICAL: Each stardust in stardustList must include userId for backend toolkit compatibility
 */
app.post("/api/stardust/batchCreate", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    // Validate stardustList is provided
    if (!body.stardustList || !Array.isArray(body.stardustList)) {
      return c.json({ 
        success: false,
        error: "stardustList array is required in request body"
      }, 400);
    }
    
    // Validate each stardust has userId
    for (const stardust of body.stardustList) {
      if (!stardust.userId) {
        return c.json({ 
          success: false,
          error: "userId is required for each stardust in stardustList"
        }, 400);
      }
    }
    
    const stardustIds = await ctx.runMutation(api.stardustMutations.batchCreateStardust, {
      stardustList: body.stardustList,
    });
    
    return c.json({ success: true, data: { stardustIds } });
  } catch (error: any) {
    console.error("[STARDUST_BATCH_CREATE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to batch create stardust"
    }, 500);
  }
});


/**
 * Batch update stardust
 */
app.post("/api/stardust/batchUpdate", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const stardustIds = await ctx.runMutation(api.stardustMutations.batchUpdateStardust, {
      updates: body.updates,
    });
    
    return c.json({ success: true, data: stardustIds });
  } catch (error: any) {
    console.error("[STARDUST_BATCH_UPDATE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to batch update stardust"
    }, 500);
  }
});


/**
 * Evolve stardust lifecycle
 */
app.post("/api/stardust/evolveLifecycle", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const stardustId = await ctx.runMutation(api.stardustMutations.evolveStardustLifecycle, {
      stardustId: body.stardustId as Id<"stardust">,
      newStage: body.newStage,
      healthDelta: body.healthDelta,
      energyDelta: body.energyDelta,
    });
    
    return c.json({ success: true, data: { stardustId } });
  } catch (error: any) {
    console.error("[STARDUST_EVOLVE_LIFECYCLE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to evolve stardust lifecycle"
    }, 500);
  }
});


/**
 * Create symbiotic pair between stardust and crystal
 */
app.post("/api/stardust/createSymbioticPair", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const stardustId = await ctx.runMutation(api.stardustMutations.createSymbioticPair, {
      stardustId: body.stardustId as Id<"stardust">,
      crystalId: body.crystalId,
      pairDescription: body.pairDescription,
    });
    
    return c.json({ success: true, data: { stardustId } });
  } catch (error: any) {
    console.error("[STARDUST_CREATE_SYMBIOTIC_PAIR] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to create symbiotic pair"
    }, 500);
  }
});

/**
 * Batch delete multiple stardust
 */
app.post("/api/stardust/batchDelete", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const result = await ctx.runMutation(api.stardustMutations.batchDeleteStardust, {
      stardustIds: body.stardustIds,
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[STARDUST_BATCH_DELETE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to batch delete stardust"
    }, 500);
  }
});

/**
 * Evolve stardust lifecycle stage
 */
app.post("/api/stardust/evolveLifecycle", async (c) => {
  try {
    const ctx = c.env;
    const body = await c.req.json();
    
    const stardustId = await ctx.runMutation(api.stardustMutations.evolveStardustLifecycle, {
      stardustId: body.stardustId as Id<"stardust">,
      newStage: body.newStage,
      healthDelta: body.healthDelta,
      energyDelta: body.energyDelta,
    });
    
    return c.json({ success: true, data: { stardustId } });
  } catch (error: any) {
    console.error("[STARDUST_EVOLVE_LIFECYCLE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to evolve stardust lifecycle"
    }, 500);
  }
});

// Cognative Fields Routes
app.post("/api/cognative/create", async (c) => {
  try {
    const body = await c.req.json();
    const field = await c.env.runMutation(api.cognitiveMutations.createCognitiveField, body);
    return c.json({ success: true, data: field });
  } catch (error: any) {
    console.error("[COGNATIVE_CREATE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to create cognative field"
    }, 500);
  }
});

app.post("/api/cognative/mutate", async (c) => {
  try {
    const body = await c.req.json();
    const field = await c.env.runMutation(api.cognitiveMutations.mutateCognitiveField, body);
    return c.json({ success: true, data: field });
  } catch (error: any) {
    console.error("[COGNATIVE_MUTATE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to mutate cognative field"
    }, 500);
  }
});

app.post("/api/cognative/delete", async (c) => {
  try {
    const body = await c.req.json();
    const field = await c.env.runMutation(api.cognitiveMutations.deleteCognitiveField, body);
    return c.json({ success: true, data: field });
  } catch (error: any) {
    console.error("[COGNATIVE_DELETE] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to delete cognative field"
    }, 500);
  }
});

app.post("/api/cognative/query", async (c) => {
  try {
    const body = await c.req.json();
    const field = await c.env.runQuery(api.cognitiveQueries.queryCognitiveField, body);
    return c.json({ success: true, data: field });
  } catch (error: any) {
    console.error("[COGNATIVE_GET] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to query cognative field"
    }, 500);
  }
});

app.post("/api/cognative/getAll", async (c) => {
  try {
    const body = await c.req.json();
    const fields = await c.env.runQuery(api.cognitiveQueries.getAllCognitiveFields, body);
    return c.json({ success: true, data: fields });
  } catch (error: any) {
    console.error("[COGNATIVE_GET_ALL] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get all cognative fields"
    }, 500);
  }
});

app.post("/api/cognative/count", async (c) => {
  try {
    const body = await c.req.json();
    const count = await c.env.runQuery(api.cognitiveQueries.countCognitiveFields, body);
    return c.json({ success: true, data: count });
  } catch (error: any) {
    console.error("[COGNATIVE_COUNT] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to count cognative fields"
    }, 500);
  }
});

app.post("/api/cognative/getNeedingOptimization", async (c) => {
  try {
    const body = await c.req.json();
    const fields = await c.env.runQuery(api.cognitiveQueries.getCognitiveFieldsNeedingOptimization, body);
    return c.json({ success: true, data: fields });
  } catch (error: any) {
    console.error("[COGNATIVE_GET_NEEDING_OPTIMIZATION] Error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get needing optimization cognative fields"
    }, 500);
  }
});

// ============================================================================
// CONVERGENCE PRESET CONFIGS
// ============================================================================

/**
 * Get all preset configurations
 */
app.get("/api/convergence/preset-configs", async (c) => {
  try {
    const presets = await c.env.runQuery(api.convergencePresetQueries.getPresetConfigs, {});
    
    return c.json({
      success: true,
      data: presets
    });
  } catch (error) {
    console.error("[CONVERGENCE] Get preset configs error:", error);
    return c.json({
      success: false,
      error: "Failed to get preset configs"
    }, 500);
  }
});

/**
 * Get a specific preset configuration by preset_id
 */
app.get("/api/convergence/preset-configs/:preset_id", async (c) => {
  try {
    const presetId = c.req.param("preset_id");
    const preset = await c.env.runQuery(api.convergencePresetQueries.getPresetConfigById, {
      preset_id: presetId
    });
    
    if (!preset) {
      return c.json({
        success: false,
        error: `Preset '${presetId}' not found`
      }, 404);
    }
    
    return c.json({
      success: true,
      data: preset
    });
  } catch (error) {
    console.error("[CONVERGENCE] Get preset config error:", error);
    return c.json({
      success: false,
      error: "Failed to get preset config"
    }, 500);
  }
});

/**
 * Create a new preset configuration
 */
app.post("/api/convergence/preset-configs", async (c) => {
  try {
    const body = await c.req.json();
    
    const configId = await c.env.runMutation(api.convergencePresetMutations.createPresetConfig, body);
    
    return c.json({ success: true, data: { configId } });
  } catch (error: any) {
    console.error("[CONVERGENCE] Create preset config error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to create preset config"
    }, 500);
  }
});

/**
 * Update a preset configuration
 */
app.patch("/api/convergence/preset-configs/:configId", async (c) => {
  try {
    const configId = c.req.param("configId") as Id<"convergence_preset_configs">;
    const body = await c.req.json();
    
    await c.env.runMutation(api.convergencePresetMutations.updatePresetConfig, {
      id: configId,
      ...body
    });
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error("[CONVERGENCE] Update preset config error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to update preset config"
    }, 500);
  }
});

/**
 * Delete a preset configuration
 */
app.delete("/api/convergence/preset-configs/:configId", async (c) => {
  try {
    const configId = c.req.param("configId") as Id<"convergence_preset_configs">;
    
    await c.env.runMutation(api.convergencePresetMutations.deletePresetConfig, {
      id: configId
    });
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error("[CONVERGENCE] Delete preset config error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to delete preset config"
    }, 500);
  }
});

// ============================================================================
// CONVERGENCE STORAGE ROUTES - Experiments, Optimization Runs
// ============================================================================

/**
 * Save optimization experiment
 */
app.post("/api/convergence/storage/experiments", async (c) => {
  try {
    const body = await c.req.json();
    
    const experimentId = await c.env.runMutation(api.convergenceStorageMutations.saveExperiment, body);
    
    return c.json({ success: true, data: { experimentId } });
  } catch (error: any) {
    console.error("[CONVERGENCE_STORAGE] Save experiment error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to save experiment"
    }, 500);
  }
});

/**
 * Batch save experiments
 */
app.post("/api/convergence/storage/experiments/batch", async (c) => {
  try {
    const body = await c.req.json();
    
    const result = await c.env.runMutation(api.convergenceStorageMutations.batchSaveExperiments, {
      experiments: body.experiments,
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[CONVERGENCE_STORAGE] Batch save experiments error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to batch save experiments"
    }, 500);
  }
});

/**
 * Get experiments for run
 */
app.get("/api/convergence/storage/experiments/run/:optimization_run_id", async (c) => {
  try {
    const optimization_run_id = c.req.param("optimization_run_id");
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 1000;
    
    const data = await c.env.runQuery(api.convergenceStorageQueries.getExperimentsForRun, {
      optimization_run_id,
      limit,
    });
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("[CONVERGENCE_STORAGE] Get experiments for run error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get experiments for run"
    }, 500);
  }
});

/**
 * Get experiments by system
 */
app.get("/api/convergence/storage/experiments/system/:system_name", async (c) => {
  try {
    const system_name = c.req.param("system_name");
    const min_score = c.req.query("min_score") ? parseFloat(c.req.query("min_score")!) : undefined;
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 100;
    
    const data = await c.env.runQuery(api.convergenceStorageQueries.getExperimentsBySystem, {
      system_name,
      min_score,
      limit,
    });
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("[CONVERGENCE_STORAGE] Get experiments by system error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get experiments by system"
    }, 500);
  }
});

/**
 * Get evolution progress
 */
app.get("/api/convergence/storage/experiments/evolution/:optimization_run_id", async (c) => {
  try {
    const optimization_run_id = c.req.param("optimization_run_id");
    const generation = c.req.query("generation") ? parseInt(c.req.query("generation")!) : undefined;
    
    const data = await c.env.runQuery(api.convergenceStorageQueries.getEvolutionProgress, {
      optimization_run_id,
      generation,
    });
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("[CONVERGENCE_STORAGE] Get evolution progress error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get evolution progress"
    }, 500);
  }
});

/**
 * Start optimization run
 */
app.post("/api/convergence/storage/runs/start", async (c) => {
  try {
    const body = await c.req.json();
    
    const runId = await c.env.runMutation(api.convergenceStorageMutations.startOptimizationRun, body);
    
    return c.json({ success: true, data: { runId } });
  } catch (error: any) {
    console.error("[CONVERGENCE_STORAGE] Start optimization run error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to start optimization run"
    }, 500);
  }
});

/**
 * Complete optimization run
 */
app.post("/api/convergence/storage/runs/complete", async (c) => {
  try {
    const body = await c.req.json();
    
    const runId = await c.env.runMutation(api.convergenceStorageMutations.completeOptimizationRun, body);
    
    return c.json({ success: true, data: { runId } });
  } catch (error: any) {
    console.error("[CONVERGENCE_STORAGE] Complete optimization run error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to complete optimization run"
    }, 500);
  }
});

/**
 * Get optimization run
 */
app.get("/api/convergence/storage/runs/:run_id", async (c) => {
  try {
    const run_id = c.req.param("run_id");
    
    const data = await c.env.runQuery(api.convergenceStorageQueries.getOptimizationRun, {
      run_id,
    });
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("[CONVERGENCE_STORAGE] Get optimization run error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get optimization run"
    }, 500);
  }
});

/**
 * Get runs for system
 */
app.get("/api/convergence/storage/runs/system/:system_name", async (c) => {
  try {
    const system_name = c.req.param("system_name");
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 50;
    
    const data = await c.env.runQuery(api.convergenceStorageQueries.getRunsForSystem, {
      system_name,
      limit,
    });
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("[CONVERGENCE_STORAGE] Get runs for system error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get runs for system"
    }, 500);
  }
});

/**
 * Get system optimization stats
 */
app.get("/api/convergence/storage/stats/:system_name", async (c) => {
  try {
    const system_name = c.req.param("system_name");
    
    const data = await c.env.runQuery(api.convergenceStorageQueries.getSystemOptimizationStats, {
      system_name,
    });
    
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("[CONVERGENCE_STORAGE] Get system optimization stats error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to get system optimization stats"
    }, 500);
  }
});

// ============================================================================
// BRIEFING ROOM ENDPOINTS
// ============================================================================

/**
 * Publish system intelligence briefing
 */
app.post("/api/briefing/publishSystemIntelligence", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, alertType, title, description, priority, metadata } = body;
    
    const eventId = await c.env.runMutation(internal.briefingRoomInternal.publishSystemIntelligenceBriefing, {
      userId,
      alertType,
      title,
      description,
      priority: priority || "medium",
      metadata: metadata || {},
    });
    
    return c.json({ success: true, data: eventId });
  } catch (error: any) {
    console.error("[BRIEFING] Publish system intelligence error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to publish system intelligence briefing"
    }, 500);
  }
});

/**
 * Publish crystal formation briefing
 */
app.post("/api/briefing/publishCrystalFormation", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, crystalId, crystalName, crystalType, confidenceScore, coreInsight, shardCount } = body;
    
    const eventId = await c.env.runMutation(internal.briefingRoomInternal.publishCrystalFormationBriefing, {
      userId,
      crystalId,
      crystalName,
      crystalType,
      confidenceScore,
      coreInsight,
      shardCount,
    });
    
    return c.json({ success: true, data: eventId });
  } catch (error: any) {
    console.error("[BRIEFING] Publish crystal formation error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to publish crystal formation briefing"
    }, 500);
  }
});

/**
 * Publish widget completion briefing
 */
app.post("/api/briefing/publishWidgetCompletion", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, widgetId, widgetTitle, widgetType, completedAt, summary, projectId } = body;
    
    const eventId = await c.env.runMutation(internal.briefingRoomInternal.publishWidgetCompletionBriefing, {
      userId,
      widgetId,
      widgetTitle,
      widgetType,
      completedAt,
      summary,
      projectId,
    });
    
    return c.json({ success: true, data: eventId });
  } catch (error: any) {
    console.error("[BRIEFING] Publish widget completion error:", error);
    return c.json({ 
      success: false,
      error: error.message || "Failed to publish widget completion briefing"
    }, 500);
  }
});

// ============================================================================
// CONVERGENCE CURRENT CONFIG
// ============================================================================

/**
 * Get current config for a user
 */
app.get("/api/convergence/current-config/:user_id", async (c) => {
  try {
    const userId = c.req.param("user_id");
    const currentConfig = await c.env.runQuery(api.convergenceCurrentConfigQueries.getCurrentConfig, {
      user_id: userId
    });
    
    return c.json({
      success: true,
      data: currentConfig
    });
  } catch (error) {
    console.error("[CONVERGENCE] Get current config error:", error);
    return c.json({
      success: false,
      error: "Failed to get current config"
    }, 500);
  }
});

/**
 * Set current config for a user
 */
app.post("/api/convergence/current-config", async (c) => {
  try {
    const args = await c.req.json();
    const configId = await c.env.runMutation(api.convergenceCurrentConfigMutations.setCurrentConfig, args);
    
    return c.json({
      success: true,
      data: configId
    });
  } catch (error) {
    console.error("[CONVERGENCE] Set current config error:", error);
    return c.json({
      success: false,
      error: "Failed to set current config"
    }, 500);
  }
});

/**
 * Update current config status
 */
app.patch("/api/convergence/current-config/status", async (c) => {
  try {
    const args = await c.req.json();
    await c.env.runMutation(api.convergenceCurrentConfigMutations.updateCurrentConfigStatus, args);
    
    return c.json({
      success: true
    });
  } catch (error) {
    console.error("[CONVERGENCE] Update current config status error:", error);
    return c.json({
      success: false,
      error: "Failed to update current config status"
    }, 500);
  }
});

/**
 * Clear current config for a user
 */
app.delete("/api/convergence/current-config/:user_id", async (c) => {
  try {
    const userId = c.req.param("user_id");
    await c.env.runMutation(api.convergenceCurrentConfigMutations.clearCurrentConfig, {
      user_id: userId
    });
    
    return c.json({
      success: true
    });
  } catch (error) {
    console.error("[CONVERGENCE] Clear current config error:", error);
    return c.json({
      success: false,
      error: "Failed to clear current config"
    }, 500);
  }
});

// ============================================================================
// CONVERGENCE BEST CONFIGS
// ============================================================================

/**
 * Save or update best config for a system
 */
app.post("/api/convergence/best-configs", async (c) => {
  try {
    const args = await c.req.json();
    const configId = await c.env.runMutation(api.convergenceBestConfigMutations.saveBestConfig, args);
    
    return c.json({
      success: true,
      data: { configId }
    });
  } catch (error: any) {
    console.error("[CONVERGENCE] Save best config error:", error);
    return c.json({
      success: false,
      error: error.message || "Failed to save best config"
    }, 500);
  }
});

/**
 * Get all best configs (one per system)
 */
app.get("/api/convergence/best-configs", async (c) => {
  try {
    const configs = await c.env.runQuery(api.convergenceBestConfigQueries.getAllBestConfigs, {});
    
    return c.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error("[CONVERGENCE] Get all best configs error:", error);
    return c.json({
      success: false,
      error: "Failed to get best configs"
    }, 500);
  }
});

/**
 * Get best config for a specific system
 */
app.get("/api/convergence/best-configs/:system_name", async (c) => {
  try {
    const systemName = c.req.param("system_name");
    const config = await c.env.runQuery(api.convergenceBestConfigQueries.getBestConfig, {
      system_name: systemName
    });
    
    return c.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error("[CONVERGENCE] Get best config error:", error);
    return c.json({
      success: false,
      error: "Failed to get best config"
    }, 500);
  }
});

// ============================================================================
// CONVERGENCE OPTIMIZATION RUNS
// ============================================================================

/**
 * Save optimization run history
 */
app.post("/api/convergence/optimization-runs", async (c) => {
  try {
    const args = await c.req.json();
    const runId = await c.env.runMutation(api.convergenceOptimizationRuns.saveRunHistory, args);
    
    return c.json({
      success: true,
      data: { runId }
    });
  } catch (error: any) {
    console.error("[CONVERGENCE] Save run history error:", error);
    return c.json({
      success: false,
      error: error.message || "Failed to save run history"
    }, 500);
  }
});

const router = new HttpRouterWithHono(app);
export default router;