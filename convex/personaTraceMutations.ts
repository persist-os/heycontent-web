/**
 * Persona Trace Mutations
 * Handles individual trace operations (add, delete, update confidence)
 */

import { v } from "convex/values";
import { mutation, internalMutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  traceTypeValidator,
  backendTraceMetadataValidator,
  enhancedPersonaTraceValidator,
  internalTraceValidator,
  PersonaCrystallizationError
} from "./lib/personaTypes";
import {
  generateMutationId,
  logMutationStart,
  logMutationComplete,
  logMutationError,
  createPersonaError,
  createSuccessResult,
  createFailureResult
} from "./lib/personaErrorHandling";
import {
  generateManualTraceId,
  createDefaultTraceMetadata
} from "./lib/personaTraceUtils";
import { validateUserId, validateConfidence } from "./lib/personaValidation";

/**
 * Store persona traces from Agent 1's extraction process (internal)
 */
export const storePersonaTraces = internalMutation({
  args: {
    user_id: v.string(),
    conversation_id: v.id("conversations"),
    traces: v.array(internalTraceValidator)
  },
  returns: v.object({
    success: v.boolean(),
    traces_stored: v.number(),
    errors: v.array(v.string())
  }),
  handler: async (ctx, args) => {
    const mutationId = generateMutationId();
    const startTime = Date.now();
    
    logMutationStart(mutationId, "STORE-TRACES", {
      user_id: args.user_id,
      conversation_id: args.conversation_id,
      tracesCount: args.traces.length
    });
    
    const results = {
      success: true,
      traces_stored: 0,
      errors: [] as string[]
    };

    try {
      console.log(`🔄 [STORE-TRACES:${mutationId}] Starting batch insert of ${args.traces.length} traces`);
      
      // Batch insert traces
      for (let i = 0; i < args.traces.length; i++) {
        const traceData = args.traces[i];
        console.log(`📝 [STORE-TRACES:${mutationId}] Processing trace ${i + 1}/${args.traces.length}`, {
          trace_id: traceData.trace_id,
          trace_type: traceData.trace_type,
          confidence: traceData.confidence,
          insightLength: traceData.extracted_insight.length
        });
        
        try {
          // Check for duplicate traces (same conversation, trace_id, and trace_type)
          const existingTrace = await ctx.db
            .query("persona_traces")
            .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversation_id))
            .filter((q) => 
              q.and(
                q.eq(q.field("trace_id"), traceData.trace_id),
                q.eq(q.field("trace_type"), traceData.trace_type),
                q.eq(q.field("verbatim_quote"), traceData.verbatim_quote)
              )
            )
            .first();

          if (existingTrace) {
            console.log('⚠️ [STORE-TRACES] Skipping duplicate trace:', traceData.trace_type, 'with ID', traceData.trace_id);
            continue;
          }

          // Insert new trace with all enhanced fields as backend provides them
          await ctx.db.insert("persona_traces", {
            // Required fields
            user_id: args.user_id,
            conversation_id: args.conversation_id,
            trace_id: traceData.trace_id,
            trace_type: traceData.trace_type,
            verbatim_quote: traceData.verbatim_quote,
            extracted_insight: traceData.extracted_insight,
            confidence: traceData.confidence,
            context: traceData.context,
            temporal_weight: traceData.temporal_weight,
            preference_strength: traceData.preference_strength,
            metadata: traceData.metadata,
            
            // Optional enhanced fields (only include if present in backend data)
            ...(traceData.behavioral_consistency !== undefined && { behavioral_consistency: traceData.behavioral_consistency }),
            ...(traceData.contextual_relevance !== undefined && { contextual_relevance: traceData.contextual_relevance }),
            ...(traceData.contradiction_flags !== undefined && { 
              contradiction_flags: traceData.contradiction_flags === null ? [] : traceData.contradiction_flags 
            }),
            ...(traceData.crystallization_priority !== undefined && { crystallization_priority: traceData.crystallization_priority }),
            ...(traceData.emotional_valence !== undefined && { emotional_valence: traceData.emotional_valence }),
            ...(traceData.last_accessed !== undefined && { last_accessed: traceData.last_accessed }),
            ...(traceData.processing_version !== undefined && { processing_version: traceData.processing_version }),
            ...(traceData.quality_score !== undefined && { quality_score: traceData.quality_score }),
            ...(traceData.semantic_tags !== undefined && { semantic_tags: traceData.semantic_tags }),
            ...(traceData.source_message_index !== undefined && { source_message_index: traceData.source_message_index })
          });

          results.traces_stored++;

        } catch (error) {
          const errorMsg = `Failed to store trace ${traceData.trace_type}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('❌ [STORE-TRACES]', errorMsg);
          results.errors.push(errorMsg);
          results.success = false;
        }
      }

      const processingTime = Date.now() - startTime;
      logMutationComplete(mutationId, "STORE-TRACES", processingTime, {
        traces_stored: results.traces_stored,
        totalTraces: args.traces.length,
        errors: results.errors.length
      });
      
      return results;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logMutationError(mutationId, "STORE-TRACES", error as Error, processingTime);
      
      return {
        success: false,
        traces_stored: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
});

/**
 * Manually add a persona trace (for testing or manual curation)
 */
export const addPersonaTrace = mutation({
  args: {
    user_id: v.string(),
    conversation_id: v.id("conversations"),
    trace_type: traceTypeValidator,
    verbatim_quote: v.string(),
    extracted_insight: v.string(),
    confidence: v.float64(),
    context: v.string(),
    temporal_weight: v.optional(v.float64()),
    preference_strength: v.optional(v.float64()),
    metadata: v.optional(backendTraceMetadataValidator),
    // Optional enhanced fields
    behavioral_consistency: v.optional(v.float64()),
    contextual_relevance: v.optional(v.float64()),
    contradiction_flags: v.optional(v.union(v.array(v.string()), v.null())),
    crystallization_priority: v.optional(v.float64()),
    emotional_valence: v.optional(v.float64()),
    last_accessed: v.optional(v.float64()),
    processing_version: v.optional(v.string()),
    quality_score: v.optional(v.float64()),
    semantic_tags: v.optional(v.array(v.string())),
    source_message_index: v.optional(v.float64())
  },
  returns: v.object({
    success: v.boolean(),
    trace_id: v.optional(v.id("persona_traces")),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    const mutationId = generateMutationId();
    const startTime = Date.now();
    
    logMutationStart(mutationId, "ADD-TRACE", {
      user_id: args.user_id,
      trace_type: args.trace_type
    });
    
    try {
      // Validate user ID
      const userValidation = validateUserId(args.user_id);
      if (userValidation) {
        return createFailureResult([userValidation]);
      }

      // Validate confidence
      const confidenceValidation = validateConfidence(args.confidence);
      if (confidenceValidation) {
        return createFailureResult([confidenceValidation]);
      }

      // Validate conversation belongs to user
      const conversation = await ctx.db.get(args.conversation_id);
      if (!conversation || conversation.userId !== args.user_id) {
        throw new Error("Conversation not found or unauthorized");
      }

      // Check for duplicates
      const existingTrace = await ctx.db
        .query("persona_traces")
        .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversation_id))
        .filter((q) => 
          q.and(
            q.eq(q.field("trace_type"), args.trace_type),
            q.eq(q.field("verbatim_quote"), args.verbatim_quote)
          )
        )
        .first();

      if (existingTrace) {
        return {
          success: false,
          error: "Duplicate trace already exists"
        };
      }

      const now = Date.now();
      const traceId = await ctx.db.insert("persona_traces", {
        // Required fields
        user_id: args.user_id,
        conversation_id: args.conversation_id,
        trace_id: generateManualTraceId(),
        trace_type: args.trace_type,
        verbatim_quote: args.verbatim_quote,
        extracted_insight: args.extracted_insight,
        confidence: args.confidence,
        context: args.context,
        temporal_weight: args.temporal_weight || 1.0,
        preference_strength: args.preference_strength || 0.5,
        metadata: args.metadata || createDefaultTraceMetadata(
          args.conversation_id,
          args.verbatim_quote,
          args.user_id
        ),
        
        // Optional enhanced fields (only include if provided)
        ...(args.behavioral_consistency !== undefined && { behavioral_consistency: args.behavioral_consistency }),
        ...(args.contextual_relevance !== undefined && { contextual_relevance: args.contextual_relevance }),
        ...(args.contradiction_flags !== undefined && { 
          contradiction_flags: args.contradiction_flags === null ? [] : args.contradiction_flags 
        }),
        ...(args.crystallization_priority !== undefined && { crystallization_priority: args.crystallization_priority }),
        ...(args.emotional_valence !== undefined && { emotional_valence: args.emotional_valence }),
        ...(args.last_accessed !== undefined && { last_accessed: args.last_accessed }),
        ...(args.processing_version !== undefined && { processing_version: args.processing_version }),
        ...(args.quality_score !== undefined && { quality_score: args.quality_score }),
        ...(args.semantic_tags !== undefined && { semantic_tags: args.semantic_tags }),
        ...(args.source_message_index !== undefined && { source_message_index: args.source_message_index })
      });

      const processingTime = Date.now() - startTime;
      logMutationComplete(mutationId, "ADD-TRACE", processingTime, { trace_id: traceId });
      
      return {
        success: true,
        trace_id: traceId
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logMutationError(mutationId, "ADD-TRACE", error as Error, processingTime);
      
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
    user_id: v.string(),
    trace_id: v.id("persona_traces")
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    const mutationId = generateMutationId();
    const startTime = Date.now();
    
    logMutationStart(mutationId, "DELETE-TRACE", {
      user_id: args.user_id,
      trace_id: args.trace_id
    });
    
    try {
      // Validate user ID
      const userValidation = validateUserId(args.user_id);
      if (userValidation) {
        return {
          success: false,
          error: userValidation.message
        };
      }

      const trace = await ctx.db.get(args.trace_id);
      if (!trace || trace.user_id !== args.user_id) {
        throw new Error("Trace not found or unauthorized");
      }

      await ctx.db.delete(args.trace_id);

      const processingTime = Date.now() - startTime;
      logMutationComplete(mutationId, "DELETE-TRACE", processingTime);
      
      return { success: true };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logMutationError(mutationId, "DELETE-TRACE", error as Error, processingTime);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Update trace confidence (for manual curation)
 */
export const updateTraceConfidence = mutation({
  args: {
    user_id: v.string(),
    trace_id: v.id("persona_traces"),
    confidence: v.number()
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    const mutationId = generateMutationId();
    const startTime = Date.now();
    
    logMutationStart(mutationId, "UPDATE-TRACE-CONFIDENCE", {
      user_id: args.user_id,
      trace_id: args.trace_id,
      confidence: args.confidence
    });
    
    try {
      // Validate user ID
      const userValidation = validateUserId(args.user_id);
      if (userValidation) {
        return {
          success: false,
          error: userValidation.message
        };
      }

      // Validate confidence
      const confidenceValidation = validateConfidence(args.confidence);
      if (confidenceValidation) {
        return {
          success: false,
          error: confidenceValidation.message
        };
      }

      const trace = await ctx.db.get(args.trace_id);
      if (!trace || trace.user_id !== args.user_id) {
        throw new Error("Trace not found or unauthorized");
      }

      await ctx.db.patch(args.trace_id, {
        confidence: args.confidence
      });

      const processingTime = Date.now() - startTime;
      logMutationComplete(mutationId, "UPDATE-TRACE-CONFIDENCE", processingTime);
      
      return { success: true };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logMutationError(mutationId, "UPDATE-TRACE-CONFIDENCE", error as Error, processingTime);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Bulk delete traces for a conversation (cleanup)
 */
export const deleteConversationTraces = mutation({
  args: {
    user_id: v.string(),
    conversation_id: v.id("conversations")
  },
  returns: v.object({
    success: v.boolean(),
    deleted_count: v.number(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    const mutationId = generateMutationId();
    const startTime = Date.now();
    
    logMutationStart(mutationId, "DELETE-CONVERSATION-TRACES", {
      user_id: args.user_id,
      conversation_id: args.conversation_id
    });
    
    try {
      // Validate user ID
      const userValidation = validateUserId(args.user_id);
      if (userValidation) {
        return {
          success: false,
          deleted_count: 0,
          error: userValidation.message
        };
      }

      // Validate conversation belongs to user
      const conversation = await ctx.db.get(args.conversation_id);
      if (!conversation || conversation.userId !== args.user_id) {
        throw new Error("Conversation not found or unauthorized");
      }

      // Get all traces for this conversation
      const traces = await ctx.db
        .query("persona_traces")
        .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversation_id))
        .collect();

      // Delete all traces
      let deletedCount = 0;
      for (const trace of traces) {
        await ctx.db.delete(trace._id);
        deletedCount++;
      }

      const processingTime = Date.now() - startTime;
      logMutationComplete(mutationId, "DELETE-CONVERSATION-TRACES", processingTime, {
        deleted_count: deletedCount
      });
      
      return {
        success: true,
        deleted_count: deletedCount
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logMutationError(mutationId, "DELETE-CONVERSATION-TRACES", error as Error, processingTime);
      
      return {
        success: false,
        deleted_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});