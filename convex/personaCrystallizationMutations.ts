/**
 * Clean Persona Crystallization Mutations
 * Handles crystallized insights with proper evolution tracking
 */

import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  crystallizedInsightInputValidator,
  personaTraceInputValidator,
  CrystallizedInsightInput,
  InsightStorageResponse,
  TraceStorageResponse
} from "./lib/personaTypes";

/**
 * Public action to store persona traces - calls internal mutation
 */
export const storePersonaTracesAction = action({
  args: {
    traces: v.array(personaTraceInputValidator)
  },
  returns: v.object({
    success: v.boolean(),
    tracesStored: v.number(),
    errors: v.array(v.string())
  }),
  handler: async (ctx, args): Promise<TraceStorageResponse> => {
    console.log('🎬 [PUBLIC ACTION] Storing persona traces via internal mutation');
    
    return await ctx.runMutation(internal.personaTraceMutations.storePersonaTraces, {
      traces: args.traces
    });
  }
});

/**
 * Public action to store crystallized insights - calls internal mutation
 */
export const storeCrystallizedInsightsAction = action({
  args: {
    insights: v.array(crystallizedInsightInputValidator)
  },
  returns: v.object({
    success: v.boolean(),
    insightsStored: v.number(),
    newInsights: v.number(),
    evolvedInsights: v.number(),
    errors: v.array(v.string())
  }),
  handler: async (ctx, args): Promise<InsightStorageResponse> => {
    console.log('🎬 [PUBLIC ACTION] Storing crystallized insights via internal mutation');
    
    return await ctx.runMutation(internal.personaCrystallizationMutations.storeCrystallizedInsights, {
      insights: args.insights
    });
  }
});

/**
 * Store crystallized insights with evolution tracking (internal)
 */
export const storeCrystallizedInsights = internalMutation({
  args: {
    insights: v.array(crystallizedInsightInputValidator)
  },
  returns: v.object({
    success: v.boolean(),
    insightsStored: v.number(),
    newInsights: v.number(),
    evolvedInsights: v.number(),
    errors: v.array(v.string())
  }),
  handler: async (ctx, args): Promise<InsightStorageResponse> => {
    console.log(`🔮 [STORE-INSIGHTS] Processing ${args.insights.length} insights`);
    
    const results: InsightStorageResponse = {
      success: true,
      insightsStored: 0,
      newInsights: 0,
      evolvedInsights: 0,
      errors: []
    };

    try {
      for (let i = 0; i < args.insights.length; i++) {
        const insight = args.insights[i];
        
        try {
          // Validate insight data
          if (!insight.userId || !insight.content || !insight.category) {
            results.errors.push(`Invalid insight data at index ${i}`);
            continue;
          }

          // Convert string source IDs to Convex IDs
          const sourceIds: Id<"persona_traces">[] = [];
          for (const sourceId of insight.sources) {
            try {
              // Try to validate if it's already a valid Convex ID
              if (sourceId && typeof sourceId === 'string') {
                // Attempt to get the trace directly if it's a valid Convex ID
                try {
                  const trace = await ctx.db.get(sourceId as Id<"persona_traces">);
                  if (trace && trace.userId === insight.userId) {
                    sourceIds.push(trace._id);
                    continue;
                  }
                } catch {
                  // Not a valid Convex ID, skip this attempt
                }
                
                // Fallback: search for traces with matching content
                // This is expensive but ensures we find referenced traces
                const userTraces = await ctx.db
                  .query("persona_traces")
                  .withIndex("by_user", (q) => q.eq("userId", insight.userId))
                  .collect();
                
                // Look for trace with matching ID in content metadata
                const matchingTrace = userTraces.find(t => {
                  if (t.content && typeof t.content === 'object' && t.content.trace_id === sourceId) {
                    return true;
                  }
                  return false;
                });
                
                if (matchingTrace) {
                  sourceIds.push(matchingTrace._id);
                }
              }
            } catch (error) {
              console.warn(`Failed to convert source ID ${sourceId}:`, error);
            }
          }

          // Check if insight already exists (by user and category)
          const existingInsight = await ctx.db
            .query("crystallized_insights")
            .withIndex("by_user_category", (q) => q.eq("userId", insight.userId).eq("category", insight.category))
            .first();

          if (existingInsight) {
            // Evolution: update existing insight
            const previousVersion = {
              content: existingInsight.content,
              confidence: existingInsight.confidence,
              timestamp: existingInsight.timestamp,
              reason: insight.evolutionReason || "Backend evolution"
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

            results.evolvedInsights++;
            console.log(`🔄 [STORE-INSIGHTS] Evolved insight ${insight.category} for user ${insight.userId}`);
            
          } else {
            // New insight
            await ctx.db.insert("crystallized_insights", {
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

            results.newInsights++;
            console.log(`✨ [STORE-INSIGHTS] Created new insight ${insight.category} for user ${insight.userId}`);
          }

          results.insightsStored++;
          
        } catch (error) {
          const errorMsg = `Failed to store insight ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('❌ [STORE-INSIGHTS]', errorMsg);
          results.errors.push(errorMsg);
        }
      }

      if (results.errors.length > 0) {
        results.success = false;
      }

      console.log(`✅ [STORE-INSIGHTS] Completed: ${results.insightsStored}/${args.insights.length} insights processed`);
      console.log(`📊 [STORE-INSIGHTS] Summary: ${results.newInsights} new, ${results.evolvedInsights} evolved`);
      
      return results;

    } catch (error) {
      console.error('❌ [STORE-INSIGHTS] Critical error:', error);
      return {
        success: false,
        insightsStored: results.insightsStored,
        newInsights: results.newInsights,
        evolvedInsights: results.evolvedInsights,
        errors: [...results.errors, error instanceof Error ? error.message : 'Critical error']
      };
    }
  }
});

/**
 * Delete a crystallized insight
 */
export const deleteCrystallizedInsight = internalMutation({
  args: {
    userId: v.string(),
    insightId: v.id("crystallized_insights")
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    console.log('🗑️ [DELETE-INSIGHT] Deleting insight:', args.insightId);
    
    try {
      // Verify insight belongs to user
      const insight = await ctx.db.get(args.insightId);
      if (!insight) {
        return {
          success: false,
          error: "Insight not found"
        };
      }

      if (insight.userId !== args.userId) {
        return {
          success: false,
          error: "Unauthorized: insight belongs to different user"
        };
      }

      await ctx.db.delete(args.insightId);
      
      console.log('✅ [DELETE-INSIGHT] Successfully deleted insight');
      return { success: true };

    } catch (error) {
      console.error('❌ [DELETE-INSIGHT] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Delete all insights for a user (cleanup operation)
 */
export const deleteAllUserInsights = internalMutation({
  args: {
    userId: v.string()
  },
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    console.log('🧹 [DELETE-ALL-INSIGHTS] Cleaning up insights for user:', args.userId);
    
    try {
      const insights = await ctx.db
        .query("crystallized_insights")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      let deletedCount = 0;
      for (const insight of insights) {
        await ctx.db.delete(insight._id);
        deletedCount++;
      }

      console.log(`✅ [DELETE-ALL-INSIGHTS] Deleted ${deletedCount} insights`);
      return {
        success: true,
        deletedCount
      };

    } catch (error) {
      console.error('❌ [DELETE-ALL-INSIGHTS] Error:', error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});