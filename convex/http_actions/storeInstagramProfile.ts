import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const userId = url.pathname.split("/")[4]; // /api/users/:id/instagram/profile
  const { username, accountId, profileData, createdAt, updatedAt } = await request.json();
  if (!profileData || !profileData.id || !username || !accountId) {
    return new Response(JSON.stringify({ success: false, error: "profileData.id, accountId, and username are required" }), { status: 400 });
  }
  try {
    const result = await ctx.runMutation(api.instagramMutations.storeProfileData, {
      userId,
      accountId,
      username,
      profileData,
      createdAt: createdAt ?? Date.now(),
      updatedAt: updatedAt ?? Date.now(),
    });
    return new Response(JSON.stringify({ success: true, status: result.status, accountId: result.accountId }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to store Instagram profile data" }), { status: 500 });
  }
});
