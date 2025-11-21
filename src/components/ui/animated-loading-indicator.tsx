'use client'

import React from 'react'
import { T } from '@/components/translation'

export interface AnimatedLoadingIndicatorProps {
  /** Custom message to display (disables progressive cycling) */
  message?: string
  /** Array of progressive messages to cycle through */
  messages?: string[]
  /** Time interval between message changes in milliseconds (default: 2500) */
  messageInterval?: number
  /** Icon type - 'running' uses local GIF running man, 'spinner' uses CSS spinner */
  iconType?: 'running' | 'spinner'
  /** Animation duration in seconds (default: 0.8) */
  animationDuration?: number
  /** Translation context for messages */
  translationContext?: string
  /** Additional className for container */
  className?: string
}

// Default progressive messages for thinking process
const DEFAULT_MESSAGES = [
  "Working on it...",
  "Processing your request...",
  "Analyzing context...",
  "Gathering information...",
  "Connecting the dots...",
  "Building the response...",
  "Refining the details...",
  "Generating response...",
  "Putting it all together...",
  "Almost there...",
  "Finalizing...",
]

/**
 * AnimatedLoadingIndicator - Reusable loading indicator with progressive messages
 * 
 * Features:
 * - Running man GIF from local public folder with built-in animation
 * - Progressive message cycling (configurable messages and interval)
 * - Backward compatible with single message prop
 * - Translation support via T component
 * 
 * Usage:
 * ```tsx
 * <AnimatedLoadingIndicator />
 * <AnimatedLoadingIndicator message="Custom message" />
 * <AnimatedLoadingIndicator messages={["Step 1", "Step 2"]} />
 * ```
 */
export function AnimatedLoadingIndicator({
  message,
  messages = DEFAULT_MESSAGES,
  messageInterval = 2500,
  iconType = 'running',
  animationDuration = 0.8,
  translationContext = 'thinking_process.working',
  className = '',
}: AnimatedLoadingIndicatorProps) {
  // Progressive message cycling state
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0)
  
  // Cycle through messages every messageInterval seconds
  React.useEffect(() => {
    if (message) return // Don't cycle if custom message provided
    
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
    }, messageInterval)
    
    return () => clearInterval(interval)
  }, [message, messages, messageInterval])
  
  // Get current message (custom message or cycled default)
  const displayMessage = message || messages[currentMessageIndex]
  
  return (
    <div className={`bg-transparent box-border flex gap-2.5 items-center p-3 rounded-xl ${className}`}>
      <div className="h-10 w-10 relative shrink-0 flex items-center justify-center">
        {iconType === 'running' ? (
          <img 
            src="/gif/run-12055.gif" 
            alt="Running" 
            className="w-full h-full object-contain"
            style={{ maxWidth: '40px', maxHeight: '40px' }}
            aria-hidden="true"
          />
        ) : (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" aria-hidden="true" />
        )}
      </div>
      <p className="flex-1 font-normal leading-5 text-foreground text-base whitespace-pre-wrap">
        {message ? (
          message
        ) : (
          <T context={translationContext}>{displayMessage}</T>
        )}
      </p>
    </div>
  )
}

