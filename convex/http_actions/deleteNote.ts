import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export default httpAction(async (ctx, req) => {
  const { noteId } = Object.fromEntries(new URL(req.url).searchParams);
  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing required field in body: userId" }), { status: 400 });
    }
    const deleteResult = await ctx.runMutation(api.notes.deleteNote, {
      noteId: noteId as Id<"notes">,
      userId,
    });
    if (!deleteResult || !deleteResult.success) {
      return new Response(JSON.stringify({ success: false, error: "Mutation reported failure to delete note" }), { status: 500 });
    }
    const stillExists = await ctx.runQuery(api.notes.getNote, { noteId, userId });
    if (stillExists) {
      return new Response(JSON.stringify({ success: false, error: "Note still found after deletion attempt, verification failed" }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: true, message: "Note deleted successfully and verified" }));
  } catch (error: any) {
    console.error("Failed to delete note or verify deletion:", error);
    if (error.message && error.message.includes("Note not found or unauthorized")) {
      return new Response(JSON.stringify({ success: false, error: "Note not found or unauthorized to delete" }), { status: 404 });
    }
    if (error.data) {
      return new Response(JSON.stringify({ success: false, error: "Failed to delete note", details: error.data }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: false, error: "Failed to delete note", message: error.message || "Internal Server Error" }), { status: 500 });
  }
});
