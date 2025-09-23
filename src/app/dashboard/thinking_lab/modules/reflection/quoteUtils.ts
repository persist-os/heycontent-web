/**
 * Quote Utils
 * 
 * Simple utilities for text selection and quote formatting.
 * Components use these helpers then call store actions directly.
 */

import type { Message, ReflectionActions } from '../../types'

// =============================================================================
// TEXT SELECTION
// =============================================================================

/**
 * Extract text selection from a message element
 */
export function getSelectedText(messageElement: HTMLElement): string | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return null
  }

  const selectedText = selection.toString().trim()
  return selectedText || null
}

/**
 * Clear current text selection
 */
export function clearSelection(): void {
  const selection = window.getSelection()
  if (selection) {
    selection.removeAllRanges()
  }
}

// =============================================================================
// QUOTE FORMATTING
// =============================================================================

/**
 * Format text as a blockquote with source attribution
 */
export function formatQuote(text: string, source: string): string {
  const quotedLines = text
    .split('\n')
    .map(line => `> ${line}`)
    .join('\n')

  return `\n\n${quotedLines}\n> \n> — *${source}*\n\n`
}

/**
 * Create source attribution for a message
 */
export function createSource(message: Message): string {
  const role = message.role === 'user' ? 'You' : 'Context'
  const time = new Date(message.timestamp).toLocaleTimeString()
  return `${role} at ${time}`
}

// =============================================================================
// INTEGRATION HELPERS
// =============================================================================

/**
 * Quote selected text to reflection notepad
 */
export function quoteSelection(
  messageElement: HTMLElement,
  message: Message,
  reflectionActions: ReflectionActions
): boolean {
  const selectedText = getSelectedText(messageElement)
  if (!selectedText) {
    return false
  }

  const source = createSource(message)
  const formattedQuote = formatQuote(selectedText, source)
  
  // Use existing store method
  reflectionActions.insertQuote(formattedQuote, source)
  clearSelection()
  
  return true
}

/**
 * Quote entire message to reflection notepad
 */
export function quoteMessage(
  message: Message,
  reflectionActions: ReflectionActions
): void {
  const source = createSource(message)
  const formattedQuote = formatQuote(message.content, source)
  
  // Use existing store method
  reflectionActions.insertQuote(formattedQuote, source)
}