import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const { userId, limit } = Object.fromEntries(new URL(req.url).searchParams);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
  }
  // Validate limit before parsing
  let parsedLimit: number | undefined = undefined;
  if (typeof limit === 'string' && /^\d+$/.test(limit)) {
    parsedLimit = parseInt(limit, 10);
  }
  try {
    const analyses = await ctx.runQuery(api.analyses.getAnalysesByUser, { userId, limit: parsedLimit });
    return new Response(JSON.stringify({ success: true, data: analyses }));
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message || "Internal Server Error" }), { status: 500 });
  }
});
