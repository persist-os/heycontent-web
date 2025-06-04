import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  // Expect path: /api/users/:userId/instagram/tokens
  const match = url.pathname.match(/^\/api\/users\/([^/]+)\/instagram\/tokens$/);
  if (!match) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid URL format. Expected /api/users/:userId/instagram/tokens" }),
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
  try {
    const tokens = await ctx.runQuery(api.instagramQueries.getInstagramTokens, { userId });
    return new Response(JSON.stringify({ success: true, tokens }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to retrieve Instagram tokens" }), { status: 500 });
  }
});
