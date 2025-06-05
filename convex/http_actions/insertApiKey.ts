import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), { status: 400 });
  }
  const { user_id, key_hash, scopes, rate_tier } = body;
  if (!user_id || !key_hash) {
    return new Response(JSON.stringify({ error: "Missing user_id or key_hash" }), { status: 400 });
  }
  try {
    await ctx.runMutation(api.apiKeysMutations.insert_api_key, {
      user_id,
      key_hash,
      scopes,
      rate_tier,
    });
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to create API key" }), { status: 500 });
  }
});
