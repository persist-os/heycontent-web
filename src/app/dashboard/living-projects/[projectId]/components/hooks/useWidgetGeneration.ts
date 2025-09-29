/**
 * WIDGET GENERATION HOOK
 * 
 * Handles automatic and manual widget generation for projects
 * with proper state management and error handling.
 */

import { useState, useEffect } from 'react'
import { fetchWithApiKey } from '@/app/lib/api-helpers'
import { AuthenticationError, APIError } from '@/app/lib/errors'

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
  const [generationAttempted, setGenerationAttempted] = useState(false)

  // Auto-generate widgets if project doesn't have any
  useEffect(() => {
    const autoGenerateWidgets = async () => {
      if (
        currentFingerprint && 
        !hasWidgets && 
        !isGenerating &&
        !generationAttempted
      ) {
        console.log('[AUTO-GENERATE] Starting automatic widget generation')
        setIsGenerating(true)
        setGenerationAttempted(true)
        
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
            console.log('[AUTO-GENERATE] Widgets generated successfully')
          } else {
            console.error('[AUTO-GENERATE] Failed to generate widgets')
            if (response.status !== 401 && response.status !== 403) {
              setGenerationAttempted(false)
            }
          }
        } catch (error) {
          console.error('[AUTO-GENERATE] Error generating widgets:', error)
          if (!(error instanceof AuthenticationError)) {
            setGenerationAttempted(false)
          }
        } finally {
          setIsGenerating(false)
        }
      }
    }

    autoGenerateWidgets()
  }, [currentFingerprint, hasWidgets, isGenerating, generationAttempted, projectId])

  const regenerateWidgets = async () => {
    if (!currentFingerprint) return
    
    setIsGenerating(true)
    setGenerationAttempted(false)
    
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
        console.log('Widgets regeneration triggered successfully')
      } else {
        console.error('Failed to regenerate widgets')
      }
    } catch (error) {
      console.error('Error regenerating widgets:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    isGenerating,
    regenerateWidgets
  }
}
