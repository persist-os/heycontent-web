/**
 * Clean Persona Batch Mutations
 * Simplified batch processing for content-based schema
 */

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  personaTraceInputValidator,
  crystallizedInsightInputValidator,
  CrystallizedInsightInput,
  PersonaTraceInput,
  BatchProcessingResult
} from "./lib/personaTypes";

/**
 * Batch store persona traces with optimized processing
 */
export const batchStorePersonaTraces = internalMutation({
  args: {
    traces: v.array(personaTraceInputValidator),
    batchSize: v.optional(v.number())
  },
  returns: v.object({
    success: v.boolean(),
    totalProcessed: v.number(),
    successful: v.number(),
    failed: v.number(),
    errors: v.array(v.string()),
    processingTime: v.number()
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const batchSize = args.batchSize || 50;
    
    console.log(`🔄 [BATCH-TRACES] Processing ${args.traces.length} traces in batches of ${batchSize}`);
    
    const results = {
      success: true,
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      processingTime: 0
    };

    try {
      // Process traces in chunks for better performance
      for (let i = 0; i < args.traces.length; i += batchSize) {
        const chunk = args.traces.slice(i, i + batchSize);
        console.log(`📦 [BATCH-TRACES] Processing chunk ${Math.floor(i / batchSize) + 1}/${Math.ceil(args.traces.length / batchSize)}`);
        
        for (const trace of chunk) {
          results.totalProcessed++;
          
          try {
            // Basic validation
            if (!trace.userId || trace.content === undefined || typeof trace.confidence !== 'number') {
              results.errors.push(`Invalid trace data for user ${trace.userId}`);
              results.failed++;
              continue;
            }

            // Store trace
            await ctx.db.insert("persona_traces", {
              userId: trace.userId,
              content: trace.content,
              timestamp: trace.timestamp || Date.now(),
              confidence: Math.max(0, Math.min(1, trace.confidence))
            });

            results.successful++;

          } catch (error) {
            const errorMsg = `Failed to store trace for user ${trace.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            results.errors.push(errorMsg);
            results.failed++;
          }
        }
      }

      results.processingTime = Date.now() - startTime;
      
      console.log(`✅ [BATCH-TRACES] Completed: ${results.successful}/${results.totalProcessed} traces stored in ${results.processingTime}ms`);
      
      results.success = results.failed === 0;
      return results;

    } catch (error) {
      results.processingTime = Date.now() - startTime;
      const criticalError = `Critical error in batch trace processing: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      console.error('❌ [BATCH-TRACES]', criticalError);
      
      results.success = false;
      results.failed = results.failed + 1;
      results.errors.push(criticalError);
      return results;
    }
  }
});

/**
 * Batch store crystallized insights with evolution tracking
 */
export const batchStoreCrystallizedInsights = internalMutation({
  args: {
    insights: v.array(crystallizedInsightInputValidator),
    batchSize: v.optional(v.number())
  },
  returns: v.object({
    success: v.boolean(),
    totalProcessed: v.number(),
    successful: v.number(),
    failed: v.number(),
    newInsights: v.number(),
    evolvedInsights: v.number(),
    errors: v.array(v.string()),
    processingTime: v.number()
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const batchSize = args.batchSize || 25; // Smaller batch size for insights
    
    console.log(`🔮 [BATCH-INSIGHTS] Processing ${args.insights.length} insights in batches of ${batchSize}`);
    
    const results = {
      success: true,
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      newInsights: 0,
      evolvedInsights: 0,
      errors: [] as string[],
      processingTime: 0
    };

    try {
      // Pre-fetch existing insights for optimization
      const allUserIds = [...new Set(args.insights.map(i => i.userId))];
      const existingInsightsMap = new Map<string, any>();
      
      for (const userId of allUserIds) {
        const userInsights = await ctx.db
          .query("crystallized_insights")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
        
        userInsights.forEach(insight => {
          const key = `${userId}:${insight.category}`;
          existingInsightsMap.set(key, insight);
        });
      }

      // Process insights in chunks
      for (let i = 0; i < args.insights.length; i += batchSize) {
        const chunk = args.insights.slice(i, i + batchSize);
        console.log(`📦 [BATCH-INSIGHTS] Processing chunk ${Math.floor(i / batchSize) + 1}/${Math.ceil(args.insights.length / batchSize)}`);
        
        for (const insight of chunk) {
          results.totalProcessed++;
          
          try {
            // Validate insight data
            if (!insight.userId || !insight.content || !insight.category) {
              results.errors.push(`Invalid insight data for user ${insight.userId}`);
                results.failed++;
                continue;
            }

            // Convert string source IDs to Convex IDs (simplified approach)
            const sourceIds: Id<"persona_traces">[] = [];
            for (const sourceId of insight.sources) {
              try {
                if (typeof sourceId === 'string') {
                  const sourceAsId = sourceId as Id<"persona_traces">;
                  const trace = await ctx.db.get(sourceAsId);
                  if (trace && trace.userId === insight.userId) {
                    sourceIds.push(sourceAsId);
                  }
                }
              } catch (error) {
                // Skip invalid source IDs
                console.warn(`Invalid source ID ${sourceId} for insight ${insight.category}`);
              }
            }

            // Check if insight exists
            const existingKey = `${insight.userId}:${insight.category}`;
            const existingInsight = existingInsightsMap.get(existingKey);

            if (existingInsight) {
              // Evolution: update existing insight
              const previousVersion = {
                content: existingInsight.content,
                confidence: existingInsight.confidence,
                timestamp: existingInsight.timestamp,
                reason: insight.evolutionReason || "Backend batch evolution"
              };

              const updatedPreviousVersions = [
                ...(existingInsight.previousVersions || []),
                previousVersion
              ];

              await ctx.db.patch(existingInsight._id, {
                content: insight.content,
                confidence: Math.max(0, Math.min(1, insight.confidence)),
                timestamp: insight.timestamp || Date.now(),
                sources: sourceIds,
                version: (existingInsight.version || 1) + 1,
                previousVersions: updatedPreviousVersions,
                evolutionCount: (existingInsight.evolutionCount || 0) + 1
              });

              // Update our cache
              existingInsightsMap.set(existingKey, {
                ...existingInsight,
                content: insight.content,
                confidence: insight.confidence,
                version: (existingInsight.version || 1) + 1,
                evolutionCount: (existingInsight.evolutionCount || 0) + 1
              });

              results.evolvedInsights++;
              
            } else {
              // New insight
              const newInsightId = await ctx.db.insert("crystallized_insights", {
                userId: insight.userId,
                content: insight.content,
                category: insight.category,
                timestamp: insight.timestamp || Date.now(),
                confidence: Math.max(0, Math.min(1, insight.confidence)),
                sources: sourceIds,
                version: 1,
                previousVersions: [],
                evolutionCount: 0
              });

              // Add to cache
              existingInsightsMap.set(existingKey, {
                _id: newInsightId,
                userId: insight.userId,
                category: insight.category,
                content: insight.content,
                confidence: insight.confidence,
                version: 1,
                evolutionCount: 0
              });

              results.newInsights++;
            }

            results.successful++;

          } catch (error) {
            const errorMsg = `Failed to store insight ${insight.category} for user ${insight.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            results.errors.push(errorMsg);
            results.failed++;
          }
        }
      }

      results.processingTime = Date.now() - startTime;
      
      console.log(`✅ [BATCH-INSIGHTS] Completed: ${results.successful}/${results.totalProcessed} insights processed in ${results.processingTime}ms`);
      console.log(`📊 [BATCH-INSIGHTS] Summary: ${results.newInsights} new, ${results.evolvedInsights} evolved`);
      
      results.success = results.failed === 0;
      return results;

    } catch (error) {
      results.processingTime = Date.now() - startTime;
      const criticalError = `Critical error in batch insight processing: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      console.error('❌ [BATCH-INSIGHTS]', criticalError);
      
      results.success = false;
      results.failed = results.failed + 1;
      results.errors.push(criticalError);
      return results;
    }
  }
});

/**
 * Cleanup operation: delete all persona data for a user
 */
export const cleanupUserPersonaData = internalMutation({
  args: {
    userId: v.string()
  },
  returns: v.object({
    success: v.boolean(),
    deletedTraces: v.number(),
    deletedInsights: v.number(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    console.log('🧹 [CLEANUP] Starting persona data cleanup for user:', args.userId);
    
    try {
      // Delete all traces
      const traces = await ctx.db
        .query("persona_traces")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      let deletedTraces = 0;
      for (const trace of traces) {
        await ctx.db.delete(trace._id);
        deletedTraces++;
      }

      // Delete all insights
      const insights = await ctx.db
        .query("crystallized_insights")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      let deletedInsights = 0;
      for (const insight of insights) {
        await ctx.db.delete(insight._id);
        deletedInsights++;
      }

      console.log(`✅ [CLEANUP] Completed: deleted ${deletedTraces} traces and ${deletedInsights} insights`);
      
      return {
        success: true,
        deletedTraces,
        deletedInsights
      };

    } catch (error) {
      console.error('❌ [CLEANUP] Error:', error);
      return {
        success: false,
        deletedTraces: 0,
        deletedInsights: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});