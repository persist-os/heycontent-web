import React, { useState, useEffect } from 'react'
import { Search, Brain, Sparkles, Database, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { T } from '@/components/translation'

interface ThinkingStep {
  id: string
  message: string
  isCompleted: boolean
  isActive: boolean
}

interface HorizontalProgressiveThinkingProps {
  onComplete?: () => void
  isCompleted?: boolean
}

export const HorizontalProgressiveThinking: React.FC<HorizontalProgressiveThinkingProps> = ({ 
  onComplete,
  isCompleted = false
}) => {
  const [steps, setSteps] = useState<ThinkingStep[]>([])
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false)

  // Hardcoded thinking steps that show at spaced intervals
  const thinkingSteps = [
    "Understanding what you need",
    "Looking through our past conversations...",
    "Finding what's most relevant",
    "Putting my thoughts together"
  ]

  // Auto-open dropdown when generation starts, auto-close when complete
  useEffect(() => {
    if (steps.length > 0 && !isCompleted) {
      setIsThinkingExpanded(true)
    } else if (isCompleted) {
      setIsThinkingExpanded(false)
    }
  }, [steps.length, isCompleted])

  // Initialize and progress through steps at spaced intervals
  useEffect(() => {
    if (steps.length === 0 && !isCompleted) {
      // Start with just the first step
      setSteps([{
        id: 'step-0',
        message: thinkingSteps[0],
        isCompleted: false,
        isActive: true
      }])

      // Add remaining steps progressively
      const intervals: NodeJS.Timeout[] = []
      for (let i = 1; i < thinkingSteps.length; i++) {
        const timeout = setTimeout(() => {
          setSteps(prev => {
            const newStep: ThinkingStep = {
              id: `step-${i}`,
              message: thinkingSteps[i],
              isCompleted: false,
              isActive: true
            }
            
            // Mark previous step as completed and inactive
            const updatedSteps = prev.map(step => ({
              ...step,
              isCompleted: true,
              isActive: false
            }))
            
            return [...updatedSteps, newStep]
          })
        }, i * 2500)
        intervals.push(timeout)
      }

      return () => intervals.forEach(clearTimeout)
    }
  }, [isCompleted])

  // Mark all steps as completed when finished
  useEffect(() => {
    if (isCompleted) {
      setSteps(prev => prev.map(step => ({
        ...step,
        isCompleted: true,
        isActive: false
      })))
      
      onComplete?.()
    }
  }, [isCompleted, onComplete])

  const getStepIcon = (isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="w-4 h-4 text-primary" />
    }
    
    if (isActive) {
      return <Sparkles className="w-4 h-4 text-primary animate-spin" />
    }
    
    return <Sparkles className="w-4 h-4 text-primary" />
  }

  // Don't show if no steps and not completed
  if (steps.length === 0 && !isCompleted) {
    return null
  }

  return (
    <div className="mb-3">
      <button 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
      >
        <Sparkles className="w-4 h-4 text-primary" />
        <span>
          {isCompleted ? (
            <T context="thinking_process.show_process">Show thinking process</T>
          ) : (
            <T context="thinking_process.loading">Thinking...</T>
          )}
        </span>
        {isThinkingExpanded ? 
          <ChevronUp className="w-3 h-3" /> : 
          <ChevronDown className="w-3 h-3" />
        }
      </button>

      <AnimatePresence>
        {isThinkingExpanded && (
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
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-2 text-sm">
                      {getStepIcon(step.isActive, step.isCompleted)}
                      <span className="text-foreground">
                        <T context="thinking_process">{step.message}</T>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 