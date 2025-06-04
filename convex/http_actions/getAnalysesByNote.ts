import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const { noteId } = Object.fromEntries(new URL(req.url).searchParams);
  if (!noteId) {
    return new Response(JSON.stringify({ error: "Missing noteId in query" }), { status: 400 });
  }
  try {
    const analyses = await ctx.runQuery(api.analyses.getAnalysesByNote, { noteId });
    return new Response(JSON.stringify({ success: true, analyses }));
  } catch (error: any) {
    console.error("Failed to get analyses for note:", error);
    if (error.data) {
      return new Response(JSON.stringify({ success: false, error: "Failed to get analyses for note", details: error.data }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: false, error: "Failed to get analyses for note", message: error.message || "Internal Server Error" }), { status: 500 });
  }
});
