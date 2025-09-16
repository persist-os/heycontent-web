/**
 * Persona Crystallization Mutations - Main Entry Point
 * This file contains only the public actions that delegate to internal mutations
 * Individual mutation logic has been extracted to separate files for better organization
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  traceTypeValidator,
  backendTraceMetadataValidator,
  evolutionHistoryValidator,
  crystallizedInsightMetadataValidator,
  enhancedPersonaTraceValidator
} from "./lib/personaTypes";

/**
 * Public action to store persona traces - calls internal mutation
 */
export const storePersonaTracesAction = action({
  args: {
    user_id: v.string(),
    conversation_id: v.string(), // Backend sends as string, converted internally
    traces: v.array(enhancedPersonaTraceValidator)
  },
  returns: v.object({
    success: v.boolean(),
    traces_stored: v.number(),
    errors: v.array(v.string())
  }),
  handler: async (ctx, args) => {
    console.log('🎬 [PUBLIC ACTION] Storing persona traces via internal mutation');
    
    // Convert string conversation_id to Convex ID format
    return await ctx.runMutation(internal.personaTraceMutations.storePersonaTraces, {
      user_id: args.user_id,
      conversation_id: args.conversation_id as Id<"conversations">,
      traces: args.traces
    });
  }
});

/**
 * Public action to store crystallized insights - calls internal mutation
 */
export const storeCrystallizedInsightsAction = action({
  args: {
    user_id: v.string(),
    insights: v.array(v.object({
      insight_type: v.string(),
      crystallized_insight: v.string(),
      confidence: v.float64(),
      supporting_traces: v.array(v.string()), // Trace IDs as strings (converted internally)
      contradiction_flags: v.union(v.array(v.string()), v.null()),
      evolution_history: evolutionHistoryValidator,
      temporal_stability: v.float64(),
      cross_pattern_correlations: v.array(v.string()),
      metadata: crystallizedInsightMetadataValidator,
      created_at: v.float64(), // Backend correctly maps to created_at
      updated_at: v.float64() // Backend correctly maps to updated_at
    }))
  },
  returns: v.object({
    success: v.boolean(),
    insights_updated: v.number(),
    new_insights: v.number(),
    evolved_insights: v.number(),
    errors: v.array(v.string())
  }),
  handler: async (ctx, args) => {
    console.log('🎬 [PUBLIC ACTION] Storing crystallized insights via internal mutation');
    
    // Convert snake_case to camelCase for internal mutation
    const result = await ctx.runMutation(internal.personaInsightMutations.updateCrystallizedInsights, {
      userId: args.user_id,
      insights: args.insights
    });
    
    // Convert enhanced response to simple format for backward compatibility
    return {
      success: result.success,
      insights_updated: result.insightsUpdated,
      new_insights: result.newInsights,
      evolved_insights: result.evolvedInsights,
      errors: result.errors
    };
  }
});

/**
 * Public action to batch store crystallized insights with optimized processing
 */
export const batchStoreCrystallizedInsightsAction = action({
  args: {
    user_id: v.string(),
    insights: v.array(v.object({
      insight_type: v.string(),
      crystallized_insight: v.string(),
      confidence: v.float64(),
      supporting_traces: v.array(v.string()), // Trace IDs as strings (converted internally)
      contradiction_flags: v.union(v.array(v.string()), v.null()),
      evolution_history: evolutionHistoryValidator,
      temporal_stability: v.float64(),
      cross_pattern_correlations: v.array(v.string()),
      metadata: crystallizedInsightMetadataValidator,
      created_at: v.float64(), // Backend correctly maps to created_at
      updated_at: v.float64() // Backend correctly maps to updated_at
    })),
    batch_size: v.optional(v.number()),
    skip_validation: v.optional(v.boolean())
  },
  returns: v.object({
    success: v.boolean(),
    batch_id: v.string(),
    total_processed: v.number(),
    successful: v.number(),
    failed: v.number(),
    insights_updated: v.number(),
    new_insights: v.number(),
    evolved_insights: v.number(),
    processing_time: v.number(),
    errors: v.array(v.object({
      code: v.string(),
      message: v.string(),
      details: v.any(),
      timestamp: v.number()
    })),
    validation_errors: v.array(v.object({
      code: v.string(),
      message: v.string(),
      details: v.any(),
      timestamp: v.number()
    })),
    trace_conversion_errors: v.array(v.object({
      code: v.string(),
      message: v.string(),
      details: v.any(),
      timestamp: v.number()
    }))
  }),
  handler: async (ctx, args) => {
    console.log('🎬 [PUBLIC ACTION] Batch storing crystallized insights via internal mutation');
    
    return await ctx.runMutation(internal.personaBatchMutations.batchUpdateCrystallizedInsights, {
      user_id: args.user_id,
      insights_batch: args.insights,
      batch_size: args.batch_size,
      skip_validation: args.skip_validation
    });
  }
});

// Re-export all the individual mutations from their respective files
// This allows existing imports to continue working without changes

// Trace mutations
export { 
  storePersonaTraces,
  addPersonaTrace,
  deletePersonaTrace,
  updateTraceConfidence,
  deleteConversationTraces
} from "./personaTraceMutations";

// Insight mutations  
export {
  updateCrystallizedInsights,
  deleteCrystallizedInsight,
  updateInsightConfidence
} from "./personaInsightMutations";

// Batch mutations
export {
  batchUpdateCrystallizedInsights,
  transactionSafeInsightUpdate
} from "./personaBatchMutations";

// Management mutations
export {
  clearAllPersonaData
} from "./personaManagementMutations";
