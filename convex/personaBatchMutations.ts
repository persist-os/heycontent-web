/**
 * Persona Batch Mutations
 * Handles batch processing operations for high-throughput scenarios
 */

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  evolutionHistoryValidator,
  crystallizedInsightMetadataValidator,
  PersonaCrystallizationError
} from "./lib/personaTypes";

// Reusable error validator that matches PersonaCrystallizationError
const personaErrorValidator = v.object({
  code: v.string(),
  message: v.string(),
  details: v.any(),
  timestamp: v.number()
});
import {
  generateMutationId,
  logMutationStart,
  logMutationComplete,
  logMutationError,
  createPersonaError,
  createBatchError,
  createCriticalError
} from "./lib/personaErrorHandling";
import {
  createBatchResult,
  generateBatchId,
  createInsightsCache,
  chunkArray,
  processInParallel,
  validateBatchArgs,
  logBatchProgress,
  logBatchCompletion
} from "./lib/personaBatchUtils";
import {
  convertTraceIdsRobustly,
  mergeEvolutionHistory
} from "./lib/personaTraceUtils";
import {
  validateInsightData,
  sanitizeInsightData,
  VALIDATION_THRESHOLDS,
  getActionableErrorMessage
} from "./lib/personaValidation";

/**
 * Batch update multiple crystallized insights with optimized processing
 * Includes transaction-like handling and performance improvements for large sets
 */
export const batchUpdateCrystallizedInsights = internalMutation({
  args: {
    userId: v.string(),
    insightsBatch: v.array(v.object({
      insight_type: v.string(),
      crystallized_insight: v.string(),
      confidence: v.number(),
      supporting_traces: v.array(v.string()), // Trace IDs as strings (converted internally)
      contradiction_flags: v.union(v.array(v.string()), v.null()),
      evolution_history: evolutionHistoryValidator,
      temporal_stability: v.number(),
      cross_pattern_correlations: v.array(v.string()),
      metadata: crystallizedInsightMetadataValidator,
      created_at: v.number(),
      updated_at: v.number()
    })),
    batchSize: v.optional(v.number()), // For chunking large batches
    skipValidation: v.optional(v.boolean()) // For trusted sources
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
    errors: v.array(personaErrorValidator),
    validation_errors: v.array(personaErrorValidator),
    trace_conversion_errors: v.array(personaErrorValidator)
  }),
  handler: async (ctx, args) => {
    const batchId = generateBatchId();
    const startTime = Date.now();
    const batchSize = args.batchSize || 50; // Default batch size for processing
    
    logMutationStart(batchId, "BATCH-UPDATE", {
      userId: args.userId,
      batchSize,
      skipValidation: args.skipValidation || false,
      insightsCount: args.insightsBatch.length
    });
    
    const results = {
      batch_id: batchId,
      total_processed: 0,
      successful: 0,
      failed: 0,
      insights_updated: 0,
      new_insights: 0,
      evolved_insights: 0,
      processing_time: 0,
      errors: [] as PersonaCrystallizationError[],
      validation_errors: [] as PersonaCrystallizationError[],
      trace_conversion_errors: [] as PersonaCrystallizationError[]
    };

    try {
      // Validate batch arguments
      const argValidation = validateBatchArgs(args.userId, batchSize, 10);
      if (argValidation) {
        results.errors.push(argValidation);
        return {
          success: false,
          ...results
        };
      }

      // Pre-fetch existing insights for the user to optimize lookups
      console.log(`📋 [BATCH-UPDATE:${batchId}] Pre-fetching existing insights for optimization`);
      const existingInsights = await ctx.db
        .query("crystallized_insights")
        .withIndex("by_user", (q) => q.eq("user_id", args.userId))
        .collect();
      
      const existingInsightsByType = createInsightsCache(existingInsights);

      console.log(`📊 [BATCH-UPDATE:${batchId}] Found ${existingInsights.length} existing insights, processing in chunks of ${batchSize}`);

      // Process insights in chunks for better performance and memory management
      const chunks = chunkArray(args.insightsBatch, batchSize);
      
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        
        console.log(`🔄 [BATCH-UPDATE:${batchId}] Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} insights)`);

        // Process chunk with parallel operations where possible
        for (let i = 0; i < chunk.length; i++) {
          const insightData = chunk[i];
          const globalIndex = chunkIndex * batchSize + i + 1;
          const insightContext = `insight ${globalIndex}/${args.insightsBatch.length} (${insightData.insight_type})`;
          
          results.total_processed++;
          
          try {
            // Step 1: Validation (skip if requested for trusted sources)
            if (!args.skipValidation) {
              const validationError = validateInsightData(insightData);
              if (validationError) {
                console.warn(`⚠️ [BATCH-UPDATE:${batchId}] Validation failed for ${insightContext}:`, validationError);
                results.validation_errors.push(validationError);
                results.failed++;
                continue;
              }
            }

            // Step 2: Efficient trace ID conversion with caching
            const { validIds: supportingTraceIds, errors: traceErrors } = await convertTraceIdsRobustly(
              ctx, 
              insightData.supporting_traces, 
              args.userId
            );
            
            if (traceErrors.length > 0) {
              results.trace_conversion_errors.push(...traceErrors);
            }

            // Step 3: Check existing insight using pre-fetched map
            const existingInsight = existingInsightsByType.get(insightData.insight_type);

            // Step 4: Prepare optimized insight record
            const insightRecord = sanitizeInsightData({
              userId: args.userId,
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

            // Step 5: Atomic update or create operation
            if (existingInsight) {
              // Merge evolution history efficiently
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

              results.evolved_insights++;
              // Update our cache for subsequent insights in this batch
              existingInsightsByType.set(insightData.insight_type, {
                ...existingInsight,
                ...insightRecord
              });
            } else {
              const newInsightId = await ctx.db.insert("crystallized_insights", insightRecord);
              results.new_insights++;
              // Add to cache for subsequent insights in this batch
              existingInsightsByType.set(insightData.insight_type, {
                _id: newInsightId,
                ...insightRecord
              });
            }

            results.insights_updated++;
            results.successful++;

          } catch (error) {
            const               errorObj = createBatchError(
              `Failed to process ${insightContext}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              { 
                insight_type: insightData.insight_type,
                globalIndex,
                chunkIndex,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            );
            
            console.error(`❌ [BATCH-UPDATE:${batchId}] ${errorObj.message}`, error);
            results.errors.push(errorObj);
            results.failed++;
          }
        }

        // Log chunk completion
        logBatchProgress(batchId, "BATCH-UPDATE", chunkIndex + 1, chunks.length, 
          results.total_processed, results.successful, results.failed);
      }

      results.processing_time = Date.now() - startTime;
      
      logBatchCompletion(batchId, "BATCH-UPDATE", results, results.processing_time);
      
      return {
        success: results.failed === 0, // Success if no failures
        ...results
      };

    } catch (error) {
      results.processing_time = Date.now() - startTime;
      const criticalError = createCriticalError(
        `Critical error in batch processing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { batchId, processingTime: results.processing_time }
      );
      
      logMutationError(batchId, "BATCH-UPDATE", error as Error, results.processing_time);
      
      return {
        success: false,
        batch_id: batchId,
        total_processed: results.total_processed,
        successful: results.successful,
        failed: results.failed + 1, // +1 for the critical error
        insights_updated: results.insights_updated,
        new_insights: results.new_insights,
        evolved_insights: results.evolved_insights,
        processing_time: results.processing_time,
        errors: [...results.errors, criticalError],
        validation_errors: results.validation_errors,
        trace_conversion_errors: results.trace_conversion_errors
      };
    }
  }
});

/**
 * Transaction-safe insight update with rollback capability
 * Ensures consistency when updating insights with complex relationships
 */
export const transactionSafeInsightUpdate = internalMutation({
  args: {
    userId: v.string(),
    insight: v.object({
      insight_type: v.string(),
      crystallized_insight: v.string(),
      confidence: v.number(),
      supporting_traces: v.array(v.string()), // Trace IDs as strings (converted internally)
      contradiction_flags: v.union(v.array(v.string()), v.null()),
      evolution_history: evolutionHistoryValidator,
      temporal_stability: v.number(),
      cross_pattern_correlations: v.array(v.string()),
      metadata: crystallizedInsightMetadataValidator,
      created_at: v.number(),
      updated_at: v.number()
    }),
    dryRun: v.optional(v.boolean()) // Test the operation without committing
  },
  returns: v.object({
    success: v.boolean(),
    operation_type: v.union(v.literal("create"), v.literal("update"), v.literal("no-change")),
    insight_id: v.optional(v.id("crystallized_insights")),
    validated_traces: v.array(v.id("persona_traces")),
    errors: v.array(personaErrorValidator),
    dry_run: v.boolean()
  }),
  handler: async (ctx, args) => {
    const mutationId = generateMutationId();
    const startTime = Date.now();
    
    logMutationStart(mutationId, "TRANSACTION-SAFE", {
      userId: args.userId,
      insight_type: args.insight.insight_type,
      dryRun: args.dryRun || false
    });

    const result = {
      success: false,
      operation_type: "no-change" as "create" | "update" | "no-change",
      insight_id: undefined as Id<"crystallized_insights"> | undefined,
      validated_traces: [] as Id<"persona_traces">[],
      errors: [] as PersonaCrystallizationError[],
      dry_run: args.dryRun || false
    };

    try {
      // Step 1: Comprehensive validation for updates
      const validationError = validateInsightData(args.insight, true);
      if (validationError) {
        const actionableMessage = getActionableErrorMessage(validationError);
        result.errors.push({
          ...validationError,
          message: actionableMessage
        });
        console.warn(`⚠️ [TRANSACTION-SAFE:${mutationId}] Validation failed:`, actionableMessage);
        return result;
      }

      // Step 2: Validate trace references with atomic consistency
      const { validIds: supportingTraceIds, errors: traceErrors } = await convertTraceIdsRobustly(
        ctx, 
        args.insight.supporting_traces, 
        args.userId
      );
      
      if (traceErrors.length > 0) {
        result.errors.push(...traceErrors);
        // Don't fail for trace conversion errors, but record them
      }
      
      result.validated_traces = supportingTraceIds;
      console.log(`✅ [TRANSACTION-SAFE:${mutationId}] Validated ${supportingTraceIds.length}/${args.insight.supporting_traces.length} trace references`);

      // Step 3: Check existing insight state
      const existingInsight = await ctx.db
        .query("crystallized_insights")
        .withIndex("by_user_type", (q) => q.eq("user_id", args.userId).eq("insight_type", args.insight.insight_type))
        .first();

      // Step 4: Prepare the insight record with data consistency checks
      const insightRecord = sanitizeInsightData({
        user_id: args.userId,
        insight_type: args.insight.insight_type,
        crystallized_insight: args.insight.crystallized_insight,
        confidence: args.insight.confidence,
        supporting_traces: supportingTraceIds,
        contradiction_flags: args.insight.contradiction_flags,
        evolution_history: args.insight.evolution_history,
        temporal_stability: args.insight.temporal_stability,
        cross_pattern_correlations: args.insight.cross_pattern_correlations,
        metadata: args.insight.metadata,
        created_at: args.insight.created_at,
        updated_at: args.insight.updated_at
      });

      // Step 5: Determine operation type and check for actual changes
      if (existingInsight) {
        // Check if update is actually needed (deep comparison)
        const hasChanged = (
          existingInsight.crystallized_insight !== insightRecord.crystallized_insight ||
          Math.abs(existingInsight.confidence - insightRecord.confidence) > 0.001 ||
          Math.abs(existingInsight.temporal_stability - insightRecord.temporal_stability) > 0.001 ||
          JSON.stringify(existingInsight.supporting_traces.sort()) !== JSON.stringify(supportingTraceIds.sort()) ||
          JSON.stringify(existingInsight.contradiction_flags.sort()) !== JSON.stringify(insightRecord.contradiction_flags.sort()) ||
          JSON.stringify(existingInsight.cross_pattern_correlations.sort()) !== JSON.stringify(insightRecord.cross_pattern_correlations.sort())
        );

        if (!hasChanged) {
          result.operation_type = "no-change";
          result.success = true;
          result.insight_id = existingInsight._id;
          console.log(`📋 [TRANSACTION-SAFE:${mutationId}] No changes detected for insight: ${args.insight.insight_type}`);
          return result;
        }

        result.operation_type = "update";
        result.insight_id = existingInsight._id;
      } else {
        result.operation_type = "create";
      }

      // Step 6: Execute the operation (if not dry run)
      if (!args.dryRun) {
        if (result.operation_type === "update" && existingInsight) {
          // Atomic update with evolution history merging
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

          console.log(`🔄 [TRANSACTION-SAFE:${mutationId}] Successfully updated insight: ${args.insight.insight_type}`);
        } else {
          // Atomic create
          const newInsightId = await ctx.db.insert("crystallized_insights", insightRecord);
          result.insight_id = newInsightId;
          
          console.log(`✨ [TRANSACTION-SAFE:${mutationId}] Successfully created insight: ${args.insight.insight_type}`);
        }
      } else {
        console.log(`🧪 [TRANSACTION-SAFE:${mutationId}] Dry run completed - would ${result.operation_type} insight: ${args.insight.insight_type}`);
      }

      result.success = true;
      
      const processingTime = Date.now() - startTime;
      logMutationComplete(mutationId, "TRANSACTION-SAFE", processingTime, {
        operation_type: result.operation_type,
        insight_type: args.insight.insight_type,
        validated_traces: result.validated_traces.length,
        errors: result.errors.length,
        dry_run: result.dry_run
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const criticalError = createPersonaError(
        'TRANSACTION_ERROR',
        `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { 
          insight_type: args.insight.insight_type,
          operation_type: result.operation_type,
          processingTime
        }
      );
      
      result.errors.push(criticalError);
      logMutationError(mutationId, "TRANSACTION-SAFE", error as Error, processingTime);
      
      return result;
    }
  }
});
