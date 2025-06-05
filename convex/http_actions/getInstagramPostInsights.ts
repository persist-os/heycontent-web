import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  // Try to extract from query params first
  let userId = url.searchParams.get("userId");
  let postId = url.searchParams.get("postId");

  // If not present in query params, extract from path using regex
  if (!userId || !postId) {
    // Example path: /api/users/:userId/instagram/posts/:postId/insights
    const match = url.pathname.match(/\/api\/users\/([^/]+)\/instagram\/posts\/([^/]+)\/insights/);
    if (match) {
      userId = match[1];
      postId = match[2];
    }
  }

  if (!userId || !postId) {
    return new Response(JSON.stringify({ success: false, error: "Missing or invalid userId or postId" }), { status: 400 });
  }
  try {
    const post = await ctx.runQuery(api.instagramQueries.getInstagramPost, { userId, postId });
    if (!post) {
      return new Response(JSON.stringify({ success: false, error: "Post not found" }), { status: 404 });
    }
    const insights = {
      likes: post?.data?.like_count ?? 0,
      comments: post?.data?.comment_count ?? 0,
    };
    return new Response(JSON.stringify({ success: true, insights }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to get Instagram post insights" }), { status: 500 });
  }
});
