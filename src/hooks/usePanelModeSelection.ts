/**
 * PANEL MODE SELECTION HOOK
 * 
 * State management hook for panel mode selection.
 * Handles mode selection via URL state (source of truth).
 * 
 * PATTERN COMPLIANCE:
 * - Pure logic, no UI
 * - React hooks best practices
 * - URL synchronization via router.replace (no history spam)
 * - Follows useArtifactVersionSelection.ts pattern
 * 
 * LAW VI: This is the new Gold Standard for panel mode selection.
 * Can be reused for any panel/mode selection (notepad, artifacts, widgets).
 */

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export function usePanelModeSelection(
  defaultMode: 'notepad' | 'artifacts' | 'widgets' = 'notepad'
) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  // Read mode from URL (source of truth)
  const urlMode = searchParams.get('panel')
  const panelMode = (urlMode === 'artifacts' || urlMode === 'widgets' || urlMode === 'notepad')
    ? urlMode
    : defaultMode
  
  // Update URL when mode changes (never sync with localStorage)
  const setPanelMode = useCallback((mode: 'notepad' | 'artifacts' | 'widgets') => {
    const params = new URLSearchParams(searchParams.toString())
    if (mode === defaultMode) {
      params.delete('panel') // Remove param if viewing default
    } else {
      params.set('panel', mode)
    }
    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [router, searchParams, pathname, defaultMode])
  
  return { panelMode, setPanelMode }
}

