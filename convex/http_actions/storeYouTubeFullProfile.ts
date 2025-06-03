import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const userId = url.searchParams.get("id");
  const { channel, videos } = await request.json();
  if (!userId || !channel || !videos) {
    return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), { status: 400 });
  }
  try {
    await ctx.runMutation(api.youtubeMutations.storeYoutubeFullProfile, {
      userId,
      channel,
      videos,
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to store YouTube profile" }), { status: 500 });
  }
});
