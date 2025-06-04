import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  // Assumes /api/stripe/subscriptions/:id
  const parts = url.pathname.split("/");
  const stripeSubscriptionId = parts[parts.length - 1];
  const data = await req.json();
  try {
    const result = await ctx.runMutation(api.subscriptionActions.updateSubscriptionFromStripe, {
      stripeSubscriptionId,
      data
    });
    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to update subscription" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
