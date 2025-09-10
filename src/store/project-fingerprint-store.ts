import React from 'react';
import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { ConvexReactClient, useMutation, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { ProjectFingerprint, FingerprintEvolutionHistory } from '@/app/dashboard/chat/types';

export interface ProjectFingerprintStoreState {
  // Data
  currentFingerprint: Doc<'project_fingerprints'> | null;
  fingerprintHistory: Doc<'fingerprint_evolution_history'>[];
  projectFingerprints: Doc<'project_fingerprints'>[];

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  lastFetchedUserId: string | null;
  lastFetchedProjectId: string | null;

  // Cache metadata
  cacheTimestamp: number;
  cacheValidDuration: number; // 5 minutes in milliseconds

  // Error state
  error: string | null;

  // Actions
  initializeFingerprintData: (projectId: string, userId: string, convex: ConvexReactClient) => Promise<void>;
  refreshFingerprintData: (projectId: string, userId: string, convex: ConvexReactClient) => Promise<void>;
  invalidateFingerprintData: () => void;
  setCurrentFingerprint: (fingerprint: Doc<'project_fingerprints'> | null) => void;
  addFingerprint: (fingerprint: Doc<'project_fingerprints'>) => void;
  updateFingerprint: (fingerprintId: Id<'project_fingerprints'>, updates: Partial<Doc<'project_fingerprints'>>) => void;
  removeFingerprint: (fingerprintId: Id<'project_fingerprints'>) => void;
  isCacheValid: () => boolean;

  // Evolution tracking
  addEvolutionEntry: (entry: Doc<'fingerprint_evolution_history'>) => void;
  getEvolutionHistory: (fingerprintId: string) => Doc<'fingerprint_evolution_history'>[];
}

export const useProjectFingerprintStore = create<ProjectFingerprintStoreState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      currentFingerprint: null,
      fingerprintHistory: [],
      projectFingerprints: [],
      isLoading: false,
      isInitialized: false,
      lastFetchedUserId: null,
      lastFetchedProjectId: null,
      cacheTimestamp: 0,
      cacheValidDuration: 5 * 60 * 1000, // 5 minutes
      error: null,

      // Check if cache is still valid
      isCacheValid: () => {
        const state = get();
        const now = Date.now();
        return state.cacheTimestamp > 0 && (now - state.cacheTimestamp) < state.cacheValidDuration;
      },

      // Initialize fingerprint data with aggressive caching
      initializeFingerprintData: async (projectId: string, userId: string, convex: ConvexReactClient) => {
        const state = get();
        const initStartTime = performance.now();

        // Initialize fingerprint data for project

        // Check if we have valid cached data for this project/user
        if (state.isInitialized &&
            state.lastFetchedProjectId === projectId &&
            state.lastFetchedUserId === userId &&
            state.isCacheValid() &&
            state.currentFingerprint) {
          return; // Use cached data
        }

        // Skip if already loading for this project/user
        if (state.isLoading && state.lastFetchedProjectId === projectId && state.lastFetchedUserId === userId) {
          return; // Already loading
        }

        set({ isLoading: true, error: null, lastFetchedProjectId: projectId, lastFetchedUserId: userId });

        try {

          // Get the project to see if it has a fingerprint
          const project = await convex.query(api.projectsQueries.getProjectById, { projectId: projectId as Id<"projects"> });
          let fingerprint = null;
          let fingerprintHistory = [];

          if (project?.fingerprintId) {
            // Get the fingerprint data
            fingerprint = await convex.query(api.fingerprintQueries.getFingerprintById, {
              fingerprintId: project.fingerprintId
            });

            // Get evolution history
            fingerprintHistory = await convex.query(api.fingerprintEvolutionQueries.getFingerprintEvolutionHistory, {
              fingerprintId: project.fingerprintId
            });
          }


          set({
            currentFingerprint: fingerprint,
            fingerprintHistory: fingerprintHistory,
            isLoading: false,
            isInitialized: true,
            cacheTimestamp: Date.now(),
            error: null
          });

        } catch (error) {
          console.error('Failed to initialize fingerprint data:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load fingerprint data',
            currentFingerprint: null,
            fingerprintHistory: []
          });
        }
      },

      // Refresh fingerprint data (force refetch)
      refreshFingerprintData: async (projectId: string, userId: string, convex: ConvexReactClient) => {

        // Force clear cache first for true refresh
        set({
          isLoading: true,
          error: null,
          lastFetchedProjectId: projectId,
          lastFetchedUserId: userId,
          cacheTimestamp: 0 // Invalidate cache immediately
        });

        try {

          // Get the project to see if it has a fingerprint
          const project = await convex.query(api.projectsQueries.getProjectById, { projectId: projectId as Id<"projects"> });
          let fingerprint = null;
          let fingerprintHistory = [];

          if (project?.fingerprintId) {
            // Get the fingerprint data
            fingerprint = await convex.query(api.fingerprintQueries.getFingerprintById, {
              fingerprintId: project.fingerprintId
            });

            // Get evolution history
            fingerprintHistory = await convex.query(api.fingerprintEvolutionQueries.getFingerprintEvolutionHistory, {
              fingerprintId: project.fingerprintId
            });
          }


          set({
            currentFingerprint: fingerprint,
            fingerprintHistory: fingerprintHistory,
            isLoading: false,
            isInitialized: true,
            cacheTimestamp: Date.now(), // Set fresh cache timestamp
            error: null
          });


        } catch (error) {
          console.error('Failed to refresh fingerprint data:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to refresh fingerprint data'
          });
        }
      },

      // Invalidate data (force next fetch)
      invalidateFingerprintData: () => {
        set({
          isInitialized: false,
          lastFetchedProjectId: null,
          lastFetchedUserId: null,
          cacheTimestamp: 0,
          currentFingerprint: null,
          fingerprintHistory: [],
          projectFingerprints: [],
          error: null,
          isLoading: false
        });
      },

      // Set current fingerprint
      setCurrentFingerprint: (fingerprint: Doc<'project_fingerprints'> | null) => {
        set({ currentFingerprint: fingerprint });
      },

      // Add new fingerprint to store
      addFingerprint: (fingerprint: Doc<'project_fingerprints'>) => {
        const state = get();
        const updatedFingerprints = [fingerprint, ...state.projectFingerprints];
        set({
          currentFingerprint: fingerprint,
          projectFingerprints: updatedFingerprints,
          cacheTimestamp: Date.now()
        });
      },

      // Update existing fingerprint in store
      updateFingerprint: (fingerprintId: Id<'project_fingerprints'>, updates: Partial<Doc<'project_fingerprints'>>) => {
        const state = get();

        const updateFingerprintInArray = (fingerprints: Doc<'project_fingerprints'>[]) =>
          fingerprints.map(fp => fp._id === fingerprintId ? { ...fp, ...updates } : fp);

        const updatedFingerprints = updateFingerprintInArray(state.projectFingerprints);

        // Update current fingerprint if it's the one being updated
        const updatedCurrentFingerprint = state.currentFingerprint?._id === fingerprintId
          ? { ...state.currentFingerprint, ...updates }
          : state.currentFingerprint;

        set({
          projectFingerprints: updatedFingerprints,
          currentFingerprint: updatedCurrentFingerprint,
          cacheTimestamp: Date.now()
        });
      },

      // Remove fingerprint from store
      removeFingerprint: (fingerprintId: Id<'project_fingerprints'>) => {
        const state = get();

        const filteredFingerprints = state.projectFingerprints.filter(fp => fp._id !== fingerprintId);
        const updatedCurrentFingerprint = state.currentFingerprint?._id === fingerprintId
          ? null
          : state.currentFingerprint;

        const filteredHistory = state.fingerprintHistory.filter(h => h.fingerprintId !== fingerprintId);

        set({
          projectFingerprints: filteredFingerprints,
          currentFingerprint: updatedCurrentFingerprint,
          fingerprintHistory: filteredHistory,
          cacheTimestamp: Date.now()
        });
      },

      // Evolution tracking
      addEvolutionEntry: (entry: Doc<'fingerprint_evolution_history'>) => {
        const state = get();
        set({
          fingerprintHistory: [entry, ...state.fingerprintHistory],
          cacheTimestamp: Date.now()
        });
      },

      // Get evolution history for specific fingerprint
      getEvolutionHistory: (fingerprintId: string) => {
        const state = get();
        return state.fingerprintHistory.filter(entry => entry.fingerprintId === fingerprintId);
      }
    })),
    {
      name: 'project-fingerprint-store-cache',
      partialize: (state) => ({
        currentFingerprint: state.currentFingerprint,
        fingerprintHistory: state.fingerprintHistory,
        projectFingerprints: state.projectFingerprints,
        isInitialized: state.isInitialized,
        lastFetchedProjectId: state.lastFetchedProjectId,
        lastFetchedUserId: state.lastFetchedUserId,
        cacheTimestamp: state.cacheTimestamp
      }),
    }
  )
);

// Selector hooks for common use cases
export const useProjectFingerprint = () => {
  const currentFingerprint = useProjectFingerprintStore(state => state.currentFingerprint);
  const isLoading = useProjectFingerprintStore(state => state.isLoading);
  const error = useProjectFingerprintStore(state => state.error);

  return {
    fingerprint: currentFingerprint,
    isLoading,
    isError: !!error,
    hasFingerprint: !!currentFingerprint,
    fingerprintId: currentFingerprint?._id,
    projectId: currentFingerprint?.projectId,
    userId: currentFingerprint?.userId,
    name: currentFingerprint?.name,
    description: currentFingerprint?.description,
    status: currentFingerprint?.status,
    domain: currentFingerprint?.domain,
    complexity_level: currentFingerprint?.complexity_level,
    core_intention: currentFingerprint?.core_intention,
    success_vision: currentFingerprint?.success_vision,
    last_evolution: currentFingerprint?.last_evolution,
    intelligence_version: currentFingerprint?.intelligence_version
  };
};

export const useFingerprintEvolution = () => {
  const fingerprintHistory = useProjectFingerprintStore(state => state.fingerprintHistory);
  const getEvolutionHistory = useProjectFingerprintStore(state => state.getEvolutionHistory);
  const addEvolutionEntry = useProjectFingerprintStore(state => state.addEvolutionEntry);
  const currentFingerprint = useProjectFingerprintStore(state => state.currentFingerprint);

  return {
    history: fingerprintHistory,
    currentHistory: currentFingerprint ? getEvolutionHistory(currentFingerprint._id) : [],
    addEvolutionEntry,
    hasHistory: fingerprintHistory.length > 0,
    evolutionCount: fingerprintHistory.length
  };
};

export const useFingerprintDisplay = () => {
  const fingerprint = useProjectFingerprintStore(state => state.currentFingerprint);

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
    feedback_frequency: fingerprint?.feedback_frequency
  };
};

// Optimized fingerprint manager hook that uses the centralized store
export const useProjectFingerprintManager = (projectId?: string, userId?: string) => {
  // Fingerprint manager hook

  const convex = useConvex();
  const createFingerprintMutation = useMutation(api.fingerprintMutations.createFingerprint);
  const updateFingerprintMutation = useMutation(api.fingerprintMutations.updateFingerprint);
  const deleteFingerprintMutation = useMutation(api.fingerprintMutations.deleteFingerprint);
  const updateProjectFingerprintMutation = useMutation(api.projectsMutations.updateProjectFingerprintId);

  // Get data from store (no additional queries)
  const currentFingerprint = useProjectFingerprintStore(state => state.currentFingerprint);
  const refreshFingerprintData = useProjectFingerprintStore(state => state.refreshFingerprintData);
  const updateFingerprintInStore = useProjectFingerprintStore(state => state.updateFingerprint);
  const addFingerprintToStore = useProjectFingerprintStore(state => state.addFingerprint);
  const removeFingerprintFromStore = useProjectFingerprintStore(state => state.removeFingerprint);
  const isLoading = useProjectFingerprintStore(state => state.isLoading);

  // Hook initialization complete

  const createFingerprint = async (fingerprintData: any): Promise<boolean> => {
    if (!projectId || !userId) return false;

    try {
      const result = await createFingerprintMutation({
        projectId: projectId as Id<"projects">,
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
        // Update the project to link to this fingerprint
        await updateProjectFingerprintMutation({
          projectId: projectId as Id<"projects">,
          fingerprintId: result
        });

        // Force refresh to get the new fingerprint immediately
        await refreshFingerprintData(projectId, userId, convex);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create fingerprint:', error);
      return false;
    }
  };

  const updateFingerprint = async (updates: Partial<Doc<'project_fingerprints'>>): Promise<boolean> => {
    if (!currentFingerprint || !projectId || !userId) return false;

    try {
      // Optimistically update store first
      updateFingerprintInStore(currentFingerprint._id, updates);

      // Update backend
      await updateFingerprintMutation({
        fingerprintId: currentFingerprint._id,
        ...updates
      });

      // Force refresh to ensure we have the latest data
      await refreshFingerprintData(projectId, userId, convex);

      return true;
    } catch (error) {
      // Revert on error by refreshing from server
      if (projectId && userId) {
        refreshFingerprintData(projectId, userId, convex);
      }
      return false;
    }
  };

  const deleteFingerprint = async (): Promise<boolean> => {
    if (!currentFingerprint || !projectId || !userId) return false;

    try {
      // Optimistically remove from store
      removeFingerprintFromStore(currentFingerprint._id);

      // Update project to remove fingerprint link
      await updateProjectFingerprintMutation({
        projectId: projectId as Id<"projects">,
        fingerprintId: null
      });

      // Delete the fingerprint
      await deleteFingerprintMutation({
        fingerprintId: currentFingerprint._id
      });

      // Force refresh to ensure we have the latest data
      await refreshFingerprintData(projectId, userId, convex);

      return true;
    } catch (error) {
      // Revert on error by refreshing from server
      if (projectId && userId) {
        refreshFingerprintData(projectId, userId, convex);
      }
      return false;
    }
  };

  return {
    // Data from store (no queries)
    currentFingerprint,
    isLoading,
    hasFingerprint: !!currentFingerprint,

    // Actions
    createFingerprint,
    updateFingerprint,
    deleteFingerprint,
  };
};
