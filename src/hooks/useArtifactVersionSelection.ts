/**
 * ARTIFACT VERSION SELECTION HOOK
 * 
 * State management hook for artifact version selection.
 * Handles version selection via URL state (source of truth).
 * 
 * PATTERN COMPLIANCE:
 * - Pure logic, no UI
 * - React hooks best practices
 * - URL synchronization via router.replace (no history spam)
 * - Follows useGalleryNavigation.ts pattern
 * 
 * LAW VI: This is the new Gold Standard for version selection.
 * Can be reused for any versioned content (artifacts, notes, widgets).
 */

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export function useArtifactVersionSelection(
  artifactId: string | null,
  currentVersion: number,
  defaultVersion?: number
) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  // Read version from URL (source of truth)
  const urlVersion = searchParams.get('version')
  const selectedVersion = urlVersion 
    ? parseInt(urlVersion, 10) 
    : (defaultVersion ?? currentVersion)
  
  // Update URL when version changes (never sync with props)
  const selectVersion = useCallback((version: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (version === currentVersion) {
      params.delete('version') // Remove param if viewing current
    } else {
      params.set('version', version.toString())
    }
    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [router, searchParams, pathname, currentVersion])
  
  return { selectedVersion, selectVersion }
}

