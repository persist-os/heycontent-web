/**
 * Intelligence Configuration - Default settings and constants
 * 
 * Defines default trigger thresholds and analysis preferences for the
 * crystal intelligence system. These can be overridden per-user.
 */

export const DEFAULT_INTELLIGENCE_CONFIG = {
  triggers: {
    chat_messages: 25,        // Trigger analysis after 25 chat messages
    smart_notes: 10,          // Trigger after 10 smart notes generated
    crystal_formations: 5,    // Trigger after 5 new crystals formed
    days_since_last: 7,       // Fallback: trigger if 7+ days since last analysis
  },
  preferences: {
    analysis_depth: "standard" as "fast" | "standard" | "deep",
    auto_archival: false,                 // Don't auto-archive by default
    review_notifications: true,           // Enable review notifications
  },
};

export const ANALYSIS_VERSION = "1.0.0";  // Track algorithm versions

/**
 * Determine job type based on activity patterns.
 * This is adaptive - returns appropriate analysis depth based on what triggered it.
 */
export function determineJobType(
  config: {
    triggers: typeof DEFAULT_INTELLIGENCE_CONFIG.triggers;
    preferences: {
      analysis_depth: "fast" | "standard" | "deep";
      auto_archival: boolean;
      review_notifications: boolean;
    };
  },
  counts: {
    chat_messages: number;
    smart_notes: number;
    crystal_formations: number;
  }
): "quick_update" | "standard_analysis" | "deep_analysis" {
  // Deep analysis if user prefers it and enough data accumulated
  if (config.preferences.analysis_depth === "deep" && counts.crystal_formations >= 5) {
    return "deep_analysis";
  }
  
  // Standard analysis for typical activity
  if (counts.chat_messages >= config.triggers.chat_messages || 
      counts.smart_notes >= config.triggers.smart_notes) {
    return "standard_analysis";
  }
  
  // Quick update for small changes
  return "quick_update";
}

/**
 * Calculate job priority based on activity levels.
 * Higher activity = higher priority.
 */
export function calculatePriority(
  counts: {
    chat_messages: number;
    smart_notes: number;
    crystal_formations: number;
  }
): "low" | "normal" | "high" | "urgent" {
  const total_activity = counts.chat_messages + counts.smart_notes + counts.crystal_formations;
  
  // Urgent: Very high activity (50+ actions)
  if (total_activity >= 50) return "urgent";
  
  // High: Significant activity (30+ actions)
  if (total_activity >= 30) return "high";
  
  // Normal: Moderate activity (10+ actions)
  if (total_activity >= 10) return "normal";
  
  // Low: Light activity
  return "low";
}
