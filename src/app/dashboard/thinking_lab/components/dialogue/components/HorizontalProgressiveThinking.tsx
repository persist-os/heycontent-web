import React from 'react'
import { Sparkles, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { T } from '@/components/translation'
import type { Message } from '@/app/types/chat'
import {
  deriveThinkingSteps,
  deriveThinkingCompletion,
  deriveThinkingExpansion,
  type ThinkingStep
} from '../../../utils/thinkingState'

interface HorizontalProgressiveThinkingProps {
  messages?: Message[]  // Optional: real messages to display
  isStreaming?: boolean  // NEW: Track streaming state
  isLoading?: boolean  // NEW: Track loading state
  hasFinalArtifact?: boolean  // NEW: Track if final artifact is created
  onComplete?: () => void
  userExpanded?: boolean  // Optional: controlled expansion from parent
  onExpansionChange?: (expanded: boolean) => void  // Optional: notify parent of expansion change
}

export const HorizontalProgressiveThinking: React.FC<HorizontalProgressiveThinkingProps> = ({ 
  messages,
  isStreaming = false,
  isLoading = false,
  hasFinalArtifact = false,
  onComplete,
  userExpanded,
  onExpansionChange
}) => {
  // PURE COMPUTATION: Derive completion from data (no state)
  const isCompleted = React.useMemo(() => {
    return deriveThinkingCompletion(isStreaming, isLoading, hasFinalArtifact)
  }, [isStreaming, isLoading, hasFinalArtifact])

  // Progressive loading for hardcoded steps (when no messages)
  // Use minimal state: only track current step index for progressive display
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)
  const hasMessages = messages && messages.length > 0
  
  // Internal expansion state (allows collapsing at all times)
  // If parent provides userExpanded, use that; otherwise use internal state
  const [internalExpanded, setInternalExpanded] = React.useState(true) // Default: expanded
  const effectiveExpanded = userExpanded !== undefined ? userExpanded : internalExpanded

  // Progressive step loading: only for hardcoded steps (no messages)
  React.useEffect(() => {
    if (hasMessages || isCompleted) {
      // Reset when messages arrive or completed
      setCurrentStepIndex(0)
      return
    }

    // Progressive loading: show steps one by one at intervals
    const intervals: NodeJS.Timeout[] = []
    const HARDCODED_STEPS = [
      "Understanding what you need",
      "Looking through our past conversations...",
      "Finding what's most relevant",
      "Putting my thoughts together"
    ]

    // Start with first step
    setCurrentStepIndex(1)

    // Add remaining steps progressively
    for (let i = 1; i < HARDCODED_STEPS.length; i++) {
      const timeout = setTimeout(() => {
        setCurrentStepIndex(i + 1)
      }, i * 2500)
      intervals.push(timeout)
    }

    return () => intervals.forEach(clearTimeout)
  }, [hasMessages, isCompleted])

  // PURE COMPUTATION: Derive steps from messages OR progressive hardcoded steps
  const steps = React.useMemo(() => {
    if (hasMessages) {
      // Use real messages
      return deriveThinkingSteps(messages, isCompleted)
    }
    
    // Progressive hardcoded steps (show up to currentStepIndex)
    const HARDCODED_STEPS = [
      "Understanding what you need",
      "Looking through our past conversations...",
      "Finding what's most relevant",
      "Putting my thoughts together"
    ]
    
    return HARDCODED_STEPS.slice(0, currentStepIndex).map((msg, i) => {
      const isLast = i === currentStepIndex - 1
      return {
        id: `step-${i}`,
        message: msg,
        isCompleted: isCompleted && isLast,
        isActive: !isCompleted && isLast
      }
    })
  }, [messages, isCompleted, hasMessages, currentStepIndex])

  // Track previous completion state to call onComplete (no useEffect - use ref)
  const prevCompletedRef = React.useRef(isCompleted)
  if (isCompleted && !prevCompletedRef.current) {
    // Completion just changed from false to true - call callback
    onComplete?.()
  }
  prevCompletedRef.current = isCompleted

  // Handle manual expansion toggle - always allow collapsing/expanding
  const handleToggle = React.useCallback(() => {
    const newExpanded = !effectiveExpanded
    if (onExpansionChange) {
      // Parent controls expansion
      onExpansionChange(newExpanded)
    } else {
      // Internal state controls expansion
      setInternalExpanded(newExpanded)
    }
  }, [effectiveExpanded, onExpansionChange])

  const getStepIcon = (isActive: boolean, isCompleted: boolean, isLastMessage: boolean) => {
    // Show "done" (CheckCircle) only on last message when completed
    if (isCompleted && isLastMessage) {
      return <CheckCircle className="w-4 h-4 text-primary" />
    }
    
    // Show active spinner for last message when streaming
    if (isActive) {
      return <Sparkles className="w-4 h-4 text-primary animate-spin" />
    }
    
    // Show inactive sparkles for other messages
    return <Sparkles className="w-4 h-4 text-primary" />
  }

  // Show component if we have steps OR if we're in loading/streaming state
  // CRITICAL: Never hide when completed - thinking persists until final artifact
  if (steps.length === 0 && !isStreaming && !isLoading && isCompleted) {
    return null
  }

  return (
    <div className="mb-3">
      <button 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={handleToggle}
      >
        <Sparkles className="w-4 h-4 text-primary" />
        <span>
          {isCompleted ? (
            <T context="thinking_process.show_process">Show thinking process</T>
          ) : (
            <T context="thinking_process.loading">Thinking...</T>
          )}
        </span>
        {effectiveExpanded ? 
          <ChevronUp className="w-3 h-3" /> : 
          <ChevronDown className="w-3 h-3" />
        }
      </button>

      <AnimatePresence>
        {effectiveExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-2"
          >
            <div className="space-y-2">
              {/* Thinking Steps */}
              {steps.length > 0 && (
                <div className="space-y-1">
                  {steps.map((step, index) => {
                    const isLastMessage = index === steps.length - 1
                    return (
                      <div key={step.id} className="flex items-center gap-2 text-sm">
                        {getStepIcon(step.isActive, step.isCompleted, isLastMessage)}
                        <span className="text-foreground">
                          {messages ? step.message : <T context="thinking_process">{step.message}</T>}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 