import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const body = await request.json();
  const { name, email, image, userId } = body;
  if (!name || !email) {
    return new Response(JSON.stringify({ error: "Missing name or email" }), { status: 400 });
  }
  const args = { name, email, ...(image && { image }), ...(userId && { userId }) };
  // Adjust mutation name if needed
  const result = await ctx.runMutation(api.userMutations.create_user, args);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status: 201,
  });
});
