'use client'

/**
 * Discovery State Management Hook
 * 
 * Custom React hook for managing core discovery state including
 * confidence, field completion, suggestions, and error states.
 * Centralizes state management logic for the project discovery system.
 * 
 * Used by: Main container component, progress display components
 */

import { useCallback, useState } from 'react'
import type { DiscoveryState, ProgressData } from '../../types/discoveryTypes'

export function useDiscoveryState() {
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>({
    confidence: 0.0,
    field_based_confidence: 0.0,
    completed_fields: 0,
    partial_fields: 0,
    empty_fields: 0,
    total_fields: 132,
    completion_percentage: 0.0,
    next_priority_field: null,
    missing_fields: [],
    is_complete: false,
    can_generate_fingerprint: true,
  })

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [fingerprint, setFingerprint] = useState<any>(null)
  const [error, setErrorState] = useState<string | null>(null)

  /** Update progress metrics on discovery state */
  const updateProgress = useCallback((data: ProgressData): void => {
    setDiscoveryState(prev => ({
      ...prev,
      completed_fields: data.completed,
      partial_fields: data.partial,
      empty_fields: data.empty,
      total_fields: data.total,
      completion_percentage: data.percentage,
    }))
  }, [])

  /** Replace suggestion list for guided questions */
  const updateSuggestions = useCallback((next: string[]): void => {
    setSuggestions(Array.isArray(next) ? next : [])
  }, [])

  /** Mark discovery as complete and store resulting fingerprint */
  const setComplete = useCallback((fp: any): void => {
    setIsComplete(true)
    setFingerprint(fp)
    setDiscoveryState(prev => ({ ...prev, is_complete: true }))
  }, [])

  /** Set error message for UI surfaces */
  const setError = useCallback((msg: string): void => {
    setErrorState(msg)
  }, [])

  return {
    discoveryState,
    suggestions,
    isComplete,
    fingerprint,
    error,
    updateProgress,
    updateSuggestions,
    setComplete,
    setError,
    setDiscoveryState, // escape hatch for advanced updates
  }
}


