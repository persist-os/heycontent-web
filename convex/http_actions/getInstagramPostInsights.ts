import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  const userId = parts[4];
  const postId = parts[7];
  try {
    const post = await ctx.runQuery(api.instagramQueries.getInstagramPost, { userId, postId });
    if (!post) {
      return new Response(JSON.stringify({ success: false, error: "Post not found" }), { status: 404 });
    }
    const insights = {
      likes: post.data.like_count || 0,
      comments: post.data.comment_count || 0,
    };
    return new Response(JSON.stringify({ success: true, insights }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to get Instagram post insights" }), { status: 500 });
  }
});
