/**
 * A2A (Agent-to-Agent) Note Schema
 * 
 * Simple storage for agent network communication.
 * Agents can store and retrieve A2A notes from the shared context.
 */
import { v } from "convex/values";

export const a2aNoteSchemaFields = {
  agentId: v.string(),           // Agent that created the note (chat, orchestrator, nexus, etc.)
  report: v.any(),                // Note content (structured object)
  conversationId: v.optional(v.string()),  // Optional conversation context
  projectId: v.optional(v.string()),       // Optional project context
  createdAt: v.number(),          // Timestamp
};

