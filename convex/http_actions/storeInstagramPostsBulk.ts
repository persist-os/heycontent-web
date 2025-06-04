import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

export default httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(request.url);
  const userId = url.pathname.split("/")[4]; // /api/users/:id/instagram/posts/bulk
  const { posts } = await request.json();
  if (!Array.isArray(posts) || posts.length === 0) {
    return new Response(JSON.stringify({ success: false, error: "No posts provided" }), { status: 400 });
  }
  const results = [];
  for (const post of posts) {
    if (!post.id) {
      results.push({ status: "error", error: "Missing post id", post });
      continue;
    }
    try {
      const result = await ctx.runMutation(api.instagramMutations.storePostData, {
        userId,
        postId: post.id,
        postData: post,
      });
      results.push({ status: result.status, postId: post.id });
    } catch (error) {
      results.push({ status: "error", error: error instanceof Error ? error.message : "Unknown error", postId: post.id });
    }
  }
  return new Response(JSON.stringify({ success: true, results }), { status: 200 });
});
