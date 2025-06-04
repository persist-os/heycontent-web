import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  const userId = url.pathname.split("/")[4];
  const updates = await req.json();
  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing user ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!updates || typeof updates !== "object") {
    return new Response(
      JSON.stringify({ success: false, error: "Missing or invalid update data" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    await ctx.runMutation(api["http_actions/updateUser"], { userId, updates });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to update Stripe customer" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
