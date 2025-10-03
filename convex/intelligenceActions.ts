/**
 * Intelligence Actions - Async operations for intelligence system
 * 
 * Provides actions for:
 * - Trigger detection (non-blocking)
 * - Job processing coordination
 * - Analysis orchestration
 */

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { determineJobType, calculatePriority } from "./intelligenceConfig";

/**
 * Check if intelligence analysis should be triggered.
 * Called after every tracked activity (non-blocking).
 */
export const checkIntelligenceTriggers = internalAction({
  args: {
    userId: v.string(),
    event_type: v.string(),  // "chat", "smart_note", "crystal_formation", "crystal_retrieval"
  },
  handler: async (ctx, { userId, event_type }) => {
    try {
      console.log(`[TRIGGERS] Checking triggers for user ${userId} after ${event_type} event`);
      
      // Get user's config and counters
      const [config, counters] = await Promise.all([
        ctx.runQuery(api.intelligenceQueries.getUserConfig, { userId }),
        ctx.runQuery(api.intelligenceQueries.getActivityCounters, { userId }),
      ]);

      // Check if any threshold is met
      const should_trigger = shouldTriggerAnalysis(config, counters, event_type);
      
      if (should_trigger) {
        console.log(`[TRIGGERS] Threshold met for user ${userId}. Queueing analysis job.`);
        
        // Determine job type and priority
        const job_type = determineJobType(config, counters.since_last_analysis);
        const priority = calculatePriority(counters.since_last_analysis);
        
        // Queue analysis job
        await ctx.runMutation(api.intelligenceMutations.queueAnalysisJob, {
          userId,
          job_type,
          priority,
          trigger_source: event_type,
        });
        
        // Reset counters
        await ctx.runMutation(api.intelligenceMutations.resetActivityCounters, { userId });
        
        console.log(`[TRIGGERS] Queued ${job_type} job with ${priority} priority for user ${userId}`);
      }
    } catch (error) {
      // Trigger checks are non-critical - log but don't throw
      console.log(`[TRIGGERS] Trigger check failed for user ${userId}: ${error}`);
    }
  },
});

/**
 * Helper function to determine if analysis should be triggered.
 */
function shouldTriggerAnalysis(
  config: any,
  counters: any,
  event_type: string
): boolean {
  const thresholds = config.triggers;
  const counts = counters.since_last_analysis;
  
  // Primary triggers: activity thresholds
  if (counts.chat_messages >= thresholds.chat_messages) {
    console.log(`[TRIGGERS] Chat messages threshold met: ${counts.chat_messages} >= ${thresholds.chat_messages}`);
    return true;
  }
  
  if (counts.smart_notes >= thresholds.smart_notes) {
    console.log(`[TRIGGERS] Smart notes threshold met: ${counts.smart_notes} >= ${thresholds.smart_notes}`);
    return true;
  }
  
  if (counts.crystal_formations >= thresholds.crystal_formations) {
    console.log(`[TRIGGERS] Crystal formations threshold met: ${counts.crystal_formations} >= ${thresholds.crystal_formations}`);
    return true;
  }
  
  // Secondary trigger: time-based fallback (for inactive users)
  const days_since = (Date.now() - config.last_analysis) / (1000 * 60 * 60 * 24);
  if (days_since >= thresholds.days_since_last) {
    console.log(`[TRIGGERS] Time threshold met: ${days_since.toFixed(1)} days >= ${thresholds.days_since_last} days`);
    return true;
  }
  
  // Tertiary trigger: immediate analysis on crystal formation if enough accumulated
  if (event_type === "crystal_formation" && counts.crystal_formations >= 3) {
    console.log(`[TRIGGERS] Immediate crystal formation trigger: ${counts.crystal_formations} formations`);
    return true;
  }
  
  return false;
}
