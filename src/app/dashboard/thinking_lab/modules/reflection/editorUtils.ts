/**
 * Editor Utils
 * 
 * Simple utilities for keyboard shortcuts and text formatting.
 * Components use these then call store actions directly.
 */

import type { ReflectionActions } from '../../types'

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

/**
 * Handle keyboard shortcuts for the editor
 * Returns true if shortcut was handled
 */
export function handleKeyboardShortcut(
  event: KeyboardEvent,
  reflectionActions: ReflectionActions
): boolean {
  const { ctrlKey, metaKey, key } = event
  const modKey = ctrlKey || metaKey
  
  if (!modKey) return false
  
  switch (key.toLowerCase()) {
    case 'k':
      // CMD+K for command palette - component handles this
      event.preventDefault()
      return true
      
    case 's':
      // CMD+S for save
      event.preventDefault()
      reflectionActions.saveNote()
      return true
      
    default:
      return false
  }
}

// =============================================================================
// TEXT FORMATTING
// =============================================================================

/**
 * Wrap selected text with markdown formatting
 */
export function wrapText(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string = prefix
): string {
  const before = content.substring(0, selectionStart)
  const selected = content.substring(selectionStart, selectionEnd)
  const after = content.substring(selectionEnd)
  
  return before + prefix + selected + suffix + after
}

/**
 * Make selected text bold
 */
export function makeBold(
  content: string,
  selectionStart: number,
  selectionEnd: number
): string {
  return wrapText(content, selectionStart, selectionEnd, '**')
}

/**
 * Make selected text italic
 */
export function makeItalic(
  content: string,
  selectionStart: number,
  selectionEnd: number
): string {
  return wrapText(content, selectionStart, selectionEnd, '*')
}

/**
 * Make selected text code
 */
export function makeCode(
  content: string,
  selectionStart: number,
  selectionEnd: number
): string {
  return wrapText(content, selectionStart, selectionEnd, '`')
}

// =============================================================================
// TEXT UTILITIES
// =============================================================================

/**
 * Insert text at cursor position
 */
export function insertText(
  content: string,
  position: number,
  text: string
): string {
  const before = content.substring(0, position)
  const after = content.substring(position)
  return before + text + after
}
