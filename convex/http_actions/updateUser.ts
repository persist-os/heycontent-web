import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "PATCH") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const body = await request.json();
  const { userId, name, email, image } = body;
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
  }
  const updates = { ...(name && { name }), ...(email && { email }), ...(image && { image }) };
  const result = await ctx.runMutation(api.userMutations.updateUser, { userId, updates });
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
