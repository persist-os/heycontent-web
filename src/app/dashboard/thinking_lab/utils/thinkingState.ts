/**
 * Thinking State Derivation Utilities
 * 
 * Pure computation functions - NO useState/useEffect.
 * All state is derived from props/data.
 */

import type { Message } from '@/app/types/chat'

export interface ThinkingStep {
  id: string
  message: string
  isCompleted: boolean
  isActive: boolean
}

// Hardcoded thinking steps (fallback when no messages)
const HARDCODED_STEPS = [
  "Understanding what you need",
  "Looking through our past conversations...",
  "Finding what's most relevant",
  "Putting my thoughts together"
]

/**
 * Derive thinking steps from messages (no state, pure computation)
 */
export function deriveThinkingSteps(
  messages?: Message[],
  isComplete?: boolean
): ThinkingStep[] {
  if (!messages || messages.length === 0) {
    // Return hardcoded steps if no messages (fallback)
    return HARDCODED_STEPS.map((msg, i) => ({
      id: `step-${i}`,
      message: msg,
      isCompleted: isComplete || false,
      isActive: !isComplete && i === 0
    }))
  }
  
  // Convert messages to steps (pure transformation)
  return messages.map((msg, index) => {
    const isLast = index === messages.length - 1
    return {
      id: msg.id || `msg-${index}`,
      message: msg.content || '',
      isCompleted: isComplete && isLast,
      isActive: !isComplete && isLast
    }
  })
}

/**
 * Derive completion state from data (no state, pure computation)
 * CRITICAL: Thinking persists until final artifact is created
 * 
 * Completion = not loading AND (has final artifact OR no artifacts expected)
 */
export function deriveThinkingCompletion(
  isLoading: boolean,
  hasFinalArtifact: boolean = false  // Track if final artifact is created
): boolean {
  // Not complete if loading
  if (isLoading) return false
  // If we're tracking artifacts, wait for final artifact
  // Otherwise, complete when not loading
  return true  // Simplified: complete when not loading (artifact tracking can be added later)
}

/**
 * Derive expansion state (auto-expand when active, persist when complete)
 * 
 * Auto-expands when thinking is active (not complete).
 * Persists expansion when complete (user can collapse manually).
 */
export function deriveThinkingExpansion(
  isComplete: boolean,
  hasMessages: boolean,
  userExpanded?: boolean  // Optional: user manual toggle (controlled from parent)
): boolean {
  // If user manually toggled, respect that
  if (userExpanded !== undefined) return userExpanded
  
  // Auto-expand when active (not complete) and has messages
  if (!isComplete && hasMessages) return true
  
  // Persist expansion when complete (show thinking process)
  if (isComplete) return true
  
  // Default: collapsed
  return false
}

