import React, { useState } from 'react'
import { HorizontalProgressiveThinking } from './main_chat/HorizontalProgressiveThinking'

const ProgressiveThinkingDemo: React.FC = () => {
  const [currentStatus, setCurrentStatus] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [mockVectorSearchMetadata, setMockVectorSearchMetadata] = useState<any>(null)

  const simulateEnhancedThinkingProcess = async () => {
    setIsRunning(true)
    setIsCompleted(false)
    setCurrentStatus('')
    setMockVectorSearchMetadata(null)

    const statusUpdates = [
      { status: 'Analyzing whether your query needs context...', delay: 800 },
      { status: 'Query needs context - proceeding with vector search', delay: 1200 },
      { status: 'Looking through all your content...', delay: 1000 },
      { status: 'Discovered 8 potentially relevant items', delay: 1500 },
      { status: 'Analyzing AI grading quality...', delay: 800 },
      { status: 'Examining each item for relevance...', delay: 1000 },
      { status: '"Instagram Post: CSULB Campus Life..." - high quality content (87.3%)', delay: 800 },
      { status: '"Email Thread: No Subject" - contains broken data patterns', delay: 600 },
      { status: '"YouTube Video: Student Life at CSULB..." - relevant content (74.8%)', delay: 800 },
      { status: '"Instagram Post: Random Sunset..." - relevance score too low (41.2%)', delay: 600 },
      { status: '"Note: CSULB Influencer Research..." - passed standard filtering (91.5%)', delay: 800 },
      { status: '"Gmail Thread: Unknown Sender..." - generic response from AI', delay: 600 },
      { status: '"Instagram Post: Breakfast Photo..." - not relevant for query (38.9%)', delay: 700 },
      { status: '"YouTube Video: Cooking Tutorial..." - content too short (52.1%)', delay: 650 },
      { status: 'Quality filtering complete: kept 3 items, filtered 5 items', delay: 1000 },
      { status: 'Generating your response...', delay: 800 },
    ]

    for (const update of statusUpdates) {
      setCurrentStatus(update.status)
      await new Promise(resolve => setTimeout(resolve, update.delay))
    }

    // Set mock vector search metadata to show the final context
    setMockVectorSearchMetadata({
      foundRelevantContent: true,
      relevantContent: [
        {
          title: "Instagram Post: CSULB Campus Life - Behind the Scenes",
          contentType: "instagram",
          score: 0.873
        },
        {
          title: "YouTube Video: Student Life at CSULB - Day in the Life",
          contentType: "youtube", 
          score: 0.748
        },
        {
          title: "Note: CSULB Influencer Research and Analysis",
          contentType: "note",
          score: 0.915
        }
      ]
    })

    setIsCompleted(true)
    setIsRunning(false)
  }

  const resetDemo = () => {
    setCurrentStatus('')
    setIsCompleted(false)
    setIsRunning(false)
    setMockVectorSearchMetadata(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          Horizontal Progressive Thinking Demo
        </h2>
        <p className="text-muted-foreground">
          Experience the new horizontal thinking system that shows exactly what's being analyzed and persists permanently after completion
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={simulateEnhancedThinkingProcess}
            disabled={isRunning}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {isRunning ? 'Thinking...' : 'Start Horizontal Thinking Demo'}
          </button>
          
          <button
            onClick={resetDemo}
            className="px-6 py-3 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
          >
            Reset Demo
          </button>
        </div>
      </div>

      <div className="bg-background rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Query: "Can you give me some examples of CSULB student influencers who might be a good fit?"
        </h3>
        
        <div className="min-h-[200px]">
          {(isRunning || isCompleted || currentStatus) && (
            <HorizontalProgressiveThinking 
              searchStatus={currentStatus}
              isCompleted={isCompleted}
              vectorSearchMetadata={mockVectorSearchMetadata}
              onComplete={() => {
                console.log('Horizontal thinking demo completed!')
              }}
            />
          )}
          
          {!isRunning && !isCompleted && !currentStatus && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Click "Start Horizontal Thinking Demo" to see the new horizontal thinking process
            </div>
          )}
        </div>
      </div>

      <div className="bg-muted/50 rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold mb-3 text-foreground">
          Enhanced Features:
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Horizontal Layout:</strong> Steps flow horizontally and wrap to multiple lines</li>
          <li>• <strong>Permanent Display:</strong> Context and thinking process never disappears after completion</li>
          <li>• <strong>Integrated Context:</strong> Replaces the old dropdown with an integrated expandable section</li>
          <li>• <strong>Real-time Updates:</strong> See items being kept or filtered with reasons</li>
          <li>• <strong>Progressive Disclosure:</strong> Steps build on each other like Cursor's thinking</li>
          <li>• <strong>Minimalist Design:</strong> Clean, semantic colors following design system</li>
        </ul>
      </div>
    </div>
  )
}

export default ProgressiveThinkingDemo 