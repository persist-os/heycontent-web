/**
 * WIDGET GENERATION HOOK
 * 
 * Handles MANUAL widget generation for projects.
 * 
 * AUTO-GENERATION REMOVED: Widget generation now ONLY happens:
 * 1. Via "Spawn Widget" button (new manual spawning system)
 * 2. Via "Regenerate widgets" menu option (this hook)
 * 3. Via orchestrator post-actions (background intelligence)
 * 
 * NO auto-generation on page load!
 */

import { useState } from 'react'
import { fetchWithApiKey } from '@/app/lib/api-helpers'

interface UseWidgetGenerationOptions {
  projectId: string
  currentFingerprint: any
  hasWidgets: boolean
}

export function useWidgetGeneration({
  projectId,
  currentFingerprint,
  hasWidgets
}: UseWidgetGenerationOptions) {
  const [isGenerating, setIsGenerating] = useState(false)

  const regenerateWidgets = async () => {
    if (!currentFingerprint) return
    
    console.log('[MANUAL-REGENERATE] User triggered widget regeneration')
    setIsGenerating(true)
    
    try {
      const response = await fetchWithApiKey(`/api/projects/${projectId}/generate-widgets`, {
        method: 'POST',
        body: JSON.stringify({
          fingerprint_id: currentFingerprint._id,
          project_id: projectId,
          user_preferences: {}
        })
      })

      if (response.ok) {
        console.log('[MANUAL-REGENERATE] Widgets regeneration triggered successfully')
      } else {
        console.error('[MANUAL-REGENERATE] Failed to regenerate widgets')
      }
    } catch (error) {
      console.error('[MANUAL-REGENERATE] Error regenerating widgets:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    isGenerating,
    regenerateWidgets
  }
}
