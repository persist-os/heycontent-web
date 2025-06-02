import { api } from "../_generated/api";

export default async function httpRequest(ctx, request) {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
  }
  const user = await ctx.runQuery(api.userQueries.getUser, { userId });
  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
