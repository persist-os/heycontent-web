import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: { "Content-Type": "application/json" } });
  }
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  if (!email) {
    return new Response(JSON.stringify({ error: "Missing email" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  try {
    const user = await ctx.runQuery(api.userQueries.getUserByEmail, { email });
    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to get user by email", message: error instanceof Error ? error.message : String(error) }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
