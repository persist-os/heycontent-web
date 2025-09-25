import { mutation, query } from "./_generated/server";
import { v, Infer } from "convex/values";
import { Id } from "./_generated/dataModel";

// Shared validators
const CreateFingerprintArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  domain: v.string(),
  complexity_level: v.number(),
  collaboration_style: v.string(),
  time_horizon: v.string(),
  primary_pattern: v.string(),
  working_style: v.array(v.string()),
  decision_making: v.string(),
  energy_patterns: v.string(),
  core_intention: v.string(),
  success_vision: v.string(),
  value_creation: v.string(),
  personal_growth: v.array(v.string()),
  natural_rhythm: v.string(),
  key_phases: v.array(v.object({
    name: v.string(),
    essence: v.string(),
    estimated_duration: v.string(),
    readiness_indicators: v.array(v.string()),
  })),
  flexibility_preference: v.string(),
  tangible_deliverables: v.array(v.string()),
  intangible_benefits: v.array(v.string()),
  measurement_approach: v.string(),
  sharing_intention: v.string(),
  cognitive_load_preference: v.string(),
  information_density: v.string(),
  motivation_style: v.array(v.string()),
  feedback_frequency: v.string(),
  learning_sensitivity: v.number(),
  change_triggers: v.array(v.object({
    condition_type: v.string(),
    threshold: v.number(),
    response_style: v.string(),
  })),
  stability_zones: v.array(v.string()),
  growth_edges: v.array(v.string()),
  morning_persona: v.object({
    energy_match: v.string(),
    focus_style: v.string(),
    preparation_depth: v.string(),
  }),
  evening_persona: v.object({
    reflection_approach: v.string(),
    consolidation_style: v.string(),
    transition_support: v.string(),
  }),
  event_triggers: v.array(v.object({
    trigger_pattern: v.string(),
    response_personality: v.string(),
    coordination_rules: v.array(v.string()),
  })),
  base_personality: v.string(),
  project_voice: v.string(),
  question_generation_style: v.string(),
  suggestion_approach: v.string(),
  clarification_method: v.string(),
  dynamic_dimensions: v.array(v.object({
    dimension_name: v.string(),
    dimension_type: v.string(),
    measurement_approach: v.string(),
    evolution_sensitivity: v.number(),
    ui_representation: v.string(),
  })),
  user_constraints: v.array(v.string()),
  external_dependencies: v.array(v.string()),
  support_systems: v.array(v.string()),
  potential_obstacles: v.array(v.string()),
  intelligence_version: v.optional(v.string()),
  status: v.optional(v.string()),
});

const UpdateFingerprintArgsValidator = v.object({
  fingerprintId: v.id("project_fingerprints"),
  userId: v.string(),
  updates: v.object({
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    domain: v.optional(v.string()),
    complexity_level: v.optional(v.number()),
    collaboration_style: v.optional(v.string()),
    time_horizon: v.optional(v.string()),
    primary_pattern: v.optional(v.string()),
    working_style: v.optional(v.array(v.string())),
    decision_making: v.optional(v.string()),
    energy_patterns: v.optional(v.string()),
    core_intention: v.optional(v.string()),
    success_vision: v.optional(v.string()),
    value_creation: v.optional(v.string()),
    personal_growth: v.optional(v.array(v.string())),
    natural_rhythm: v.optional(v.string()),
    key_phases: v.optional(v.array(v.object({
      name: v.string(),
      essence: v.string(),
      estimated_duration: v.string(),
      readiness_indicators: v.array(v.string()),
    }))),
    flexibility_preference: v.optional(v.string()),
    tangible_deliverables: v.optional(v.array(v.string())),
    intangible_benefits: v.optional(v.array(v.string())),
    measurement_approach: v.optional(v.string()),
    sharing_intention: v.optional(v.string()),
    cognitive_load_preference: v.optional(v.string()),
    information_density: v.optional(v.string()),
    motivation_style: v.optional(v.array(v.string())),
    feedback_frequency: v.optional(v.string()),
    learning_sensitivity: v.optional(v.number()),
    change_triggers: v.optional(v.array(v.object({
      condition_type: v.string(),
      threshold: v.number(),
      response_style: v.string(),
    }))),
    stability_zones: v.optional(v.array(v.string())),
    growth_edges: v.optional(v.array(v.string())),
    morning_persona: v.optional(v.object({
      energy_match: v.string(),
      focus_style: v.string(),
      preparation_depth: v.string(),
    })),
    evening_persona: v.optional(v.object({
      reflection_approach: v.string(),
      consolidation_style: v.string(),
      transition_support: v.string(),
    })),
    event_triggers: v.optional(v.array(v.object({
      trigger_pattern: v.string(),
      response_personality: v.string(),
      coordination_rules: v.array(v.string()),
    }))),
    base_personality: v.optional(v.string()),
    project_voice: v.optional(v.string()),
    question_generation_style: v.optional(v.string()),
    suggestion_approach: v.optional(v.string()),
    clarification_method: v.optional(v.string()),
    dynamic_dimensions: v.optional(v.array(v.object({
      dimension_name: v.string(),
      dimension_type: v.string(),
      measurement_approach: v.string(),
      evolution_sensitivity: v.number(),
      ui_representation: v.string(),
    }))),
    user_constraints: v.optional(v.array(v.string())),
    external_dependencies: v.optional(v.array(v.string())),
    support_systems: v.optional(v.array(v.string())),
    potential_obstacles: v.optional(v.array(v.string())),
    intelligence_version: v.optional(v.string()),
    status: v.optional(v.string()),
  }),
});

const DeleteFingerprintArgsValidator = v.object({
  fingerprintId: v.id("project_fingerprints"),
  userId: v.string(),
});

// Evolution State Validators
const UpdateEvolutionStateArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.string(),
  evolutionData: v.object({
    timestamp: v.number(),
    evolution_trigger: v.string(),
    changes_made: v.record(v.string(), v.any()),
    reasoning: v.string(),
    confidence_score: v.number(),
    learning_captured: v.string(),
    trigger_context: v.optional(v.record(v.string(), v.any())),
    evolution_metrics: v.optional(v.record(v.string(), v.number())),
    processing_time_ms: v.optional(v.number()),
    ai_model_version: v.optional(v.string()),
  }),
});

const GetEvolutionStateArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.string(),
  includeHistory: v.optional(v.boolean()),
  limit: v.optional(v.number()),
});

const FinalizeFingerprintArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.string(),
  evolutionVersion: v.optional(v.string()),
  finalizationReason: v.optional(v.string()),
});

// Infer TypeScript types
export type CreateFingerprintArgs = Infer<typeof CreateFingerprintArgsValidator>;
export type UpdateFingerprintArgs = Infer<typeof UpdateFingerprintArgsValidator>;
export type DeleteFingerprintArgs = Infer<typeof DeleteFingerprintArgsValidator>;
export type UpdateEvolutionStateArgs = Infer<typeof UpdateEvolutionStateArgsValidator>;
export type GetEvolutionStateArgs = Infer<typeof GetEvolutionStateArgsValidator>;
export type FinalizeFingerprintArgs = Infer<typeof FinalizeFingerprintArgsValidator>;

/**
 * Create a new project fingerprint from AI-generated data
 */
export const createFingerprint = mutation({
  args: CreateFingerprintArgsValidator,
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create the fingerprint
    const fingerprintId = await ctx.db.insert("project_fingerprints", {
      // Core Identity
      projectId: args.projectId,
      userId: args.userId,
      name: args.name,
      description: args.description,

      // AI-Discovered Project Nature
      domain: args.domain,
      complexity_level: args.complexity_level,
      collaboration_style: args.collaboration_style,
      time_horizon: args.time_horizon,

      // AI-Generated Project Archetype
      primary_pattern: args.primary_pattern,
      working_style: args.working_style,
      decision_making: args.decision_making,
      energy_patterns: args.energy_patterns,

      // Intentions
      core_intention: args.core_intention,
      success_vision: args.success_vision,
      value_creation: args.value_creation,
      personal_growth: args.personal_growth,

      // Dynamic Timeline
      natural_rhythm: args.natural_rhythm,
      key_phases: args.key_phases,
      flexibility_preference: args.flexibility_preference,

      // Output Desires
      tangible_deliverables: args.tangible_deliverables,
      intangible_benefits: args.intangible_benefits,
      measurement_approach: args.measurement_approach,
      sharing_intention: args.sharing_intention,

      // Interface Preferences
      cognitive_load_preference: args.cognitive_load_preference,
      information_density: args.information_density,
      motivation_style: args.motivation_style,
      feedback_frequency: args.feedback_frequency,

      // Evolution Intelligence
      learning_sensitivity: args.learning_sensitivity,
      change_triggers: args.change_triggers,
      stability_zones: args.stability_zones,
      growth_edges: args.growth_edges,

      // AI Agent Coordination
      morning_persona: args.morning_persona,
      evening_persona: args.evening_persona,
      event_triggers: args.event_triggers,

      // AI Prompt Generation
      base_personality: args.base_personality,
      project_voice: args.project_voice,
      question_generation_style: args.question_generation_style,
      suggestion_approach: args.suggestion_approach,
      clarification_method: args.clarification_method,

      // Dynamic Intelligence Fields
      dynamic_dimensions: args.dynamic_dimensions,

      // Contextual Awareness
      user_constraints: args.user_constraints,
      external_dependencies: args.external_dependencies,
      support_systems: args.support_systems,
      potential_obstacles: args.potential_obstacles,

      // Metadata
      created_at: now,
      last_evolution: now,
      intelligence_version: args.intelligence_version || "1.0.0",
      status: args.status || "active",
    });

    // Update the project to link it to the fingerprint
    await ctx.db.patch(args.projectId, {
      fingerprintId: fingerprintId,
      updatedAt: now,
    });

    return fingerprintId;
  },
});

/**
 * Update an existing project fingerprint
 */
export const updateFingerprint = mutation({
  args: UpdateFingerprintArgsValidator,
  handler: async (ctx, args) => {
    // Verify the fingerprint belongs to the user
    const fingerprint = await ctx.db.get(args.fingerprintId);
    if (!fingerprint) {
      throw new Error("Fingerprint not found");
    }
    
    if (fingerprint.userId !== args.userId) {
      throw new Error("Unauthorized: Fingerprint does not belong to user");
    }

    // Update the fingerprint
    await ctx.db.patch(args.fingerprintId, {
      ...args.updates,
      last_evolution: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a project fingerprint
 */
export const deleteFingerprint = mutation({
  args: DeleteFingerprintArgsValidator,
  handler: async (ctx, args) => {
    // Verify the fingerprint belongs to the user
    const fingerprint = await ctx.db.get(args.fingerprintId);
    if (!fingerprint) {
      throw new Error("Fingerprint not found");
    }
    
    if (fingerprint.userId !== args.userId) {
      throw new Error("Unauthorized: Fingerprint does not belong to user");
    }

    // Remove the fingerprint reference from the project
    await ctx.db.patch(fingerprint.projectId, {
      fingerprintId: undefined,
      updatedAt: Date.now(),
    });

    // Delete the fingerprint
    await ctx.db.delete(args.fingerprintId);

    return { success: true };
  },
});

// =============================================================================
// EVOLUTION STATE MUTATIONS FOR PROJECT DISCOVERY ORCHESTRATOR
// =============================================================================

// Validation helpers for evolution state
function validateConfidenceScore(score: number): number {
  if (score < 0 || score > 1) {
    throw new Error("Confidence score must be between 0 and 1");
  }
  return score;
}

function validateEvolutionTrigger(trigger: string): string {
  const validTriggers = [
    'conversation_message', 
    'morning_update', 
    'evening_update', 
    'data_change', 
    'user_edit', 
    'milestone_reached', 
    'ai_insight', 
    'manual_evolution',
    'project_discovery'
  ];
  if (!validTriggers.includes(trigger)) {
    throw new Error(`Invalid evolution trigger: ${trigger}. Must be one of: ${validTriggers.join(', ')}`);
  }
  return trigger;
}

// Helper to validate project ownership
async function validateProjectOwnership(ctx: any, projectId: Id<"projects">, userId: string) {
  const project = await ctx.db.get(projectId);
  
  if (!project) {
    throw new Error("Project not found");
  }
  
  if (project.userId !== userId) {
    throw new Error("Unauthorized: Project does not belong to user");
  }
  
  return project;
}

/**
 * Update evolution state with incremental conversation data
 * Used by Project Discovery Orchestrator to build fingerprints incrementally
 */
export const updateEvolutionState = mutation({
  args: UpdateEvolutionStateArgsValidator,
  handler: async (ctx, args) => {
    // Validate project ownership
    const project = await validateProjectOwnership(ctx, args.projectId, args.userId);
    
    // Validate evolution data
    const validatedTrigger = validateEvolutionTrigger(args.evolutionData.evolution_trigger);
    const validatedConfidence = validateConfidenceScore(args.evolutionData.confidence_score);
    
    try {
      // Check if project already has a fingerprint
      let fingerprintId = project.fingerprintId;
      
      // If no fingerprint exists, create a basic one first
      if (!fingerprintId) {
        fingerprintId = await ctx.db.insert("project_fingerprints", {
          projectId: args.projectId,
          userId: args.userId,
          name: project.name || "Project Fingerprint",
          description: "Auto-generated fingerprint from project discovery",
          
          // Set default values - will be evolved over time
          domain: "general",
          complexity_level: 1,
          collaboration_style: "individual",
          time_horizon: "medium-term",
          primary_pattern: "exploratory",
          working_style: ["flexible"],
          decision_making: "collaborative",
          energy_patterns: "variable",
          core_intention: "discovery",
          success_vision: "to be defined",
          value_creation: "to be defined",
          personal_growth: ["learning"],
          natural_rhythm: "flexible",
          key_phases: [],
          flexibility_preference: "high",
          tangible_deliverables: [],
          intangible_benefits: [],
          measurement_approach: "qualitative",
          sharing_intention: "private",
          cognitive_load_preference: "moderate",
          information_density: "medium",
          motivation_style: ["curiosity"],
          feedback_frequency: "as_needed",
          learning_sensitivity: 0.5,
          change_triggers: [],
          stability_zones: [],
          growth_edges: [],
          morning_persona: {
            energy_match: "moderate",
            focus_style: "flexible",
            preparation_depth: "basic"
          },
          evening_persona: {
            reflection_approach: "casual",
            consolidation_style: "informal",
            transition_support: "minimal"
          },
          event_triggers: [],
          base_personality: "curious",
          project_voice: "exploratory",
          question_generation_style: "open-ended",
          suggestion_approach: "gentle",
          clarification_method: "conversational",
          dynamic_dimensions: [],
          user_constraints: [],
          external_dependencies: [],
          support_systems: [],
          potential_obstacles: [],
          
          // Metadata
          created_at: args.evolutionData.timestamp,
          last_evolution: args.evolutionData.timestamp,
          intelligence_version: args.evolutionData.ai_model_version || "1.0.0",
          status: "evolving",
        });
        
        // Update project to link the fingerprint
        await ctx.db.patch(args.projectId, {
          fingerprintId: fingerprintId,
          updatedAt: args.evolutionData.timestamp,
        });
      }
      
      // Get next version number
      const existingEvolutions = await ctx.db
        .query("fingerprint_evolution_history")
        .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", fingerprintId))
        .collect();
      const nextVersion = existingEvolutions.length + 1;

      // Create evolution history entry
      const evolutionId = await ctx.db.insert("fingerprint_evolution_history", {
        fingerprintId: fingerprintId,
        userId: args.userId,
        projectId: args.projectId,
        
        timestamp: args.evolutionData.timestamp,
        evolution_trigger: validatedTrigger,
        version: nextVersion,
        readiness_status: "gathering_data",
        changes_made: args.evolutionData.changes_made,
        reasoning: args.evolutionData.reasoning,
        confidence_score: validatedConfidence,
        
        evolution_state: {
          current_phase: "data_collection",
          completion_percentage: Math.min(100, nextVersion * 10), // Simple progress calculation
          next_actions: ["Continue conversation", "Analyze patterns"],
          blockers: [],
          dependencies: [],
        },
        
        learning_captured: args.evolutionData.learning_captured,
        trigger_context: args.evolutionData.trigger_context,
        evolution_metrics: args.evolutionData.evolution_metrics,
        
        processing_time_ms: args.evolutionData.processing_time_ms,
        ai_model_version: args.evolutionData.ai_model_version,
      });
      
      // Update fingerprint's last evolution timestamp
      await ctx.db.patch(fingerprintId, {
        last_evolution: args.evolutionData.timestamp,
      });
      
      return {
        success: true,
        evolutionId,
        fingerprintId,
        isNewFingerprint: !project.fingerprintId,
      };
      
    } catch (error) {
      console.error("Failed to update evolution state:", error);
      throw new Error("Failed to update evolution state. Please try again.");
    }
  },
});

/**
 * Get current evolution state for a project
 * Used by agents to retrieve current state and history
 */
export const getEvolutionState = query({
  args: GetEvolutionStateArgsValidator,
  handler: async (ctx, args) => {
    try {
      // Validate project ownership
      const project = await validateProjectOwnership(ctx, args.projectId, args.userId);
      
      // Get current fingerprint if it exists
      let currentFingerprint = null;
      if (project.fingerprintId) {
        currentFingerprint = await ctx.db.get(project.fingerprintId);
      }
      
      // Get evolution history if requested
      let evolutionHistory = [];
      if (args.includeHistory && project.fingerprintId) {
        const limit = args.limit || 20;
        evolutionHistory = await ctx.db
          .query("fingerprint_evolution_history")
          .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", project.fingerprintId))
          .order("desc")
          .take(limit);
      }
      
      // Calculate evolution readiness score
      let readinessScore = 0;
      let readinessStatus = "not_started";
      
      if (currentFingerprint) {
        // Simple readiness calculation based on filled fields
        const requiredFields = [
          'domain', 'complexity_level', 'collaboration_style', 'time_horizon',
          'primary_pattern', 'working_style', 'decision_making', 'energy_patterns',
          'core_intention', 'success_vision', 'value_creation'
        ];
        
        let filledFields = 0;
        requiredFields.forEach(field => {
          const value = (currentFingerprint as any)[field];
          if (value && (typeof value !== 'string' || value.trim() !== '') && 
              (Array.isArray(value) ? value.length > 0 : true)) {
            filledFields++;
          }
        });
        
        readinessScore = filledFields / requiredFields.length;
        
        if (readinessScore < 0.3) {
          readinessStatus = "early_discovery";
        } else if (readinessScore < 0.7) {
          readinessStatus = "developing";
        } else {
          readinessStatus = "ready_to_finalize";
        }
      }
      
      return {
        project: {
          _id: project._id,
          name: project.name,
          fingerprintId: project.fingerprintId,
        },
        currentFingerprint,
        evolutionHistory,
        readinessScore,
        readinessStatus,
        totalEvolutions: evolutionHistory.length,
        lastEvolution: evolutionHistory.length > 0 ? evolutionHistory[0].timestamp : null,
      };
      
    } catch (error) {
      console.error("Failed to get evolution state:", error);
      if (error.message.includes("Unauthorized") || error.message.includes("not found")) {
        throw error;
      }
      throw new Error("Failed to retrieve evolution state. Please try again.");
    }
  },
});

/**
 * Finalize evolution history into final fingerprint
 * Used when user decides to generate the final fingerprint
 */
export const finalizeFingerprint = mutation({
  args: FinalizeFingerprintArgsValidator,
  handler: async (ctx, args) => {
    try {
      // Validate project ownership
      const project = await validateProjectOwnership(ctx, args.projectId, args.userId);
      
      if (!project.fingerprintId) {
        throw new Error("No fingerprint found to finalize. Please start the discovery process first.");
      }
      
      const fingerprint = await ctx.db.get(project.fingerprintId);
      if (!fingerprint) {
        throw new Error("Fingerprint not found");
      }
      
      // Get all evolution history to create final version
      const evolutionHistory = await ctx.db
        .query("fingerprint_evolution_history")
        .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", project.fingerprintId))
        .order("asc")
        .collect();
      
      // Calculate final confidence score based on evolution history
      let finalConfidence = 0;
      if (evolutionHistory.length > 0) {
        const totalConfidence = evolutionHistory.reduce((sum, entry) => sum + entry.confidence_score, 0);
        finalConfidence = totalConfidence / evolutionHistory.length;
      }
      
      // Get next version number
      const nextVersion = evolutionHistory.length + 1;

      // Create final evolution entry
      const finalEvolutionId = await ctx.db.insert("fingerprint_evolution_history", {
        fingerprintId: project.fingerprintId,
        userId: args.userId,
        projectId: args.projectId,
        
        timestamp: Date.now(),
        evolution_trigger: "finalization",
        version: nextVersion,
        readiness_status: "completed",
        changes_made: {
          finalization_reason: args.finalizationReason || "User requested finalization",
          evolution_version: args.evolutionVersion || "1.0.0",
          total_evolutions: evolutionHistory.length,
          final_confidence: finalConfidence,
        },
        reasoning: `Finalizing fingerprint after ${evolutionHistory.length} evolution steps. Final confidence: ${finalConfidence.toFixed(2)}`,
        confidence_score: finalConfidence,
        
        evolution_state: {
          current_phase: "finalization",
          completion_percentage: 100,
          next_actions: ["Fingerprint ready for use"],
          blockers: [],
          dependencies: [],
        },
        
        learning_captured: `Finalized fingerprint with ${evolutionHistory.length} evolution steps. Ready for production use.`,
        trigger_context: {
          finalization_requested_by: "user",
          evolution_count: evolutionHistory.length,
          average_confidence: finalConfidence,
        },
        evolution_metrics: {
          total_evolution_steps: evolutionHistory.length,
          final_confidence_score: finalConfidence,
          time_to_finalization: Date.now() - (fingerprint as any).created_at,
        },
      });
      
      // Update fingerprint status to finalized
      await ctx.db.patch(project.fingerprintId, {
        status: "finalized",
        last_evolution: Date.now(),
        intelligence_version: args.evolutionVersion || "1.0.0",
      });
      
      return {
        success: true,
        finalEvolutionId,
        fingerprintId: project.fingerprintId,
        finalConfidence,
        totalEvolutions: evolutionHistory.length + 1, // Including the finalization step
        finalizedAt: Date.now(),
      };
      
    } catch (error) {
      console.error("Failed to finalize fingerprint:", error);
      if (error.message.includes("Unauthorized") || error.message.includes("not found")) {
        throw error;
      }
      throw new Error("Failed to finalize fingerprint. Please try again.");
    }
  },
});

/**
 * Get evolution readiness status for multiple projects
 * Used by agents to understand which projects are ready for finalization
 */
export const getEvolutionReadinessStatus = query({
  args: {
    userId: v.string(),
    projectIds: v.optional(v.array(v.id("projects"))),
  },
  handler: async (ctx, args) => {
    try {
      // Get projects (all user projects or specific ones)
      let projects;
      if (args.projectIds && args.projectIds.length > 0) {
        projects = await Promise.all(
          args.projectIds.map(id => ctx.db.get(id))
        );
        projects = projects.filter(Boolean);
      } else {
        projects = await ctx.db
          .query("projects")
          .filter((q) => q.eq(q.field("userId"), args.userId))
          .collect();
      }
      
      // Get readiness status for each project
      const readinessStatus = await Promise.all(
        projects.map(async (project) => {
          try {
            // Get current fingerprint if it exists
            let fingerprint = null;
            if (project.fingerprintId) {
              fingerprint = await ctx.db.get(project.fingerprintId);
            }
            
            // Get evolution count
            let evolutionCount = 0;
            if (project.fingerprintId) {
              const evolutions = await ctx.db
                .query("fingerprint_evolution_history")
                .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", project.fingerprintId))
                .collect();
              evolutionCount = evolutions.length;
            }
            
            // Calculate readiness
            let readinessScore = 0;
            let readinessStatus = "not_started";
            
            if (fingerprint) {
              const requiredFields = [
                'domain', 'complexity_level', 'collaboration_style', 'time_horizon',
                'primary_pattern', 'working_style', 'decision_making', 'energy_patterns',
                'core_intention', 'success_vision', 'value_creation'
              ];
              
              let filledFields = 0;
              requiredFields.forEach(field => {
                const value = (fingerprint as any)[field];
                if (value && (typeof value !== 'string' || value.trim() !== '') && 
                    (Array.isArray(value) ? value.length > 0 : true)) {
                  filledFields++;
                }
              });
              
              readinessScore = filledFields / requiredFields.length;
              
              if (readinessScore < 0.3) {
                readinessStatus = "early_discovery";
              } else if (readinessScore < 0.7) {
                readinessStatus = "developing";
              } else {
                readinessStatus = "ready_to_finalize";
              }
            }
            
            return {
              projectId: project._id,
              projectName: project.name,
              fingerprintId: project.fingerprintId,
              readinessScore,
              readinessStatus,
              evolutionCount,
              lastEvolution: fingerprint?.last_evolution || null,
              status: fingerprint?.status || "not_started",
            };
          } catch (error) {
            console.warn(`Failed to get readiness for project ${project._id}:`, error);
            return {
              projectId: project._id,
              projectName: project.name,
              fingerprintId: null,
              readinessScore: 0,
              readinessStatus: "error",
              evolutionCount: 0,
              lastEvolution: null,
              status: "error",
            };
          }
        })
      );
      
      return readinessStatus;
      
    } catch (error) {
      console.error("Failed to get evolution readiness status:", error);
      throw new Error("Failed to retrieve evolution readiness status. Please try again.");
    }
  },
});
