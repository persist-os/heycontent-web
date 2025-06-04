import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  // Prefer userId from query parameter, fallback to regex path extraction
  let userId = url.searchParams.get("userId");
  if (!userId) {
    const pathMatch = url.pathname.match(/\/api\/users\/([^\/]+)\/stripe\/customer/);
    if (pathMatch) {
      userId = pathMatch[1];
    }
  }
  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: "Missing or invalid userId" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  try {
    const user = await ctx.runQuery(api.userQueries.getUser, { userId });
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!user.stripeCustomerId) {
      return new Response(JSON.stringify({ stripeCustomerId: null }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ stripeCustomerId: user.stripeCustomerId }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to retrieve customer" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
