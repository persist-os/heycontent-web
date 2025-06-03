import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const userId = url.pathname.split("/")[4]; // /api/users/:id/instagram/token
  const { accountId, accessToken, refreshToken, expiresAt, scope } = await request.json();
  const scopeArray = Array.isArray(scope)
    ? scope
    : typeof scope === "string"
    ? scope.split(" ")
    : [];
  try {
    await ctx.runMutation(api.instagramMutations.updateInstagramToken, {
      userId,
      accountId,
      accessToken,
      refreshToken,
      expiresAt,
      scope: scopeArray,
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to store Instagram token" }), { status: 500 });
  }
});
