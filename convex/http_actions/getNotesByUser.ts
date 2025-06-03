import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const { userId } = Object.fromEntries(new URL(req.url).searchParams);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId in query" }), { status: 400 });
  }
  try {
    const notes = await ctx.runQuery(api.notes.getNotesByUser, { userId });
    return new Response(JSON.stringify({ success: true, notes }));
  } catch (error: any) {
    console.error("Failed to get notes by user:", error);
    if (error.data) {
      return new Response(JSON.stringify({ success: false, error: "Failed to get notes by user", details: error.data }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: false, error: "Failed to get notes by user", message: error.message || "Internal Server Error" }), { status: 500 });
  }
});
