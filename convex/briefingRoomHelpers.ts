/**
 * Briefing Room Integration Helpers
 * 
 * Helper functions to publish briefing events from existing systems.
 * Call these from crystal formations, widget completions, etc.
 */

import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// Helper: Publish Crystal Formation Event
// ============================================================================

/**
 * Publish briefing event when a crystal forms
 * Call this from formationMutations after successful crystal creation
 */
export async function publishCrystalFormationBriefing(
  ctx: MutationCtx,
  params: {
    userId: string;
    crystalId: Id<"crystals">;
    crystalName: string;
    crystalType: string;
    confidenceScore: string;
    coreInsight?: string;
    shardCount: number;
  }
) {
  const now = Date.now();
  
  // Calculate initial position based on category
  const initialPosition = {
    x: -400, // Crystal zone
    y: Math.random() * 100 - 50,
    z: 200,
  };
  
  try {
    await ctx.db.insert("briefing_events", {
      userId: params.userId,
      type: "crystal_formation",
      category: "crystal",
      priority: params.confidenceScore === "very_high" || params.confidenceScore === "high" ? "high" : "medium",
      urgencyLevel: 0.7,
      
      timestamp: now,
      timeWaiting: 0,
      
      data: {
        crystal_id: params.crystalId,
        crystal_name: params.crystalName,
        crystal_type: params.crystalType,
        confidence_score: params.confidenceScore,
        core_insight: params.coreInsight || "New pattern crystallized from your data",
        shard_count: params.shardCount,
      },
      
      state: "waiting",
      stateHistory: [{
        from: "forming",
        to: "waiting",
        timestamp: now,
        trigger: "crystal_formed"
      }],
      
      position: initialPosition,
      spatialPriority: 3,
      relatedBriefings: [],
      
      viewed: false,
      archived: false,
      starred: false,
      actionsTaken: [],
      
      aiContext: {
        relatedCrystals: [],
        relatedProjects: [],
        relatedWidgets: [],
        generatedSuggestions: [],
      },
      
      metadata: {
        source: "crystal_formation",
        version: "1.0",
      },
      
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error("Failed to publish crystal formation briefing:", error);
    // Don't throw - briefing is nice-to-have, don't break crystal formation
  }
}

// ============================================================================
// Helper: Publish Widget Completion Event
// ============================================================================

/**
 * Publish briefing event when a widget job completes
 * Call this from widget execution completion
 */
export async function publishWidgetCompletionBriefing(
  ctx: MutationCtx,
  params: {
    userId: string;
    widgetId: Id<"widgets"> | string;
    widgetTitle: string;
    widgetType: string;
    projectId?: Id<"projects"> | string;
    completedAt: number;
    summary?: string;
  }
) {
  const now = Date.now();
  
  const initialPosition = {
    x: -200, // Widget zone
    y: Math.random() * 100 - 50,
    z: 200,
  };
  
  try {
    await ctx.db.insert("briefing_events", {
      userId: params.userId,
      type: "widget_job_complete",
      category: "widget",
      priority: "medium",
      urgencyLevel: 0.5,
      
      timestamp: now,
      timeWaiting: 0,
      
      data: {
        widget_id: params.widgetId,
        widget_title: params.widgetTitle,
        widget_type: params.widgetType,
        project_id: params.projectId,
        completed_at: params.completedAt,
        summary: params.summary || `${params.widgetTitle} has completed its work`,
      },
      
      state: "waiting",
      stateHistory: [{
        from: "forming",
        to: "waiting",
        timestamp: now,
        trigger: "widget_completed"
      }],
      
      position: initialPosition,
      spatialPriority: 2,
      relatedBriefings: [],
      
      viewed: false,
      archived: false,
      starred: false,
      actionsTaken: [],
      
      metadata: {
        source: "widget_executor",
        version: "1.0",
      },
      
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error("Failed to publish widget completion briefing:", error);
  }
}

// ============================================================================
// Helper: Publish Content Sharing Event
// ============================================================================

/**
 * Publish briefing event when content is shared
 * Call this from contentSharingMutations
 */
export async function publishContentSharedBriefing(
  ctx: MutationCtx,
  params: {
    recipientUserId: string;
    sharedByUserId: string;
    sharedByName: string;
    contentType: string;
    contentId: string;
    contentTitle: string;
    message?: string;
  }
) {
  const now = Date.now();
  
  const initialPosition = {
    x: 200, // Collaboration zone
    y: Math.random() * 100 - 50,
    z: 200,
  };
  
  try {
    await ctx.db.insert("briefing_events", {
      userId: params.recipientUserId,
      type: "content_shared",
      category: "collaboration",
      priority: "medium",
      urgencyLevel: 0.6,
      
      timestamp: now,
      timeWaiting: 0,
      
      data: {
        content_type: params.contentType,
        content_id: params.contentId,
        content_title: params.contentTitle,
        shared_by_user_id: params.sharedByUserId,
        shared_by_name: params.sharedByName,
        message: params.message || "",
      },
      
      state: "waiting",
      stateHistory: [{
        from: "forming",
        to: "waiting",
        timestamp: now,
        trigger: "content_shared"
      }],
      
      position: initialPosition,
      spatialPriority: 2,
      relatedBriefings: [],
      
      viewed: false,
      archived: false,
      starred: false,
      actionsTaken: [],
      
      metadata: {
        source: "content_sharing",
        version: "1.0",
      },
      
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error("Failed to publish content shared briefing:", error);
  }
}

// ============================================================================
// Helper: Publish System Intelligence Event
// ============================================================================

/**
 * Publish briefing event for system intelligence alerts
 * Call this from intelligence/MAB systems
 */
export async function publishSystemIntelligenceBriefing(
  ctx: MutationCtx,
  params: {
    userId: string;
    alertType: string;
    title: string;
    description: string;
    priority?: "critical" | "high" | "medium" | "low";
    metadata?: Record<string, any>;
  }
) {
  const now = Date.now();
  
  const initialPosition = {
    x: 400, // System zone
    y: Math.random() * 100 - 50,
    z: params.priority === "critical" ? 50 : 200,
  };
  
  try {
    await ctx.db.insert("briefing_events", {
      userId: params.userId,
      type: params.alertType,
      category: "system",
      priority: params.priority || "low",
      urgencyLevel: params.priority === "critical" ? 0.9 : 0.3,
      
      timestamp: now,
      timeWaiting: 0,
      
      data: {
        alert_type: params.alertType,
        title: params.title,
        description: params.description,
        ...params.metadata,
      },
      
      state: params.priority === "critical" ? "requesting" : "waiting",
      stateHistory: [{
        from: "forming",
        to: params.priority === "critical" ? "requesting" : "waiting",
        timestamp: now,
        trigger: "system_alert"
      }],
      
      position: initialPosition,
      spatialPriority: params.priority === "critical" ? 4 : 1,
      relatedBriefings: [],
      
      viewed: false,
      archived: false,
      starred: false,
      actionsTaken: [],
      
      metadata: {
        source: "system_intelligence",
        version: "1.0",
      },
      
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error("Failed to publish system intelligence briefing:", error);
  }
}

// ============================================================================
// Helper: Publish Dream Report (Mock for now)
// ============================================================================

/**
 * Publish briefing event for dream reports
 * This is a placeholder until dream synthesis is implemented
 */
export async function publishDreamReportBriefing(
  ctx: MutationCtx,
  params: {
    userId: string;
    dreamTitle: string;
    dreamNarrative: string;
    insights: string[];
    confidence: number;
  }
) {
  const now = Date.now();
  
  const initialPosition = {
    x: 0, // Dream zone (center)
    y: Math.random() * 100 - 50,
    z: 250,
  };
  
  try {
    await ctx.db.insert("briefing_events", {
      userId: params.userId,
      type: "dream_report",
      category: "dream",
      priority: "medium",
      urgencyLevel: 0.6,
      
      timestamp: now,
      timeWaiting: 0,
      
      data: {
        dream_title: params.dreamTitle,
        dream_narrative: params.dreamNarrative,
        insights: params.insights,
        confidence: params.confidence,
        generated_at: now,
      },
      
      state: "waiting",
      stateHistory: [{
        from: "forming",
        to: "waiting",
        timestamp: now,
        trigger: "dream_synthesized"
      }],
      
      position: initialPosition,
      spatialPriority: 2,
      relatedBriefings: [],
      
      viewed: false,
      archived: false,
      starred: false,
      actionsTaken: [],
      
      metadata: {
        source: "dream_synthesizer",
        version: "1.0",
      },
      
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error("Failed to publish dream report briefing:", error);
  }
}

