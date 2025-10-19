'use client'

import posthog from '../../instrumentation-client'

export function track(event: string, props?: Record<string, any>) {
  if (typeof window === 'undefined') return
  posthog.capture(event, props)
}

export function trackPageview(path: string) {
  if (typeof window === 'undefined') return
  posthog.capture('$pageview', { $current_url: path })
}

