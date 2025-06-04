import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  // Add authentication check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
  }
  // Optionally: Add logic to validate the token and ensure the user is allowed to save the subscription

  // Ensure the request method is POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method Not Allowed" }), { status: 405 });
  }

  // Use URLSearchParams to extract userId
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: "Missing userId" }), { status: 400 });
  }

  const body = await req.json();
  try {
    const result = await ctx.runMutation(api.subscriptionQueries.saveSubscription, {
      ...body,
      userId,
    });
    return new Response(JSON.stringify({ success: true, subscriptionId: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to save subscription" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
