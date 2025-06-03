import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const { userId, title, messages } = await request.json();
  if (!userId || !title) {
    return new Response(JSON.stringify({ error: "Missing userId or title" }), { status: 400 });
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
