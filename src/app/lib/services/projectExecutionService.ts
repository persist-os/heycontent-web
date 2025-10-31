/**
 * Project Execution Service
 * 
 * Minimal API client for execution plan generation and execution.
 * Follows existing service patterns from projectWidgetsService.ts
 * 
 * NOTE: userId is handled automatically by fetchWithApiKey() via auth header
 */

import { fetchWithApiKey } from '@/app/lib/api-helpers'

export interface ExecutionPlan {
  planId: string
  projectId: string
  steps: ExecutionStep[]
  totalEstimatedDurationMinutes: number
  cognitiveContext?: string
}

export interface ExecutionStep {
  widgetId: string
  widgetTitle: string  // Display title for the widget
  executionOrder: number  // Matches backend PlanStep model
  timing: string
  rationale: string
  expectedOutput: string
  dependencies?: string[]
  skipRecommended?: boolean
  skipReason?: string
}

export interface GeneratePlanParams {
  projectId: string
  projectName: string
  projectDomain: string
  saveToDb?: boolean
}

export interface ExecutePlanParams {
  projectId: string
  planId: string
  steps: ExecutionStep[]
  executeImmediately?: boolean
}

/**
 * Generate AI execution plan for project
 */
export async function generateExecutionPlan(
  params: GeneratePlanParams
): Promise<{ success: boolean; plan?: ExecutionPlan; error?: string }> {

  const response = await fetchWithApiKey('/api/execution-plans/generate', {
    method: 'POST',
    body: JSON.stringify({
      project_id: params.projectId,
      project_name: params.projectName,
      project_domain: params.projectDomain,
      save_to_db: params.saveToDb ?? true
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to generate plan: ${response.status}`)
  }

  return response.json()
}

/**
 * Trigger execution of a plan
 */
export async function executePlan(
  params: ExecutePlanParams
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const response = await fetchWithApiKey('/api/execution-plans/execute', {
    method: 'POST',
    body: JSON.stringify({
      project_id: params.projectId,
      plan_id: params.planId,
      steps: params.steps,
      execute_immediately: params.executeImmediately ?? true
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to execute plan: ${response.status}`)
  }

  return response.json()
}

