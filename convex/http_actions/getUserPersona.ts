import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
  }
  const personas = await ctx.runQuery(api.personaQueries.getPersonasByUser, { creatorId: userId });
  return new Response(JSON.stringify(personas), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
