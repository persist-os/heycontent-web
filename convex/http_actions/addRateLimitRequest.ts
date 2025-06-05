import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed. Only POST is supported." }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const { id, timestamp } = body;
  if (typeof id !== "string" || id.trim() === "") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid rate limit key: id must be a non-empty string" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const result = await ctx.runMutation(api.rateLimiting.storeRateLimitRequest, {
      id,
      timestamp: timestamp || Math.floor(Date.now() / 1000)
    });
    return new Response(JSON.stringify({ success: true, result }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to store rate limit request" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
