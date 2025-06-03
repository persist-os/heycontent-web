import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const { userId, conversationId, message } = await request.json();
  if (!userId || !conversationId || !message) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }
  try {
    const result = await ctx.runMutation(api.chatMutations.addMessageToConversation, {
      userId,
      conversationId,
      message,
    });
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to add message" }), { status: 500 });
  }
});
