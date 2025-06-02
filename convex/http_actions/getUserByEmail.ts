import { api } from "../_generated/api";

export default async function httpRequest(ctx, request) {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  if (!email) {
    return new Response(JSON.stringify({ error: "Missing email" }), { status: 400 });
  }
  const user = await ctx.runQuery(api.userQueries.getUserByEmail, { email });
  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
