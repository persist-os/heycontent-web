import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "DELETE") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const searchParams = new URL(request.url).searchParams;
  const apiKeyId = searchParams.get("apiKeyId");
  const userId = searchParams.get("userId");
  if (!apiKeyId) {
    return new Response(JSON.stringify({ error: "Missing apiKeyId" }), { status: 400 });
  }
  try {
    await ctx.runAction(api.apiKeys.deleteByStringId, { keyIdStr: apiKeyId });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to delete API key" }), { status: 500 });
  }
});
