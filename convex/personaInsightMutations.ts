/**
 * Persona Insight Mutations
 * Handles individual insight operations (create, update, delete)
 */

import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  evolutionHistoryValidator,
  crystallizedInsightMetadataValidator,
  crystallizedInsightInputValidator,
  PersonaCrystallizationError
} from "./lib/personaTypes";
import {
  generateMutationId,
  logMutationStart,
  logMutationComplete,
  logMutationError,
  createSuccessResult,
  createFailureResult
} from "./lib/personaErrorHandling";
import {
  convertTraceIdsRobustly,
  mergeEvolutionHistory,
  hasSignificantChanges
} from "./lib/personaTraceUtils";
import {
  validateInsightData,
  validateUserId,
  validateConfidence,
  sanitizeInsightData,
  VALIDATION_THRESHOLDS,
  getActionableErrorMessage
} from "./lib/personaValidation";

/**
 * Update crystallized insights from Agent 1's crystallization process (internal)
 * Enhanced with comprehensive data validation, error handling, and robust trace ID conversion
 */
export const updateCrystallizedInsights = internalMutation({
  args: {
    userId: v.string(),
    insights: v.array(crystallizedInsightInputValidator)
  },
  returns: v.object({
    success: v.boolean(),
    insightsUpdated: v.number(),
    newInsights: v.number(),
    evolvedInsights: v.number(),
    errors: v.array(v.string()),
    validationErrors: v.array(v.object({
      code: v.string(),
      message: v.string(),
      details: v.any(),
      timestamp: v.number()
    })),
    traceConversionErrors: v.array(v.object({
      code: v.string(),
      message: v.string(),
      details: v.any(),
      timestamp: v.number()
    }))
  }),
  handler: async (ctx, args) => {
    const mutationId = generateMutationId();
    const startTime = Date.now();
    
    logMutationStart(mutationId, "UPDATE-INSIGHTS", {
      userId: args.userId,
      insightsCount: args.insights.length
    });
    
    const results = {
      success: true,
      insightsUpdated: 0,
      newInsights: 0,
      evolvedInsights: 0,
      errors: [] as string[],
      validationErrors: [] as PersonaCrystallizationError[],
      traceConversionErrors: [] as PersonaCrystallizationError[]
    };

    try {
      // Validate user exists (basic security check)
      const userValidation = validateUserId(args.userId);
      if (userValidation) {
        results.validationErrors.push(userValidation);
        results.success = false;
        return results;
      }

      console.log(`🔄 [UPDATE-INSIGHTS:${mutationId}] Processing ${args.insights.length} insights with enhanced validation`);

      for (let i = 0; i < args.insights.length; i++) {
        const insightData = args.insights[i];
        const insightContext = `insight ${i + 1}/${args.insights.length} (${insightData.insight_type})`;
        
        console.log(`📊 [UPDATE-INSIGHTS:${mutationId}] Processing ${insightContext}`, {
          insight_type: insightData.insight_type,
          confidence: insightData.confidence,
          supporting_traces_count: insightData.supporting_traces.length,
          temporal_stability: insightData.temporal_stability
        });
        
        try {
          // Step 1: Enhanced data validation with update context
          const validationError = validateInsightData(insightData, true);
          if (validationError) {
            const actionableMessage = getActionableErrorMessage(validationError);
            console.warn(`⚠️ [UPDATE-INSIGHTS:${mutationId}] Validation failed for ${insightContext}:`, validationError);
            results.validationErrors.push(validationError);
            results.errors.push(`${actionableMessage} (${insightData.insight_type})`);
            results.success = false;
            continue;
          }

          // Step 2: Robust trace ID conversion and validation
          const { validIds: supportingTraceIds, errors: traceErrors } = await convertTraceIdsRobustly(
            ctx, 
            insightData.supporting_traces, 
            args.userId
          );
          
          if (traceErrors.length > 0) {
            console.warn(`⚠️ [UPDATE-INSIGHTS:${mutationId}] Trace conversion errors for ${insightContext}:`, traceErrors);
            results.traceConversionErrors.push(...traceErrors);
            // Don't fail the entire insight if some traces are invalid, but log the issues
          }

          console.log(`✓ [UPDATE-INSIGHTS:${mutationId}] Converted ${supportingTraceIds.length}/${insightData.supporting_traces.length} trace IDs for ${insightContext}`);

          // Step 3: Check for existing insight
          const existingInsight = await ctx.db
            .query("crystallized_insights")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .filter((q) => q.eq(q.field("insight_type"), insightData.insight_type))
            .first();

          // Step 4: Prepare insight record with validated data
          const insightRecord = sanitizeInsightData({
            user_id: args.userId,
            insight_type: insightData.insight_type,
            crystallized_insight: insightData.crystallized_insight,
            confidence: insightData.confidence,
            supporting_traces: supportingTraceIds,
            contradiction_flags: insightData.contradiction_flags,
            evolution_history: insightData.evolution_history,
            temporal_stability: insightData.temporal_stability,
            cross_pattern_correlations: insightData.cross_pattern_correlations,
            metadata: insightData.metadata,
            created_at: insightData.created_at,
            updated_at: insightData.updated_at
          });

          // Step 5: Create or update insight with transaction-like behavior
          if (existingInsight) {
            console.log(`🔄 [UPDATE-INSIGHTS:${mutationId}] Updating existing ${insightContext}`);
            
            // Merge evolution history (preserve existing + add new)
            const mergedEvolutionHistory = mergeEvolutionHistory(
              existingInsight.evolution_history,
              insightRecord.evolution_history
            );

            await ctx.db.patch(existingInsight._id, {
              crystallized_insight: insightRecord.crystallized_insight,
              confidence: insightRecord.confidence,
              supporting_traces: insightRecord.supporting_traces,
              contradiction_flags: insightRecord.contradiction_flags,
              evolution_history: mergedEvolutionHistory,
              temporal_stability: insightRecord.temporal_stability,
              cross_pattern_correlations: insightRecord.cross_pattern_correlations,
              metadata: {
                ...insightRecord.metadata,
                // Update confidence history
                confidence_history: [
                  ...existingInsight.metadata.confidence_history,
                  {
                    timestamp: insightRecord.updated_at,
                    confidence: insightRecord.confidence
                  }
                ]
              },
              updated_at: insightRecord.updated_at
            });

            results.evolvedInsights++;
            console.log(`✅ [UPDATE-INSIGHTS:${mutationId}] Successfully updated ${insightContext}`);
          } else {
            console.log(`✨ [UPDATE-INSIGHTS:${mutationId}] Creating new ${insightContext}`);
            
            await ctx.db.insert("crystallized_insights", insightRecord);
            results.newInsights++;
            console.log(`✅ [UPDATE-INSIGHTS:${mutationId}] Successfully created ${insightContext}`);
          }

          results.insightsUpdated++;

        } catch (error) {
          const errorMsg = `Failed to process ${insightContext}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ [UPDATE-INSIGHTS:${mutationId}]`, errorMsg, error);
          results.errors.push(errorMsg);
          results.success = false;
        }
      }

      const processingTime = Date.now() - startTime;
      logMutationComplete(mutationId, "UPDATE-INSIGHTS", processingTime, {
        total: args.insights.length,
        successful: results.insightsUpdated,
        newInsights: results.newInsights,
        evolvedInsights: results.evolvedInsights,
        validationErrors: results.validationErrors.length,
        traceConversionErrors: results.traceConversionErrors.length,
        generalErrors: results.errors.length
      });
      
      return results;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logMutationError(mutationId, "UPDATE-INSIGHTS", error as Error, processingTime);
      
      return {
        success: false,
        insightsUpdated: 0,
        newInsights: 0,
        evolvedInsights: 0,
        errors: [error instanceof Error ? error.message : 'Unknown critical error'],
        validationErrors: [],
        traceConversionErrors: []
      };
    }
  }
});

/**
 * Delete a crystallized insight
 */
export const deleteCrystallizedInsight = mutation({
  args: {
    userId: v.string(),
    insight_id: v.id("crystallized_insights")
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    const mutationId = generateMutationId();
    const startTime = Date.now();
    
    logMutationStart(mutationId, "DELETE-INSIGHT", {
      userId: args.userId,
      insightId: args.insight_id
    });
    
    try {
      // Validate user ID
      const userValidation = validateUserId(args.userId);
      if (userValidation) {
        return {
          success: false,
          error: userValidation.message
        };
      }

      const insight = await ctx.db.get(args.insight_id);
      if (!insight || insight.user_id !== args.userId) {
        throw new Error("Insight not found or unauthorized");
      }

      await ctx.db.delete(args.insight_id);

      const processingTime = Date.now() - startTime;
      logMutationComplete(mutationId, "DELETE-INSIGHT", processingTime);
      
      return { success: true };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logMutationError(mutationId, "DELETE-INSIGHT", error as Error, processingTime);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Update insight confidence (for manual curation)
 */
export const updateInsightConfidence = mutation({
  args: {
    userId: v.string(),
    insight_id: v.id("crystallized_insights"),
    confidence: v.number()
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    const mutationId = generateMutationId();
    const startTime = Date.now();
    
    logMutationStart(mutationId, "UPDATE-INSIGHT-CONFIDENCE", {
      userId: args.userId,
      insightId: args.insight_id,
      confidence: args.confidence
    });
    
    try {
      // Validate user ID
      const userValidation = validateUserId(args.userId);
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

      const insight = await ctx.db.get(args.insight_id);
      if (!insight || insight.user_id !== args.userId) {
        throw new Error("Insight not found or unauthorized");
      }

      // Update confidence and add to history
      const updatedConfidenceHistory = [
        ...insight.metadata.confidence_history,
        {
          timestamp: Date.now(),
          confidence: args.confidence
        }
      ];

      await ctx.db.patch(args.insight_id, {
        confidence: args.confidence,
        metadata: {
          ...insight.metadata,
          confidence_history: updatedConfidenceHistory
        },
        updated_at: Date.now()
      });

      const processingTime = Date.now() - startTime;
      logMutationComplete(mutationId, "UPDATE-INSIGHT-CONFIDENCE", processingTime);
      
      return { success: true };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logMutationError(mutationId, "UPDATE-INSIGHT-CONFIDENCE", error as Error, processingTime);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});
