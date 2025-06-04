import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  const userId = url.pathname.split("/")[4];
  const { periodStart, periodEnd, includedRequests } = await req.json();
  if (!userId || !periodStart || !periodEnd || typeof includedRequests !== "number") {
    return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), { status: 400 });
  }
  const result = await ctx.runMutation(api.usageEvents.resetUsageForPeriod, {
    userId,
    periodStart,
    periodEnd,
    includedRequests,
  });
  return new Response(JSON.stringify(result), { status: 200 });
});
