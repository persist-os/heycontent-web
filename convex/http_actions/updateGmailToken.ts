import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export default httpAction(async (ctx, req) => {
  const body = await req.json();
  const { userId, accessToken, refreshToken, expiryDate, scope, tokenType } = body;
  if (!userId || !accessToken || !refreshToken || !expiryDate) {
    return new Response(JSON.stringify({ success: false, error: "Missing required token fields" }), { status: 400 });
  }
  try {
    const result = await ctx.runMutation(api.gmailMutations.updateGmailToken, {
      userId,
      accessToken,
      refreshToken,
      expiryDate,
      scope: scope || "",
      tokenType: tokenType || "Bearer",
    });
    return new Response(JSON.stringify({ success: true, status: result.status, tokenId: result.tokenId }));
  } catch (error: any) {
    console.error("Failed to store Gmail token:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to store Gmail token" }), { status: 500 });
  }
}); 