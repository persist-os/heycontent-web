import { httpRouter } from "convex/server";
import { httpAction } from "../../_generated/server";
import { api } from "../../_generated/api";

const http = httpRouter();

/**
 * NOTES HTTP ACTIONS
 * Native Convex HTTP actions for notes domain
 * 
 * PILOT DOMAIN - Testing parallel system with fallback
 */

// GET /api/notes/:noteId
http.route({
  path: "/api/notes/:noteId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const noteId = request.url.split('/').pop() as string;
      
      const result = await ctx.runQuery(api.noteQueries.getNote, {
        noteId: noteId as any, // Convex ID will be validated
      });
      
      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("[noteQueries.getNote] Error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// GET /api/users/:userId/notes
http.route({
  path: "/api/users/:userId/notes",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const userId = pathParts[pathParts.findIndex(p => p === 'users') + 1];
      
      const result = await ctx.runQuery(api.noteQueries.getUserNotes, {
        userId,
      });
      
      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("[noteQueries.getUserNotes] Error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// PATCH /api/notes/:noteId
http.route({
  path: "/api/notes/:noteId",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    try {
      const noteId = request.url.split('/').pop() as string;
      const body = await request.json();
      
      const result = await ctx.runMutation(api.noteMutations.updateNote, {
        noteId: noteId as any,
        ...body,
      });
      
      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("[noteMutations.updateNote] Error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// POST /api/notes - Complex route (requires subscription check)
// TODO: This route needs manual review as it has 2 Convex calls
// For now, we'll let it fallback to the old system
/*
http.route({
  path: "/api/notes",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      
      // First check subscription
      const subscription = await ctx.runQuery(api.subscriptionQueries.getUserSubscription, {
        userId: body.userId,
      });
      
      // Then create note
      const result = await ctx.runMutation(api.noteMutations.createNote, body);
      
      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("[noteMutations.createNote] Error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});
*/

export default http;

