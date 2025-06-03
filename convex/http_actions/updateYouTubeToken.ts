import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const userId = url.searchParams.get("id");
  const { accessToken, refreshToken, expiresAt, tokenType, scope } = await request.json();
  if (!userId || !accessToken || !refreshToken || !expiresAt || !tokenType) {
    return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), { status: 400 });
  }
  const scopeArray = Array.isArray(scope)
    ? scope
    : typeof scope === "string"
    ? scope.split(" ")
    : [];
  try {
    await ctx.runMutation(api.youtubeMutations.update_youtube_token, {
      userId,
      accessToken,
      refreshToken,
      expiresAt,
      tokenType,
      scope: scopeArray,
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to store YouTube token" }), { status: 500 });
  }
});
