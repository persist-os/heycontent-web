import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Fingerprint Evolution Signals - Track project activity for MAB-driven evolution
 * Minimal implementation - reuses existing MAB infrastructure
 */

// ============================================================================
// SIGNAL TYPES
// ============================================================================

const signalTypes = v.union(
  v.literal("note_added"),
  v.literal("note_modified"),
  v.literal("crystal_added"),
  v.literal("shard_added"),
  v.literal("widget_updated"),
  v.literal("widget_executed"),
  v.literal("manual_edit")
);

// ============================================================================
// INITIALIZE SIGNALS
// ============================================================================

/**
 * Initialize signal tracking for a fingerprint
 * Called when fingerprint is created
 */
export const initialize = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, { fingerprintId, projectId, userId }) => {
    // Check if already exists
    const existing = await ctx.db
      .query("fingerprint_evolution_signals")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", fingerprintId))
      .first();
    
    if (existing) {
      return { success: true, signalsId: existing._id };
    }
    
    const now = Date.now();
    
    const signalsId = await ctx.db.insert("fingerprint_evolution_signals", {
      fingerprintId,
      projectId,
      userId,
      
      // Initialize counters
      notes_added: 0,
      notes_modified: 0,
      crystals_added: 0,
      shards_added: 0,
      widgets_updated: 0,
      widgets_executed: 0,
      manual_edits: 0,
      
      // Timestamps
      last_evolution_at: now,
      last_signal_update_at: now,
      
      // Scores
      content_accumulation_score: 0,
      content_modification_score: 0,
      activity_intensity_score: 0,
      time_decay_factor: 0,
      evolution_signal_score: 0,
      
      // Metadata
      createdAt: now,
      updatedAt: now,
    });
    
    return { success: true, signalsId };
  },
});

// ============================================================================
// INCREMENT SIGNALS
// ============================================================================

/**
 * Increment signal counter and recompute scores
 * Called from project/widget/note mutations
 */
export const increment = mutation({
  args: {
    projectId: v.id("projects"),
    signalType: signalTypes,
    count: v.optional(v.number()),
  },
  handler: async (ctx, { projectId, signalType, count = 1 }) => {
    // Get fingerprint for project
    const fingerprint = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    
    if (!fingerprint) {
      // No fingerprint yet, skip
      return { success: true, message: "No fingerprint for project" };
    }
    
    // Get or create signals
    let signals = await ctx.db
      .query("fingerprint_evolution_signals")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", fingerprint._id))
      .first();
    
    if (!signals) {
      // Initialize if not exists
      const now = Date.now();
      const signalsId = await ctx.db.insert("fingerprint_evolution_signals", {
        fingerprintId: fingerprint._id,
        projectId: fingerprint.projectId,
        userId: fingerprint.userId,
        notes_added: 0,
        notes_modified: 0,
        crystals_added: 0,
        shards_added: 0,
        widgets_updated: 0,
        widgets_executed: 0,
        manual_edits: 0,
        last_evolution_at: now,
        last_signal_update_at: now,
        content_accumulation_score: 0,
        content_modification_score: 0,
        activity_intensity_score: 0,
        time_decay_factor: 0,
        evolution_signal_score: 0,
        createdAt: now,
        updatedAt: now,
      });
      signals = await ctx.db.get(signalsId);
      if (!signals) throw new Error("Failed to create signals");
    }
    
    // Map signal type to field
    const fieldMap: Record<string, keyof typeof signals> = {
      note_added: "notes_added",
      note_modified: "notes_modified",
      crystal_added: "crystals_added",
      shard_added: "shards_added",
      widget_updated: "widgets_updated",
      widget_executed: "widgets_executed",
      manual_edit: "manual_edits",
    };
    
    const field = fieldMap[signalType];
    const currentValue = signals[field] as number;
    
    // Update counter
    await ctx.db.patch(signals._id, {
      [field]: currentValue + count,
      last_signal_update_at: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Recompute scores
    await recomputeScores(ctx, signals._id);
    
    return { success: true, signalsId: signals._id };
  },
});

// ============================================================================
// RESET SIGNALS
// ============================================================================

/**
 * Reset signals after evolution completes
 * Called from backend after fingerprint evolution
 */
export const reset = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
  },
  handler: async (ctx, { fingerprintId }) => {
    const signals = await ctx.db
      .query("fingerprint_evolution_signals")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", fingerprintId))
      .first();
    
    if (!signals) {
      return { success: false, message: "Signals not found" };
    }
    
    const now = Date.now();
    
    await ctx.db.patch(signals._id, {
      // Reset counters
      notes_added: 0,
      notes_modified: 0,
      crystals_added: 0,
      shards_added: 0,
      widgets_updated: 0,
      widgets_executed: 0,
      manual_edits: 0,
      
      // Reset scores
      content_accumulation_score: 0,
      content_modification_score: 0,
      activity_intensity_score: 0,
      time_decay_factor: 0,
      evolution_signal_score: 0,
      
      // Update timestamps
      last_evolution_at: now,
      last_signal_update_at: now,
      updatedAt: now,
    });
    
    return { success: true, signalsId: signals._id };
  },
});

// ============================================================================
// SCORE COMPUTATION
// ============================================================================

/**
 * Recompute all signal scores
 * Internal helper function
 */
async function recomputeScores(
  ctx: any,
  signalsId: Id<"fingerprint_evolution_signals">
) {
  const signals = await ctx.db.get(signalsId);
  if (!signals) return;
  
  const now = Date.now();
  
  // 1. Content Accumulation (new content added)
  const contentAccum = (
    signals.notes_added * 0.3 +
    signals.crystals_added * 0.4 +
    signals.shards_added * 0.2
  );
  const contentAccumScore = Math.min(contentAccum / 20, 1.0);
  
  // 2. Content Modification (existing content changed)
  const contentMod = (
    signals.notes_modified * 0.4 +
    signals.widgets_updated * 0.3 +
    signals.manual_edits * 0.3
  );
  const contentModScore = Math.min(contentMod / 15, 1.0);
  
  // 3. Activity Intensity (usage frequency)
  const timeSinceUpdate = (now - signals.last_signal_update_at) / (1000 * 3600 * 24); // days
  const activityRate = signals.widgets_executed / Math.max(timeSinceUpdate, 1);
  const activityScore = Math.min(activityRate / 5, 1.0);
  
  // 4. Time Decay (staleness)
  const timeSinceEvolution = (now - signals.last_evolution_at) / (1000 * 3600 * 24); // days
  const timeDecay = Math.min(timeSinceEvolution / 30, 1.0);
  
  // 5. Combined Evolution Signal
  const evolutionScore = (
    0.3 * contentAccumScore +
    0.3 * contentModScore +
    0.2 * activityScore +
    0.2 * timeDecay
  );
  
  // Update scores
  await ctx.db.patch(signalsId, {
    content_accumulation_score: contentAccumScore,
    content_modification_score: contentModScore,
    activity_intensity_score: activityScore,
    time_decay_factor: timeDecay,
    evolution_signal_score: evolutionScore,
    updatedAt: now,
  });
}

