import React, { useState, useEffect } from 'react'
import { Search, Brain, Sparkles, Database, CheckCircle, Filter } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

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

interface ProgressiveThinkingIndicatorProps {
  searchStatus?: string
  statusHistory?: string[] // Array of all status updates
  onComplete?: () => void
  isCompleted?: boolean
}

export const ProgressiveThinkingIndicator: React.FC<ProgressiveThinkingIndicatorProps> = ({ 
  searchStatus = '', 
  statusHistory = [],
  onComplete,
  isCompleted = false
}) => {
  const [steps, setSteps] = useState<ThinkingStep[]>([])
  const [dots, setDots] = useState('')
  const [processedStatusCount, setProcessedStatusCount] = useState(0)

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
    
    quickCheck: {
      main: [
        "This one's easy",
        "Quick and simple",
        "Straightforward question",
        "No digging needed",
        "Got this covered"
      ],
      sub: [
        "No need to check your content for this",
        "This doesn't need your content history",
        "Straight to the point on this one",
        "Your question is self-contained",
        "No context hunting required"
      ]
    },
    
    vectorSearch: {
      main: [
        "Digging through all your stuff",
        "Browsing your content library",
        "Scanning your creative universe",
        "Exploring your content treasure",
        "Diving into your digital collection",
        "Surfing through your materials"
      ],
      sub: [
        "Scanning notes, conversations, and posts for good matches",
        "Looking for the perfect pieces to help with your question",
        "Hunting for relevant gems in your content",
        "Finding the best stuff to answer your question",
        "Searching for golden nuggets in your library",
        "Checking every corner for helpful content"
      ]
    },
    
    discovery: {
      main: [
        "Found {count} interesting pieces",
        "Discovered {count} potential gems",
        "Uncovered {count} useful items",
        "Located {count} relevant pieces",
        "Spotted {count} helpful bits",
        "Found {count} pieces of the puzzle"
      ],
      sub: [
        "Discovered some bits of content that might help",
        "Found some good stuff in your library",
        "Uncovered some relevant material",
        "Located some helpful pieces",
        "Spotted some useful content",
        "Found some perfect matches"
      ]
    },
    
    grading: {
      main: [
        "Sorting the gems from the good stuff",
        "Picking the cream of the crop",
        "Finding the absolute best pieces",
        "Curating your top content",
        "Selecting the perfect matches",
        "Choosing the golden pieces"
      ],
      sub: [
        "Checking each piece to see what actually helps with your question",
        "Using AI magic to find the most relevant bits",
        "Making sure we get only the good stuff",
        "Quality checking each piece for relevance",
        "Filtering for the absolute best matches",
        "Hand-picking the most useful content"
      ]
    },
    
    itemDecisions: {
      kept: [
        "Kept",
        "Love this one",
        "Perfect match",
        "This is gold",
        "Exactly what we need",
        "Spot on"
      ],
      filtered: [
        "Filtered",
        "Not quite right",
        "Doesn't fit",
        "Not this time",
        "Close but no cigar",
        "Not the vibe"
      ]
    },
    
    completion: {
      main: [
        "All done checking!",
        "Finished picking the good stuff",
        "Content curation complete",
        "Found the perfect mix",
        "All sorted and ready",
        "Mission accomplished"
      ],
      sub: [
        "Ready to craft your response",
        "Time to work some magic",
        "Let's create something awesome",
        "Ready to put it all together",
        "Time for the fun part",
        "Ready to make something great"
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

  // Animated dots for thinking effect
  useEffect(() => {
    if (isCompleted) return
    
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return ''
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isCompleted])

  // Helper function to clean status messages of emojis
  const cleanMessage = (message: string) => {
    return message.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
  }

  // Log grading step changes for debugging
  useEffect(() => {
    const gradingStep = steps.find(step => step.stage === 'grading')
    if (gradingStep) {
      console.log('🔍 [ProgressiveThinking] Grading step updated:', {
        stage: gradingStep.stage,
        isActive: gradingStep.isActive,
        hasDetails: !!gradingStep.details,
        details: gradingStep.details,
        hasDecisions: !!(gradingStep.details?.itemDecisions),
        decisionsLength: gradingStep.details?.itemDecisions?.length || 0
      })
    }
  }, [steps])

  // Process status history - handle all accumulated status updates
  useEffect(() => {
    // Only process new status updates that haven't been handled yet
    const newStatuses = statusHistory.slice(processedStatusCount);
    
    if (newStatuses.length === 0) return;
    
    console.log('🔍 [ProgressiveThinking] Processing new status updates:', newStatuses);
    console.log('🔍 [ProgressiveThinking] Total statusHistory length:', statusHistory.length);
    console.log('🔍 [ProgressiveThinking] Previously processed:', processedStatusCount);
    
    // Process each new status update
    newStatuses.forEach((currentStatus, index) => {
      console.log(`🔍 [ProgressiveThinking] Processing status ${processedStatusCount + index + 1}:`, currentStatus);
      
      // Process this status update (using existing logic)
      processStatusUpdate(currentStatus);
    });
    
    // Update the count of processed statuses
    setProcessedStatusCount(statusHistory.length);
  }, [statusHistory]);

  // Helper function to process individual status updates
  const processStatusUpdate = (searchStatus: string) => {
    const updateOrCreateStep = (stage: ThinkingStep['stage'], message: string, submessage?: string, details?: ThinkingStep['details'], shouldComplete: boolean = false) => {
      setSteps(prev => {
        const existingStepIndex = prev.findIndex(step => step.stage === stage)
        
        if (existingStepIndex >= 0) {
          // Update existing step
          const updatedSteps = [...prev]
          updatedSteps[existingStepIndex] = {
            ...updatedSteps[existingStepIndex],
            message: cleanMessage(message),
            submessage: submessage ? cleanMessage(submessage) : undefined,
            details: details || updatedSteps[existingStepIndex].details,
            isCompleted: shouldComplete,
            isActive: !shouldComplete
          }
          return updatedSteps
        } else {
          // Create new step and mark previous as completed
          const newStep: ThinkingStep = {
            id: `${stage}-${Date.now()}`,
            stage,
            message: cleanMessage(message),
            submessage: submessage ? cleanMessage(submessage) : undefined,
            timestamp: new Date(),
            isCompleted: shouldComplete,
            isActive: !shouldComplete,
            details
          }
          
          // Mark previous steps as completed
          const updatedSteps = prev.map(step => ({
            ...step,
            isCompleted: true,
            isActive: false
          }))
          
          return [...updatedSteps, newStep]
        }
      })
    }

    // Intent analysis phase
    if (searchStatus.includes('Analyzing whether your query needs context')) {
      updateOrCreateStep('analyzing', getRandomMessage(messagePools.intentAnalysis.main), getRandomMessage(messagePools.intentAnalysis.sub))
    }
    // Context decision
    else if (searchStatus.includes('Query needs context - proceeding with vector search')) {
      updateOrCreateStep('analyzing', getRandomMessage(messagePools.contextNeeded.main), getRandomMessage(messagePools.contextNeeded.sub), undefined, true)
    }
    else if (searchStatus.includes('Query needs context (heuristic)')) {
      updateOrCreateStep('analyzing', getRandomMessage(messagePools.contextNeeded.main), 'Quick check - let me look through your stuff', undefined, true)
    }
    else if (searchStatus.includes('Query is self-contained')) {
      updateOrCreateStep('analyzing', getRandomMessage(messagePools.quickCheck.main), getRandomMessage(messagePools.quickCheck.sub), undefined, true)
      // Auto-transition to generation for self-contained queries
      setTimeout(() => {
        updateOrCreateStep('generating', getRandomMessage(messagePools.generation.main), getRandomMessage(messagePools.generation.sub))
      }, 1000)
    }
    // Vector search phase
    else if (searchStatus.includes('Looking through all your content')) {
      updateOrCreateStep('searching', getRandomMessage(messagePools.vectorSearch.main), getRandomMessage(messagePools.vectorSearch.sub))
    }
    else if (searchStatus.includes('Searching your content')) {
      updateOrCreateStep('searching', getRandomMessage(messagePools.vectorSearch.main), getRandomMessage(messagePools.vectorSearch.sub))
    }
    else if (searchStatus.includes('Discovered') && searchStatus.includes('potentially relevant items')) {
      const match = searchStatus.match(/Discovered (\d+) potentially relevant items/)
      const itemCount = match ? parseInt(match[1]) : 0
      console.log('🔍 [ProgressiveThinking] Discovered items:', { itemCount, searchStatus });
      updateOrCreateStep('searching', getRandomMessage(messagePools.discovery.main, itemCount), getRandomMessage(messagePools.discovery.sub), undefined, true)
    }
    else if (searchStatus.includes('Finding your best relevant context')) {
      console.log('🔍 [ProgressiveThinking] Finding best relevant context:', searchStatus);
      updateOrCreateStep('searching', getRandomMessage(messagePools.vectorSearch.main), 'Finding the most useful info from your content')
    }
    // Grading phase
    else if (searchStatus.includes('Analyzing relevance across your content')) {
      console.log('🔍 [ProgressiveThinking] Creating grading step for relevance analysis');
      updateOrCreateStep('grading', getRandomMessage(messagePools.grading.main), getRandomMessage(messagePools.grading.sub), {
        itemsKept: 0,
        itemsFiltered: 0,
        itemsProcessed: 0,
        itemDecisions: []
      })
    }
    else if (searchStatus.includes('Examining each item for relevance')) {
      console.log('🔍 [ProgressiveThinking] Creating grading step for item examination');
      updateOrCreateStep('grading', getRandomMessage(messagePools.grading.main), getRandomMessage(messagePools.grading.sub), {
        itemsKept: 0,
        itemsFiltered: 0,
        itemsProcessed: 0,
        itemDecisions: []
      })
    }
    else if (searchStatus.includes('Analyzing AI grading quality')) {
      console.log('🔍 [ProgressiveThinking] Updating grading step for AI quality check');
      updateOrCreateStep('grading', getRandomMessage(messagePools.grading.main), 'Making sure we got the good stuff')
    }
    else if (searchStatus.includes('Backend AI gave generic responses')) {
      console.log('🔍 [ProgressiveThinking] Updating grading step for strict filtering');
      updateOrCreateStep('grading', getRandomMessage(messagePools.grading.main), 'AI was being too generous - applying stricter standards')
    }
    else if (searchStatus.includes('Backend AI gave generic responses - applying strict criteria')) {
      console.log('🔍 [ProgressiveThinking] Backend AI generic responses - applying strict criteria');
      updateOrCreateStep('grading', getRandomMessage(messagePools.grading.main), 'AI was too loose - switching to tighter quality checks', {
        itemsKept: 0,
        itemsFiltered: 0,
        itemsProcessed: 0,
        itemDecisions: []
      })
    }
    // Individual item decisions - update grading step with running totals
    else if (searchStatus.includes('✅') || searchStatus.includes('❌')) {
      console.log('🔍 [ProgressiveThinking] Potential individual item detected:', searchStatus);
      
      const isKept = searchStatus.includes('✅')
      
      // More comprehensive regex to match various quote formats
      const titleMatch = searchStatus.match(/"([^"]+)"/) || 
                        searchStatus.match(/""([^"]+)"/) || 
                        searchStatus.match(/✅\s*"([^"]+)"/) || 
                        searchStatus.match(/❌\s*"([^"]+)"/) ||
                        searchStatus.match(/✅\s*""([^"]+)"/) || 
                        searchStatus.match(/❌\s*""([^"]+)"/)
      
      // Match reason patterns - handle cases with and without " - "
      const reasonMatch = searchStatus.match(/- (.+?)(?:\s*\(\d+|\s*$)/) || 
                         searchStatus.match(/- (.+)$/) ||
                         searchStatus.match(/(high quality content)/) ||
                         searchStatus.match(/(Exceeded item limit)/)
      
      console.log('🔍 [ProgressiveThinking] Individual item parsing:', { 
        isKept, 
        titleMatch: titleMatch ? titleMatch[1] : null, 
        reasonMatch: reasonMatch ? reasonMatch[1] : null,
        fullStatus: searchStatus 
      });
      
      if (titleMatch) {
        const title = titleMatch[1].substring(0, 60) + (titleMatch[1].length > 60 ? '...' : '')
        const reason = reasonMatch ? reasonMatch[1].trim() : (isKept ? 'high quality content' : 'filtered out')
        
        console.log('🔍 [ProgressiveThinking] Processing individual item:', { title, reason, isKept });
        
        // Process immediately without delay
        setSteps(prev => {
          console.log('🔍 [ProgressiveThinking] Current steps when processing item:', prev.map(s => ({ stage: s.stage, message: s.message, isActive: s.isActive })));
          
          let gradingStepIndex = prev.findIndex(step => step.stage === 'grading')
          console.log('🔍 [ProgressiveThinking] Grading step index:', gradingStepIndex);
          
          // If no grading step exists, create one
          if (gradingStepIndex === -1) {
            console.log('🔍 [ProgressiveThinking] Creating grading step for individual item');
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
            
            // Mark previous steps as completed and add the new grading step
            const updatedSteps = prev.map(step => ({
              ...step,
              isCompleted: true,
              isActive: false
            }))
            
            prev = [...updatedSteps, gradingStep]
            gradingStepIndex = prev.length - 1
          }
          
          const updatedSteps = [...prev]
          const currentStep = updatedSteps[gradingStepIndex]
          const prevDetails = currentStep.details || { itemsKept: 0, itemsFiltered: 0, itemsProcessed: 0, itemDecisions: [] }
          
          console.log('🔍 [ProgressiveThinking] Previous details before update:', prevDetails);
          
          const newKept = prevDetails.itemsKept + (isKept ? 1 : 0)
          const newFiltered = prevDetails.itemsFiltered + (isKept ? 0 : 1)
          const newProcessed = prevDetails.itemsProcessed + 1
          
          // Add this decision to the list
          const newDecision = {
            title,
            reason: cleanMessage(reason),
            isKept,
            timestamp: new Date()
          }
          
          const newDecisions = [...(prevDetails.itemDecisions || []), newDecision]
          
          console.log('🔍 [ProgressiveThinking] New counts after update:', { newKept, newFiltered, newProcessed });
          console.log('🔍 [ProgressiveThinking] New decision added:', newDecision);
          
          // Update the grading step with new information
          updatedSteps[gradingStepIndex] = {
            ...currentStep,
            message: `Checking content (${newKept} kept, ${newFiltered} filtered)`,
            submessage: `Latest: ${getRandomMessage(messagePools.itemDecisions[isKept ? 'kept' : 'filtered'])} "${title}" - ${reason}`,
            details: {
              itemsKept: newKept,
              itemsFiltered: newFiltered,
              itemsProcessed: newProcessed,
              itemDecisions: newDecisions
            },
            // Always keep active to continue receiving updates
            isCompleted: false,
            isActive: true,
            timestamp: new Date() // Update timestamp to show recent activity
          }
          
          console.log('🔍 [ProgressiveThinking] Updated grading step:', updatedSteps[gradingStepIndex]);
          
          return updatedSteps
        })
      } else {
        console.log('🔍 [ProgressiveThinking] Could not parse individual item title from:', searchStatus);
      }
    }
    // Completion messages - only transition to generation, don't mark grading as complete yet
    else if (
      searchStatus.includes('Quality filtering complete') ||
      searchStatus.includes('Found') && searchStatus.includes('highly relevant items') ||
      searchStatus.includes('Analysis complete') ||
      searchStatus.includes('All') && searchStatus.includes('items passed quality checks')
    ) {
      console.log('🔍 [ProgressiveThinking] Completion message received (not marking grading complete yet):', searchStatus);
      
      // Don't mark grading as complete here - let individual items continue to arrive
      // Just log that we received the completion message
    }
    // Direct generation start - now we can mark grading as complete and start generation
    else if (searchStatus.includes('Generating your response')) {
      console.log('🔍 [ProgressiveThinking] Generation starting - marking grading as complete');
      
      // Mark grading step as completed now that generation is starting
      setSteps(prev => {
        const gradingStepIndex = prev.findIndex(step => step.stage === 'grading')
        if (gradingStepIndex >= 0) {
          const updatedSteps = [...prev]
          const currentStep = updatedSteps[gradingStepIndex]
          
          // Extract final counts from current step
          const finalCounts = currentStep.details
          let finalMessage = getRandomMessage(messagePools.completion.main)
          let finalSubmessage = getRandomMessage(messagePools.completion.sub)
          
          if (finalCounts?.itemsKept !== undefined && finalCounts?.itemsFiltered !== undefined) {
            finalMessage = `Finished picking the good stuff`
            finalSubmessage = `Selected ${finalCounts.itemsKept} useful pieces, filtered ${finalCounts.itemsFiltered} items`
          }
          
          updatedSteps[gradingStepIndex] = {
            ...currentStep,
            message: finalMessage,
            submessage: finalSubmessage,
            isCompleted: true,
            isActive: false
          }
          
          console.log('🔍 [ProgressiveThinking] Marked grading step as complete:', updatedSteps[gradingStepIndex]);
          return updatedSteps
        }
        return prev
      })
      
      // Start generation step
      updateOrCreateStep('generating', getRandomMessage(messagePools.generation.main), getRandomMessage(messagePools.generation.sub))
    }
    // Catch-all for debugging unhandled messages
    else {
      console.log('🔍 [ProgressiveThinking] Unhandled status message:', searchStatus);
    }
  }

  // Handle completion - clear all steps only when generation is completely done
  useEffect(() => {
    if (isCompleted) {
      // Only clear steps when generation is completely finished
      setTimeout(() => {
        setSteps([])
        onComplete?.()
      }, 1000) // Give users time to see the full process before clearing
    }
  }, [isCompleted, onComplete])

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
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        }
      case 'searching':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800'
        }
      case 'grading':
        return {
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        }
      case 'generating':
        return {
          color: 'text-amber-600',
          bgColor: 'bg-amber-50 dark:bg-amber-950/20',
          borderColor: 'border-amber-200 dark:border-amber-800'
        }
      case 'completed':
        return {
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800'
        }
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
          borderColor: 'border-gray-200 dark:border-gray-800'
        }
    }
  }

  // Show nothing if completed (don't show fallback "thinking")
  if (isCompleted) {
    return null
  }

  // Show default thinking if no steps yet
  if (steps.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 p-3 rounded-lg border bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800">
        <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Thinking{dots}</span>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-w-2xl">
      <AnimatePresence>
        {steps.map((step) => {
          const colors = getStageColors(step.stage)
          const opacity = step.isActive ? 1 : step.isCompleted ? 0.7 : 0.5
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`border rounded-lg p-3 ${colors.bgColor} ${colors.borderColor}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStageIcon(step.stage, step.isActive, step.isCompleted)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${colors.color}`}>
                    {step.message}
                    {step.isActive && !step.isCompleted && dots}
                  </div>
                  
                  {step.submessage && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {step.submessage}
                    </div>
                  )}
                  
                  {/* Show progress indicators for grading phase */}
                  {step.stage === 'grading' && step.details && (
                    <div className="mt-2 space-y-2">
                      {/* Summary counters */}
                      <div className="flex items-center gap-3 text-xs">
                        {step.details.itemsProcessed !== undefined && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Filter className="w-3 h-3" />
                            <span>Processed {step.details.itemsProcessed}</span>
                          </div>
                        )}
                        {step.details.itemsKept !== undefined && step.details.itemsKept > 0 && (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>Kept {step.details.itemsKept}</span>
                          </div>
                        )}
                        {step.details.itemsFiltered !== undefined && step.details.itemsFiltered > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <Filter className="w-3 h-3" />
                            <span>Filtered {step.details.itemsFiltered}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Individual item decisions - show for both active and completed steps */}
                      {step.details.itemDecisions && step.details.itemDecisions.length > 0 && (
                        <div className="max-h-40 overflow-y-auto space-y-1 bg-gray-50 dark:bg-gray-900/50 rounded p-3 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Individual decisions ({step.details.itemDecisions.length} items):
                          </div>
                          {step.details.itemDecisions.map((decision, index) => (
                            <div key={index} className="flex items-start gap-2 text-xs py-1">
                              <span className={`flex-shrink-0 font-bold ${decision.isKept ? 'text-emerald-600' : 'text-red-600'}`}>
                                {decision.isKept ? '✓' : '✗'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-gray-100 truncate text-xs">
                                  "{decision.title}"
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">
                                  {decision.reason}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Show waiting message if no decisions yet but step is active */}
                      {step.isActive && (!step.details.itemDecisions || step.details.itemDecisions.length === 0) && (
                        <div className="text-xs text-gray-500 italic p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                          Waiting for individual content decisions...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
} 