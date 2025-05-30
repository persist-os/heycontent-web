import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { cors } from "hono/cors";
<<<<<<< HEAD
=======
import { Id } from "./_generated/dataModel";
import * as usageEventsApi from "./usageEvents";
>>>>>>> 6ad3375601b7664ca9d9a9dd65809907f2dd7884

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

// API KEY ROUTES

// Insert API key
app.post("/api/api-keys", async (c) => {
  const ctx = c.env;
  const { user_id, key_hash, scopes, rate_tier } = await c.req.json();
  if (!user_id || !key_hash) {
    return c.json({ error: "Missing user_id or key_hash" }, 400);
  }
  try {
    await ctx.runMutation(api.apiKeysMutations.insert_api_key, {
      user_id,
      key_hash,
      scopes,
      rate_tier,
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
app.post("/api/notes/create", async (c) => {
  const ctx = c.env;
  try {
    const { userId, content, platform, templateInput, analysisId, type } = await c.req.json();

    // Basic validation for required fields
    if (!userId || !content || !platform) {
      return c.json({ error: "Missing required fields: userId, content, or platform" }, 400);
    }

    const noteId = await ctx.runMutation(api.notes.createNote, {
      userId,
      content,
      platform,
      templateInput,
      analysisId,
      type,
    });
    return c.json({ success: true, noteId }, 201); // 201 Created
  } catch (error: any) {
    console.error("Failed to create note:", error);
    // Check if the error is a ConvexError with data
    if (error.data) {
        return c.json({ success: false, error: "Failed to create note", details: error.data }, 500);
    }
    return c.json({ success: false, error: "Failed to create note", message: error.message || "Internal Server Error" }, 500);
  }
});

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
    const note = await ctx.runQuery(api.notes.getNote, { noteId, userId });
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

  try {
    const notes = await ctx.runQuery(api.notes.getNotesByUser, { userId });
    return c.json({ success: true, notes }); 
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

    const updatedNote = await ctx.runMutation(api.notes.updateNote, {
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

    // Run the delete mutation (api.notes.deleteNote now expects noteId as v.id("notes"))
    // Convex handles string to Id conversion, but we cast for TypeScript type safety.
    const deleteResult = await ctx.runMutation(api.notes.deleteNote, {
      noteId: noteIdStr as Id<"notes">,
      userId,
    });
    
    if (!deleteResult || !deleteResult.success) {
      return c.json({ success: false, error: "Mutation reported failure to delete note" }, 500);
    }

    // Verification Step: Attempt to fetch the note to confirm deletion
    // (api.notes.getNote expects noteId as string)
    const stillExists = await ctx.runQuery(api.notes.getNote, { 
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

// ANALYSES ROUTES
app.get("/api/notes/:noteId/analyses", async (c) => {
  const ctx = c.env;
  const noteId = c.req.param("noteId");

  if (!noteId) {
    return c.json({ error: "Missing noteId in path" }, 400);
  }

  try {
    const analyses = await ctx.runQuery(api.analyses.getAnalysesByNote, { noteId });
    return c.json({ success: true, analyses });
  } catch (error: any) {
    console.error("Failed to get analyses for note:", error);
    if (error.data) {
        return c.json({ success: false, error: "Failed to get analyses for note", details: error.data }, 500);
    }
    return c.json({ success: false, error: "Failed to get analyses for note", message: error.message || "Internal Server Error" }, 500);
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

// Get Instagram tokens for a user
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

// Update Instagram token
app.post("/api/users/:id/instagram/token", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { accountId, accessToken, refreshToken, expiresAt, scope } = await c.req.json();

  // Ensure scope is an array of strings
  const scopeArray = Array.isArray(scope)
    ? scope
    : typeof scope === "string"
    ? scope.split(" ")
    : [];

  try {
    await ctx.runMutation(api.instagramMutations.updateInstagramToken, {
      userId,
      accountId,
      accessToken,
      refreshToken,
      expiresAt,
      scope: scopeArray,
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
  const { posts } = await c.req.json();

  if (!Array.isArray(posts) || posts.length === 0) {
    return c.json({ success: false, error: "No posts provided" }, 400);
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
        postData: post,
      });
      results.push({ status: result.status, postId: post.id });
    } catch (error) {
      results.push({ status: "error", error: error instanceof Error ? error.message : "Unknown error", postId: post.id });
    }
  }

  return c.json({ success: true, results });
});

// Store Instagram profile data
app.post("/api/users/:id/instagram/profile", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { username, accountId, profileData, createdAt, updatedAt } = await c.req.json();

  // Validate required fields
  if (!profileData || !profileData.id || !username || !accountId) {
    return c.json({ success: false, error: "profileData.id, accountId, and username are required" }, 400);
  }

  try {
    const result = await ctx.runMutation(api.instagramMutations.storeProfileData, {
      userId,
      accountId,
      username,
      profileData,
      createdAt: createdAt ?? Date.now(),
      updatedAt: updatedAt ?? Date.now(),
    });

    return c.json({ 
      success: true,
      status: result.status,
      accountId: result.accountId,
    });
  } catch (error) {
    console.error("Failed to store Instagram profile data:", error);
    return c.json({ 
      success: false, 
      error: `Failed to store Instagram profile data: ${error instanceof Error ? error.message : 'Unknown error'}`
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
  const { timestamp, model, status, qty } = await c.req.json();
  if (!userId || !timestamp || !model || !status || typeof qty !== "number") {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }
  // Log the event
  await ctx.runMutation(api.usageEvents.logUsageEvent, {
    userId,
    timestamp,
    model,
    status,
    qty,
  });
  // Update user's usage field
  await ctx.runMutation(api.usageEvents.updateUserUsage, { userId, qty });
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

const router = new HttpRouterWithHono(app);
export default router;