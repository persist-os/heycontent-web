import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { cors } from "hono/cors";

const app: HonoWithConvex<ActionCtx> = new Hono();

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
  const user = await ctx.runQuery(api.userQueries.getUserById, { userId });
  return c.json(user);
});

// Get user by email
app.get("/api/users/email/:email", async (c) => {
  const ctx = c.env;
  const email = c.req.param("email");
  const user = await ctx.runQuery(api.userQueries.getUserByEmail, { email });
  return c.json(user);
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
    // key_id is expected to be a string representation of the Convex _id
    // deleteByStringId will find the key by its _id string and delete it
    await ctx.runAction(api.apiKeys.deleteByStringId, { keyIdStr: key_id });
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return c.json({ success: false, error: "Failed to delete API key" }, 500);
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
      accountId: result.accountId
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
  const { accessToken, refreshToken, expiresAt, scope } = await c.req.json();

  // Ensure scope is an array of strings
  const scopeArray = Array.isArray(scope)
    ? scope
    : typeof scope === "string"
    ? scope.split(" ")
    : [];

  try {
    await ctx.runMutation(api.instagramMutations.updateInstagramToken, {
      userId,
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

// Store full Instagram profile (profile + posts + stories + reels) for a user
app.post("/api/users/:id/instagram/full_profile", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { profile, posts, stories, reels } = await c.req.json();
  
  if (!profile || !profile.id) {
    return c.json({ success: false, error: "Valid profile data is required" }, 400);
  }
  
  try {
    const result = await ctx.runMutation(api.instagramMutations.storeInstagramFullProfile, {
      userId,
      profile,
      posts,
      stories,
      reels
    });
    return c.json({ success: true, result });
  } catch (error) {
    console.error("Error storing Instagram full profile:", error);
    return c.json({ 
      success: false, 
      error: `Failed to store Instagram profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// Store Instagram profile data
app.post("/api/users/:id/instagram/profile", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { profileId, username, fullName, biography, profilePicture, statistics } = await c.req.json();
  
  if (!profileId || !username) {
    return c.json({ success: false, error: "Profile ID and username are required" }, 400);
  }
  
  try {
    const result = await ctx.runMutation(api.instagramMutations.storeProfileData, {
      userId,
      profileId,
      username,
      fullName,
      biography,
      profilePicture,
      statistics,
      updatedAt: Date.now()
    });
    
    return c.json({ 
      success: true,
      status: result.status,
      profileId: result.profileId 
    });
  } catch (error) {
    console.error("Failed to store Instagram profile data:", error);
    return c.json({ 
      success: false, 
      error: `Failed to store Instagram profile data: ${error instanceof Error ? error.message : 'Unknown error'}`
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

const router = new HttpRouterWithHono(app);
export default router;