import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  
  // Add authentication check
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
  }
  
  // Validate that the authenticated user can access the requested userId's API keys
  // This should verify that the token owner matches the requested userId

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  // Validate userId
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return new Response(
      JSON.stringify({ success: false, error: "Valid userId is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate required fields in body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Valid request body is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!body || typeof body !== 'object') {
    return new Response(
      JSON.stringify({ success: false, error: "Valid request body is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { timestamp, model, status, qty } = body;
  if (!userId || !timestamp || !model || !status || typeof qty !== "number") {
    return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), { status: 400 });
  }
  await ctx.runMutation(api.usageEvents.logUsageEvent, {
    userId,
    timestamp,
    model,
    status,
    qty,
  });
  await ctx.runMutation(api.usageEvents.updateUserUsage, { userId, qty });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
