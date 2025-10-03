/**
 * Intelligence Scheduled Actions - Background job processing
 * 
 * Runs periodically to process queued intelligence analysis jobs.
 * Calls Python analyzer service and updates job status.
 */

import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";

/**
 * Process pending intelligence jobs.
 * Called every 5 minutes by cron scheduler.
 */
export const processIntelligenceJobs = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("[INTELLIGENCE CRON] Starting job processing cycle");
      
      // Fetch pending jobs (limit to 5 per cycle to avoid overwhelming the system)
      const pendingJobs = await ctx.runQuery(api.intelligenceQueries.getPendingJobs, {
        limit: 5
      });
      
      if (!pendingJobs || pendingJobs.length === 0) {
        console.log("[INTELLIGENCE CRON] No pending jobs found");
        return { processed: 0, message: "No pending jobs" };
      }
      
      console.log(`[INTELLIGENCE CRON] Found ${pendingJobs.length} pending jobs`);
      
      // Process each job
      let processedCount = 0;
      let failedCount = 0;
      
      for (const job of pendingJobs) {
        try {
          // Mark job as running
          await ctx.runMutation(api.intelligenceMutations.updateJobStatus, {
            jobId: job._id,
            status: "running",
            started_at: Date.now()
          });
          
          // Call Python analyzer
          const result = await callPythonAnalyzer(job);
          
          if (result.success) {
            // Update job as completed
            await ctx.runMutation(api.intelligenceMutations.updateJobStatus, {
              jobId: job._id,
              status: "completed",
              completed_at: Date.now(),
              results: result.data
            });
            
            processedCount++;
            console.log(`[INTELLIGENCE CRON] Job ${job._id} completed successfully`);
          } else {
            // Mark job as failed
            await ctx.runMutation(api.intelligenceMutations.updateJobStatus, {
              jobId: job._id,
              status: "failed",
              completed_at: Date.now(),
              results: {
                crystals_analyzed: 0,
                relationships_found: 0,
                contradictions_found: 0,
                health_scores_updated: 0,
                error: result.error || "Analysis failed"
              }
            });
            
            failedCount++;
            console.error(`[INTELLIGENCE CRON] Job ${job._id} failed: ${result.error}`);
          }
          
        } catch (error: any) {
          failedCount++;
          console.error(`[INTELLIGENCE CRON] Error processing job ${job._id}:`, error);
          
          // Mark job as failed
          try {
            await ctx.runMutation(api.intelligenceMutations.updateJobStatus, {
              jobId: job._id,
              status: "failed",
              completed_at: Date.now(),
              results: {
                crystals_analyzed: 0,
                relationships_found: 0,
                contradictions_found: 0,
                health_scores_updated: 0,
                error: error.message || "Unknown error"
              }
            });
          } catch (updateError) {
            console.error(`[INTELLIGENCE CRON] Failed to update job status:`, updateError);
          }
        }
      }
      
      console.log(
        `[INTELLIGENCE CRON] Cycle complete: ${processedCount} successful, ${failedCount} failed`
      );
      
      return {
        processed: processedCount,
        failed: failedCount,
        total: pendingJobs.length,
        message: `Processed ${processedCount}/${pendingJobs.length} jobs`
      };
      
    } catch (error: any) {
      console.error("[INTELLIGENCE CRON] Critical error in job processing:", error);
      return {
        processed: 0,
        failed: 0,
        total: 0,
        error: error.message,
        message: "Job processing failed"
      };
    }
  }
});

/**
 * Call Python analyzer service to perform intelligence analysis.
 * 
 * This makes an HTTP request to the backend analyzer endpoint using
 * system-level authentication (BACKEND_API_KEY for internal cron jobs).
 */
async function callPythonAnalyzer(job: any): Promise<{success: boolean, data?: any, error?: string}> {
  try {
    // Get backend URL and system API key from environment
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    const systemApiKey = process.env.BACKEND_API_KEY;
    
    if (!backendUrl) {
      throw new Error("BACKEND_URL not configured");
    }
    
    if (!systemApiKey) {
      throw new Error("BACKEND_API_KEY not configured - required for system authentication");
    }
    
    // Call Python analyzer endpoint with system authentication
    // The backend intelligence route accepts system keys (userId starting with "system_" or "service_")
    // and allows them to analyze any user's crystals
    const response = await fetch(`${backendUrl}/api/v1/crystal_intelligence/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${systemApiKey}`,
      },
      body: JSON.stringify({
        userId: job.userId,
        jobId: job._id,
        jobType: job.job_type,
        scope: job.scope,
        analysisDepth: job.scope.analysis_depth
      }),
      signal: AbortSignal.timeout(120000) // 2 minute timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analyzer returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, data: data.data };
    } else {
      return { success: false, error: data.error || data.message || "Analysis failed" };
    }
    
  } catch (error: any) {
    console.error("[INTELLIGENCE CRON] Analyzer call failed:", error);
    return {
      success: false,
      error: error.message || "Failed to call analyzer service"
    };
  }
}
