import { httpRouter } from "convex/server";
import notesRouter from "./notes/notes";

/**
 * NATIVE CONVEX HTTP ACTIONS
 * 
 * This is the new parallel system that sits on top of the old Hono system.
 * Routes are organized by domain for maintainability.
 * 
 * CURRENT STATUS: PILOT PHASE
 * - notes/ domain implemented (3 routes)
 * - All other domains will fallback to existing http.ts
 * 
 * FALLBACK STRATEGY:
 * If a route is not handled here, it falls back to the existing Hono router.
 */

const http = httpRouter();

// For now, we'll just export the notes router directly for testing
// Once verified, we'll create a proper aggregation router

export default notesRouter;

