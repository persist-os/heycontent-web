import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const users = await ctx.runQuery(api.userQueries.list, {});
  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});