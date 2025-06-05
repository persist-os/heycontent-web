import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), { status: 400 });
  }
  const { id, window_start } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing rate limit key" }), { status: 400 });
  }
  try {
    const rateLimitData = await ctx.runQuery(api.rateLimiting.getRateLimitData, {
      id,
      window_start: window_start || (Date.now() / 1000 - 900)
    });
    return new Response(JSON.stringify(rateLimitData), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to retrieve rate limit data", timestamps: [] }), { status: 500 });
  }
});
