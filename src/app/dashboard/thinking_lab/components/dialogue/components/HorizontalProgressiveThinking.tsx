import React from 'react'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { T } from '@/components/translation'
import type { Message } from '@/app/types/chat'
import { ThinkingLoadingIndicator } from './ThinkingLoadingIndicator'

interface ThinkingState {
  shouldShow: boolean
  showLoadingIndicator: boolean
  showExpandableList: boolean
  a2aMessages: Message[]
  isLoading: boolean
}

interface HorizontalProgressiveThinkingProps {
  thinkingState?: ThinkingState
}

export const HorizontalProgressiveThinking: React.FC<HorizontalProgressiveThinkingProps> = ({ 
  thinkingState,
}) => {
  // ONLY state: user expansion toggle (user interaction, not derived)
  // MUST be called before any early returns (React Hook rules)
  const [internalExpanded, setInternalExpanded] = React.useState(true)

  // Simple toggle handler (defined before early returns)
  const handleToggle = React.useCallback(() => {
    setInternalExpanded(prev => !prev)
  }, [])

  // Use thinkingState from Convex query
  if (!thinkingState || !thinkingState.shouldShow) {
    return null
  }

  // Show loading indicator when loading and no messages
  if (thinkingState.showLoadingIndicator) {
    return (
      <div className="mb-3 bg-transparent">
        <ThinkingLoadingIndicator />
      </div>
    )
  }

  // Show expandable list when there are A2A messages
  if (!thinkingState.showExpandableList) {
    return null
  }

  const hasMessages = thinkingState.a2aMessages && thinkingState.a2aMessages.length > 0

  return (
    <div className="mb-3 bg-transparent">
      <button 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none p-0"
        onClick={handleToggle}
      >
        <Sparkles className={`w-4 h-4 text-primary ${thinkingState.isLoading ? 'animate-spin' : ''}`} />
        <span>
          <T context="thinking_process.loading">Thinking...</T>
        </span>
        {internalExpanded ? 
          <ChevronUp className="w-3 h-3" /> : 
          <ChevronDown className="w-3 h-3" />
        }
      </button>

      <AnimatePresence>
        {internalExpanded && hasMessages && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-2 bg-transparent"
          >
            {/* Scrollable container for A2A messages - max-height with overflow */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2 bg-transparent">
              <div className="space-y-1 bg-transparent">
                {thinkingState.a2aMessages.map((message, index) => {
                  const isLast = index === thinkingState.a2aMessages.length - 1
                  return (
                    <div key={message.id || `a2a-${index}`} className="flex items-center gap-2 text-sm bg-transparent">
                      <Sparkles className={`w-4 h-4 text-primary ${thinkingState.isLoading && isLast ? 'animate-spin' : ''}`} />
                      <span className="text-foreground">
                        {message.content || message.chat_response || 'Processing...'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 