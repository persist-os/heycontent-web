/**
 * Save Utils
 * 
 * Simple validation and helper utilities for saving notes.
 * Components use these then call store actions directly.
 */

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate content before saving
 */
export function validateContent(content: string): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for maximum content size (100KB)
  if (content.length > 100000) {
    errors.push('Note is too large (max 100KB)')
  }

  // Check for minimum content
  if (content.trim().length === 0) {
    warnings.push('Note is empty')
  }

  // Check for potential issues
  if (content.includes('undefined') || content.includes('null')) {
    warnings.push('Note contains "undefined" or "null" text')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Check if content has meaningful changes
 */
export function hasSignificantChanges(
  oldContent: string,
  newContent: string,
  minChangeThreshold = 5
): boolean {
  const oldTrimmed = oldContent.trim()
  const newTrimmed = newContent.trim()

  if (oldTrimmed === newTrimmed) {
    return false
  }

  const changeSize = Math.abs(newTrimmed.length - oldTrimmed.length)
  return changeSize >= minChangeThreshold
}

// =============================================================================
// STATUS HELPERS
// =============================================================================

/**
 * Generate save status message
 */
export function getSaveStatusMessage(
  isDirty: boolean,
  isSaving: boolean,
  lastSaved?: number,
  error?: string
): string {
  if (error) return `Save failed: ${error}`
  if (isSaving) return 'Saving...'
  if (isDirty) return 'Unsaved changes'
  if (lastSaved) return `Saved at ${new Date(lastSaved).toLocaleTimeString()}`
  return 'No changes'
}