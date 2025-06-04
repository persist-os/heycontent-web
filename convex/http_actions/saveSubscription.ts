import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  const userId = url.pathname.split("/")[4];
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
