import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const body = await req.json();
  const { userId, email, messagesTotal, threadsTotal, labelsTotal, historyId } = body;
  if (!userId || !email) {
    return new Response(JSON.stringify({ success: false, error: "Missing required fields: userId, email" }), { status: 400 });
  }
  try {
    const result = await ctx.runMutation(api.gmailMutations.saveProfileData, {
      userId,
      email,
      profileData: {
        messagesTotal,
        threadsTotal,
        historyId,
        labelsTotal,
      },
    });
    return new Response(JSON.stringify({ success: true, status: result.status }));
  } catch (error: any) {
    console.error("Failed to store Gmail account data:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500 }
    );
  }
});
