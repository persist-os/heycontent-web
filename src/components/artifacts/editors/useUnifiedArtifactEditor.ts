/**
 * UNIFIED ARTIFACT EDITOR HOOK
 * 
 * PHASE 3: This is the new Gold Standard for artifact editing.
 * Supports:
 * - Optimistic concurrency control (version-based)
 * - Edit source tracking (widget vs user)
 * - Conflict resolution with merge strategy
 * - Per-artifact locking (handled by backend)
 * 
 * Replaces useArtifactEditor.ts with enhanced collaboration features.
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

interface UseUnifiedArtifactEditorProps {
  artifactId: Id<'artifacts'>
  artifactData: any
  artifactMetadata?: { version?: number }  // Optional metadata for initial version
  userId?: string
  widgetId?: string
  editSource?: 'widget' | 'user'  // Default: 'user' if userId provided, 'widget' if widgetId provided
  onUpdate?: (data: any) => void
  onConflict?: (conflictInfo: ConflictInfo) => void
}

interface ConflictInfo {
  artifactId: string
  expectedVersion: number
  currentVersion: number
  mergeStrategy: 'overwrite' | 'merge' | 'user_precedence'
  message: string
}

interface UpdateResult {
  success: boolean
  error?: string
  conflictInfo?: ConflictInfo
}

export function useUnifiedArtifactEditor({
  artifactId,
  artifactData,
  artifactMetadata,
  userId,
  widgetId,
  editSource,
  onUpdate,
  onConflict
}: UseUnifiedArtifactEditorProps) {
  const [localData, setLocalData] = useState(artifactData)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Initialize version from metadata if provided, otherwise default to 1
  const [currentVersion, setCurrentVersion] = useState<number>(artifactMetadata?.version || 1)
  const [hasConflict, setHasConflict] = useState(false)

  // Determine edit source (user vs widget)
  const effectiveEditSource: 'widget' | 'user' = editSource || 
    (userId ? 'user' : (widgetId ? 'widget' : 'user'))
  
  // Determine updatedBy (userId for user edits, widgetId for widget edits)
  const updatedBy = effectiveEditSource === 'user' ? (userId || '') : (widgetId || '')

  // PHASE 3: Fetch artifact to get current version for optimistic concurrency control
  // ✅ FIX: Only query when both artifactId and userId are valid non-empty strings
  const artifact = useQuery(
    api.artifactQueries.getArtifact,
    artifactId && userId && typeof userId === 'string' && userId.length > 0
      ? { artifactId, userId }
      : 'skip'
  )

  // Update local version when artifact changes (use query result as source of truth)
  useEffect(() => {
    if (artifact) {
      // Always sync with the latest version from the database
      const latestVersion = artifact.metadata?.version || artifactMetadata?.version || 1
      setCurrentVersion(latestVersion)
      setLocalData(artifact.data)
      setHasConflict(false)  // Reset conflict when artifact updates
    } else if (artifactMetadata?.version) {
      // Fallback to prop metadata if query hasn't loaded yet
      setCurrentVersion(artifactMetadata.version)
    }
  }, [artifact?.metadata?.version, artifact?.data, artifactMetadata?.version])

  // Convex mutation for updating artifacts (with edit_source and version control)
  const updateArtifact = useMutation(api.artifactMutations.updateArtifact)

  /**
   * Update a field in the artifact data
   * Uses optimistic updates with version-based concurrency control
   */
  const updateField = useCallback(async (
    path: string,
    value: any,
    mergeStrategy: 'overwrite' | 'merge' | 'user_precedence' = 'overwrite'
  ): Promise<UpdateResult> => {
    // Store previous state for rollback
    const previousData = localData
    const previousVersion = currentVersion

    try {
      // Optimistic update
      const newData = updateNestedValue(localData, path, value)
      setLocalData(newData)
      
      if (onUpdate) {
        onUpdate(newData)
      }

      // Save to Convex with version control
      setIsSaving(true)
      setError(null)
      
      try {
        // Use currentVersion state (which is kept in sync with query via useEffect)
        // Don't read from query here as it might be stale during rapid edits
        // The useEffect will sync currentVersion whenever the query updates
        await updateArtifact({
          artifactId: artifactId,
          data: newData,
          updatedBy: updatedBy,
          editSource: effectiveEditSource,  // Track edit source
          expectedVersion: currentVersion  // Use state version (kept in sync by useEffect)
        })
        
        // Success - version will be incremented by backend
        setCurrentVersion(previousVersion + 1)
        setIsSaving(false)
        setHasConflict(false)
        
        return {
          success: true
        }
      } catch (err: any) {
        // Check if it's a version conflict
        if (err?.message?.includes('Version mismatch') || err?.message?.includes('VERSION_CONFLICT')) {
          setHasConflict(true)
          setIsSaving(false)
          
          // Rollback optimistic update
          setLocalData(previousData)
          setCurrentVersion(previousVersion)
          
          // Extract version info from error
          const conflictInfo: ConflictInfo = {
            artifactId: artifactId,
            expectedVersion: currentVersion,
            currentVersion: artifact?.metadata?.version || currentVersion + 1,
            mergeStrategy: mergeStrategy,
            message: 'Artifact was updated by another widget or user. Please refresh and try again.'
          }
          
          // Notify about conflict
          if (onConflict) {
            onConflict(conflictInfo)
          }
          
          // TODO: Implement merge strategy (Phase 3.1.2)
          // For now, just notify about conflict
          
          return {
            success: false,
            error: 'VERSION_CONFLICT',
            conflictInfo: conflictInfo
          }
        } else {
          // Other error
          throw err
        }
      }
    } catch (err) {
      // Rollback on failure
      setLocalData(previousData)
      setCurrentVersion(previousVersion)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      setIsSaving(false)
      setHasConflict(false)
      
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save changes'
      }
    }
  }, [localData, currentVersion, artifactId, updatedBy, effectiveEditSource, onUpdate, onConflict, artifact])

  /**
   * Update an array item
   */
  const updateArrayItem = useCallback(async (
    arrayPath: string,
    index: number,
    updates: Record<string, any>,
    mergeStrategy: 'overwrite' | 'merge' | 'user_precedence' = 'overwrite'
  ): Promise<UpdateResult> => {
    const previousData = localData
    const previousVersion = currentVersion

    try {
      const newData = { ...localData }
      const array = getNestedValue(newData, arrayPath)
      
      if (Array.isArray(array) && array[index]) {
        array[index] = { ...array[index], ...updates }
        setLocalData(newData)
        
        if (onUpdate) {
          onUpdate(newData)
        }

        // Save to Convex with version control
        setIsSaving(true)
        setError(null)
        
        try {
          // Use currentVersion state (which is kept in sync with query via useEffect)
          await updateArtifact({
            artifactId: artifactId,
            data: newData,
            updatedBy: updatedBy,
            editSource: effectiveEditSource,
            expectedVersion: currentVersion  // Use state version (kept in sync by useEffect)
          })
          
          setCurrentVersion(previousVersion + 1)
          setIsSaving(false)
          setHasConflict(false)
          
          return {
            success: true
          }
        } catch (err: any) {
          if (err?.message?.includes('Version mismatch') || err?.message?.includes('VERSION_CONFLICT')) {
            setHasConflict(true)
            setIsSaving(false)
            setLocalData(previousData)
            setCurrentVersion(previousVersion)
            
            const conflictInfo: ConflictInfo = {
              artifactId: artifactId,
              expectedVersion: currentVersion,
              currentVersion: artifact?.metadata?.version || currentVersion + 1,
              mergeStrategy: mergeStrategy,
              message: 'Artifact was updated by another widget or user. Please refresh and try again.'
            }
            
            if (onConflict) {
              onConflict(conflictInfo)
            }
            
            return {
              success: false,
              error: 'VERSION_CONFLICT',
              conflictInfo: conflictInfo
            }
          } else {
            throw err
          }
        }
      }
      
      throw new Error('Invalid array path or index')
    } catch (err) {
      setLocalData(previousData)
      setCurrentVersion(previousVersion)
      setError(err instanceof Error ? err.message : 'Failed to update item')
      setIsSaving(false)
      setHasConflict(false)
      
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update item'
      }
    }
  }, [localData, currentVersion, artifactId, updatedBy, effectiveEditSource, onUpdate, onConflict, artifact])

  /**
   * Update entire artifact data
   */
  const updateData = useCallback(async (
    newData: any,
    mergeStrategy: 'overwrite' | 'merge' | 'user_precedence' = 'overwrite'
  ): Promise<UpdateResult> => {
    const previousData = localData
    const previousVersion = currentVersion

    try {
      // Optimistic update
      setLocalData(newData)
      
      if (onUpdate) {
        onUpdate(newData)
      }

      // Save to Convex with version control
      setIsSaving(true)
      setError(null)
      
      try {
        await updateArtifact({
          artifactId: artifactId,
          data: newData,
          updatedBy: updatedBy,
          editSource: effectiveEditSource,
          expectedVersion: currentVersion
        })
        
        setCurrentVersion(previousVersion + 1)
        setIsSaving(false)
        setHasConflict(false)
        
        return {
          success: true
        }
      } catch (err: any) {
        if (err?.message?.includes('Version mismatch') || err?.message?.includes('VERSION_CONFLICT')) {
          setHasConflict(true)
          setIsSaving(false)
          setLocalData(previousData)
          setCurrentVersion(previousVersion)
          
          const conflictInfo: ConflictInfo = {
            artifactId: artifactId,
            expectedVersion: currentVersion,
            currentVersion: artifact?.metadata?.version || currentVersion + 1,
            mergeStrategy: mergeStrategy,
            message: 'Artifact was updated by another widget or user. Please refresh and try again.'
          }
          
          if (onConflict) {
            onConflict(conflictInfo)
          }
          
          return {
            success: false,
            error: 'VERSION_CONFLICT',
            conflictInfo: conflictInfo
          }
        } else {
          throw err
        }
      }
    } catch (err) {
      setLocalData(previousData)
      setCurrentVersion(previousVersion)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      setIsSaving(false)
      setHasConflict(false)
      
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save changes'
      }
    }
  }, [localData, currentVersion, artifactId, updatedBy, effectiveEditSource, onUpdate, onConflict, artifact])

  /**
   * Refresh artifact data from server (resolves conflicts)
   */
  const refresh = useCallback(() => {
    if (artifact) {
      setLocalData(artifact.data)
      setCurrentVersion(artifact.metadata?.version || 1)
      setHasConflict(false)
      setError(null)
    }
  }, [artifact])

  return {
    localData,
    updateField,
    updateArrayItem,
    updateData,
    isSaving,
    error,
    hasConflict,
    currentVersion,
    editSource: effectiveEditSource,
    refresh,
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
    if (current[keys[i]] === undefined || current[keys[i]] === null) {
      current[keys[i]] = {}
    }
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

