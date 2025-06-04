import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:v=|\/videos\/|embed\/|youtu\.be\/|\/v\/|\/e\/|watch\?v=|watch\?.+&v=)([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  const userId = url.pathname.split("/")[4];
  const videoUrl = url.searchParams.get("videoUrl");
  if (!videoUrl) {
    return new Response(JSON.stringify({ success: false, error: "Missing videoUrl query parameter" }), { status: 400 });
  }
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    return new Response(JSON.stringify({ success: false, error: "Invalid or unrecognized YouTube video URL" }), { status: 400 });
  }
  try {
    const video = await ctx.runQuery(api.youtubeQueries.getVideoById, { userId, videoId });
    if (!video) {
      return new Response(JSON.stringify({ success: false, error: "No video found for this user and videoId" }), { status: 404 });
    }
    return new Response(JSON.stringify({ success: true, video }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to retrieve video data" }), { status: 500 });
  }
});
