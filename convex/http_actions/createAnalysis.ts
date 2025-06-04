import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

interface CreateAnalysisArgs {
  noteId: string;
  platform: string;
  output: any;
  createdAt: number;
  error?: string;
}

export default httpAction(async (ctx, req) => {
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body" }),
      { status: 400 }
    );
  }
  const { noteId, platform, output, error } = body;
  if (!noteId || !platform) {
    return new Response(JSON.stringify({ error: "Missing required fields: noteId and platform" }), { status: 400 });
  }
  const args: CreateAnalysisArgs = {
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
  } catch (caughtError: any) {
    return new Response(JSON.stringify({ success: false, error: caughtError.message || "Internal Server Error" }), { status: 500 });
  }
});
