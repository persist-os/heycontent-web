import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { cors } from "hono/cors";
import { Id } from "./_generated/dataModel";
import * as usageEventsApi from "./usageEvents";
import { httpRouter } from "convex/server";
import getUserById from "./http_actions/getUserById";
import createUser from "./http_actions/createUser";
import updateUser from "./http_actions/updateUser";
import getUserByEmail from "./http_actions/getUserByEmail";
import getUserPersona from "./http_actions/getUserPersona";
import insertApiKey from "./http_actions/insertApiKey";
import validateApiKey from "./http_actions/validateApiKey";
import getUserApiKeys from "./http_actions/getUserApiKeys";
import deleteApiKey from "./http_actions/deleteApiKey";
import createNote from "./http_actions/createNote";
import getNote from "./http_actions/getNote";
import getNotesByUser from "./http_actions/getNotesByUser";
import updateNote from "./http_actions/updateNote";
import deleteNote from "./http_actions/deleteNote";
import getAnalysesByNote from "./http_actions/getAnalysesByNote";
import linkAnalysisToNote from "./http_actions/linkAnalysisToNote";
import createAnalysis from "./http_actions/createAnalysis";
import getAnalysesByUser from "./http_actions/getAnalysesByUser";
import getAnalysesByUserPlatform from "./http_actions/getAnalysesByUserPlatform";
import getGmailTokens from "./http_actions/getGmailTokens";
import updateGmailToken from "./http_actions/updateGmailToken";
import saveGmailAccount from "./http_actions/saveGmailAccount";
import storeGmailFullProfile from "./http_actions/storeGmailFullProfile";


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
// User-related routes have been moved to convex/http_actions/

// API KEY ROUTES
// API-related routes have been moved to convex/http_actions/

// NOTES ROUTES
// Notes-related routes have been moved to convex/http_actions/

// GMAIL ROUTES

// Gmail routes have been moved to convex/http_actions/

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
      post: post.data
    });
  } catch (error) {
    console.error("Error fetching Instagram post:", error);
    return c.json({ 
      success: false, 
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
  }
});

// Get Instagram post insights
app.get("/api/users/:id/instagram/post/:postId/insights", async (c) => {
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

    // Extract insights from post data
    const insights = {
      likes: post.data.like_count || 0,
      comments: post.data.comment_count || 0,
      // Add any other metrics available in the post data
    };

    return c.json({ 
      success: true,
      insights
    });
  } catch (error) {
    console.error("Error fetching Instagram post insights:", error);
    return c.json({ 
      success: false, 
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
  }
});

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

// === Convex httpRouter for new user HTTP actions ===
const http = httpRouter();

http.route({
  path: "/api/http/getUserById",
  method: "GET",
  handler: getUserById,
});

http.route({
  path: "/api/http/createUser",
  method: "POST",
  handler: createUser,
});

http.route({
  path: "/api/http/updateUser",
  method: "PATCH",
  handler: updateUser,
});

http.route({
  path: "/api/http/getUserByEmail",
  method: "GET",
  handler: getUserByEmail,
});

http.route({
  path: "/api/http/getUserPersona",
  method: "GET",
  handler: getUserPersona,
});

http.route({
  path: "/insertApiKey",
  method: "POST",
  handler: insertApiKey,
});

http.route({
  path: "/validateApiKey",
  method: "POST",
  handler: validateApiKey,
});

http.route({
  path: "/getUserApiKeys",
  method: "GET",
  handler: getUserApiKeys,
});

http.route({
  path: "/deleteApiKey",
  method: "DELETE",
  handler: deleteApiKey,
});

http.route({ path: "/createNote", method: "POST", handler: createNote });
http.route({ path: "/getNote", method: "GET", handler: getNote });
http.route({ path: "/getNotesByUser", method: "GET", handler: getNotesByUser });
http.route({ path: "/updateNote", method: "PATCH", handler: updateNote });
http.route({ path: "/deleteNote", method: "DELETE", handler: deleteNote });
http.route({ path: "/getAnalysesByNote", method: "GET", handler: getAnalysesByNote });
http.route({ path: "/linkAnalysisToNote", method: "POST", handler: linkAnalysisToNote });
http.route({ path: "/createAnalysis", method: "POST", handler: createAnalysis });
http.route({ path: "/getAnalysesByUser", method: "GET", handler: getAnalysesByUser });
http.route({ path: "/getAnalysesByUserPlatform", method: "GET", handler: getAnalysesByUserPlatform });
http.route({ path: "/getGmailTokens", method: "GET", handler: getGmailTokens });
http.route({ path: "/updateGmailToken", method: "POST", handler: updateGmailToken });
http.route({ path: "/saveGmailAccount", method: "POST", handler: saveGmailAccount });
http.route({ path: "/storeGmailFullProfile", method: "POST", handler: storeGmailFullProfile });

const router = new HttpRouterWithHono(app);
export default http;
