import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  const userId = url.pathname.split("/")[4];
  const body = await req.json();
  const { stripeCustomerId } = body;
  if (!stripeCustomerId) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing Stripe customer ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const existingUser = await ctx.runQuery(api.userQueries.getUserByStripeCustomerId, { stripeCustomerId });
    if (existingUser && existingUser.userId !== userId) {
      return new Response(
        JSON.stringify({ success: false, error: "This Stripe customer ID is already associated with another user" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    await ctx.runMutation(api["http_actions/updateUser"], { userId, updates: { stripeCustomerId } });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to save customer" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
