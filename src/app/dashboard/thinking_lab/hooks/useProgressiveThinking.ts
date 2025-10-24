/**
 * Progressive Thinking Hook
 * Manages staged "thinking" status updates during AI responses with automatic cleanup
 */

import { useEffect, useRef } from 'react'

export const THINKING_STEP_DELAY_MS = 700
export const POST_THINK_DELAY_MS = 250

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

/**
 * Hook that manages progressive thinking status updates
 * @param enabled - Whether the thinking sequence is active
 * @param onStatusUpdate - Callback that receives each status update
 */
export function useProgressiveThinking(
  enabled: boolean,
  onStatusUpdate?: (status: string) => void
) {
  const stopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled) {
      stopRef.current?.()
      return
    }

    let stopped = false
    const stop = () => { stopped = true }
    stopRef.current = stop

    ;(async () => {
      try {
        // MAB controls all context decisions automatically
        const steps = [
          "Understanding what you're thinking about",
          "Searching related content",
          "Looking through all your content",
          "Quality filtering",
        ]

        for (const step of steps) {
          if (stopped) return
          onStatusUpdate?.(step)
          await sleep(THINKING_STEP_DELAY_MS)
        }
      } catch (error) {
        console.warn('[useProgressiveThinking] Error in sequence:', error)
      }
    })()

    // Cleanup on unmount or when disabled
    return () => {
      stopped = true
      stopRef.current = null
    }
  }, [enabled, onStatusUpdate])

  return {
    stop: () => stopRef.current?.(),
    addGenerationSteps: async () => {
      onStatusUpdate?.('Putting my thoughts together')
      await sleep(POST_THINK_DELAY_MS)
      onStatusUpdate?.('Generating response...')
    }
  }
}

/**
 * Standalone function for use in non-React contexts (like messageService)
 * MAB now controls all context decisions automatically
 * Returns both stop function and a promise that resolves when all steps complete
 */
export function startProgressiveThinking(
  onUpdate?: (status: string) => void
): { stop: () => void; completion: Promise<void> } {
  let stopped = false
  const stop = () => { stopped = true }

  const completion = (async () => {
    try {
      const steps = [
        "Understanding what you're thinking about",
        "Query needs context - proceeding with vector search",
        "Looking through all your content",
        "Quality filtering",
      ]

      for (const step of steps) {
        if (stopped) return
        onUpdate?.(step)
        await sleep(THINKING_STEP_DELAY_MS)
      }
    } catch (error) {
      console.warn('[ProgressiveThinking] Error in sequence:', error)
    }
  })()

  return { stop, completion }
}

// Export sleep and delay constants for other uses
export { sleep }

