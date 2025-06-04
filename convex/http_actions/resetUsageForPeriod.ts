import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  const userId = url.pathname.split("/")[4];
  const { periodStart, periodEnd, includedRequests } = await req.json();

  // Enhanced validation
  const userIdPattern = /^[a-zA-Z0-9_-]{20,}$/; // Convex IDs are usually 20+ chars, alphanumeric/underscore/hyphen
  if (!userId || !userIdPattern.test(userId)) {
    return new Response(JSON.stringify({ success: false, error: "Invalid or missing userId format" }), { status: 400 });
  }
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  if (!periodStart || isNaN(startDate.getTime())) {
    return new Response(JSON.stringify({ success: false, error: "Invalid or missing periodStart date" }), { status: 400 });
  }
  if (!periodEnd || isNaN(endDate.getTime())) {
    return new Response(JSON.stringify({ success: false, error: "Invalid or missing periodEnd date" }), { status: 400 });
  }
  if (typeof includedRequests !== "number") {
    return new Response(JSON.stringify({ success: false, error: "Missing or invalid includedRequests" }), { status: 400 });
  }

  const result = await ctx.runMutation(api.usageEvents.resetUsageForPeriod, {
    userId,
    periodStart,
    periodEnd,
    includedRequests,
  });
  return new Response(JSON.stringify(result), { status: 200 });
});
