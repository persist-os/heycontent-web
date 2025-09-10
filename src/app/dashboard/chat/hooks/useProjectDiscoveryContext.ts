import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useProjectFingerprintStore } from '@/store/project-fingerprint-store'
import { ProjectFingerprint } from '../types'

interface UseProjectDiscoveryContextResult {
  // Current project state
  projectId: string | null
  fingerprintId: string | null
  currentFingerprint: ProjectFingerprint | null

  // Loading and initialization
  isInitializing: boolean
  isLoading: boolean
  error: string | null

  // Actions
  initializeProjectDiscovery: () => Promise<void>
  updateFingerprint: (updates: Partial<ProjectFingerprint>) => Promise<void>
  finalizeFingerprint: () => Promise<void>
  resetDiscovery: () => Promise<void>

  // Discovery progress
  discoveryProgress: {
    hasBasicInfo: boolean
    hasGoals: boolean
    hasTimeline: boolean
    hasOutputs: boolean
    hasUI: boolean
    isComplete: boolean
  }
}

export const useProjectDiscoveryContext = (
  projectId?: string,
  fingerprintId?: string
): UseProjectDiscoveryContextResult => {
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Store integration
  const fingerprintStore = useProjectFingerprintStore()

  // Convex queries
  const project = useQuery(
    api.projects.getById,
    projectId ? { projectId } : 'skip'
  )

  const fingerprint = useQuery(
    api.project_fingerprints.getById,
    fingerprintId ? { fingerprintId } : 'skip'
  )

  // Convex mutations
  const createProject = useMutation(api.projects.create)
  const createFingerprint = useMutation(api.project_fingerprints.create)
  const updateFingerprintMutation = useMutation(api.project_fingerprints.update)

  // Current state
  const currentFingerprint = fingerprintStore.currentFingerprint

  // Initialize project discovery
  const initializeProjectDiscovery = useCallback(async () => {
    if (!projectId) return

    try {
      setIsInitializing(true)
      setError(null)

      // Check if project exists
      if (!project) {
        // Create new project if it doesn't exist
        await createProject({
          name: 'New Project',
          description: 'Project discovery in progress',
          userId: fingerprintStore.userId || '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      }

      // Check if fingerprint exists
      if (!currentFingerprint && !fingerprintId) {
        // Create initial fingerprint
        const newFingerprintId = await createFingerprint({
          projectId,
          userId: fingerprintStore.userId || '',
          name: 'Project Fingerprint',
          description: 'AI-generated project intelligence',
          domain: '',
          complexity_level: 1,
          collaboration_style: 'solo',
          time_horizon: 'project',
          primary_pattern: 'iterative_creator',
          working_style: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          // Initialize all fields as empty
          goals: {
            primary: '',
            secondary: [],
            success_metrics: [],
            completion_criteria: []
          },
          timeline: {
            start_date: Date.now(),
            target_completion: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
            milestones: [],
            urgency_level: 'medium'
          },
          desired_outputs: {
            content_types: [],
            formats: [],
            platforms: [],
            quality_standards: []
          },
          ui_priorities: {
            must_have: [],
            nice_to_have: [],
            constraints: []
          },
          technical_requirements: {
            tools_needed: [],
            skills_required: [],
            integrations_required: []
          },
          risk_factors: [],
          success_indicators: [],
          evolution_triggers: {
            time_based: [],
            event_based: [],
            metric_based: []
          },
          ai_generated_insights: [],
          last_evolution_at: Date.now(),
          evolution_count: 0
        })

        // Load the new fingerprint into store
        fingerprintStore.setCurrentFingerprintId(newFingerprintId)
      } else if (fingerprintId && !currentFingerprint) {
        // Load existing fingerprint
        fingerprintStore.setCurrentFingerprintId(fingerprintId)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize project discovery')
      console.error('Project discovery initialization error:', err)
    } finally {
      setIsInitializing(false)
    }
  }, [projectId, project, currentFingerprint, fingerprintId, createProject, createFingerprint, fingerprintStore])

  // Update fingerprint
  const updateFingerprint = useCallback(async (updates: Partial<ProjectFingerprint>) => {
    if (!currentFingerprint?._id) return

    try {
      await updateFingerprintMutation({
        fingerprintId: currentFingerprint._id,
        updates: {
          ...updates,
          updatedAt: Date.now()
        }
      })

      // Update local store
      fingerprintStore.updateFingerprint(currentFingerprint._id, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update fingerprint')
      console.error('Fingerprint update error:', err)
    }
  }, [currentFingerprint, updateFingerprintMutation, fingerprintStore])

  // Finalize fingerprint
  const finalizeFingerprint = useCallback(async () => {
    if (!currentFingerprint?._id) return

    try {
      await updateFingerprint({
        // Mark as finalized/complete
        evolution_count: (currentFingerprint.evolution_count || 0) + 1,
        last_evolution_at: Date.now()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize fingerprint')
      console.error('Fingerprint finalization error:', err)
    }
  }, [currentFingerprint, updateFingerprint])

  // Reset discovery
  const resetDiscovery = useCallback(async () => {
    try {
      fingerprintStore.clearCurrentFingerprint()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset discovery')
      console.error('Discovery reset error:', err)
    }
  }, [fingerprintStore])

  // Discovery progress calculation
  const discoveryProgress = useMemo(() => {
    if (!currentFingerprint) {
      return {
        hasBasicInfo: false,
        hasGoals: false,
        hasTimeline: false,
        hasOutputs: false,
        hasUI: false,
        isComplete: false
      }
    }

    const hasBasicInfo = !!(
      currentFingerprint.name &&
      currentFingerprint.description &&
      currentFingerprint.domain
    )

    const hasGoals = !!(
      currentFingerprint.goals?.primary ||
      (currentFingerprint.goals?.secondary && currentFingerprint.goals.secondary.length > 0)
    )

    const hasTimeline = !!(
      currentFingerprint.timeline?.target_completion &&
      (currentFingerprint.timeline?.milestones && currentFingerprint.timeline.milestones.length > 0)
    )

    const hasOutputs = !!(
      currentFingerprint.desired_outputs?.content_types &&
      currentFingerprint.desired_outputs.content_types.length > 0
    )

    const hasUI = !!(
      currentFingerprint.ui_priorities?.must_have &&
      currentFingerprint.ui_priorities.must_have.length > 0
    )

    const isComplete = hasBasicInfo && hasGoals && hasTimeline && hasOutputs && hasUI

    return {
      hasBasicInfo,
      hasGoals,
      hasTimeline,
      hasOutputs,
      hasUI,
      isComplete
    }
  }, [currentFingerprint])

  // Loading state
  const isLoading = fingerprintStore.isLoading || !!project === false || !!fingerprint === false

  return {
    projectId,
    fingerprintId: currentFingerprint?._id || fingerprintId || null,
    currentFingerprint,

    isInitializing,
    isLoading,
    error,

    initializeProjectDiscovery,
    updateFingerprint,
    finalizeFingerprint,
    resetDiscovery,

    discoveryProgress
  }
}
