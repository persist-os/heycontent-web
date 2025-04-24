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
  const result = await ctx.runMutation(api.users.update, {
    name,
    email,
    image,
    userId,
  });
  return c.json(result);
});

// API KEY ROUTES

// Get API key for user
app.get("/api/users/:id/api-key", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const apiKey = await ctx.runQuery(api.apiKeysQueries.get, { userId });
  return c.json(apiKey);
});

// Generate API key for user
app.post("/api/users/:id/api-key", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { scopes, rate_tier } = await c.req.json();
  const result = await ctx.runAction(api.apiKeys.generate, {
    user_id: userId,
    scopes,
    rate_tier
  });
  return c.json(result);
});

// Revoke API key
app.delete("/api/api-keys/:keyId", async (c) => {
  const ctx = c.env;
  const keyIdStr = c.req.param("keyId");
  
  try {
    // Instead of trying to convert the string to an ID,
    // let's create an action to handle the revocation by key string ID
    await ctx.runAction(api.apiKeys.revokeByStringId, { keyIdStr });
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to revoke API key:", error);
    return c.json({ success: false, error: "Failed to revoke API key" }, 500);
  }
});

// Get API keys
app.get("/api/api-keys/active", async (c) => {
  const ctx = c.env;
  const activeKeys = await ctx.runQuery(api.apiKeysQueries.listActive);
  return c.json(activeKeys);
});

app.get("/api/api-keys/:keyId", async (c) => {
  const ctx = c.env;
  const keyIdStr = c.req.param("keyId");
  const apiKey = await ctx.runQuery(api.apiKeysQueries.getById, { keyIdStr });
  return c.json(apiKey);
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

const router = new HttpRouterWithHono(app);
export default router;