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
  const persona = await ctx.runQuery(api.personas.getPersona, { userId });
  return new Response(JSON.stringify(persona), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
