import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  // Expect path: /api/users/:userId/instagram/token
  const match = url.pathname.match(/^\/api\/users\/([^/]+)\/instagram\/token$/);
  if (!match) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid URL format. Expected /api/users/:userId/instagram/token" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const userId = match[1];
  if (typeof userId !== "string" || userId.trim() === "") {
    return new Response(
      JSON.stringify({ success: false, error: "Missing or invalid userId in URL" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const { accountId, accessToken, refreshToken, expiresAt, scope } = body;
  if (
    typeof accountId !== "string" || accountId.trim() === "" ||
    typeof accessToken !== "string" || accessToken.trim() === "" ||
    typeof refreshToken !== "string" || refreshToken.trim() === "" ||
    typeof expiresAt !== "number" ||
    (typeof scope !== "string" && !Array.isArray(scope))
  ) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing or invalid fields: accountId, accessToken, refreshToken (strings), expiresAt (number), scope (string or array) required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
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
      username: ""
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to store Instagram token" }), { status: 500 });
  }
});
