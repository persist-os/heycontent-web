/**
 * Clean Persona Trace Mutations
 * Simplified operations for the new content-based schema
 */

import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  personaTraceInputValidator,
  PersonaTraceInput,
  TraceStorageResponse
} from "./lib/personaTypes";

/**
 * Store persona traces from backend (internal)
 */
export const storePersonaTraces = internalMutation({
  args: {
    traces: v.array(personaTraceInputValidator)
  },
  returns: v.object({
    success: v.boolean(),
    tracesStored: v.number(),
    errors: v.array(v.string())
  }),
  handler: async (ctx, args): Promise<TraceStorageResponse> => {
    console.log(`🔄 [STORE-TRACES] Processing ${args.traces.length} traces`);
    
    const results: TraceStorageResponse = {
      success: true,
      tracesStored: 0,
      errors: []
    };

    try {
      for (let i = 0; i < args.traces.length; i++) {
        const trace = args.traces[i];
        
        try {
          // Simple validation
          if (!trace.userId || !trace.content || typeof trace.confidence !== 'number') {
            results.errors.push(`Invalid trace data at index ${i}`);
            continue;
          }

          // Store trace with simplified schema
          await ctx.db.insert("persona_traces", {
            userId: trace.userId,
            content: trace.content,
            timestamp: trace.timestamp || Date.now(),
            confidence: Math.max(0, Math.min(1, trace.confidence)) // Clamp 0-1
          });

          results.tracesStored++;
          
        } catch (error) {
          const errorMsg = `Failed to store trace ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('❌ [STORE-TRACES]', errorMsg);
          results.errors.push(errorMsg);
        }
      }

      if (results.errors.length > 0) {
        results.success = false;
      }

      console.log(`✅ [STORE-TRACES] Completed: ${results.tracesStored}/${args.traces.length} traces stored`);
      return results;

    } catch (error) {
      console.error('❌ [STORE-TRACES] Critical error:', error);
      return {
        success: false,
        tracesStored: results.tracesStored,
        errors: [...results.errors, error instanceof Error ? error.message : 'Critical error']
      };
    }
  }
});

/**
 * Manually add a persona trace (for testing or manual input)
 */
export const addPersonaTrace = mutation({
  args: {
    userId: v.string(),
    content: v.any(),
    confidence: v.number()
  },
  returns: v.object({
    success: v.boolean(),
    traceId: v.optional(v.id("persona_traces")),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    console.log('📝 [ADD-TRACE] Adding manual trace for user:', args.userId);
    
    try {
      // Basic validation
      if (!args.userId || args.content === undefined || typeof args.confidence !== 'number') {
        return {
          success: false,
          error: "Invalid input: userId, content, and confidence are required"
        };
      }

      const traceId = await ctx.db.insert("persona_traces", {
        userId: args.userId,
        content: args.content,
        timestamp: Date.now(),
        confidence: Math.max(0, Math.min(1, args.confidence))
      });

      console.log('✅ [ADD-TRACE] Successfully added trace:', traceId);
      return {
        success: true,
        traceId
      };

    } catch (error) {
      console.error('❌ [ADD-TRACE] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Delete a persona trace
 */
export const deletePersonaTrace = mutation({
  args: {
    userId: v.string(),
    traceId: v.id("persona_traces")
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    console.log('🗑️ [DELETE-TRACE] Deleting trace:', args.traceId);
    
    try {
      // Verify trace belongs to user
      const trace = await ctx.db.get(args.traceId);
      if (!trace) {
        return {
          success: false,
          error: "Trace not found"
        };
      }

      if (trace.userId !== args.userId) {
        return {
          success: false,
          error: "Unauthorized: trace belongs to different user"
        };
      }

      await ctx.db.delete(args.traceId);
      
      console.log('✅ [DELETE-TRACE] Successfully deleted trace');
      return { success: true };

    } catch (error) {
      console.error('❌ [DELETE-TRACE] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Update trace confidence
 */
export const updateTraceConfidence = mutation({
  args: {
    userId: v.string(),
    traceId: v.id("persona_traces"),
    confidence: v.number()
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    console.log('📊 [UPDATE-CONFIDENCE] Updating trace confidence:', args.traceId);
    
    try {
      // Verify trace belongs to user
      const trace = await ctx.db.get(args.traceId);
      if (!trace) {
        return {
          success: false,
          error: "Trace not found"
        };
      }

      if (trace.userId !== args.userId) {
        return {
          success: false,
          error: "Unauthorized: trace belongs to different user"
        };
      }

      await ctx.db.patch(args.traceId, {
        confidence: Math.max(0, Math.min(1, args.confidence))
      });

      console.log('✅ [UPDATE-CONFIDENCE] Successfully updated confidence');
      return { success: true };

    } catch (error) {
      console.error('❌ [UPDATE-CONFIDENCE] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Delete all traces for a user (cleanup operation)
 */
export const deleteAllUserTraces = mutation({
  args: {
    userId: v.string()
  },
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    console.log('🧹 [DELETE-ALL-TRACES] Cleaning up traces for user:', args.userId);
    
    try {
      const traces = await ctx.db
        .query("persona_traces")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      let deletedCount = 0;
      for (const trace of traces) {
        await ctx.db.delete(trace._id);
        deletedCount++;
      }

      console.log(`✅ [DELETE-ALL-TRACES] Deleted ${deletedCount} traces`);
      return {
        success: true,
        deletedCount
      };

    } catch (error) {
      console.error('❌ [DELETE-ALL-TRACES] Error:', error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});