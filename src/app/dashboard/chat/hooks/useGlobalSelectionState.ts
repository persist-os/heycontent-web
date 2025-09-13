import React, { useState, useCallback } from 'react'

// Global state for tracking active text selections
let globalActiveSelections = new Set<string>()
let globalStateListeners = new Set<() => void>()

const notifyListeners = () => {
  globalStateListeners.forEach(listener => listener())
}

export const useGlobalSelectionState = () => {
  const [hasActiveSelection, setHasActiveSelection] = useState(globalActiveSelections.size > 0)

  // Subscribe to global state changes
  React.useEffect(() => {
    const listener = () => {
      setHasActiveSelection(globalActiveSelections.size > 0)
    }
    globalStateListeners.add(listener)
    return () => {
      globalStateListeners.delete(listener)
    }
  }, [])

  const addActiveSelection = useCallback((selectionId: string) => {
    globalActiveSelections.add(selectionId)
    notifyListeners()
  }, [])

  const removeActiveSelection = useCallback((selectionId: string) => {
    globalActiveSelections.delete(selectionId)
    notifyListeners()
  }, [])

  return {
    hasActiveSelection,
    addActiveSelection,
    removeActiveSelection,
    isScrollingSuppressed: hasActiveSelection
  }
}
