/**
 * useProjectExecution Hook
 * 
 * Centralized state management for project execution flow.
 * Follows existing hook patterns from useWidgetGeneration.ts
 * 
 * NOTE: userId is NOT managed here - it's handled automatically by auth system
 */

import { useState, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { 
  generateExecutionPlan as generatePlanAPI,
  executePlan as executePlanAPI,
  ExecutionPlan,
  ExecutionStep,
  GeneratePlanParams,
  ExecutePlanParams
} from '@/app/lib/services/projectExecutionService'

export function useProjectExecution(projectId?: string) {
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<ExecutionPlan | null>(null)
  const [executionJobId, setExecutionJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Subscribe to execution progress (real-time updates via Convex)
  const executionProgress = useQuery(
    api.executionPlanQueries.getLatestPlanForProject,
    projectId ? { projectId } : 'skip'
  )

  /**
   * Generate execution plan
   */
  const generatePlan = useCallback(async (params: GeneratePlanParams) => {
    try {
      setIsGeneratingPlan(true)
      setError(null)

      const result = await generatePlanAPI(params)

      if (!result.success || !result.plan) {
        throw new Error(result.error || 'Failed to generate plan')
      }

      setCurrentPlan(result.plan)
      return result.plan

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsGeneratingPlan(false)
    }
  }, [])

  /**
   * Execute plan
   */
  const executePlan = useCallback(async (params: ExecutePlanParams) => {
    try {
      setIsExecuting(true)
      setError(null)

      const result = await executePlanAPI(params)

      if (!result.success || !result.jobId) {
        throw new Error(result.error || 'Failed to execute plan')
      }

      setExecutionJobId(result.jobId)
      return result.jobId

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsExecuting(false)
    }
  }, [])

  /**
   * Modify plan (update current plan state)
   */
  const modifyPlan = useCallback((modifiedSteps: ExecutionStep[]) => {
    if (!currentPlan) return

    setCurrentPlan({
      ...currentPlan,
      steps: modifiedSteps
    })
  }, [currentPlan])

  /**
   * Clear current plan
   */
  const clearPlan = useCallback(() => {
    setCurrentPlan(null)
    setExecutionJobId(null)
    setError(null)
  }, [])

  return {
    // State
    isGeneratingPlan,
    isExecuting,
    currentPlan,
    executionJobId,
    executionProgress, // Real-time progress from Convex
    error,

    // Actions
    generatePlan,
    executePlan,
    modifyPlan,
    clearPlan
  }
}

