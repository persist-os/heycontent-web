import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

// Helper to extract userId from /api/users/:userId/...
function extractUserIdFromApiUsersPath(pathname: string): string | null {
  // e.g. /api/users/:userId/stripe/subscription
  const parts = pathname.split("/");
  // ['', 'api', 'users', ':userId', ...]
  if (parts.length > 3 && parts[1] === "api" && parts[2] === "users") {
    return parts[3];
  }
  return null;
}

export default httpAction(async (ctx, req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(req.url);
  const userId = extractUserIdFromApiUsersPath(url.pathname);
  const meterName = url.searchParams.get("meterName");
  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing or invalid userId in path" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!meterName) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing meter name" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const subscription = await ctx.runQuery(api.subscriptionQueries.getUserSubscription, { userId });
    if (!subscription) {
      return new Response(
        JSON.stringify({ success: false, error: "Subscription not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    if (subscription.items && Array.isArray(subscription.items)) {
      const item = subscription.items.find(item => item.meterName === meterName);
      if (!item) {
        return new Response(
          JSON.stringify({ success: false, error: "Subscription item not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ subscriptionItemId: item.stripeItemId }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    const stripeSubscriptionId = subscription.stripeSubscriptionId;
    if (!stripeSubscriptionId) {
      return new Response(
        JSON.stringify({ success: false, error: "No Stripe subscription ID found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    if (meterName === "api_requests") {
      const meteredItemId = `si_metered_${stripeSubscriptionId}`;
      return new Response(JSON.stringify({ subscriptionItemId: meteredItemId }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(
      JSON.stringify({ success: false, error: `Unsupported meter name: ${meterName}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to retrieve subscription item" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
