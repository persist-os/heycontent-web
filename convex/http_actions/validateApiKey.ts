import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  let key_hash: unknown;
  try {
    const body = await request.json();
    key_hash = body.key_hash;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (typeof key_hash !== "string" || key_hash.trim() === "") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid key_hash: must be a non-empty string" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const userId = await ctx.runQuery(api.apiKeysQueries.validate_api_key, { key_hash });
    if (userId) {
      return new Response(JSON.stringify({ success: true, userId }), { status: 200, headers: { "Content-Type": "application/json" } });
    } else {
      return new Response(JSON.stringify({ success: false, error: "Invalid API key" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to validate API key" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
