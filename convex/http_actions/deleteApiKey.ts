import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "DELETE") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const searchParams = new URL(request.url).searchParams;
  const apiKeyId = searchParams.get("apiKeyId");
  const userId = searchParams.get("userId");
  if (!apiKeyId || !userId) {
    return new Response(JSON.stringify({ error: "Missing apiKeyId or userId" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Authorization: Check if API key belongs to user
  const apiKey = await ctx.runQuery(api.apiKeysQueries.getById, { keyIdStr: apiKeyId });
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }
  if (apiKey.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Unauthorized: API key does not belong to user" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  try {
    await ctx.runAction(api.apiKeys.deleteByStringId, { keyIdStr: apiKeyId });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to delete API key" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
