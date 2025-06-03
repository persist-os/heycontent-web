import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const { noteId, platform, output, error } = await req.json();
  if (!noteId || !platform) {
    return new Response(JSON.stringify({ error: "Missing required fields: noteId and platform" }), { status: 400 });
  }
  const args: any = {
    noteId,
    platform,
    output: output || {},
    createdAt: Date.now(),
  };
  if (typeof error === "string") {
    args.error = error;
  }
  try {
    const analysisId = await ctx.runMutation(api.analyses.createNoteAnalysis, args);
    return new Response(JSON.stringify({ success: true, analysisId }), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message || "Internal Server Error" }), { status: 500 });
  }
});
