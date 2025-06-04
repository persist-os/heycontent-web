import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), { status: 400 });
  }
  const { userId, title, messages } = body;
  if (!userId || !title) {
    return new Response(JSON.stringify({ error: "Missing userId or title" }), { status: 400 });
  }
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Missing or invalid 'messages' (must be an array)" }), { status: 400 });
  }
  try {
    const result = await ctx.runMutation(api.chatMutations.createConversation, {
      userId,
      title,
      messages,
    });
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to create conversation" }), { status: 500 });
  }
});
