import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const userId = url.searchParams.get("id");
  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: "Missing userId" }), { status: 400 });
  }
  try {
    const tokens = await ctx.runQuery(api.youtubeQueries.getYouTubeTokens, { userId });
    return new Response(JSON.stringify({ success: true, tokens }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to retrieve user tokens" }), { status: 500 });
  }
});
