import React from 'react'
import { AnimatedLoadingIndicator } from '@/components/ui/animated-loading-indicator'

interface ThinkingLoadingIndicatorProps {
  message?: string
}

/**
 * ThinkingLoadingIndicator - Wrapper for thinking lab loading state
 * 
 * Uses AnimatedLoadingIndicator with thinking-specific defaults.
 * Maintains backward compatibility with existing usage.
 */
export const ThinkingLoadingIndicator: React.FC<ThinkingLoadingIndicatorProps> = ({ 
  message 
}) => {
  return (
    <AnimatedLoadingIndicator 
      message={message}
      translationContext="thinking_process.working"
    />
  )
}

