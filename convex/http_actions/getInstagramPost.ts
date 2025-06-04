import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/users\/([^\/]+)\/instagram\/post\/([^\/]+)/);
  if (!pathMatch) {
    return new Response(JSON.stringify({ error: "Invalid URL format" }), { status: 400 });
  }
  const [, userId, postId] = pathMatch;

  try {
    const post = await ctx.runQuery(api.instagramQueries.getInstagramPost, { userId, postId });
    if (!post) {
      return new Response(JSON.stringify({ success: false, error: "Post not found" }), { status: 404 });
    }
    return new Response(JSON.stringify({ success: true, post: post.data }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: "Failed to get Instagram post" }), { status: 500 });
  }
});
