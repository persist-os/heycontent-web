import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(req.url);
  // Use regex to extract userId from /api/users/:userId/stripe/subscription
  const pathMatch = url.pathname.match(/\/api\/users\/([^\/]+)\/stripe\/subscription/);
  if (!pathMatch) {
    return new Response(JSON.stringify({ error: "Invalid URL format" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const [, userId] = pathMatch;
  try {
    const subscription = await ctx.runQuery(api.subscriptionQueries.getUserSubscription, { userId });
    return new Response(JSON.stringify(subscription), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to retrieve subscription" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
