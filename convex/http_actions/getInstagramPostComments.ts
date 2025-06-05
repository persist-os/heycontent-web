import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  // Expect path: /api/instagram/users/:userId/posts/:postId/comments
  const match = url.pathname.match(/^\/api\/instagram\/users\/([^/]+)\/posts\/([^/]+)\/comments$/);
  if (!match) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid URL format. Expected /api/instagram/users/:userId/posts/:postId/comments" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const userId = match[1];
  const postId = match[2];
  if (!userId || !postId) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing userId or postId in URL" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const post = await ctx.runQuery(api.instagramQueries.getInstagramPost, { userId, postId });
    if (!post) {
      return new Response(JSON.stringify({ success: false, error: "Post not found" }), { status: 404 });
    }
    return new Response(JSON.stringify({ success: true, comments: post.data.comments || [] }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to get Instagram post comments" }), { status: 500 });
  }
});
