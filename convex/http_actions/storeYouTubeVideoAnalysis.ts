import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const videoId = url.searchParams.get("videoId");
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON in request body" }), { status: 400 });
  }
  const { analysisData } = body;
  if (!userId || !videoId) {
    return new Response(JSON.stringify({ success: false, error: "Missing userId or videoId" }), { status: 400 });
  }
  try {
    const result = await ctx.runMutation(api.youtubeMutations.storeVideoAnalysis, { userId, videoId, analysisData });
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to store video analysis" }), { status: 500 });
  }
});
