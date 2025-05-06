import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { getRateLimitData, storeRateLimitRequest } from "./rateLimiting";
import { cors } from "hono/cors";

const app: HonoWithConvex<ActionCtx> = new Hono();

// Add CORS middleware
app.use("*", cors());


// USER ROUTES

// List all users
app.get("/api/users", async (c) => {
  const ctx = c.env;
  const users = await ctx.runQuery(api.users.list, {});
  return c.json(users);
});

// Get user by ID
app.get("/api/users/:id", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const user = await ctx.runQuery(api.users.get, { userId });
  return c.json(user);
});

// Get user by email
app.get("/api/users/email/:email", async (c) => {
  const ctx = c.env;
  const email = c.req.param("email");
  const user = await ctx.runQuery(api.users.getUserByEmail, { email });
  return c.json(user);
});

// Create new user
app.post("/api/users", async (c) => {
  const ctx = c.env;
  const { name, email, image, userId } = await c.req.json();
  const result = await ctx.runMutation(api.users.create, {
    name,
    email,
    image,
    userId,
  });
  return c.json(result);
});

// Update user
app.patch("/api/users/:id", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { name, email, image } = await c.req.json();
  await ctx.runAction(api.auth.updateUser, {
    name,
    email,
    image,
    userId,
  });
  return c.json({ success: true });
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

// YOUTUBE ROUTES

// Get YouTube data for user
app.get("/api/users/:id/youtube", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const youtubeData = await ctx.runQuery(api.youtubeQueries.getYouTubeData, { userId });
  return c.json(youtubeData);
});

// Get YouTube connection status
app.get("/api/users/:id/youtube/status", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const status = await ctx.runQuery(api.youtubeQueries.getYouTubeConnectionStatus, { userId });
  return c.json({ connected: status });
});

// Update YouTube token
app.post("/api/users/:id/youtube/token", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { accessToken, refreshToken, expiresAt, tokenType, scope } = await c.req.json();
  
  // Convert scope to array if it's a string
  const scopeArray = typeof scope === 'string' ? scope.split(' ') : scope;
  
  await ctx.runMutation(api.youtubeMutations.update_youtube_token, {
    userId,
    accessToken,
    refreshToken,
    expiresAt,
    tokenType,
    scope: scopeArray
  });
  return c.json({ success: true });
});

// Get YouTube credentials
app.get("/api/users/:id/youtube/credentials", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const credentials = await ctx.runQuery(api.youtubeQueries.get_youtube_credentials, { userId });
  return c.json(credentials);
});

// Get YouTube channel analysis
app.get("/api/users/:id/youtube/analysis/channel", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const youtubeData = await ctx.runQuery(api.youtubeQueries.getYouTubeData, { userId });
  
  if (!youtubeData) {
    return c.json({ error: "No YouTube data found" }, 404);
  }

  // Extract channel metrics
  const channelData = {
    subscribers: youtubeData.subscriberCount || 0,
    videos: youtubeData.videoCount || 0,
    views: youtubeData.viewCount || 0,
    lastUpdated: new Date(youtubeData.timestamp).toISOString(),
    channelInfo: youtubeData.socialAccount?.metadata || null
  };

  return c.json(channelData);
});

// Get YouTube video analysis
app.get("/api/users/:id/youtube/analysis/videos", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const videoId = c.req.query("videoId");
  
  if (videoId) {
    // Get specific video data
    const videoData = await ctx.runQuery(api.youtubeQueries.getVideoData, { userId, videoId });
    return c.json(videoData);
  } else {
    // Fetch all video data for the user
    const userVideos = await ctx.runQuery(api.youtubeQueries.listUserYouTubeVideos, { userId });
    return c.json(userVideos);
  }
});

// Get YouTube engagement metrics
app.get("/api/users/:id/youtube/analysis/engagement", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const youtubeData = await ctx.runQuery(api.youtubeQueries.getYouTubeData, { userId });
  
  if (!youtubeData) {
    return c.json({ error: "No YouTube data found" }, 404);
  }

  // Calculate engagement metrics
  const engagementData = {
    subscriberGrowth: youtubeData.subscriberCount || 0,
    videoGrowth: youtubeData.videoCount || 0,
    viewGrowth: youtubeData.viewCount || 0,
    lastUpdated: new Date(youtubeData.timestamp).toISOString(),
    channelHealth: {
      subscriberToViewRatio: youtubeData.viewCount && youtubeData.subscriberCount 
        ? (youtubeData.viewCount / youtubeData.subscriberCount).toFixed(2)
        : "0.00", // Return string for consistency
      videosPerSubscriber: youtubeData.subscriberCount && youtubeData.videoCount
        ? (youtubeData.videoCount / youtubeData.subscriberCount).toFixed(2)
        : "0.00" // Return string for consistency
    }
  };

  return c.json(engagementData);
});

// Store YouTube channel data (generic, with tokens)
app.post("/api/users/:id/youtube/data", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { channelData, accessToken, refreshToken, expiresAt, tokenType, scope } = await c.req.json();

  if (!channelData || !accessToken || !tokenType || !scope) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }

  try {
    await ctx.runMutation(api.youtubeMutations.storeYouTubeData, {
      userId,
      channelData,
      accessToken,
      refreshToken,
      expiresAt,
      tokenType,
      scope,
    });
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to store YouTube data:", error);
    return c.json({ success: false, error: "Failed to store YouTube data" }, 500);
  }
});

// YouTube endpoints
app.post("/api/users/:id/youtube/videos", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { videoId, videoData } = await c.req.json();
  await ctx.runMutation(api.youtubeMutations.storeVideoData, { userId, videoId, videoData });
  return c.json({ success: true });
});

app.get("/api/users/:id/youtube/videos/:videoId", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const videoId = c.req.param("videoId");
  const videoData = await ctx.runQuery(api.youtubeQueries.getVideoData, { userId, videoId });
  return c.json(videoData);
});

app.post("/api/users/:id/youtube/channel", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const channelData = await c.req.json();
  await ctx.runMutation(api.youtubeMutations.saveChannelData, { userId, ...channelData });
  return c.json({ success: true });
});

app.post("/api/users/:id/youtube/videos/:videoId/analysis", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const videoId = c.req.param("videoId");
  const { analysisData } = await c.req.json();
  await ctx.runMutation(api.youtubeMutations.storeVideoAnalysis, { userId, videoId, analysisData });
  return c.json({ success: true });
});

// Users endpoints
app.get("/api/users/id/:userId", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("userId");
  const user = await ctx.runQuery(api.users.getUserById, { userId });
  return c.json(user);
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
    // Get rate limit data from Convex table
    // Use the imported function reference directly from rateLimiting.ts
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
    // Store the rate limit request
    // Use the imported function reference directly from rateLimiting.ts
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