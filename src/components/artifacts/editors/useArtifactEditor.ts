/**
 * ARTIFACT EDITOR HOOK
 * 
 * Manages edit state and optimistic updates for artifacts.
 * Handles saving changes to Convex with rollback on failure.
 */

'use client'

import { useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

interface UseArtifactEditorProps {
  widgetId: string
  outputId: string
  artifactData: any
  onUpdate?: (data: any) => void
}

interface EditHistory {
  timestamp: number
  widgetId: string
  changes: string
}

export function useArtifactEditor({
  widgetId,
  outputId,
  artifactData,
  onUpdate
}: UseArtifactEditorProps) {
  const [localData, setLocalData] = useState(artifactData)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Convex mutation (will be implemented when backend is ready)
  // const updateArtifact = useMutation(api.widgetOutputsMutations.updateArtifactData)

  /**
   * Update a field in the artifact data
   * Uses optimistic updates for immediate UI feedback
   */
  const updateField = useCallback(async (
    path: string,
    value: any
  ) => {
    // Store previous state for rollback
    const previousData = localData

    try {
      // Optimistic update
      const newData = updateNestedValue(localData, path, value)
      setLocalData(newData)
      
      if (onUpdate) {
        onUpdate(newData)
      }

      // TODO: Save to Convex when backend is ready
      // setIsSaving(true)
      // await updateArtifact({
      //   outputId,
      //   artifactData: newData,
      //   widgetId
      // })
      // setIsSaving(false)

      setError(null)
      return true
    } catch (err) {
      // Rollback on failure
      setLocalData(previousData)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      setIsSaving(false)
      return false
    }
  }, [localData, outputId, widgetId, onUpdate])

  /**
   * Update an array item
   */
  const updateArrayItem = useCallback(async (
    arrayPath: string,
    index: number,
    updates: Record<string, any>
  ) => {
    const previousData = localData

    try {
      const newData = { ...localData }
      const array = getNestedValue(newData, arrayPath)
      
      if (Array.isArray(array) && array[index]) {
        array[index] = { ...array[index], ...updates }
        setLocalData(newData)
        
        if (onUpdate) {
          onUpdate(newData)
        }

        setError(null)
        return true
      }
      
      throw new Error('Invalid array path or index')
    } catch (err) {
      setLocalData(previousData)
      setError(err instanceof Error ? err.message : 'Failed to update item')
      return false
    }
  }, [localData, onUpdate])

  return {
    localData,
    updateField,
    updateArrayItem,
    isSaving,
    error,
    clearError: () => setError(null)
  }
}

/**
 * Helper: Update nested object value by path
 */
function updateNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.')
  const newObj = JSON.parse(JSON.stringify(obj)) // Deep clone
  
  let current = newObj
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]]
  }
  
  current[keys[keys.length - 1]] = value
  return newObj
}

/**
 * Helper: Get nested value by path
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[key]
  }
  
  return current
}

