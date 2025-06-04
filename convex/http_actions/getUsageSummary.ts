import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  const userId = url.pathname.split("/")[4];
  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: "Missing userId" }), { status: 400 });
  }
  const summary = await ctx.runQuery(api.usageEvents.getUsageSummary, { userId });
  return new Response(JSON.stringify({ success: true, ...summary }), { status: 200 });
});
