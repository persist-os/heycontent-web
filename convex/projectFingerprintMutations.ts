import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Optimized Project Fingerprint Mutations
 * Following Convex best practices for performance and scalability
 */

// ============================================================================
// CORE FINGERPRINT OPERATIONS
// ============================================================================

/**
 * Create initial fingerprint for project discovery
 * Used by: Backend when starting discovery process
 */
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    discoveryConversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, { projectId, userId, name, description, discoveryConversationId }) => {
    // Check if fingerprint already exists
    const existing = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (existing) {
      throw new Error("Fingerprint already exists for this project");
    }

    const now = Date.now();
    
    const fingerprintId = await ctx.db.insert("project_fingerprints", {
      projectId,
      userId,
      name,
      description,
      discoveryConversationId,
      
      // Initialize core fields as empty - will be filled during discovery
      domain: "",
      complexity_level: 0,
      collaboration_style: "",
      time_horizon: "",
      primary_pattern: "",
      working_style: [],
      decision_making: "",
      energy_patterns: "",
      
      // Initialize intentions
      core_intention: "",
      success_vision: "",
      value_creation: "",
      personal_growth: [],
      
      // Initialize timeline
      natural_rhythm: "",
      key_phases: [],
      flexibility_preference: "",
      
      // Initialize outputs
      tangible_deliverables: [],
      intangible_benefits: [],
      measurement_approach: "",
      sharing_intention: "",
      
      // Initialize interface preferences
      cognitive_load_preference: "",
      information_density: "",
      motivation_style: [],
      feedback_frequency: "",
      
      // Initialize evolution settings - all empty until discovered
      learning_sensitivity: 0, // Will be set to 1-10 during discovery
      change_triggers: [],
      stability_zones: [],
      growth_edges: [],
      
      // Initialize AI coordination
      morning_persona: {
        energy_match: "",
        focus_style: "",
        preparation_depth: "",
      },
      evening_persona: {
        reflection_approach: "",
        consolidation_style: "",
        transition_support: "",
      },
      event_triggers: [],
      
      // Initialize AI prompt generation
      base_personality: "",
      project_voice: "",
      question_generation_style: "",
      suggestion_approach: "",
      clarification_method: "",
      
      // Initialize dynamic dimensions
      dynamic_dimensions: [],
      
      // Initialize contextual awareness
      user_constraints: [],
      external_dependencies: [],
      support_systems: [],
      potential_obstacles: [],
      
      // Metadata
      created_at: now,
      last_evolution: now,
      intelligence_version: "1.0",
      status: "discovering",
    });
    
    // 🆕 Initialize evolution signals for MAB tracking
    await ctx.db.insert("fingerprint_evolution_signals", {
      fingerprintId,
      projectId,
      userId,
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
    
    return fingerprintId;
  },
});

/**
 * Link fingerprint to discovery conversation
 * Used by: Frontend when creating/resuming discovery
 */
export const linkDiscoveryConversation = mutation({
  args: {
    projectId: v.id("projects"),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { projectId, conversationId }) => {
    const fingerprint = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!fingerprint) {
      throw new Error("Fingerprint not found for project");
    }

    await ctx.db.patch(fingerprint._id, {
      discoveryConversationId: conversationId,
    });

    return { success: true, fingerprintId: fingerprint._id };
  },
});

/**
 * Update fingerprint fields during discovery process
 * Used by: Backend AI agent after each conversation turn
 */
export const updateDiscoveryProgress = mutation({
  args: {
    projectId: v.id("projects"),
    fieldsUpdate: v.record(v.string(), v.any()),
    trigger: v.string(), // "conversation", "ai_insight", "user_edit"
    confidence_scores: v.optional(v.record(v.string(), v.number())),
    conversationMessageId: v.optional(v.string()),
  },
  handler: async (ctx, { 
    projectId, 
    fieldsUpdate, 
    trigger, 
    confidence_scores,
    conversationMessageId 
  }) => {
    // Get existing fingerprint
    const fingerprint = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!fingerprint) {
      throw new Error("Fingerprint not found for project");
    }

    const now = Date.now();
    
    // Update fingerprint with new fields
    const updatedFingerprint = {
      ...fingerprint,
      ...fieldsUpdate,
      last_evolution: now,
    };

    // Determine if discovery is complete based on key fields
    // Updated to match the expanded core fields from queries
    const coreFields = [
      'domain', 'complexity_level', 'collaboration_style', 'time_horizon',
      'primary_pattern', 'working_style', 'decision_making', 'energy_patterns',
      'core_intention', 'success_vision', 'value_creation', 'personal_growth',
      'natural_rhythm', 'flexibility_preference', 'cognitive_load_preference',
      'information_density', 'feedback_frequency', 'learning_sensitivity',
      'base_personality', 'project_voice'
    ];
    
    const completedFields = coreFields.filter(field => {
      const value = updatedFingerprint[field as keyof typeof updatedFingerprint];
      
      // Check for null/undefined
      if (value === null || value === undefined) return false;
      
      // Check for empty string
      if (value === '') return false;
      
      // Check for empty arrays
      if (Array.isArray(value) && value.length === 0) return false;
      
      // Check for zero numbers (learning_sensitivity valid range is 1-10, so 0 = not discovered)
      if (typeof value === 'number' && value === 0) return false;
      
      return true;
    });
    
    // Update status if discovery is substantially complete (75% threshold)
    const completionThreshold = Math.ceil(coreFields.length * 0.75); // 15 out of 20 fields
    if (completedFields.length >= completionThreshold && fingerprint.status === "discovering") {
      updatedFingerprint.status = "active";
    }

    // Update the fingerprint
    await ctx.db.patch(fingerprint._id, updatedFingerprint);

    // Record evolution history
    await ctx.db.insert("fingerprint_evolution_history", {
      fingerprintId: fingerprint._id,
      userId: fingerprint.userId,
      projectId: fingerprint.projectId,
      timestamp: now,
      evolution_trigger: trigger,
      changes_made: fieldsUpdate,
      reasoning: `Discovery update via ${trigger}`,
      confidence_score: confidence_scores ? 
        Object.values(confidence_scores).reduce((a, b) => a + b, 0) / Object.values(confidence_scores).length : 
        0.8, // Default confidence
      trigger_context: {
        conversation_message_id: conversationMessageId,
        fields_updated: Object.keys(fieldsUpdate),
        completed_fields_count: completedFields.length,
        total_core_fields: coreFields.length,
      },
      learning_captured: `Updated ${Object.keys(fieldsUpdate).length} fields during discovery`,
    });

    return {
      success: true,
      fingerprintId: fingerprint._id,
      status: updatedFingerprint.status,
      completion_percentage: Math.round((completedFields.length / coreFields.length) * 100),
      fields_updated: Object.keys(fieldsUpdate),
    };
  },
});

/**
 * Mark fingerprint discovery as complete
 * Used by: Backend AI agent when discovery is finished
 */
export const completeDiscovery = mutation({
  args: {
    projectId: v.id("projects"),
    finalFields: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, { projectId, finalFields }) => {
    const fingerprint = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!fingerprint) {
      throw new Error("Fingerprint not found for project");
    }

    const now = Date.now();
    
    // Apply any final field updates
    const updates: any = {
      status: "active",
      last_evolution: now,
    };
    
    if (finalFields) {
      Object.assign(updates, finalFields);
    }

    await ctx.db.patch(fingerprint._id, updates);

    // Record completion in evolution history
    await ctx.db.insert("fingerprint_evolution_history", {
      fingerprintId: fingerprint._id,
      userId: fingerprint.userId,
      projectId: fingerprint.projectId,
      timestamp: now,
      evolution_trigger: "discovery_completion",
      changes_made: { status: "active", ...finalFields },
      reasoning: "Discovery process completed by AI agent",
      confidence_score: 0.95,
      learning_captured: "Discovery phase successfully completed",
    });

    return {
      success: true,
      fingerprintId: fingerprint._id,
      status: "active",
    };
  },
});

// ============================================================================
// FINGERPRINT MANAGEMENT
// ============================================================================

/**
 * Update fingerprint fields directly (user editing)
 * Used by: Frontend when user manually edits fingerprint fields
 */
export const updateFields = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      domain: v.optional(v.string()),
      core_intention: v.optional(v.string()),
      success_vision: v.optional(v.string()),
      value_creation: v.optional(v.string()),
      tangible_deliverables: v.optional(v.array(v.string())),
      personal_growth: v.optional(v.array(v.string())),
      intangible_benefits: v.optional(v.array(v.string())),
      primary_pattern: v.optional(v.string()),
      working_style: v.optional(v.array(v.string())),
      collaboration_style: v.optional(v.string()),
      decision_making: v.optional(v.string()),
      energy_patterns: v.optional(v.string()),
      time_horizon: v.optional(v.string()),
      natural_rhythm: v.optional(v.string()),
      flexibility_preference: v.optional(v.string()),
      measurement_approach: v.optional(v.string()),
      feedback_frequency: v.optional(v.string()),
      cognitive_load_preference: v.optional(v.string()),
      information_density: v.optional(v.string()),
      motivation_style: v.optional(v.array(v.string())),
      complexity_level: v.optional(v.number()),
      learning_sensitivity: v.optional(v.number()),
      sharing_intention: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { fingerprintId, userId, updates }) => {
    const fingerprint = await ctx.db.get(fingerprintId);
    
    if (!fingerprint) {
      throw new Error("Fingerprint not found");
    }
    
    // Verify user owns this fingerprint
    if (fingerprint.userId !== userId) {
      throw new Error("Access denied: You don't own this fingerprint");
    }

    const now = Date.now();
    
    // Apply updates
    await ctx.db.patch(fingerprintId, {
      ...updates,
      last_evolution: now,
    });

    // Record user edit in evolution history
    await ctx.db.insert("fingerprint_evolution_history", {
      fingerprintId,
      userId: fingerprint.userId,
      projectId: fingerprint.projectId,
      timestamp: now,
      evolution_trigger: "user_edit",
      changes_made: updates,
      reasoning: "Manual user edit via fingerprint editor",
      confidence_score: 1.0, // User edits have full confidence
      learning_captured: `User updated ${Object.keys(updates).length} fields`,
    });

    // 🆕 INCREMENT FINGERPRINT SIGNALS
    try {
      await ctx.runMutation(api.fingerprintSignalsMutations.increment, {
        projectId: fingerprint.projectId,
        signalType: "manual_edit",
        count: Object.keys(updates).length, // Count number of fields edited
      });
    } catch (error) {
      console.error("Failed to increment signal:", error);
    }

    return {
      success: true,
      fingerprintId,
      fields_updated: Object.keys(updates),
    };
  },
});

/**
 * Update fingerprint status
 * Used by: Status changes, archiving, etc.
 */
export const updateStatus = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    status: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { fingerprintId, status, reason }) => {
    const fingerprint = await ctx.db.get(fingerprintId);
    
    if (!fingerprint) {
      throw new Error("Fingerprint not found");
    }

    const now = Date.now();
    
    await ctx.db.patch(fingerprintId, {
      status,
      last_evolution: now,
    });

    // Record status change in evolution history
    await ctx.db.insert("fingerprint_evolution_history", {
      fingerprintId,
      userId: fingerprint.userId,
      projectId: fingerprint.projectId,
      timestamp: now,
      evolution_trigger: "status_change",
      changes_made: { status },
      reasoning: reason || `Status changed to ${status}`,
      confidence_score: 1.0,
      learning_captured: `Status updated to ${status}`,
    });

    return { success: true, status };
  },
});

/**
 * Delete fingerprint and evolution history
 * Used by: Project deletion, user cleanup
 */
export const deleteFingerprint = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(), // Security: ensure user owns the fingerprint
  },
  handler: async (ctx, { fingerprintId, userId }) => {
    const fingerprint = await ctx.db.get(fingerprintId);
    
    if (!fingerprint) {
      throw new Error("Fingerprint not found");
    }
    
    if (fingerprint.userId !== userId) {
      throw new Error("Access denied: You don't own this fingerprint");
    }

    // Delete evolution history first
    const evolutions = await ctx.db
      .query("fingerprint_evolution_history")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", fingerprintId))
      .collect();

    for (const evolution of evolutions) {
      await ctx.db.delete(evolution._id);
    }

    // Delete the fingerprint
    await ctx.db.delete(fingerprintId);

    return { success: true };
  },
});

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Batch update multiple fields efficiently
 * Used by: Large updates from AI processing
 */
export const batchUpdateFields = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    fieldUpdates: v.array(v.object({
      field: v.string(),
      value: v.any(),
      confidence: v.optional(v.number()),
    })),
    trigger: v.string(),
  },
  handler: async (ctx, { fingerprintId, fieldUpdates, trigger }) => {
    const fingerprint = await ctx.db.get(fingerprintId);
    
    if (!fingerprint) {
      throw new Error("Fingerprint not found");
    }

    const now = Date.now();
    
    // Build update object
    const updates: any = { last_evolution: now };
    const changes: any = {};
    
    for (const update of fieldUpdates) {
      updates[update.field] = update.value;
      changes[update.field] = update.value;
    }

    await ctx.db.patch(fingerprintId, updates);

    // Record batch update in evolution history
    await ctx.db.insert("fingerprint_evolution_history", {
      fingerprintId,
      userId: fingerprint.userId,
      projectId: fingerprint.projectId,
      timestamp: now,
      evolution_trigger: trigger,
      changes_made: changes,
      reasoning: `Batch update of ${fieldUpdates.length} fields`,
      confidence_score: fieldUpdates.reduce((sum, update) => sum + (update.confidence || 0.8), 0) / fieldUpdates.length,
      learning_captured: `Batch updated: ${fieldUpdates.map(u => u.field).join(', ')}`,
    });

    return {
      success: true,
      fields_updated: fieldUpdates.length,
      updates: Object.keys(changes),
    };
  },
});
