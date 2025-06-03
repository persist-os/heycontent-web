import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const { noteId, userId } = Object.fromEntries(new URL(req.url).searchParams);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing required query parameter: userId" }), { status: 400 });
  }
  if (!noteId) {
    return new Response(JSON.stringify({ error: "Missing noteId in query" }), { status: 400 });
  }
  try {
    const note = await ctx.runQuery(api.notes.getNote, { noteId, userId });
    if (note) {
      return new Response(JSON.stringify({ success: true, note }));
    } else {
      return new Response(JSON.stringify({ success: false, error: "Note not found or unauthorized" }), { status: 404 });
    }
  } catch (error: any) {
    console.error("Failed to get note:", error);
    if (error.data) {
      return new Response(JSON.stringify({ success: false, error: "Failed to get note", details: error.data }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: false, error: "Failed to get note", message: error.message || "Internal Server Error" }), { status: 500 });
  }
});
