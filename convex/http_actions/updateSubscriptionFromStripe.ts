import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  // Robust path validation: Must be /api/stripe/subscriptions/:id
  const match = url.pathname.match(/^\/api\/stripe\/subscriptions\/([^/]+)$/);
  if (!match) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid URL format. Expected /api/stripe/subscriptions/:id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const stripeSubscriptionId = match[1];

  // Parse and validate request body
  let data: any;
  try {
    data = await req.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  // Example validation: require 'status' (string) and 'customerId' (string)
  if (!data || typeof data !== "object" || typeof data.status !== "string" || typeof data.customerId !== "string") {
    return new Response(
      JSON.stringify({ success: false, error: "Missing or invalid required fields: status (string), customerId (string)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const result = await ctx.runMutation(api.subscriptionActions.updateSubscriptionFromStripe, {
      stripeSubscriptionId,
      data
    });
    if (!result.success) {
      // If the mutation failed due to bad input, use 400; otherwise, use 500
      const statusCode = result.error && result.error.toLowerCase().includes("not found") ? 400 : 500;
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: statusCode, headers: { "Content-Type": "application/json" } }
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
