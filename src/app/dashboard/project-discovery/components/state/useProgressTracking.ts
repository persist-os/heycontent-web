/**
 * Progress Tracking Hook
 * 
 * Custom React hook for managing progress tracking and field completion
 * in the project discovery system. Handles field completion updates,
 * progress calculations, and missing field identification.
 * 
 * Used by: Progress display components, progress calculation utilities
 */

import { useCallback, useMemo, useState } from 'react'
import { ProgressMetrics } from '../types/progressTypes'
import { calculateCompletionPercentage, identifyMissingFields, calculateConfidence, getNextPriorityField } from '../utils/progressCalculator'

/**
 * useProgressTracking
 *
 * @param allFields - Ordered list of all fingerprint fields used for progress
 * @returns helpers and state for tracking and deriving progress metrics
 */
export function useProgressTracking(allFields: Array<string>) {
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set())

  const fieldData = useMemo(() => allFields.map((f) => ({ fieldName: f, status: completedFields.has(f) ? 'complete' : 'empty', confidence: completedFields.has(f) ? 1 : 0, lastUpdated: '' })), [allFields, completedFields])

  const progress: ProgressMetrics = useMemo(() => {
    const completed = completedFields.size
    const total = allFields.length
    const completionPercentage = calculateCompletionPercentage(completed, total)
    const fieldBasedConfidence = calculateConfidence(fieldData)
    return { completionPercentage, fieldBasedConfidence, traditionalConfidence: completionPercentage, completedFields: completed, partialFields: 0, emptyFields: total - completed, totalFields: total }
  }, [allFields.length, completedFields.size, fieldData])

  /** Update a field's completion state */
  const updateFieldCompletion = useCallback((field: string, completed: boolean): void => {
    setCompletedFields((prev) => {
      const next = new Set(prev)
      if (completed) next.add(field); else next.delete(field)
      return next
    })
  }, [])

  /** Compute and return latest progress metrics */
  const calculateProgress = useCallback((): ProgressMetrics => progress, [progress])

  /** Get list of missing (incomplete) fields */
  const getMissingFields = useCallback((): string[] => identifyMissingFields(Array.from(completedFields), allFields), [completedFields, allFields])

  /** Get next priority field to work on */
  const getNextPriority = useCallback((): string | null => getNextPriorityField(getMissingFields()), [getMissingFields])

  return { progress, updateFieldCompletion, calculateProgress, getMissingFields, getNextPriority }
}

export default useProgressTracking


