/**
 * Proper Convex-reactive hooks for project fingerprint data
 * Replaces the problematic Zustand store with direct useQuery hooks
 */

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';

/**
 * Get project fingerprint data reactively
 * This is the main hook that replaces useProjectFingerprintStore
 */
export const useProjectFingerprint = (projectId?: Id<'projects'>) => {
  const fingerprint = useQuery(
    api.projectFingerprintQueries.getFullContext,
    projectId ? { projectId } : 'skip'
  );

  const completionStatus = useQuery(
    api.projectFingerprintQueries.getCompletionStatus,
    projectId ? { projectId } : 'skip'
  );

  return {
    // Data
    fingerprint,
    isLoading: fingerprint === undefined,
    hasFingerprint: !!fingerprint,
    
    // Completion status
    completionStatus,
    isComplete: completionStatus?.completion_percentage === 100,
    
    // Convenient accessors
    fingerprintId: fingerprint?._id,
    projectId: fingerprint?.projectId,
    userId: fingerprint?.userId,
    name: fingerprint?.name,
    description: fingerprint?.description,
    status: fingerprint?.status,
    domain: fingerprint?.domain,
    complexity_level: fingerprint?.complexity_level,
    core_intention: fingerprint?.core_intention,
    success_vision: fingerprint?.success_vision,
    last_evolution: fingerprint?.last_evolution,
    intelligence_version: fingerprint?.intelligence_version,
  };
};

/**
 * Get fingerprint evolution history reactively
 */
export const useFingerprintEvolution = (fingerprintId?: Id<'project_fingerprints'>) => {
  const history = useQuery(
    api.projectFingerprintQueries.getEvolutionHistory,
    fingerprintId ? { fingerprintId } : 'skip'
  );

  return {
    history: history || [],
    isLoading: history === undefined,
    hasHistory: (history?.length || 0) > 0,
    evolutionCount: history?.length || 0,
  };
};

/**
 * Fingerprint display data for UI components
 */
export const useFingerprintDisplay = (projectId?: Id<'projects'>) => {
  const { fingerprint } = useProjectFingerprint(projectId);

  return {
    // Core display fields
    name: fingerprint?.name,
    description: fingerprint?.description,

    // Intelligence fields
    domain: fingerprint?.domain,
    complexity_level: fingerprint?.complexity_level,
    primary_pattern: fingerprint?.primary_pattern,
    working_style: fingerprint?.working_style,
    core_intention: fingerprint?.core_intention,
    success_vision: fingerprint?.success_vision,

    // Status and metadata
    status: fingerprint?.status,
    last_evolution: fingerprint?.last_evolution,
    intelligence_version: fingerprint?.intelligence_version,

    // Key arrays for display
    tangible_deliverables: fingerprint?.tangible_deliverables || [],
    intangible_benefits: fingerprint?.intangible_benefits || [],
    personal_growth: fingerprint?.personal_growth || [],
    user_constraints: fingerprint?.user_constraints || [],
    potential_obstacles: fingerprint?.potential_obstacles || [],

    // UI preferences
    cognitive_load_preference: fingerprint?.cognitive_load_preference,
    information_density: fingerprint?.information_density,
    motivation_style: fingerprint?.motivation_style || [],
    feedback_frequency: fingerprint?.feedback_frequency,
  };
};

/**
 * Fingerprint management mutations
 */
export const useProjectFingerprintManager = (projectId?: Id<'projects'>, userId?: string) => {
  const createFingerprintMutation = useMutation(api.fingerprintMutations.createFingerprint);
  const updateFingerprintMutation = useMutation(api.fingerprintMutations.updateFingerprint);
  const deleteFingerprintMutation = useMutation(api.fingerprintMutations.deleteFingerprint);
  const linkProjectFingerprintMutation = useMutation(api.projectsMutations.linkFingerprint);
  const unlinkProjectFingerprintMutation = useMutation(api.projectsMutations.unlinkFingerprint);

  const { fingerprint, isLoading } = useProjectFingerprint(projectId);

  const createFingerprint = async (fingerprintData: any): Promise<boolean> => {
    if (!projectId || !userId) return false;

    try {
      const result = await createFingerprintMutation({
        projectId,
        userId,
        name: fingerprintData.name || '',
        description: fingerprintData.description,
        domain: fingerprintData.domain || '',
        complexity_level: fingerprintData.complexity_level || 1,
        collaboration_style: fingerprintData.collaboration_style || 'solo',
        time_horizon: fingerprintData.time_horizon || 'project',
        primary_pattern: fingerprintData.primary_pattern || 'iterative_creator',
        working_style: fingerprintData.working_style || [],
        decision_making: fingerprintData.decision_making || '',
        energy_patterns: fingerprintData.energy_patterns || '',
        core_intention: fingerprintData.core_intention || '',
        success_vision: fingerprintData.success_vision || '',
        value_creation: fingerprintData.value_creation || '',
        personal_growth: fingerprintData.personal_growth || [],
        natural_rhythm: fingerprintData.natural_rhythm || 'daily',
        key_phases: fingerprintData.key_phases || [],
        flexibility_preference: fingerprintData.flexibility_preference || 'adaptive',
        tangible_deliverables: fingerprintData.tangible_deliverables || [],
        intangible_benefits: fingerprintData.intangible_benefits || [],
        measurement_approach: fingerprintData.measurement_approach || '',
        sharing_intention: fingerprintData.sharing_intention || 'private',
        cognitive_load_preference: fingerprintData.cognitive_load_preference || 'rich',
        information_density: fingerprintData.information_density || 'contextual',
        motivation_style: fingerprintData.motivation_style || [],
        feedback_frequency: fingerprintData.feedback_frequency || 'weekly',
        learning_sensitivity: fingerprintData.learning_sensitivity || 5,
        change_triggers: fingerprintData.change_triggers || [],
        stability_zones: fingerprintData.stability_zones || [],
        growth_edges: fingerprintData.growth_edges || [],
        morning_persona: fingerprintData.morning_persona || { energy_match: '', focus_style: '', preparation_depth: '' },
        evening_persona: fingerprintData.evening_persona || { reflection_approach: '', consolidation_style: '', transition_support: '' },
        event_triggers: fingerprintData.event_triggers || [],
        base_personality: fingerprintData.base_personality || '',
        project_voice: fingerprintData.project_voice || '',
        question_generation_style: fingerprintData.question_generation_style || '',
        suggestion_approach: fingerprintData.suggestion_approach || '',
        clarification_method: fingerprintData.clarification_method || '',
        dynamic_dimensions: fingerprintData.dynamic_dimensions || [],
        user_constraints: fingerprintData.user_constraints || [],
        external_dependencies: fingerprintData.external_dependencies || [],
        support_systems: fingerprintData.support_systems || [],
        potential_obstacles: fingerprintData.potential_obstacles || [],
        status: fingerprintData.status || 'discovering'
      });

      if (result) {
        await linkProjectFingerprintMutation({
          projectId,
          userId,
          fingerprintId: result
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create fingerprint:', error);
      return false;
    }
  };

  const updateFingerprint = async (updates: Partial<Doc<'project_fingerprints'>>): Promise<boolean> => {
    if (!fingerprint) return false;

    try {
      await updateFingerprintMutation({
        fingerprintId: fingerprint._id,
        ...updates
      });
      return true;
    } catch (error) {
      console.error('Failed to update fingerprint:', error);
      return false;
    }
  };

  const deleteFingerprint = async (): Promise<boolean> => {
    if (!fingerprint || !projectId || !userId) return false;

    try {
      await unlinkProjectFingerprintMutation({
        projectId,
        userId
      });

      await deleteFingerprintMutation({
        fingerprintId: fingerprint._id
      });

      return true;
    } catch (error) {
      console.error('Failed to delete fingerprint:', error);
      return false;
    }
  };

  return {
    // Data (reactive from useQuery)
    fingerprint,
    isLoading,
    hasFingerprint: !!fingerprint,

    // Actions
    createFingerprint,
    updateFingerprint,
    deleteFingerprint,
  };
};
