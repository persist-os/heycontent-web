import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  // Assumes /api/users/:id/stripe/subscription
  const userId = url.pathname.split("/")[4];
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
