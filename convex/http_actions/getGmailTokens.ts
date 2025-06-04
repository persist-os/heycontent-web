import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const { userId } = Object.fromEntries(new URL(req.url).searchParams);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId in query" }), { status: 400 });
  }
  try {
    const token = await ctx.runQuery(api.gmailQueries.getGmailToken, { userId });
    return new Response(JSON.stringify({ success: true, token }));
  } catch (error: any) {
    console.error("Failed to get Gmail tokens:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to retrieve Gmail tokens" }), { status: 500 });
  }
});
