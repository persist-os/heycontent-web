import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  // Expecting /api/users/:userId/stripe/customer
  if (pathSegments.length < 6 || pathSegments[1] !== "api" || pathSegments[2] !== "users" || pathSegments[4] === undefined || pathSegments[5] !== "stripe" || pathSegments[6] !== "customer") {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid URL format. Expected /api/users/:userId/stripe/customer" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const userId = pathSegments[4];
  if (typeof userId !== "string" || userId.trim() === "") {
    return new Response(
      JSON.stringify({ success: false, error: "Missing or invalid userId in URL" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const body = await req.json();
  const { stripeCustomerId } = body;
  if (!stripeCustomerId) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing Stripe customer ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  // Authentication and authorization check
  // Authentication and authorization check via Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized: Missing or invalid Authorization header" }), { status: 401 });
  }
  // In a real system, you would validate the token and extract the user id securely.
  // For now, we'll assume the token itself is the userId (for demo/dev only!)
  const authenticatedUserId = authHeader.substring(7);
  if (!authenticatedUserId) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized: No authenticated user" }), { status: 401 });
  }
  if (authenticatedUserId !== userId) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden: You do not have permission to update this user" }), { status: 403 });
  }
  // Convert userId to Convex Id type
  let userIdConvex: Id<"users">;
  try {
    userIdConvex = userId as Id<"users">;
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid userId for Convex ID" }),
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
    await ctx.runMutation(api.userMutations.updateUser, { userId: userIdConvex, updates: { stripeCustomerId } });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to save customer" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
