import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const { key_hash } = await request.json();
  if (!key_hash) {
    return new Response(JSON.stringify({ error: "Missing key_hash" }), { status: 400 });
  }
  try {
    const userId = await ctx.runQuery(api.apiKeysQueries.validate_api_key, { key_hash });
    if (userId) {
      return new Response(JSON.stringify({ success: true, userId }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ success: false, error: "Invalid API key" }), { status: 401 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to validate API key" }), { status: 500 });
  }
});
