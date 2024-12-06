'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Brain, TrendingUp, Target, Share2, 
  ChevronRight, ArrowRight, Clock, MessageSquare
} from 'lucide-react'
import { AIActionableInsight } from '@/types'
import { useRouter } from 'next/navigation'
import { actionableInsights } from '@/data/insights'

export function AIInsightsScreen() {
  const [selectedInsight, setSelectedInsight] = useState<number | null>(null)
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  function discussWithAI(insight: AIActionableInsight) {
    setIsLoading(true)
    router.push(`/chat?context=${insight.id}`)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="shrink-0 px-6 py-4 border-b bg-white dark:bg-gray-900 dark:border-gray-800">
        <h1 className="text-lg font-semibold mb-1 dark:text-white">AI Insights</h1>
        <p className="text-gray-600 dark:text-gray-400">Personalized recommendations for your content strategy</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto dark:bg-gray-900">
        <div className="p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Welcome Banner */}
            {isFirstVisit && (
              <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-xl">
                <h1 className="text-2xl font-semibold mb-2 dark:text-white">
                  Welcome to Your AI Content Manager
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  I've analyzed your content and found several opportunities to help you grow. 
                  Here are your personalized insights:
                </p>
                <button 
                  onClick={() => setIsFirstVisit(false)}
                  className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                >
                  Got it →
                </button>
              </div>
            )}

            {/* Cards */}
            <div className="grid gap-6">
              {actionableInsights.map((insight) => (
                <Card key={insight.id} className="overflow-hidden">
                  {/* Clickable Header */}
                  <div 
                    onClick={() => setSelectedInsight(selectedInsight === insight.id ? null : insight.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedInsight === insight.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          insight.type === 'content' 
                            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                            : insight.type === 'platform' 
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                            : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {insight.type === 'content' ? <Brain className="w-4 h-4" /> :
                           insight.type === 'platform' ? <Share2 className="w-4 h-4" /> :
                           <Target className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="font-medium dark:text-white">{insight.opportunity.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Impact: {insight.opportunity.impact}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600 dark:text-green-400">
                            {insight.opportunity.confidence}% Confidence
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {insight.action.timeToImplement}
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-200
                          ${selectedInsight === insight.id ? 'rotate-90' : ''}`} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {selectedInsight === insight.id && (
                    <div className="p-4 border-t dark:border-gray-700 space-y-4">
                      {/* Why Now Section */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                        <h4 className="font-medium dark:text-white">Why Now?</h4>
                        <ul className="space-y-2">
                          {insight.context.why.map((reason: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                              <span className="mt-1">•</span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Steps */}
                      <div>
                        <h4 className="font-medium dark:text-white mb-3">Action Steps</h4>
                        <div className="space-y-2">
                          {insight.action.steps.map((step: string, idx: number) => (
                            <button
                              key={idx}
                              className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                              <span className="text-sm dark:text-gray-300">{step}</span>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Expected Outcome */}
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">Expected Outcome</h4>
                        <p className="text-sm text-green-600 dark:text-green-400">{insight.action.expectedOutcome}</p>
                      </div>

                      {/* Discuss with IRIS */}
                      <button
                        onClick={() => discussWithAI(insight)}
                        className="flex items-center gap-2 text-sm text-purple-500 dark:text-purple-400"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Discuss with IRIS
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 