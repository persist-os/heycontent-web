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
  // PURE COMPUTATION: No state, no effects, just derived values
  const isCompleted = deriveThinkingCompletion(isStreaming, isLoading, hasFinalArtifact)
  const hasMessages = messages && messages.length > 0
  const steps = deriveThinkingSteps(messages, isCompleted)
  
  // Track completion change for callback (simple ref check, no useEffect)
  const prevCompletedRef = React.useRef(isCompleted)
  if (isCompleted && !prevCompletedRef.current) {
    onComplete?.()
  }
  prevCompletedRef.current = isCompleted

  // ONLY state: user expansion toggle (user interaction, not derived)
  const [internalExpanded, setInternalExpanded] = React.useState(true)
  const effectiveExpanded = userExpanded !== undefined ? userExpanded : internalExpanded

  // Simple toggle handler (no useCallback needed - stable function)
  const handleToggle = () => {
    const newExpanded = !effectiveExpanded
    if (onExpansionChange) {
      onExpansionChange(newExpanded)
    } else {
      setInternalExpanded(newExpanded)
    }
  }

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
            {/* Scrollable container for A2A messages - max-height with overflow */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
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