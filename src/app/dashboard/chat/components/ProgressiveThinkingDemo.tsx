import React, { useState } from 'react'
import { ProgressiveThinkingIndicator } from './main_chat/ProgressiveThinkingIndicator'

const ProgressiveThinkingDemo: React.FC = () => {
  const [currentStatus, setCurrentStatus] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const simulateEnhancedThinkingProcess = async () => {
    setIsRunning(true)
    setIsCompleted(false)
    setCurrentStatus('')

    const statusUpdates = [
      { status: '🧐 Analyzing whether your query needs context...', delay: 800 },
      { status: '✅ Query needs context - proceeding with vector search', delay: 1200 },
      { status: '🔍 Looking through all your content...', delay: 1000 },
      { status: '🎯 Discovered 8 potentially relevant items', delay: 1500 },
      { status: '🧠 Analyzing AI grading quality...', delay: 800 },
      { status: '🔍 Examining each item for relevance...', delay: 1000 },
      { status: '✅ "Instagram Post: CSULB Campus Life..." - high quality content (87.3%)', delay: 800 },
      { status: '❌ "Email Thread: No Subject" - contains broken data patterns', delay: 600 },
      { status: '✅ "YouTube Video: Student Life at CSULB..." - relevant content (74.8%)', delay: 800 },
      { status: '❌ "Instagram Post: Random Sunset..." - relevance score too low (41.2%)', delay: 600 },
      { status: '✅ "Note: CSULB Influencer Research..." - passed standard filtering (91.5%)', delay: 800 },
      { status: '❌ "Gmail Thread: Unknown Sender..." - generic response from AI', delay: 600 },
      { status: '❌ "Instagram Post: Breakfast Photo..." - not relevant for query (38.9%)', delay: 700 },
      { status: '❌ "YouTube Video: Cooking Tutorial..." - content too short (52.1%)', delay: 650 },
      { status: '🎯 Quality filtering complete: kept 3 items, filtered 5 items', delay: 1000 },
      { status: '✨ Generating your response...', delay: 800 },
    ]

    for (const update of statusUpdates) {
      setCurrentStatus(update.status)
      await new Promise(resolve => setTimeout(resolve, update.delay))
    }

    setIsCompleted(true)
    setIsRunning(false)
  }

  const resetDemo = () => {
    setCurrentStatus('')
    setIsCompleted(false)
    setIsRunning(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Enhanced Progressive Thinking Demo
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Experience the new verbose thinking system that shows exactly what's being analyzed and filtered
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={simulateEnhancedThinkingProcess}
            disabled={isRunning}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {isRunning ? 'Thinking...' : 'Start Enhanced Thinking Demo'}
          </button>
          
          <button
            onClick={resetDemo}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Reset Demo
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Query: "Can you give me some examples of CSULB student influencers who might be a good fit?"
        </h3>
        
        <div className="min-h-[300px]">
          {(isRunning || isCompleted || currentStatus) && (
            <ProgressiveThinkingIndicator 
              searchStatus={currentStatus}
              isCompleted={isCompleted}
              onComplete={() => {
                console.log('Enhanced thinking demo completed!')
              }}
            />
          )}
          
          {!isRunning && !isCompleted && !currentStatus && (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              Click "Start Enhanced Thinking Demo" to see the verbose thinking process
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          ✨ Enhanced Features:
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• <strong>Specific item examination:</strong> Shows exactly which content is being analyzed</li>
          <li>• <strong>Real-time filtering decisions:</strong> See items being kept or filtered with reasons</li>
          <li>• <strong>Relevance scores:</strong> Display confidence percentages for each item</li>
          <li>• <strong>Quality validation:</strong> Frontend AI grading validation with specific criteria</li>
          <li>• <strong>Progressive disclosure:</strong> Steps build on each other like Cursor's thinking</li>
          <li>• <strong>Detailed summaries:</strong> Final counts and reasoning for all decisions</li>
        </ul>
      </div>
    </div>
  )
}

export default ProgressiveThinkingDemo 