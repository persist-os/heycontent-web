import React, { useState, useEffect } from 'react'
import { Search, Brain, Sparkles, Database, CheckCircle, Filter, ChevronDown, ChevronUp, FileText, Youtube, Mail, MessageSquare } from 'lucide-react'
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
      return <Youtube className="w-4 h-4 text-red-500" />
    case 'instagram':
      return <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-500" />
    case 'gmail':
      return <Mail className="w-4 h-4 text-blue-500" />
    case 'note':
      return <FileText className="w-4 h-4 text-gray-600" />
    default:
      return <MessageSquare className="w-4 h-4 text-gray-600" />
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
      // Open dropdown when we have steps and generation is not complete
      setIsThinkingExpanded(true)
    } else if (isCompleted) {
      // Close dropdown when generation is complete
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

  // Pools of fun, creator-friendly phrases for each stage
  const messagePools = {
    intentAnalysis: {
      main: [
        "Figuring out what you're looking for",
        "Getting the vibe of your question",
        "Understanding what you need",
        "Piecing together your request",
        "Reading between the lines",
        "Decoding your creative needs"
      ],
      sub: [
        "Checking if I need to peek at your stuff",
        "Seeing if your content can help",
        "Deciding whether to dig into your library",
        "Figuring out if context would be useful",
        "Checking if we need your content history",
        "Seeing what kind of help you need"
      ]
    },
    
    contextNeeded: {
      main: [
        "You need some context",
        "Your stuff will help with this",
        "Time to check your content",
        "Your library has the goods",
        "Let's dig into your content"
      ],
      sub: [
        "Your question would benefit from your content history",
        "Your past work has some relevant gems",
        "There's gold in your content library",
        "Your creative history will help here",
        "Your content has the perfect context"
      ]
    },
    
    vectorSearch: {
      main: [
        "Looking through all your content...",
        "Scanning your creative library...",
        "Digging through your archives...",
        "Exploring your content history...",
        "Searching your creative vault...",
        "Hunting through your materials..."
      ],
      sub: [
        "Checking {count} items in your library",
        "Scanning through {count} pieces of content",
        "Analyzing {count} items for relevance",
        "Processing {count} pieces from your collection",
        "Examining {count} items in your archive",
        "Reviewing {count} pieces of your work"
      ]
    },
    
    grading: {
      main: [
        "Separating the gold from the noise",
        "Finding the most relevant gems",
        "Quality control time",
        "Picking the best pieces",
        "Filtering for relevance",
        "Curating the perfect context"
      ],
      sub: [
        "Making sure we get the good stuff",
        "AI is being picky about quality",
        "Only keeping the most relevant pieces",
        "Filtering out the noise",
        "Quality check in progress",
        "Being selective about what matters"
      ]
    },
    
    generation: {
      main: [
        "Crafting your answer",
        "Creating something awesome",
        "Working some magic",
        "Putting it all together",
        "Building your response",
        "Cooking up something good"
      ],
      sub: [
        "Putting together a great response",
        "Mixing your content with AI magic",
        "Creating something uniquely yours",
        "Blending insights with creativity",
        "Making something special happen",
        "Turning ideas into gold"
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
    if (searchStatus.includes('Analyzing whether your query needs context') || 
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
        searchStatus.includes('Time to check your content')) {
      
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
    if (searchStatus.includes('Analyzing AI grading quality') ||
        searchStatus.includes('Examining each item for relevance') ||
        searchStatus.includes('Quality filtering') ||
        searchStatus.includes('filtered')) {
      
      setSteps(prev => {
        let gradingStepIndex = prev.findIndex(step => step.stage === 'grading')
        
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

    if (searchStatus.includes('Generating your response') ||
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

  // Mark all steps as completed when finished - but NEVER clear them
  useEffect(() => {
    if (isCompleted) {
      setSteps(prev => prev.map(step => ({
        ...step,
        isCompleted: true,
        isActive: false
      })))
      
      // Call onComplete but NEVER clear the steps
      onComplete?.()
    }
  }, [isCompleted, onComplete])

  // Show default thinking if no steps yet and actively typing
  if (steps.length === 0 && !isCompleted && !vectorSearchMetadata?.foundRelevantContent && searchStatus) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50 border-border mb-3">
        <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
        <span className="text-sm text-muted-foreground">Thinking...</span>
      </div>
    )
  }

  const getStageIcon = (stage: ThinkingStep['stage'], isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="w-4 h-4 text-emerald-500" />
    }
    
    switch (stage) {
      case 'analyzing':
        return <Search className={`w-4 h-4 text-blue-500 ${isActive ? 'animate-pulse' : ''}`} />
      case 'searching':
        return <Database className={`w-4 h-4 text-green-500 ${isActive ? 'animate-pulse' : ''}`} />
      case 'grading':
        return <Brain className={`w-4 h-4 text-purple-500 ${isActive ? 'animate-bounce' : ''}`} />
      case 'generating':
        return <Sparkles className={`w-4 h-4 text-amber-500 ${isActive ? 'animate-spin' : ''}`} />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />
    }
  }

  const getStageColors = (stage: ThinkingStep['stage']) => {
    switch (stage) {
      case 'analyzing':
        return {
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        }
      case 'searching':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800'
        }
      case 'grading':
        return {
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        }
      case 'generating':
        return {
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950/20',
          borderColor: 'border-amber-200 dark:border-amber-800'
        }
      case 'completed':
        return {
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800'
        }
      default:
        return {
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border'
        }
    }
  }

  // ALWAYS render if we have steps OR context - never hide anything
  return (
    <>
      {/* Progressive Thinking Steps - in collapsible dropdown */}
      {(steps.length > 0 || (vectorSearchMetadata?.foundRelevantContent && vectorSearchMetadata.relevantContent && vectorSearchMetadata.relevantContent.length > 0)) && (
        <div className="mb-4 border border-border bg-muted/30 rounded-lg">
          <button 
            className="w-full flex justify-between items-center p-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
          >
            <h4 className="text-sm font-medium text-foreground">
              {isCompleted ? 'Show thinking process' : (
                <span className="inline-flex items-center">
                  <span className="animate-pulse drop-shadow-[0_0_8px_rgba(255,223,57,0.6)]">Thinking...</span>
                </span>
              )}
            </h4>
            {isThinkingExpanded ? 
              <ChevronUp className="w-4 h-4 text-muted-foreground" /> : 
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            }
          </button>

          <AnimatePresence>
            {isThinkingExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-4">
                  {/* Progressive Thinking Steps */}
                  {steps.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Analysis Steps
                      </h5>
                      <div className="relative">
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-between sm:items-center">
                          <AnimatePresence>
                            {steps.map((step, index) => {
                              const colors = getStageColors(step.stage)
                              const opacity = step.isActive ? 1 : step.isCompleted ? 0.8 : 0.6
                              
                              return (
                                <motion.div
                                  key={step.id}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.3, ease: "easeOut" }}
                                  className={`flex items-start gap-2 px-3 py-2 rounded-md border ${colors.bgColor} ${colors.borderColor} min-w-0 relative z-10 sm:flex-1 ${
                                    step.isActive ? 'ring-2 ring-offset-2 ring-amber-500/50 shadow-lg' : ''
                                  }`}
                                >
                                  <div className="flex-shrink-0 mt-0.5">
                                    {getStageIcon(step.stage, step.isActive, step.isCompleted)}
                                  </div>
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span className={`text-sm font-medium ${colors.color} leading-tight`}>
                                      {step.message}
                                    </span>
                                    {step.submessage && (
                                      <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                                        {step.submessage}
                                      </span>
                                    )}
                                  </div>
                                </motion.div>
                              )
                            })}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Context Results - integrated into thinking process */}
                  {vectorSearchMetadata?.foundRelevantContent && 
                   vectorSearchMetadata.relevantContent && 
                   vectorSearchMetadata.relevantContent.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        Context Used ({vectorSearchMetadata.relevantContent.length} item{vectorSearchMetadata.relevantContent.length > 1 ? 's' : ''})
                      </h5>
                      <div className="space-y-2">
                        {vectorSearchMetadata.relevantContent.map((item, index) => (
                          <div key={index} className="flex items-start gap-3 p-2 bg-background border border-border rounded-md">
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
      )}
    </>
  )
} 