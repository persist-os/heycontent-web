'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Brain, TrendingUp, Target, Share2, 
  ChevronRight, ArrowRight, Clock, MessageSquare
} from 'lucide-react'
import { AIActionableInsight } from '@/types'
import { useRouter } from 'next/navigation'

export function AIInsightsScreen() {
  const [selectedInsight, setSelectedInsight] = useState<number | null>(null)
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const router = useRouter()

  const actionableInsights: AIActionableInsight[] = [
    {
      id: 1,
      type: 'content',
      opportunity: {
        title: "High-Impact Tutorial Series",
        description: "Your audience is showing strong interest in React Native content",
        impact: "2-3x normal engagement",
        timing: "Next 48 hours optimal",
        confidence: 92
      },
      action: {
        steps: [
          "Create 3-part tutorial series on React Native basics",
          "Include downloadable starter code",
          "End with common troubleshooting guide"
        ],
        timeToImplement: "2-3 days",
        expectedOutcome: "85% engagement rate, 2x subscriber growth",
        requirements: ["React Native setup", "Basic examples prepared", "Recording equipment"]
      },
      context: {
        why: [
          "Search volume up 45% this week",
          "Competitor content gap identified",
          "Your React tutorials perform 2x better"
        ],
        data: ["Search trends", "Audience requests", "Content performance"]
      }
    },
    {
      id: 2,
      type: 'platform',
      opportunity: {
        title: "TikTok Growth Opportunity",
        description: "Your tutorial style perfect for TikTok's format",
        impact: "50K-100K views potential",
        timing: "Platform algorithm favoring tech content",
        confidence: 88
      },
      action: {
        steps: [
          "Convert top YouTube tutorial to 3x60s clips",
          "Add code overlay animations",
          "Include hook in first 2 seconds"
        ],
        timeToImplement: "1 day",
        expectedOutcome: "10K new followers, cross-platform growth",
        requirements: ["Vertical video format", "Quick hooks", "Visual code examples"]
      },
      context: {
        why: [
          "Tech tutorials trending on TikTok",
          "Your teaching style matches platform",
          "Untapped audience potential"
        ],
        data: ["Platform trends", "Content analysis", "Audience overlap"]
      }
    },
    {
      id: 3,
      type: 'market',
      opportunity: {
        title: "Beginner Developer Focus",
        description: "Large audience gap in beginner-friendly content",
        impact: "40K potential new followers",
        timing: "Growing demand identified",
        confidence: 85
      },
      action: {
        steps: [
          "Create 'Zero to Hero' series",
          "Focus on common beginner challenges",
          "Include practice projects"
        ],
        timeToImplement: "1 week",
        expectedOutcome: "35% audience growth, high engagement",
        requirements: ["Beginner perspective", "Step-by-step format", "Practice materials"]
      },
      context: {
        why: [
          "50% of searches from beginners",
          "High demand for foundational content",
          "Low competition in this niche"
        ],
        data: ["Search analytics", "Comments analysis", "Market research"]
      }
    },
    {
      id: 4,
      type: 'content',
      opportunity: {
        title: "Email List Growth Strategy",
        description: "High conversion potential from your tutorial viewers",
        impact: "3K+ email subscribers",
        timing: "Ready to implement",
        confidence: 89
      },
      action: {
        steps: [
          "Create PDF cheat sheet for top tutorial",
          "Add targeted CTA at key moments",
          "Set up automated welcome sequence"
        ],
        timeToImplement: "2 days",
        expectedOutcome: "25% conversion rate from viewers",
        requirements: ["Lead magnet", "Email service", "Landing page"]
      },
      context: {
        why: [
          "85% of comments asking for resources",
          "Similar creators seeing 3x list growth",
          "Perfect timing with upcoming series"
        ],
        data: ["Comment analysis", "Industry benchmarks", "Current funnel metrics"]
      }
    },
    {
      id: 5,
      type: 'platform',
      opportunity: {
        title: "LinkedIn Article Series",
        description: "Your technical insights perfect for professional audience",
        impact: "25K+ views per article",
        timing: "Tech hiring season approaching",
        confidence: 91
      },
      action: {
        steps: [
          "Convert top tutorials to long-form articles",
          "Add career growth insights",
          "Include real-world applications"
        ],
        timeToImplement: "3-4 days",
        expectedOutcome: "Strong professional network growth",
        requirements: ["Article templates", "Code examples", "Career insights"]
      },
      context: {
        why: [
          "LinkedIn algo favoring technical content",
          "Developer hiring season starting",
          "Your content style matches platform"
        ],
        data: ["Platform trends", "Seasonal analysis", "Content performance"]
      }
    },
    {
      id: 6,
      type: 'market',
      opportunity: {
        title: "Workshop Series Opportunity",
        description: "High demand for live coding sessions",
        impact: "5K-8K revenue potential",
        timing: "Launch in 2 weeks",
        confidence: 87
      },
      action: {
        steps: [
          "Plan 4-part workshop series",
          "Create project-based curriculum",
          "Set up registration system"
        ],
        timeToImplement: "2 weeks",
        expectedOutcome: "$7K revenue, community growth",
        requirements: ["Workshop outline", "Project materials", "Marketing plan"]
      },
      context: {
        why: [
          "Competitors charging 2x more",
          "Your audience requesting live sessions",
          "Perfect for your teaching style"
        ],
        data: ["Market pricing", "Audience surveys", "Engagement metrics"]
      }
    },
    {
      id: 7,
      type: 'content',
      opportunity: {
        title: "Short-Form Code Tips",
        description: "Huge potential in quick problem-solving content",
        impact: "100K+ views per tip",
        timing: "Current trend peak",
        confidence: 94
      },
      action: {
        steps: [
          "Create 10 quick code solution videos",
          "Focus on common dev problems",
          "Add satisfying before/after",
        ],
        timeToImplement: "5 days",
        expectedOutcome: "Rapid follower growth across platforms",
        requirements: ["Problem collection", "Solution demos", "Visual templates"]
      },
      context: {
        why: [
          "Short-form coding content trending",
          "High search volume for solutions",
          "Perfect for cross-platform sharing"
        ],
        data: ["Platform analytics", "Search trends", "Engagement rates"]
      }
    },
    {
      id: 8,
      type: 'platform',
      opportunity: {
        title: "Twitter Thread Strategy",
        description: "Build authority with technical insights",
        impact: "50K+ impressions per thread",
        timing: "Tech Twitter very active",
        confidence: 88
      },
      action: {
        steps: [
          "Create 5 technical thread templates",
          "Share daily coding insights",
          "Engage with tech community"
        ],
        timeToImplement: "1 week",
        expectedOutcome: "Strong tech following, partnership opportunities",
        requirements: ["Content calendar", "Thread templates", "Code snippets"]
      },
      context: {
        why: [
          "Tech Twitter engagement up 40%",
          "Your thread style performing well",
          "Perfect for building authority"
        ],
        data: ["Platform metrics", "Engagement analysis", "Content testing"]
      }
    }
  ]

  function discussWithAI(insight: AIActionableInsight) {
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

                      {/* Discuss with AI */}
                      <button
                        onClick={() => discussWithAI(insight)}
                        className="flex items-center gap-2 text-sm text-purple-500 dark:text-purple-400"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Discuss with AI
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