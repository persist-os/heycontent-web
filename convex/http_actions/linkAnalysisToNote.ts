import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const { noteId } = Object.fromEntries(new URL(req.url).searchParams);
  if (!noteId || typeof noteId !== "string" || noteId.trim() === "") {
    return new Response(JSON.stringify({ error: "Missing or invalid noteId in query parameters" }), { status: 400 });
  }
  try {
    const { analysisId, userId } = await req.json();
    if (!analysisId || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields: analysisId and userId" }), { status: 400 });
    }
    const result = await ctx.runMutation(api.analyses.linkAnalysisToNote, {
      noteId,
      analysisId,
      userId,
    });
    return new Response(JSON.stringify({ success: true, data: result }));
  } catch (error: any) {
    console.error("Failed to link analysis to note:", error);
    if (error.message && error.message.includes("Note not found")) {
      return new Response(JSON.stringify({ success: false, error: "Note not found" }), { status: 404 });
    }
    if (error.message && error.message.includes("Unauthorized")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized to link analysis to this note" }), { status: 403 });
    }
    if (error.data) {
      return new Response(JSON.stringify({ success: false, error: "Failed to link analysis to note", details: error.data }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: false, error: "Failed to link analysis to note", message: error.message || "Internal Server Error" }), { status: 500 });
  }
});
