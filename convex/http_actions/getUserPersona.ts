import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  
  // Add authentication check
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
  }
  
  // Validate that the authenticated user can access the requested userId's API keys
  // This should verify that the token owner matches the requested userId

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
  }
  const personas = await ctx.runQuery(api.personaQueries.getPersonasByUser, { userId });
  return new Response(JSON.stringify(personas), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
