import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { Id } from "../_generated/dataModel";


function extractUserIdFromUsersPath(pathname: string): string | null {
  // e.g. /api/users/:userId/stripe/customer/update
  const parts = pathname.split("/");
  // ['', 'api', 'users', ':userId', ...]
  const usersIdx = parts.indexOf("users");
  if (usersIdx !== -1 && parts.length > usersIdx + 1) {
    return parts[usersIdx + 1];
  }
  return null;
}

export default httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  const userId = extractUserIdFromUsersPath(url.pathname);
  const updates = await req.json();
  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing user ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!updates || typeof updates !== "object") {
    return new Response(
      JSON.stringify({ success: false, error: "Missing or invalid update data" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    await ctx.runMutation(api.userMutations.updateUser, { userId: userId as Id<"users">, updates });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to update Stripe customer" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
