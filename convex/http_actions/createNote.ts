import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const body = await req.json();
    const { userId, content, platform, type, templateInput, analysisId, title, important, tags } = body;
    if (!userId || !content || !platform) {
      return new Response(JSON.stringify({ error: "Missing required fields: userId, content, platform" }), { status: 400 });
    }
    const note = await ctx.runMutation(api.notes.createNote, {
      userId,
      content,
      platform,
      type,
      templateInput,
      analysisId,
      title,
      important,
      tags,
    });
    return new Response(JSON.stringify({ success: true, note }), { status: 201 });
  } catch (error: any) {
    console.error("Failed to create note:", error);
    if (error.data) {
      return new Response(JSON.stringify({ success: false, error: "Failed to create note", details: error.data }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: false, error: "Failed to create note", message: error.message || "Internal Server Error" }), { status: 500 });
  }
});