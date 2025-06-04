import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const body = await req.json();
  const { userId, account, messages, threads } = body;
  if (!userId || !account || !account.email) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing required fields: userId, account, account.email" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!Array.isArray(messages) || !Array.isArray(threads)) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing or invalid fields: messages and threads must be arrays" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const result = await ctx.runMutation(api.gmailMutations.storeGmailFullProfile, {
      userId,
      account,
      messages,
      threads,
    });
    return new Response(JSON.stringify({ success: true, result }));
  } catch (error: any) {
    console.error("Error storing Gmail full profile:", error);
    return new Response(JSON.stringify({ success: false, error: `Failed to store Gmail profile: ${error instanceof Error ? error.message : 'Unknown error'}` }), { status: 500 });
  }
});
