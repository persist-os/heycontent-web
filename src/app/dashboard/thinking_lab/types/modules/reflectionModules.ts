/**
 * Reflection Module Types
 * 
 * Type definitions for all reflection-related modules:
 * - Quote Manager
 * - Save Manager  
 * - Editor Handlers
 */

import type { Message } from '../store/labStore'
import type { ReflectionActions } from '../core/labCore'

// =============================================================================
// QUOTE MANAGER TYPES
// =============================================================================

export interface QuoteOptions {
  includeTimestamp?: boolean
  includeMessageId?: boolean
  customPrefix?: string
  formatAsBlockquote?: boolean
}

export interface QuoteResult {
  formattedQuote: string
  insertPosition?: 'end' | 'cursor' | 'start'
  metadata: {
    messageId: string
    timestamp: number
    sourceRole: 'user' | 'assistant'
    originalText: string
  }
}

export interface MessageTextSelection {
  text: string
  startOffset: number
  endOffset: number
  messageId: string
}

// =============================================================================
// SAVE MANAGER TYPES
// =============================================================================

export interface SaveConfig {
  autoSaveEnabled: boolean
  autoSaveDelayMs: number
  maxRetries: number
  retryDelayMs: number
}

export interface SaveResult {
  success: boolean
  error?: string
  timestamp: number
  isAutoSave: boolean
}

export interface SaveState {
  isDirty: boolean
  isSaving: boolean
  lastSaved?: number
  lastError?: string
  autoSaveEnabled: boolean
}

// =============================================================================
// EDITOR HANDLER TYPES
// =============================================================================

export interface EditorState {
  content: string
  cursorPosition: number
  selectionStart: number
  selectionEnd: number
  hasSelection: boolean
}

export interface CommandPaletteOptions {
  placeholder?: string
  allowMultiline?: boolean
  showSuggestions?: boolean
}

export interface FormatCommand {
  id: string
  name: string
  description: string
  shortcut?: string
  apply: (content: string, selection: EditorTextSelection) => string
}

export interface EditorTextSelection {
  start: number
  end: number
  text: string
}

export interface CursorOperation {
  type: 'insert' | 'replace' | 'delete'
  position: number
  content?: string
  length?: number
}
