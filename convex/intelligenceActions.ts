/**
 * Intelligence Actions - Async operations for MAB-based intelligence system
 * 
 * Uses Multi-Armed Bandit (MAB) with Thompson Sampling for adaptive intelligence triggering.
 * The system learns optimal trigger timing for each user through continuous feedback loops.
 * 
 * Intelligence analysis is triggered automatically after crystal formation when the MAB
 * determines sufficient semantic drift or activity has occurred. Manual triggering is
 * also available for testing and user-initiated analysis.
 */

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Track user activity for MAB state computation.
 * 
 * Increments activity counters that the MAB controller uses to compute user state
 * and semantic drift. The actual decision to trigger intelligence analysis is made
 * by the backend MAB controller after crystal formation using Thompson Sampling.
 * 
 * Called automatically after tracked activities (non-blocking, fire-and-forget).
 */
export const checkIntelligenceTriggers = internalAction({
  args: {
    userId: v.string(),
    event_type: v.string(),  // "chat", "smart_note", "crystal_formation", "crystal_retrieval"
  },
  handler: async (ctx, { userId, event_type }) => {
    try {
      console.log(`[MAB] Activity tracked for user ${userId}: ${event_type}`);
      
      // Update activity counter for MAB state computation
      await ctx.runMutation(api.intelligenceMutations.incrementActivity, {
        userId,
        activity_type: event_type,
      });
      
      // MAB controller will use these counters to:
      // 1. Compute semantic drift after crystal formation
      // 2. Evaluate user state for trigger decision
      // 3. Select optimal trigger strategy using Thompson Sampling
      
      return {
        success: true,
        message: "Activity tracked for MAB state computation",
        mab_managed: true
      };
      
    } catch (error) {
      // Trigger checks are non-critical - log but don't throw
      console.log(`[MAB TRIGGERS] Error for user ${userId}: ${error}`);
      return {
        success: false,
        error: String(error),
        message: "Trigger check failed (non-critical)"
      };
    }
  },
});

/**
 * Manually trigger intelligence analysis, bypassing MAB decision logic.
 * 
 * Enqueues an intelligence job directly to the Redis queue without waiting for
 * the MAB controller's trigger decision. Useful for testing, admin operations,
 * or user-initiated forced analysis.
 */
export const manualTriggerAnalysis = action({
  args: {
    userId: v.string(),
    analysis_depth: v.optional(v.union(
      v.literal("fast"),
      v.literal("standard"),
      v.literal("deep")
    )),
  },
  handler: async (ctx, { userId, analysis_depth = "standard" }) => {
    try {
      console.log(`[MANUAL TRIGGER] Manually triggering analysis for user ${userId}`);
      
      // Call backend to enqueue job (bypasses MAB decision)
      const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
      
      if (!backendUrl) {
        throw new Error("BACKEND_URL not configured");
      }
      
      const response = await fetch(`${backendUrl}/api/v1/crystal_intelligence/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          jobId: `manual-${Date.now()}`,
          jobType: "manual_analysis",
          scope: {
            analysis_depth: analysis_depth,
            trigger_source: "manual"
          },
          analysisDepth: analysis_depth
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend returned ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      console.log(`[MANUAL TRIGGER] Analysis triggered for user ${userId}, job: ${data.job_id}`);
      
      return {
        success: true,
        job_id: data.job_id,
        message: "Intelligence analysis triggered manually"
      };
      
    } catch (error: any) {
      console.error(`[MANUAL TRIGGER] Failed for user ${userId}:`, error);
      return {
        success: false,
        error: error.message,
        message: "Failed to trigger analysis"
      };
    }
  },
});
