import React, { useState, useEffect } from 'react'
import { Search, Brain, Sparkles, Database, CheckCircle, ChevronDown, ChevronUp, FileText, Youtube, Mail, MessageSquare } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Message } from '@/app/types/chat'

interface ThinkingStep {
  id: string
  stage: 'analyzing' | 'searching' | 'grading' | 'generating' | 'completed'
  message: string
  submessage?: string
  timestamp: Date
  isCompleted: boolean
  isActive: boolean
  details?: {
    itemsProcessed?: number
    itemsKept?: number
    itemsFiltered?: number
    itemDecisions?: Array<{
      title: string
      reason: string
      isKept: boolean
      timestamp: Date
    }>
  }
}

interface HorizontalProgressiveThinkingProps {
  searchStatus?: string
  statusHistory?: string[]
  onComplete?: () => void
  isCompleted?: boolean
  vectorSearchMetadata?: Message['vectorSearchMetadata']
}

const ContentTypeIcon: React.FC<{ contentType: string }> = ({ contentType }) => {
  switch (contentType) {
    case 'youtube':
      return <Youtube className="w-3 h-3 text-muted-foreground" />
    case 'instagram':
      return <div className="w-3 h-3 rounded bg-muted-foreground/20" />
    case 'gmail':
      return <Mail className="w-3 h-3 text-muted-foreground" />
    case 'note':
      return <FileText className="w-3 h-3 text-muted-foreground" />
    default:
      return <MessageSquare className="w-3 h-3 text-muted-foreground" />
  }
}

export const HorizontalProgressiveThinking: React.FC<HorizontalProgressiveThinkingProps> = ({ 
  searchStatus = '', 
  statusHistory = [],
  onComplete,
  isCompleted = false,
  vectorSearchMetadata
}) => {
  const [steps, setSteps] = useState<ThinkingStep[]>([])
  const [processedStatusCount, setProcessedStatusCount] = useState(0)
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false)

  // Auto-open dropdown when generation starts, auto-close when complete
  useEffect(() => {
    if (steps.length > 0 && !isCompleted) {
      setIsThinkingExpanded(true)
    } else if (isCompleted) {
      setIsThinkingExpanded(false)
    }
  }, [steps.length, isCompleted])

  // Auto-open dropdown when we have context but no steps yet
  useEffect(() => {
    if (vectorSearchMetadata?.foundRelevantContent && 
        vectorSearchMetadata.relevantContent && 
        vectorSearchMetadata.relevantContent.length > 0 && 
        !isCompleted) {
      setIsThinkingExpanded(true)
    }
  }, [vectorSearchMetadata?.foundRelevantContent, isCompleted])

  // Simplified, friendly message pools
  const messagePools = {
    intentAnalysis: {
      main: [
        "Understanding what you need",
        "Getting a sense of your question",
        "Seeing what's on your mind",
        "Taking in your request"
      ],
      sub: [
        "Checking if I need to look back at our conversations",
        "Seeing if what we've talked about can help"
      ]
    },
    
    contextNeeded: {
      main: [
        "This would benefit from some context",
        "What we've talked about before will help",
        "Time to check our conversation history"
      ],
      sub: [
        "Your question would benefit from our conversation history",
        "What you've shared before has some relevant pieces"
      ]
    },
    
    vectorSearch: {
      main: [
        "Looking through our past conversations...",
        "Checking what we've talked about before...",
        "Browsing through your thoughts..."
      ],
      sub: [
        "Checking {count} things from our conversations",
        "Looking through {count} pieces you've shared"
      ]
    },
    
    grading: {
      main: [
        "Finding what's most relevant",
        "Sorting through what matters",
        "Picking out the important bits"
      ],
      sub: [
        "Making sure I find what helps",
        "Focusing on what's most useful"
      ]
    },
    
    generation: {
      main: [
        "Putting my thoughts together",
        "Working through this with you",
        "Finding the right words"
      ],
      sub: [
        "Putting together something helpful",
        "Creating something that fits you"
      ]
    }
  };

  // Helper function to randomly select from message pools
  const getRandomMessage = (pool: string[], count?: number): string => {
    const randomIndex = Math.floor(Math.random() * pool.length);
    const message = pool[randomIndex];
    return count !== undefined ? message.replace('{count}', count.toString()) : message;
  };

  // Helper function to clean status messages of emojis
  const cleanMessage = (message: string) => {
    return message.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
  }

  // Process status updates
  useEffect(() => {
    if (processedStatusCount >= statusHistory.length && !searchStatus) return

    const allStatuses = [...statusHistory]
    if (searchStatus && !allStatuses.includes(searchStatus)) {
      allStatuses.push(searchStatus)
    }

    const unprocessedStatuses = allStatuses.slice(processedStatusCount)
    
    unprocessedStatuses.forEach((status) => {
      const cleanedStatus = cleanMessage(status)
      processStatusUpdate(cleanedStatus)
    })

    setProcessedStatusCount(allStatuses.length)
  }, [searchStatus, statusHistory, processedStatusCount])

  const processStatusUpdate = (searchStatus: string) => {
    if (searchStatus.includes('Understanding what you\'re thinking about') || 
        searchStatus.includes('Figuring out what you need')) {
      
      setSteps(prev => {
        const existingAnalyzing = prev.find(step => step.stage === 'analyzing')
        if (existingAnalyzing) return prev

        const analyzingStep: ThinkingStep = {
          id: `analyzing-${Date.now()}`,
          stage: 'analyzing',
          message: getRandomMessage(messagePools.intentAnalysis.main),
          submessage: getRandomMessage(messagePools.intentAnalysis.sub),
          timestamp: new Date(),
          isCompleted: false,
          isActive: true
        }

        return [analyzingStep]
      })
    }

    if (searchStatus.includes('Query needs context - proceeding with vector search') ||
        searchStatus.includes('Time to check our conversation history')) {
      
      setSteps(prev => {
        const updatedSteps = prev.map(step => 
          step.stage === 'analyzing' ? { ...step, isCompleted: true, isActive: false } : step
        )

        const existingContextNeeded = updatedSteps.find(step => step.stage === 'searching' && step.message.includes('context'))
        if (existingContextNeeded) return updatedSteps

        const contextNeededStep: ThinkingStep = {
          id: `context-needed-${Date.now()}`,
          stage: 'searching',
          message: getRandomMessage(messagePools.contextNeeded.main),
          submessage: getRandomMessage(messagePools.contextNeeded.sub),
          timestamp: new Date(),
          isCompleted: false,
          isActive: true
        }

        return [...updatedSteps, contextNeededStep]
      })
    }

    if (searchStatus.includes('Looking through all your content') ||
        searchStatus.includes('Discovered') && searchStatus.includes('potentially relevant')) {
      
      const countMatch = searchStatus.match(/(\d+)\s+potentially relevant/)
      const itemCount = countMatch ? parseInt(countMatch[1]) : undefined

      setSteps(prev => {
        const updatedSteps = prev.map(step => ({
          ...step,
          isCompleted: true,
          isActive: false
        }))

        const existingVectorSearch = updatedSteps.find(step => 
          step.stage === 'searching' && step.message.includes('Looking through')
        )
        if (existingVectorSearch) return updatedSteps

        const vectorSearchStep: ThinkingStep = {
          id: `vector-search-${Date.now()}`,
          stage: 'searching',
          message: getRandomMessage(messagePools.vectorSearch.main),
          submessage: getRandomMessage(messagePools.vectorSearch.sub, itemCount),
          timestamp: new Date(),
          isCompleted: false,
          isActive: true
        }

        return [...updatedSteps, vectorSearchStep]
      })
    }

    // Handle grading and individual item processing
    if (searchStatus.includes('Looking at each piece carefully') ||
        searchStatus.includes('Examining each item for relevance') ||
        searchStatus.includes('Quality filtering') ||
        searchStatus.includes('filtered')) {
      
      setSteps(prev => {
        const gradingStepIndex = prev.findIndex(step => step.stage === 'grading')
        
        if (gradingStepIndex === -1) {
          const gradingStep: ThinkingStep = {
            id: `grading-${Date.now()}`,
            stage: 'grading',
            message: getRandomMessage(messagePools.grading.main),
            submessage: getRandomMessage(messagePools.grading.sub),
            timestamp: new Date(),
            isCompleted: false,
            isActive: true,
            details: {
              itemsKept: 0,
              itemsFiltered: 0,
              itemsProcessed: 0,
              itemDecisions: []
            }
          }
          
          const updatedSteps = prev.map(step => ({
            ...step,
            isCompleted: true,
            isActive: false
          }))
          
          return [...updatedSteps, gradingStep]
        }

        // Handle individual item decisions
        const titleMatch = searchStatus.match(/"([^"]+)"\s*-\s*(.+?)(?:\s*\([\d.]+%\))?$/)
        const isKept = searchStatus.includes('high quality content') || 
                      searchStatus.includes('relevant content') || 
                      searchStatus.includes('passed standard filtering')

        if (titleMatch) {
          const title = titleMatch[1].substring(0, 60) + (titleMatch[1].length > 60 ? '...' : '')
          const reason = titleMatch[2].trim()
          
          const updatedSteps = [...prev]
          const gradingStep = updatedSteps[gradingStepIndex]
          
          if (gradingStep.details) {
            const newDecision = {
              title,
              reason,
              isKept,
              timestamp: new Date()
            }
            
            gradingStep.details.itemDecisions = [...(gradingStep.details.itemDecisions || []), newDecision]
            gradingStep.details.itemsProcessed = (gradingStep.details.itemsProcessed || 0) + 1
            
            if (isKept) {
              gradingStep.details.itemsKept = (gradingStep.details.itemsKept || 0) + 1
            } else {
              gradingStep.details.itemsFiltered = (gradingStep.details.itemsFiltered || 0) + 1
            }
          }
          
          return updatedSteps
        }

        // Handle final filtering summary
        if (searchStatus.includes('kept') && searchStatus.includes('filtered')) {
          const keptMatch = searchStatus.match(/kept (\d+)/)
          const filteredMatch = searchStatus.match(/filtered (\d+)/)
          
          if (keptMatch && filteredMatch) {
            const updatedSteps = [...prev]
            const gradingStep = updatedSteps[gradingStepIndex]
            
            if (gradingStep.details) {
              gradingStep.details.itemsKept = parseInt(keptMatch[1])
              gradingStep.details.itemsFiltered = parseInt(filteredMatch[1])
              gradingStep.details.itemsProcessed = gradingStep.details.itemsKept + gradingStep.details.itemsFiltered
            }
            
            gradingStep.isCompleted = true
            gradingStep.isActive = false
            
            return updatedSteps
          }
        }

        return prev
      })
    }

    if (searchStatus.includes('Putting my thoughts together') ||
        searchStatus.includes('Crafting your answer')) {
      
      setSteps(prev => {
        const updatedSteps = prev.map(step => ({
          ...step,
          isCompleted: true,
          isActive: false
        }))

        const existingGeneration = updatedSteps.find(step => step.stage === 'generating')
        if (existingGeneration) return updatedSteps

        const generationStep: ThinkingStep = {
          id: `generation-${Date.now()}`,
          stage: 'generating',
          message: getRandomMessage(messagePools.generation.main),
          submessage: getRandomMessage(messagePools.generation.sub),
          timestamp: new Date(),
          isCompleted: false,
          isActive: true
        }

        return [...updatedSteps, generationStep]
      })
    }
  }

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

  // Show simple thinking indicator if no steps yet
  if (steps.length === 0 && !isCompleted && !vectorSearchMetadata?.foundRelevantContent && searchStatus) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        <span>Thinking...</span>
      </div>
    )
  }

  const getStageIcon = (stage: ThinkingStep['stage'], isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="w-4 h-4 text-primary" />
    }
    
    switch (stage) {
      case 'analyzing':
        return <Search className={`w-4 h-4 text-primary ${isActive ? 'animate-pulse' : ''}`} />
      case 'searching':
        return <Database className={`w-4 h-4 text-primary ${isActive ? 'animate-pulse' : ''}`} />
      case 'grading':
        return <Brain className={`w-4 h-4 text-primary ${isActive ? 'animate-pulse' : ''}`} />
      case 'generating':
        return <Sparkles className={`w-4 h-4 text-primary ${isActive ? 'animate-spin' : ''}`} />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-primary" />
      default:
        return <Sparkles className="w-4 h-4 text-primary" />
    }
  }

  // Only show if we have steps or context
  if (steps.length === 0 && (!vectorSearchMetadata?.foundRelevantContent || !vectorSearchMetadata.relevantContent || vectorSearchMetadata.relevantContent.length === 0)) {
    return null
  }

  return (
    <div className="mb-3">
      <button 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
      >
        <Sparkles className="w-4 h-4 text-primary" />
        <span>{isCompleted ? 'Show thinking process' : 'Thinking...'}</span>
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
                      {getStageIcon(step.stage, step.isActive, step.isCompleted)}
                      <span className="text-foreground">{step.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Context Used */}
              {vectorSearchMetadata?.foundRelevantContent && 
               vectorSearchMetadata.relevantContent && 
               vectorSearchMetadata.relevantContent.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    Context Used ({vectorSearchMetadata.relevantContent.length} item{vectorSearchMetadata.relevantContent.length > 1 ? 's' : ''})
                  </div>
                  <div className="space-y-2">
                    {vectorSearchMetadata.relevantContent.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 bg-muted/20 border border-border rounded-md">
                        <div className="flex-shrink-0 mt-0.5">
                          <ContentTypeIcon contentType={item.contentType} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate" title={item.title}>
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(item.score * 100).toFixed(1)}% match • {item.contentType}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 