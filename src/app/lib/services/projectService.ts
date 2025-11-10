/**
 * Project Service
 * 
 * API client for project operations (wake, status updates, etc.)
 * Follows Gold Standard pattern from projectExecutionService.ts
 * 
 * NOTE: userId is handled automatically by fetchWithApiKey() via auth header
 */

import { fetchWithApiKey } from '@/app/lib/api-helpers'

/**
 * Wake a sleeping project
 * Changes status from "sleeping" to "working" and triggers decision engine
 */
export async function wakeProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetchWithApiKey(`/api/projects/${projectId}/wake`, {
    method: 'POST'
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to wake project: ${response.status}`)
  }

  return response.json()
}

