import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const userId = url.searchParams.get("id");
  const { channelId, title, description, customUrl, thumbnails, statistics } = await request.json();
  if (!userId || !channelId || !title) {
    return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), { status: 400 });
  }
  try {
    await ctx.runMutation(api.youtubeMutations.saveChannelData, {
      userId,
      channelId,
      title,
      description,
      customUrl,
      thumbnails,
      statistics,
      updatedAt: Date.now()
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to store YouTube channel data" }), { status: 500 });
  }
});
