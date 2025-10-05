/**
 * Auto-Scroll Hook
 * Automatically scrolls to bottom when dependencies change (e.g., new messages)
 */

import { useEffect, useRef } from 'react'

/**
 * Hook that provides a ref and automatically scrolls to it when deps change
 * @param deps - Dependencies array to trigger scroll (e.g., [messages])
 * @param options - Scroll behavior options
 * @returns Ref to attach to the scroll anchor element
 */
export function useAutoScroll<T = HTMLDivElement>(
  deps: any[],
  options: {
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
    enabled?: boolean
  } = {}
) {
  const {
    behavior = 'smooth',
    block = 'end',
    enabled = true
  } = options

  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return

    const element = ref.current as unknown as Element
    if (element?.scrollIntoView) {
      element.scrollIntoView({ behavior, block })
    }
  }, [...deps, enabled])

  return ref
}

