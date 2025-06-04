import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const body = await req.json();
  const { id, timestamp } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing rate limit key" }), { status: 400 });
  }
  try {
    const result = await ctx.runMutation(api.rateLimiting.storeRateLimitRequest, {
      id,
      timestamp: timestamp || Math.floor(Date.now() / 1000)
    });
    return new Response(JSON.stringify({ success: true, result }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to store rate limit request" }), { status: 500 });
  }
});
