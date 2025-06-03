import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export default httpAction(async (ctx, req) => {
  const { noteId } = Object.fromEntries(new URL(req.url).searchParams);
  try {
    const { userId, updates } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing required field in body: userId" }), { status: 400 });
    }
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: "Missing or empty 'updates' object in request body" }), { status: 400 });
    }
    const updatedNote = await ctx.runMutation(api.notes.updateNote, {
      noteId: noteId as Id<"notes">,
      userId,
      updates,
    });
    return new Response(JSON.stringify({ success: true, note: updatedNote }));
  } catch (error: any) {
    console.error("Failed to update note:", error);
    if (error.message) {
      if (error.message.includes("Note not found")) {
        return new Response(JSON.stringify({ success: false, error: "Note not found" }), { status: 404 });
      }
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized to update this note" }), { status: 403 });
      }
    }
    if (error.data) {
      return new Response(JSON.stringify({ success: false, error: "Failed to update note", details: error.data }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: false, error: "Failed to update note", message: error.message || "Internal Server Error" }), { status: 500 });
  }
});
