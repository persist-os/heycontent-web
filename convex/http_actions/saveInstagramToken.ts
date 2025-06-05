import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const body = await request.json();
  const { userId, instagramId, username, accessToken, refreshToken } = body;
  if (!userId || !instagramId || !username || !accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }
  try {
    const result = await ctx.runMutation(api.instagramMutations.saveInstagramToken, {
      userId,
      accountId: instagramId,
      username,
      accessToken,
      refreshToken
    });
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to save Instagram token" }), { status: 500 });
  }
});
