import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { cors } from "hono/cors";

const app: HonoWithConvex<ActionCtx> = new Hono();

// Add CORS middleware
app.use("*", cors());

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
  const user = await ctx.runQuery(api.users.getByEmail, { email });
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

// Get YouTube data for user
app.get("/api/users/:id/youtube", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const youtubeData = await ctx.runQuery(api.youtube.getYouTubeData, { userId });
  return c.json(youtubeData);
});

// Get YouTube connection status
app.get("/api/users/:id/youtube/status", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const status = await ctx.runQuery(api.youtube.getYouTubeConnectionStatus, { userId });
  return c.json({ connected: status });
});

// Update YouTube token
app.post("/api/users/:id/youtube/token", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const { accessToken, expiresAt } = await c.req.json();
  await ctx.runMutation(api.youtube.update_youtube_token, {
    userId,
    accessToken,
    expiresAt,
  });
  return c.json({ success: true });
});

// Get YouTube credentials
app.get("/api/users/:id/youtube/credentials", async (c) => {
  const ctx = c.env;
  const userId = c.req.param("id");
  const credentials = await ctx.runQuery(api.youtube.get_youtube_credentials, { userId });
  return c.json(credentials);
});

const router = new HttpRouterWithHono(app);
export default router;