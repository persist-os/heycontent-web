import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const { userId, platform, limit } = Object.fromEntries(new URL(req.url).searchParams);
  if (!userId || !platform) {
    return new Response(JSON.stringify({ error: "Missing required query parameters: userId and platform" }), { status: 400 });
  }
  try {
    const analyses = await ctx.runQuery(api.analyses.getAnalysesByUserPlatform, { userId, platform, limit: limit ? parseInt(limit) : undefined });
    return new Response(JSON.stringify({ success: true, data: analyses }));
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message || "Internal Server Error" }), { status: 500 });
  }
});
