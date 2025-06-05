import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  // Add authentication check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
  }
  // Validate API key or session token
  const token = authHeader.substring(7);
  // Add your token validation logic here

  const url = new URL(req.url);
  // Prefer userId from query parameter, fallback to regex path extraction
  let userId = url.searchParams.get("userId");
  if (!userId) {
    const pathMatch = url.pathname.match(/\/api\/users\/([^\/]+)\/usage\/summary/);
    if (pathMatch) {
      userId = pathMatch[1];
    }
  }
  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: "Missing userId" }), { status: 400 });
  }
  const summary = await ctx.runQuery(api.usageEvents.getUsageSummary, { userId });
  return new Response(JSON.stringify({ success: true, data: summary }), { status: 200 });
});
