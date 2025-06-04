import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  const userId = url.pathname.split("/")[4];
  const { timestamp, model, status, qty } = await req.json();
  if (!userId || !timestamp || !model || !status || typeof qty !== "number") {
    return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), { status: 400 });
  }
  await ctx.runMutation(api.usageEvents.logUsageEvent, {
    userId,
    timestamp,
    model,
    status,
    qty,
  });
  await ctx.runMutation(api.usageEvents.updateUserUsage, { userId, qty });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
