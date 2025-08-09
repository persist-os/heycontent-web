import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
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

// Gmail quota optimization endpoints
app.post("/api/query/getLastGmailFetch", async (c) => {
  const ctx = c.env;
  const { userId } = await c.req.json();

  if (!userId) {
    return c.json({ success: false, error: "Missing userId" }, 400);
  }

  try {
    const timestamp = await ctx.runQuery(api.userQueries.getLastGmailFetch, { userId });
    return c.json({ success: true, data: timestamp });
  } catch (error) {
    console.error("Failed to get last Gmail fetch timestamp:", error);
    return c.json({ success: false, error: "Failed to get last Gmail fetch timestamp" }, 500);
  }
});

app.post("/api/mutation/updateLastGmailFetch", async (c) => {
  const ctx = c.env;
  const { userId, timestamp } = await c.req.json();

  if (!userId) {
    return c.json({ success: false, error: "Missing userId" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.userMutations.updateLastGmailFetch, { 
      userId,
      timestamp
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to update last Gmail fetch timestamp:", error);
    return c.json({ success: false, error: "Failed to update last Gmail fetch timestamp" }, 500);
  }
});

// Store Gmail thread analysis
app.post("/api/mutation/storeGmailThreadAnalysis", async (c) => {
  const ctx = c.env;
  const { userId, threadId, analysis } = await c.req.json();

  if (!userId || !threadId || !analysis) {
    return c.json({ success: false, error: "Missing userId, threadId, or analysis" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.gmailMutations.storeGmailThreadAnalysis, { 
      userId,
      threadId,
      analysis
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to store Gmail thread analysis:", error);
    return c.json({ success: false, error: "Failed to store Gmail thread analysis" }, 500);
  }
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

// GMAIL ROUTES

// Gmail token endpoints
// Get Gmail tokens for a user
app.get("/api/users/:id/gmail/tokens", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  try {
    const token = await ctx.runQuery(api.gmailQueries.getGmailToken, { userId });
    return c.json({ success: true, token });
  } catch (error) {
    console.error("Failed to get Gmail tokens:", error);
    return c.json({ success: false, error: "Failed to retrieve Gmail tokens" }, 500);
  }
});

// Update Gmail token
app.post("/api/users/:id/gmail/token", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { accessToken, refreshToken, expiryDate, scope, tokenType } = await c.req.json();

  if (!accessToken || !refreshToken || !expiryDate) {
    return c.json({ success: false, error: "Missing required token fields" }, 400);
  }

  try {
    await ctx.runMutation(api.gmailMutations.updateGmailToken, {
      userId,
      accessToken,
      refreshToken,
      expiryDate,
      scope: scope || "",
      tokenType: tokenType || "Bearer",
    });
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to store Gmail token:", error);
    return c.json({ success: false, error: "Failed to store Gmail token" }, 500);
  }
});

// Store Gmail account data
app.post("/api/users/:id/gmail/account", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { email, messagesTotal, threadsTotal, labelsTotal, historyId } = await c.req.json();
  
  if (!email) {
    return c.json({ success: false, error: "Email is required" }, 400);
  }

  try {
    // Use the saveProfileData mutation
    const result = await ctx.runMutation(api.gmailMutations.saveProfileData, {
      userId,
      email,
      profileData: {
        messagesTotal,
        threadsTotal,
        historyId,
        labelsTotal,
      }
    });
    
    return c.json({ 
      success: true,
      status: result.status,
    });
  } catch (error) {
    console.error("Failed to store Gmail account data:", error);
    return c.json({ 
      success: false, 
      error: `Failed to store Gmail account data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// Store full Gmail profile (account + messages + threads) for a user
app.post("/api/users/:id/gmail/full_profile", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { account, messages, threads } = await c.req.json();
  
  if (!account || !account.email) {
    return c.json({ success: false, error: "Account and email are required" }, 400);
  }
  
  try {
    const result = await ctx.runMutation(api.gmailMutations.storeGmailFullProfile, {
      userId,
      account,
      messages,
      threads,
    });
    
    return c.json({ 
      success: true,
      result
    });
  } catch (error) {
    console.error("Error storing Gmail full profile:", error);
    return c.json({ 
      success: false, 
      error: `Failed to store Gmail profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// Add the missing full-sync route that the backend is calling
app.post("/api/users/:id/gmail/full-sync", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { data } = await c.req.json();
  
  if (!data || !data.account || !data.account.email) {
    return c.json({ success: false, error: "Data with account and email are required" }, 400);
  }
  
  try {
    const result = await ctx.runMutation(api.gmailMutations.storeGmailFullProfile, {
      userId,
      account: data.account,
      messages: data.messages || [],
      threads: data.threads || [],
    });
    
    return c.json({ 
      success: true,
      result
    });
  } catch (error) {
    console.error("Error storing Gmail full sync:", error);
    return c.json({ 
      success: false, 
      error: `Failed to store Gmail full sync: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// Store a single Gmail thread for a user
app.post("/api/users/:id/gmail/thread", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const {
    email,
    threadId,
    snippet,
    historyId,
    labelIds,
    message_count,
    messages,
    category, // <-- Accept category from request body
  } = await c.req.json();

  // Fix: Convex does not accept null for labelIds
  const safeLabelIds = Array.isArray(labelIds) ? labelIds : undefined;

  if (!email || !threadId) {
    return c.json({ success: false, error: "Missing required fields: email, threadId" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.gmailMutations.storeGmailThread, {
      userId,
      email,
      threadId,
      message_count,
      messages,
      data: { snippet, historyId, labelIds: safeLabelIds },
      category, // <-- Forward category to mutation
    });
    return c.json({ success: true, result });
  } catch (error) {
    console.error("Failed to store Gmail thread:", error);
    return c.json({ success: false, error: `Failed to store Gmail thread: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// YOUTUBE ROUTES

// Get YouTube tokens for a user
app.get("/api/users/:id/youtube/tokens", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  try {
    const tokens = await ctx.runQuery(api.youtubeQueries.getYouTubeTokens, { userId });
    return c.json({ success: true, tokens });
  } catch (error) {
    console.error("Failed to get user tokens:", error);
    return c.json({ success: false, error: "Failed to retrieve user tokens" }, 500);
  }
});

// Store YouTube video analysis
app.post("/api/users/:userId/youtube/videos/:videoId/analysis", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("userId");
  const videoId = c.req.param("videoId");
  const { analysisData } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.youtubeMutations.storeVideoAnalysis, { 
      userId, 
      videoId, 
      analysisData 
    });
    return c.json(result);
  } catch (error) {
    console.error("Failed to store video analysis:", error);
    return c.json({ 
      success: false, 
      error: `Failed to store video analysis: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
  }
});

// Update YouTube token
app.post("/api/users/:id/youtube/token", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { accessToken, refreshToken, expiresAt, tokenType, scope } = await c.req.json();

  // Ensure scope is an array of strings
  const scopeArray = Array.isArray(scope)
    ? scope
    : typeof scope === "string"
    ? scope.split(" ")
    : [];

  try {
    await ctx.runMutation(api.youtubeMutations.update_youtube_token, {
      userId,
      accessToken,
      refreshToken,
      expiresAt,
      tokenType,
      scope: scopeArray,
    });
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to store YouTube token:", error);
    return c.json({ success: false, error: "Failed to store YouTube token" }, 500);
  }
});

// Store full YouTube profile (channel + videos) for a user
app.post("/api/users/:id/youtube/full_profile", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { channel, videos } = await c.req.json();
  await ctx.runMutation(api.youtubeMutations.storeYoutubeFullProfile, {
    userId,
    channel,
    videos,
  });
  return c.json({ success: true });
});

// Store YouTube channel data
app.post("/api/users/:id/youtube/channel", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { channelId, title, description, customUrl, thumbnails, statistics } = await c.req.json();
  
  try {
    await ctx.runMutation(api.youtubeMutations.saveChannelData, {
      userId,
      channelId,
      title,
      description,
      customUrl,
      thumbnails,
      statistics,
      updatedAt: Date.now()
    });
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to store YouTube channel data:", error);
    return c.json({ 
      success: false, 
      error: `Failed to store YouTube channel data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// Store individual YouTube video data
app.post("/api/users/:id/youtube/videos", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { videoId, videoData } = await c.req.json();
  
  if (!videoId || !videoData) {
    return c.json({ success: false, error: "Missing required fields: videoId and videoData" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.youtubeMutations.storeVideoData, { 
      userId, 
      videoId, 
      videoData 
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to store YouTube video data:", error);
    return c.json({ 
      success: false, 
      error: `Failed to store YouTube video data: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
  }
});

// Get stored videos for a channel
app.get("/api/users/:id/youtube/channels/:channelId/videos", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const channelId = c.req.param("channelId");
  const { limit } = c.req.query();
  
  try {
    const videos = await ctx.runQuery(api.youtubeQueries.getVideosByChannel, {
      userId,
      channelId,
      limit: limit ? parseInt(limit) : undefined
    });
    return c.json({ success: true, data: videos });
  } catch (error) {
    console.error("Failed to get stored videos:", error);
    return c.json({ 
      success: false, 
      error: `Failed to get stored videos: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// Get all video analyses for a user
app.get("/api/users/:id/youtube/video-analyses", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  
  try {
    const analyses = await ctx.runQuery(api.youtubeQueries.getVideoAnalyses, { userId });
    return c.json({ success: true, data: analyses });
  } catch (error) {
    console.error("Failed to get video analyses:", error);
    return c.json({ 
      success: false, 
      error: `Failed to get video analyses: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// Get full details for a specific YouTube video (including analysis)
app.get("/api/users/:id/youtube/videos/:videoId", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const videoId = c.req.param("videoId");
  try {
    const video = await ctx.runQuery(api.youtubeQueries.getFullVideoDetails, { userId, videoId });
    if (!video) {
      return c.json({ success: false, error: "Video not found" }, 404);
    }
    return c.json({ success: true, video });
  } catch (error) {
    console.error("Failed to get full video details:", error);
    return c.json({ success: false, error: "Failed to get full video details" }, 500);
  }
});

// INSTAGRAM ROUTES

// Instagram data deletion request URL
app.post("/instagram/:id/delete", async (c) => {
const ctx = c.env;
const userId = c.req.param("id");
try {
    const result = await ctx.runMutation(api.instagramMutations.disconnectInstagram, { 
    userId: userId 
    });
    
    if (result.success) {
    return c.json({ success: true });
    } else {
    return c.json({ success: false, error: result }, 400);
    }
} catch (error) {
    console.error("Error processing Instagram data deletion request:", error);
    return c.json({ 
    success: false, 
    error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
}
});

// Get Instagram tokens for a user (now from instagramAccounts)
app.get("/api/users/:id/instagram/tokens", async (c) => {
const ctx = c.env;
const userId = c.req.param("id");
try {
    const tokens = await ctx.runQuery(api.instagramQueries.getInstagramTokens, { userId });
    return c.json({ success: true, tokens });
} catch (error) {
    console.error("Failed to get Instagram tokens:", error);
    return c.json({ success: false, error: "Failed to retrieve Instagram tokens" }, 500);
}
});

// Get Instagram account data for a user
app.get("/api/users/:id/instagram/account", async (c) => {
const ctx = c.env;
const userId = c.req.param("id");
try {
    const account = await ctx.runQuery(api.instagramQueries.getInstagramAccount, { userId });
    return c.json({ success: true, account });
} catch (error) {
    console.error("Failed to get Instagram account:", error);
    return c.json({ success: false, error: "Failed to retrieve Instagram account" }, 500);
}
});

// Update Instagram token (updated for consolidated schema)
app.post("/api/users/:id/instagram/token", async (c) => {
const ctx = c.env;
const userId = c.req.param("id");
const { instagramAccountId, accessToken, expiresAt, scope } = await c.req.json();

// Ensure scope is an array of strings
const scopeArray = Array.isArray(scope)
    ? scope
    : typeof scope === "string"
    ? scope.split(" ")
    : [];

try {
    await ctx.runMutation(api.instagramMutations.updateInstagramToken, {
    userId,
    instagramAccountId,
    accessToken: accessToken as string,
    expiresAt: expiresAt as number,
    scope: scopeArray as string[],
    });
    return c.json({ success: true });
} catch (error) {
    console.error("Failed to store Instagram token:", error);
    return c.json({ success: false, error: "Failed to store Instagram token" }, 500);
}
});

// Store Instagram posts in bulk
app.post("/api/users/:id/instagram/posts/bulk", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { instagramAccountId, posts } = await c.req.json();

  if (!Array.isArray(posts) || posts.length === 0) {
    return c.json({ success: false, error: "No posts provided" }, 400);
  }

  if (!instagramAccountId) {
    return c.json({ success: false, error: "Missing instagramAccountId" }, 400);
  }

  const results = [];
  for (const post of posts) {
    if (!post.id) {
      results.push({ status: "error", error: "Missing post id", post });
      continue;
    }
    try {
      const result = await ctx.runMutation(api.instagramMutations.storePostData, {
        userId,
        postId: post.id,
        instagramAccountId,
        postData: post,
      });
      results.push({ status: result.status, postId: post.id });
    } catch (error) {
      results.push({ status: "error", error: error instanceof Error ? error.message : "Unknown error", postId: post.id });
    }
  }

  return c.json({ success: true, results });
});

// Store a single Instagram post
app.post("/api/users/:id/instagram/posts/single", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { instagramAccountId, postData } = await c.req.json();

  if (!postData || typeof postData !== 'object') {
    return c.json({ success: false, error: "No post data provided" }, 400);
  }

  if (!postData.id) {
    return c.json({ success: false, error: "Missing post id" }, 400);
  }

  if (!instagramAccountId) {
    return c.json({ success: false, error: "Missing instagramAccountId" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.instagramMutations.storePostData, {
      userId,
      postId: postData.id,
      instagramAccountId,
      postData,
    });
    
    return c.json({ 
      success: true, 
      status: result.status, 
      postId: postData.id,
      internalId: result.postId 
    });
  } catch (error) {
    console.error(`Error storing single Instagram post ${postData.id}:`, error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      postId: postData.id 
    }, 500);
  }
});

// Store Instagram profile data (updated for consolidated schema)
app.post("/api/users/:id/instagram/profile", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const body = await c.req.json();
  
  console.log("[HTTP] Instagram profile endpoint called for user:", userId);
  console.log("[HTTP] Request body keys:", Object.keys(body));
  console.log("[HTTP] Has breakdowns:", {
    age: !!body.age_breakdown,
    city: !!body.city_breakdown,
    country: !!body.country_breakdown,
    gender: !!body.gender_breakdown
  });

  const {
    username,
    instagramAccountId,
    profileData,
    token,
    age_breakdown,
    city_breakdown,
    contact_button_type_breakdown,
    country_breakdown,
    follow_type_breakdown,
    gender_breakdown,
    media_product_type_breakdown,
    insights,
    pagination,
    diffs,
    createdAt,
    updatedAt,
  } = body;

  // Validate required fields
  if (!profileData || !profileData.id || !username || !instagramAccountId) {
    console.log("[HTTP] Validation failed - missing required fields");
    return c.json({ success: false, error: "profileData.id, instagramAccountId, and username are required" }, 400);
  }

  try {
    console.log("[HTTP] Calling storeProfileData mutation");
    const result = await ctx.runMutation(api.instagramMutations.storeProfileData, {
      userId,
      instagramAccountId,
      username,
      profileData,
      token,
      age_breakdown,
      city_breakdown,
      contact_button_type_breakdown,
      country_breakdown,
      follow_type_breakdown,
      gender_breakdown,
      media_product_type_breakdown,
      insights,
      pagination,
      diffs,
      createdAt: createdAt ?? Date.now(),
      updatedAt: updatedAt ?? Date.now(),
    });
    console.log("[HTTP] Mutation result:", result);
    return c.json({
      success: true,
      status: result.status,
      instagramAccountId: result.instagramAccountId,
    });
  } catch (error) {
    console.error("[HTTP] Failed to store Instagram profile data:", error);
    return c.json({
      success: false,
      error: `Failed to store Instagram profile data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// Patch Instagram profile data (for background tasks)
app.post("/api/users/:id/instagram/profile/patch", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { instagramAccountId, updateFields } = await c.req.json();
  
  console.log("[HTTP] Instagram profile patch endpoint called for user:", userId);
  console.log("[HTTP] Instagram Account ID:", instagramAccountId);
  console.log("[HTTP] Update fields:", Object.keys(updateFields || {}));

  if (!instagramAccountId || !updateFields) {
    return c.json({ success: false, error: "instagramAccountId and updateFields are required" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.instagramMutations.patchInstagramAccountFields, {
      userId,
      instagramAccountId,
      updateFields,
    });
    
    console.log("[HTTP] Patch mutation result:", result);
    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("[HTTP] Failed to patch Instagram profile data:", error);
    return c.json({
      success: false,
      error: `Failed to patch Instagram profile data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// Get Instagram profile insights
app.get("/api/users/:id/instagram/profile/insights", async (c) => {
const ctx = c.env;
const userId = c.req.param("id");

try {
    const insights = await ctx.runQuery(api.instagramQueries.getInstagramProfileInsights, { 
      userId,
      limit: 100 // Add limit parameter to match validator
    });
    return c.json({ success: true, insights });
} catch (error) {
    console.error("Failed to get Instagram profile insights:", error);
    return c.json({ success: false, error: "Failed to retrieve Instagram profile insights" }, 500);
}
});



// Get all Instagram posts for a user
app.get("/api/users/:id/instagram/posts/all", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");

  try {
    const posts = await ctx.runQuery(api.instagramQueries.getAllInstagramPosts, { 
      userId
    });
    
    return c.json({ 
      success: true,
      data: posts
    });
  } catch (error) {
    console.error("Error fetching all Instagram posts:", error);
    return c.json({ 
      success: false, 
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
  }
});

// Store Instagram post analysis
app.post("/api/users/:userId/instagram/posts/:postId/analysis", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("userId");
  const postId = c.req.param("postId");
  const { analysisData } = await c.req.json();
  
  try {
    const result = await ctx.runMutation(api.instagramMutations.storePostAnalysis, { 
      userId, 
      postId, 
      analysisData 
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to store Instagram post analysis:", error);
    return c.json({ 
      success: false, 
      error: `Failed to store Instagram post analysis: ${error instanceof Error ? error.message : 'Unknown error'}` 
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
  const data = await c.req.json();
  
  try {
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

// Get a single Instagram post
app.get("/api/users/:id/instagram/post/:postId", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const postId = c.req.param("postId");

  try {
    const post = await ctx.runQuery(api.instagramQueries.getInstagramPost, { 
      userId,
      postId
    });
    
    if (!post) {
      return c.json({ 
        success: false, 
        error: "Post not found" 
      }, 404);
    }

    return c.json({ 
      success: true,
      post: post
    });
  } catch (error) {
    console.error("Error fetching Instagram post:", error);
    return c.json({ 
      success: false, 
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
  }
});

// Legacy Instagram post insights endpoint - deprecated
// Insights are now stored within the unified instagramPosts table


// Get Instagram post comments
app.get("/api/users/:id/instagram/post/:postId/comments", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const postId = c.req.param("postId");

  try {
    const post = await ctx.runQuery(api.instagramQueries.getInstagramPost, { 
      userId,
      postId
    });
    
    if (!post) {
      return c.json({ 
        success: false, 
        error: "Post not found" 
      }, 404);
    }

    // Return comments from post data
    return c.json({ 
      success: true,
      comments: post.data.comments || []
    });
  } catch (error) {
    console.error("Error fetching Instagram post comments:", error);
    return c.json({ 
      success: false, 
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
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

// Get content hub data bundle (Instagram, YouTube, Gmail data)
app.get("/api/users/:id/content-hub-data-bundle", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  try {
    const bundle = await ctx.runQuery(api.contentHub.getContentHubDataBundle, { userId });
    return c.json({ success: true, data: bundle });
  } catch (error) {
    console.error("Failed to get content hub data bundle:", error);
    return c.json({ success: false, error: "Failed to get content hub data bundle" }, 500);
  }
});

// Save content hub insight for a user
app.post("/api/users/:id/save_content_hub_insight", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  
  console.log(`HTTP_TS_DEBUG: Save content hub insight route HIT for userId: ${userId}`);
  console.log(`HTTP_TS_DEBUG: Request method: ${c.req.method}, URL: ${c.req.url}`);
  
  let insight;
  try {
    const requestBody = await c.req.json();
    console.log(`HTTP_TS_DEBUG: Request body received:`, requestBody);
    insight = requestBody.insight;
  } catch (jsonError) {
    console.error(`HTTP_TS_DEBUG: Failed to parse JSON body:`, jsonError);
    return c.json({ success: false, error: "Invalid JSON in request body" }, 400);
  }
  
  if (!insight) {
    console.error(`HTTP_TS_DEBUG: Missing insight data for userId: ${userId}`);
    return c.json({ success: false, error: "Missing insight data" }, 400);
  }
  
  console.log(`HTTP_TS_DEBUG: About to call createContentHubInsight mutation for userId: ${userId}`);
  console.log(`HTTP_TS_DEBUG: Insight keys:`, Object.keys(insight));
  
  try {
    const result = await ctx.runMutation(api.contentHub.createContentHubInsight, {
      userId,
      insight,
    });
    console.log(`HTTP_TS_DEBUG: Mutation result:`, result);
    console.log(`HTTP_TS_DEBUG: Successfully saved content hub insight for userId: ${userId} with ID: ${result}`);
    return c.json({ success: true, insightId: result });
  } catch (error) {
    console.error(`HTTP_TS_DEBUG: Failed to save content hub insight for userId: ${userId}:`, error);
    return c.json({ success: false, error: "Failed to save content hub insight" }, 500);
  }
});

// Get content hub insights for a user
app.get("/api/users/:id/content-hub-insights", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  try {
    const insights = await ctx.runQuery(api.contentHub.getByUserId, { userId });
    return c.json({ success: true, data: insights });
  } catch (error) {
    console.error("Failed to get content hub insights:", error);
    return c.json({ success: false, error: "Failed to get content hub insights" }, 500);
  }
});

// Get most recent content hub insight for a user
app.get("/api/users/:id/content-hub-insights/latest", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  try {
    const insight = await ctx.runQuery(api.contentHub.getMostRecentByUserId, { userId });
    return c.json({ success: true, data: insight });
  } catch (error) {
    console.error("Failed to get latest content hub insight:", error);
    return c.json({ success: false, error: "Failed to get latest content hub insight" }, 500);
  }
});

// Instagram Analysis Endpoints

// Store Instagram tracker analysis
app.post("/api/instagram/tracker_analysis", async (c) => {
  const ctx = c.env;
  const { userId, instagramAccountId, analysis } = await c.req.json();

  if (!userId || !instagramAccountId || !analysis) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.instagramMutations.storeInstagramTrackerAnalysis, {
      userId,
      instagramAccountId,
      analysis,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to store Instagram tracker analysis:", error);
    return c.json({ success: false, error: "Failed to store Instagram tracker analysis" }, 500);
  }
});

// Get Instagram tracker analysis
app.get("/api/instagram/tracker_analysis", async (c) => {
  const ctx = c.env;
  const userId = c.req.query("userId");
  const instagramAccountId = c.req.query("instagramAccountId");

  if (!userId || !instagramAccountId) {
    return c.json({ success: false, error: "Missing required query parameters" }, 400);
  }

  try {
    const result = await ctx.runQuery(api.instagramQueries.getInstagramTrackerAnalysis, {
      userId,
      instagramAccountId,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to fetch Instagram tracker analysis:", error);
    return c.json({ success: false, error: "Failed to fetch Instagram tracker analysis" }, 500);
  }
});

// In http.ts - The response format stays the same
app.get("/api/users/:id/gmail/threads", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const limitParam = c.req.query("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;
  
  // Use the recent threads query with limit parameter
  const threads = await ctx.runQuery(api.gmailQueries.getRecentGmailThreads, { 
    userId,
    limit
  });
  // Frontend receives the SAME data structure as before
  return c.json({ success: true, threads });
});
// Store Instagram batch analysis
app.post("/api/instagram/batch_analysis", async (c) => {
  const ctx = c.env;
  const { userId, instagramAccountId, insights } = await c.req.json();

  if (!userId || !instagramAccountId || !insights) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.instagramMutations.storeInstagramBatchAnalysis, {
      userId,
      instagramAccountId,
      insights,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to store Instagram batch analysis:", error);
    return c.json({ success: false, error: "Failed to store Instagram batch analysis" }, 500);
  }
});

// Get Instagram batch analysis
app.get("/api/instagram/batch_analysis", async (c) => {
  const ctx = c.env;
  const userId = c.req.query("userId");
  const instagramAccountId = c.req.query("instagramAccountId");

  if (!userId || !instagramAccountId) {
    return c.json({ success: false, error: "Missing required query parameters" }, 400);
  }

  try {
    const result = await ctx.runQuery(api.instagramQueries.getInstagramBatchAnalysis, {
      userId,
      instagramAccountId,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to fetch Instagram batch analysis:", error);
    return c.json({ success: false, error: "Failed to fetch Instagram batch analysis" }, 500);
  }
});

// Update Instagram batch analysis status
app.post("/api/instagram/batch_analysis_status", async (c) => {
  const ctx = c.env;
  const { userId, instagramAccountId, statusUpdate, insights } = await c.req.json();

  if (!userId || !instagramAccountId || !statusUpdate) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.instagramMutations.updateInstagramBatchAnalysisStatus, {
      userId,
      instagramAccountId,
      statusUpdate,
      insights: insights || null,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to update Instagram batch analysis status:", error);
    return c.json({ success: false, error: "Failed to update Instagram batch analysis status" }, 500);
  }
});

// Gmail Analysis Endpoints

// Store Gmail batch analysis
app.post("/api/gmail/batch_analysis", async (c) => {
  const ctx = c.env;
  const { userId, gmailAccountId, insights } = await c.req.json();

  if (!userId || !gmailAccountId || !insights) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.gmailMutations.storeGmailBatchAnalysis, {
      userId,
      gmailAccountId,
      insights,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to store Gmail batch analysis:", error);
    return c.json({ success: false, error: "Failed to store Gmail batch analysis" }, 500);
  }
});

// Get Gmail batch analysis
app.get("/api/gmail/batch_analysis", async (c) => {
  const ctx = c.env;
  const userId = c.req.query("userId");
  const gmailAccountId = c.req.query("gmailAccountId");

  if (!userId || !gmailAccountId) {
    return c.json({ success: false, error: "Missing required query parameters" }, 400);
  }

  try {
    const result = await ctx.runQuery(api.gmailQueries.getGmailBatchAnalysis, {
      userId,
      gmailAccountId,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to fetch Gmail batch analysis:", error);
    return c.json({ success: false, error: "Failed to fetch Gmail batch analysis" }, 500);
  }
});

// Update Gmail batch analysis status
app.post("/api/gmail/batch_analysis_status", async (c) => {
  const ctx = c.env;
  const { userId, gmailAccountId, statusUpdate, insights } = await c.req.json();

  if (!userId || !gmailAccountId || !statusUpdate) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.gmailMutations.updateGmailBatchAnalysisStatus, {
      userId,
      gmailAccountId,
      statusUpdate,
      insights: insights || null,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to update Gmail batch analysis status:", error);
    return c.json({ success: false, error: "Failed to update Gmail batch analysis status" }, 500);
  }
});

// YouTube Analysis Endpoints

// Store YouTube batch analysis
app.post("/api/youtube/batch_analysis", async (c) => {
  const ctx = c.env;
  const { userId, channelId, insights } = await c.req.json();

  if (!userId || !channelId || !insights) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.youtubeMutations.storeYoutubeBatchAnalysis, {
      userId,
      channelId,
      insights,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to store YouTube batch analysis:", error);
    return c.json({ success: false, error: "Failed to store YouTube batch analysis" }, 500);
  }
});

// Get YouTube batch analysis
app.get("/api/youtube/batch_analysis", async (c) => {
  const ctx = c.env;
  const userId = c.req.query("userId");
  const channelId = c.req.query("channelId");

  if (!userId || !channelId) {
    return c.json({ success: false, error: "Missing required query parameters" }, 400);
  }

  try {
    const result = await ctx.runQuery(api.youtubeQueries.getYoutubeBatchAnalysis, {
      userId,
      channelId,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to fetch YouTube batch analysis:", error);
    return c.json({ success: false, error: "Failed to fetch YouTube batch analysis" }, 500);
  }
});

// Update YouTube batch analysis status
app.post("/api/youtube/batch_analysis_status", async (c) => {
  const ctx = c.env;
  const { userId, channelId, statusUpdate, insights } = await c.req.json();

  if (!userId || !channelId || !statusUpdate) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.youtubeMutations.updateYoutubeBatchAnalysisStatus, {
      userId,
      channelId,
      statusUpdate,
      insights: insights || null,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to update YouTube batch analysis status:", error);
    return c.json({ success: false, error: "Failed to update YouTube batch analysis status" }, 500);
  }
});

// === COLLISION DETECTION ENDPOINTS ===

// Check Instagram account collision
app.get("/api/collision/instagram", async (c) => {
  const { instagramAccountId } = c.req.query();
  
  if (!instagramAccountId) {
    return c.json({ error: "instagramAccountId is required" }, 400);
  }
  
  try {
    const existingAccount = await c.env.runQuery(api.instagramQueries.getInstagramAccountById, {
      instagramAccountId: instagramAccountId as string
    });
    
    if (existingAccount) {
      return c.json({
        hasCollision: true,
        platform: "instagram",
        identifier: instagramAccountId,
        existingAccount: {
          userId: existingAccount.userId,
          username: existingAccount.username,
          connectedAt: existingAccount.createdAt
        }
      });
    }
    
    return c.json({
      hasCollision: false,
      platform: "instagram", 
      identifier: instagramAccountId
    });
  } catch (error) {
    console.error("Error checking Instagram collision:", error);
    return c.json({ error: "Failed to check collision" }, 500);
  }
});

// Check YouTube channel collision
app.get("/api/collision/youtube", async (c) => {
  const { channelId } = c.req.query();
  
  if (!channelId) {
    return c.json({ error: "channelId is required" }, 400);
  }
  
  try {
    const existingChannel = await c.env.runQuery(api.youtubeQueries.getYouTubeChannelById, {
      channelId: channelId as string
    });
    
    if (existingChannel) {
      return c.json({
        hasCollision: true,
        platform: "youtube",
        identifier: channelId,
        existingAccount: {
          userId: existingChannel.userId,
          channelTitle: existingChannel.snippet?.title || "Unknown Channel",
          connectedAt: existingChannel.createdAt
        }
      });
    }
    
    return c.json({
      hasCollision: false,
      platform: "youtube",
      identifier: channelId
    });
  } catch (error) {
    console.error("Error checking YouTube collision:", error);
    return c.json({ error: "Failed to check collision" }, 500);
  }
});

// Check Gmail account collision
app.get("/api/collision/gmail", async (c) => {
  const { email } = c.req.query();
  
  if (!email) {
    return c.json({ error: "email is required" }, 400);
  }
  
  try {
    const existingAccount = await c.env.runQuery(api.gmailQueries.getGmailAccountByEmailGlobal, {
      email: email as string
    });
    
    if (existingAccount) {
      return c.json({
        hasCollision: true,
        platform: "gmail",
        identifier: email,
        existingAccount: {
          userId: existingAccount.userId,
          email: existingAccount.email,
          connectedAt: existingAccount.createdAt
        }
      });
    }
    
    return c.json({
      hasCollision: false,
      platform: "gmail",
      identifier: email
    });
  } catch (error) {
    console.error("Error checking Gmail collision:", error);
    return c.json({ error: "Failed to check collision" }, 500);
  }
});

// Add unified Instagram posts endpoint
app.post("/api/instagram/unified_posts", async (c) => {
  const ctx = c.env;
  const { userId, instagramAccountId, posts, useQueue = false, moveToMain = true } = await c.req.json();

  if (!userId || !instagramAccountId || !posts) {
    return c.json({
      success: false,
      error: "Missing required fields: userId, instagramAccountId, posts"
    }, 400);
  }

  try {
    let result;
    
    if (useQueue) {
      // Add to queue first
      const queueResult = await ctx.runMutation(api.instagramMutations.addPostsToQueue, {
        userId,
        instagramAccountId,
        posts: posts.map(post => {
          // Remove media_type from data to match schema
          const { media_type, ...dataWithoutMediaType } = post;
          return {
            postId: post.id,
            mediaType: media_type || "IMAGE",
            data: dataWithoutMediaType,
          };
        })
      });
      
      if (moveToMain) {
        // For initial fetch: Move from queue to main table
        const moveResult = await ctx.runMutation(api.instagramMutations.moveQueuePostsToMain, {
          userId,
          instagramAccountId,
        });
        
        result = {
          ...queueResult,
          movedCount: moveResult.movedCount
        };
      } else {
        // For queue fetch: Keep posts in queue only
        result = {
          ...queueResult,
          movedCount: 0
        };
      }
    } else {
      // For subsequent fetches: Store directly to main table
      result = await ctx.runMutation(api.instagramMutations.storeUnifiedPostData, {
        userId,
        instagramAccountId,
        posts
      });
    }

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error in unified posts endpoint:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Move queue posts to main table endpoint
app.post("/api/instagram/move-queue-to-main", async (c) => {
  const ctx = c.env;
  const { userId, instagramAccountId } = await c.req.json();

  if (!userId || !instagramAccountId) {
    return c.json({
      success: false,
      error: "Missing required fields: userId, instagramAccountId"
    }, 400);
  }

  try {
    const result = await ctx.runMutation(api.instagramMutations.moveQueuePostsToMain, {
      userId,
      instagramAccountId,
    });

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error in move queue to main endpoint:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get Instagram queue status endpoint
app.post("/api/instagram/queue/status", async (c) => {
  const ctx = c.env;
  const { userId, instagramAccountId } = await c.req.json();

  if (!userId || !instagramAccountId) {
    return c.json({
      success: false,
      error: "Missing required fields: userId, instagramAccountId"
    }, 400);
  }

  try {
    const result = await ctx.runQuery(api.instagramQueries.getQueueStatus, {
      userId,
      instagramAccountId,
    });

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error in queue status endpoint:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Get Instagram account by Instagram ID (for webhook processing)
app.get("/api/instagram/account/:instagramAccountId", async (c) => {
  const ctx = c.env;
  const instagramAccountId = c.req.param("instagramAccountId");
  
  try {
    const account = await ctx.runQuery(api.instagramQueries.getInstagramAccountByInstagramId, {
      instagramAccountId
    });
    
    if (!account) {
      return c.json({ success: false, error: "Instagram account not found" }, 404);
    }
    
    return c.json({ success: true, account });
  } catch (error) {
    console.error("Failed to get Instagram account by Instagram ID:", error);
    return c.json({ success: false, error: "Failed to retrieve Instagram account" }, 500);
  }
});

// Get Instagram post by media ID (for webhook processing)
app.get("/api/instagram/post/media/:mediaId", async (c) => {
  const ctx = c.env;
  const mediaId = c.req.param("mediaId");
  
  try {
    const post = await ctx.runQuery(api.instagramQueries.getInstagramPostByMediaId, {
      mediaId
    });
    
    if (!post || !post.success) {
      return c.json({ success: false, error: "Post not found" }, 404);
    }
    
    return c.json({ success: true, post: post.post });
  } catch (error) {
    console.error("Failed to get Instagram post by media ID:", error);
    return c.json({ success: false, error: "Failed to retrieve Instagram post" }, 500);
  }
});

// Update Instagram post comments (for webhook processing)
app.post("/api/instagram/post/comments/update", async (c) => {
  const ctx = c.env;
  const { userId, mediaId, newComment } = await c.req.json();
  
  if (!userId || !mediaId || !newComment) {
    return c.json({ success: false, error: "Missing required fields: userId, mediaId, newComment" }, 400);
  }
  
  try {
    const result = await ctx.runMutation(api.instagramMutations.updateInstagramPostComments, {
      userId,
      mediaId,
      newComment
    });
    
    return c.json({ success: true, result });
  } catch (error) {
    console.error("Failed to update Instagram post comments:", error);
    return c.json({ success: false, error: "Failed to update Instagram post comments" }, 500);
  }
});

// Store Instagram webhook event
app.post("/api/instagram/webhook/event", async (c) => {
  const ctx = c.env;
  const { userId, instagramAccountId, eventType, eventData, timestamp } = await c.req.json();
  
  if (!userId || !instagramAccountId || !eventType || !eventData || !timestamp) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }
  
  try {
    const result = await ctx.runMutation(api.instagramMutations.storeInstagramWebhookEvent, {
      userId,
      instagramAccountId,
      eventType,
      eventData,
      timestamp
    });
    
    return c.json({ success: true, result });
  } catch (error) {
    console.error("Failed to store Instagram webhook event:", error);
    return c.json({ success: false, error: "Failed to store webhook event" }, 500);
  }
});

// Store Instagram story insights
app.post("/api/instagram/story/insights", async (c) => {
  const ctx = c.env;
  const { userId, instagramAccountId, mediaId, insights, webhookTimestamp, storyData } = await c.req.json();
  
  if (!userId || !instagramAccountId || !mediaId || !insights) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }
  
  try {
    const result = await ctx.runMutation(api.instagramMutations.storeInstagramStoryInsights, {
      userId,
      instagramAccountId,
      mediaId,
      insights,
      webhookTimestamp: webhookTimestamp || Date.now(),
      ...(storyData && { storyData })
    });
    
    return c.json({ success: true, result });
  } catch (error) {
    console.error("Failed to store Instagram story insights:", error);
    return c.json({ success: false, error: "Failed to store story insights" }, 500);
  }
});

// Debug endpoint to list all Instagram accounts (for troubleshooting)
app.get("/api/debug/instagram/accounts", async (c) => {
  const ctx = c.env;
  
  try {
    const accounts = await ctx.runQuery(api.instagramQueries.getAllInstagramAccounts, {});
    return c.json({ 
      success: true, 
      accounts,
      count: accounts.length
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return c.json({ success: false, error: "Debug endpoint error" }, 500);
  }
});

// Append comment to Instagram post (for webhook processing)
app.post("/api/instagram/post/comments/append", async (c) => {
  const ctx = c.env;
  const { mediaId, newComment } = await c.req.json();
  
  if (!mediaId || !newComment) {
    return c.json({ success: false, error: "Missing required fields: mediaId, newComment" }, 400);
  }
  
  try {
    const result = await ctx.runMutation(api.instagramMutations.appendCommentToInstagramPost, {
      mediaId,
      newComment
    });
    
    return c.json({ success: true, ...result });
  } catch (error) {
    console.error("Failed to append comment to Instagram post:", error);
    return c.json({ success: false, error: "Failed to append comment to Instagram post" }, 500);
  }
});

// Instagram load more endpoint

// Update Instagram account pagination
app.post("/api/instagram/pagination/update", async (c) => {
  const ctx = c.env;
  const { userId, instagramAccountId, nextUrl, hasMorePosts, totalPostsFetched } = await c.req.json();
  
  if (!userId || !instagramAccountId) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }
  
  try {
    const result = await ctx.runMutation(api.instagramMutations.updateAccountPagination, {
      userId,
      instagramAccountId,
      nextUrl,
      hasMorePosts,
      totalPostsFetched,
    });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to update Instagram pagination:", error);
    return c.json({ success: false, error: "Failed to update pagination" }, 500);
  }
});

// Get Instagram account pagination
app.get("/api/instagram/pagination/:userId/:instagramAccountId", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("userId");
  const instagramAccountId = c.req.param("instagramAccountId");
  
  try {
    const pagination = await ctx.runQuery(api.instagramQueries.getAccountPagination, {
      userId,
      instagramAccountId,
    });
    return c.json({ success: true, data: pagination });
  } catch (error) {
    console.error("Failed to get Instagram pagination:", error);
    return c.json({ success: false, error: "Failed to get pagination" }, 500);
  }
});

// Get Instagram account pagination (POST endpoint for backend compatibility)
app.post("/api/instagram/pagination/get", async (c) => {
  const ctx = c.env;
  const { userId, instagramAccountId } = await c.req.json();
  
  console.log(`[HTTP] Pagination GET request - userId: ${userId}, instagramAccountId: ${instagramAccountId}`);
  
  if (!userId || !instagramAccountId) {
    return c.json({ success: false, error: "Missing required fields: userId, instagramAccountId" }, 400);
  }
  
  try {
    const pagination = await ctx.runQuery(api.instagramQueries.getAccountPagination, {
      userId,
      instagramAccountId,
    });
    
    console.log(`[HTTP] Raw pagination result:`, pagination);
    
    const responseData = {
      nextUrl: pagination?.nextUrl || null,
      hasMorePosts: pagination?.hasMorePosts || false,
      totalPostsFetched: pagination?.totalPostsFetched || 0
    };
    
    console.log(`[HTTP] Returning pagination data:`, responseData);
    
    return c.json({ 
      success: true, 
      data: responseData
    });
  } catch (error) {
    console.error("Failed to get Instagram pagination:", error);
    return c.json({ success: false, error: "Failed to get pagination" }, 500);
  }
});

// Load more Instagram posts
app.post("/api/social/instagram/load-more", async (c) => {
  const ctx = c.env;
  const { userId, instagramAccountId } = await c.req.json();
  
  if (!userId || !instagramAccountId) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }
  
  try {
    // Get current pagination state
    const pagination = await ctx.runQuery(api.instagramQueries.getAccountPagination, {
      userId,
      instagramAccountId,
    });
    
    if (!pagination || !pagination.hasMorePosts) {
      return c.json({ success: false, error: "No more posts to load" }, 400);
    }
    
    // Return pagination info for frontend to fetch next page
    return c.json({ 
      success: true, 
      data: {
        hasMorePosts: pagination.hasMorePosts,
        nextUrl: pagination.nextUrl,
        totalPostsFetched: pagination.totalPostsFetched,
      }
    });
  } catch (error) {
    console.error("Failed to load more Instagram posts:", error);
    return c.json({ success: false, error: "Failed to load more posts" }, 500);
  }
});

// Patch Instagram post data (for background tasks)
app.post("/api/users/:id/instagram/post/:postId/patch", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const postId = c.req.param("postId");
  const { instagramAccountId, updateFields } = await c.req.json();
  
  console.log("[HTTP] Instagram post patch endpoint called for user:", userId);
  console.log("[HTTP] Post ID:", postId);
  console.log("[HTTP] Instagram Account ID:", instagramAccountId);
  console.log("[HTTP] Update fields:", Object.keys(updateFields || {}));

  if (!instagramAccountId || !updateFields) {
    return c.json({ success: false, error: "instagramAccountId and updateFields are required" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.instagramMutations.patchInstagramPostFields, {
      userId,
      instagramAccountId,
      postId,
      updateFields,
    });
    
    console.log("[HTTP] Post patch mutation result:", result);
    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("[HTTP] Failed to patch Instagram post data:", error);
    return c.json({
      success: false,
      error: `Failed to patch Instagram post data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
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

const router = new HttpRouterWithHono(app);
export default router;