'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Send, Plus, Paperclip, Search,
  Clock, Star, Archive, History,
  ChevronRight, Filter, Calendar,
  Zap, Target, Edit3, TrendingUp,
  MessageSquare, Brain, Settings,
  Users, DollarSign, Activity, Globe, Video
} from 'lucide-react'
import { ChatMessage, ChatHistory, InsightReference } from '@/types'
import { actionableInsights } from '@/data/insights'
import { useSession } from 'next-auth/react'

interface AIActionableInsight {
  id: number;
  opportunity: {
    title: string;
  };
}

const ChatScreen = () => {
  const { data: session, status } = useSession()

  // Live rotating insights
  const liveInsights = [
    "Engagement up 23% in last hour",
    "3 high-value comments need response",
    "New audience segment emerging",
    "Optimal posting window in 2 hours"
  ]

  // State declarations
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAmbient, setShowAmbient] = useState(true)
  const [currentInsight, setCurrentInsight] = useState(0)
  const [activeInsight, setActiveInsight] = useState<InsightReference | null>(null)

  // Effects - Move all useEffect hooks here, before any conditional returns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % liveInsights.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const insightId = params.get('context')
    
    if (insightId) {
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: `I noticed you're interested in discussing the insight about ${
            actionableInsights.find((insight: AIActionableInsight) => insight.id === Number(insightId))?.opportunity.title
          }. What would you like to know more about?`,
          timestamp: new Date().toISOString(),
          relatedInsights: [{
            id: Number(insightId),
            type: 'reference',
            summary: actionableInsights.find((insight: AIActionableInsight) => insight.id === Number(insightId))?.opportunity.title || '',
            timestamp: new Date().toISOString()
          }]
        }
      ])
    }
  }, [])

  // Loading state
  if (status === 'loading') return null

  // Sample chat history
  const chatHistory: ChatHistory[] = [
    {
      id: 1,
      topic: 'Content Strategy Analysis',
      preview: "Let's analyze your recent content performance...",
      date: '2024-12-01',
      messages: [
        { 
          id: 1, 
          type: 'user' as const, 
          content: 'Can you analyze my content strategy?', 
          timestamp: new Date().toISOString() 
        },
        { 
          id: 2, 
          type: 'ai' as const,  
          content: "Let's analyze your recent content performance...", 
          timestamp: new Date().toISOString() 
        }
      ],
      starred: true
    },
    {
      id: 2,
      topic: 'Partnership Opportunities',
      preview: "I've identified 3 potential partnership opportunities...",
      date: '2024-11-30',
      messages: [
        { 
          id: 1, 
          type: 'user' as const, 
          content: 'What partnership opportunities do you see?', 
          timestamp: new Date().toISOString() 
        },
        { 
          id: 2, 
          type: 'ai' as const,  
          content: "I've identified 3 potential partnerships...", 
          timestamp: new Date().toISOString() 
        }
      ],
      starred: false
    }
  ]

  // Ambient insights
  const ambientInsights = [
    {
      type: 'trend',
      title: 'Trending Topic Alert',
      description: 'Tech tutorials gaining 45% more engagement',
      icon: TrendingUp,
      action: "Tell me more about content trends"
    },
    {
      type: 'opportunity',
      title: 'Partnership Match',
      description: 'New brand alignment: TechCo (94% match)',
      icon: Target,
      action: "Show partnership details"
    },
    {
      type: 'content',
      title: 'Content Gap Found',
      description: 'Missing key topic: AI Development basics',
      icon: Edit3,
      action: "Generate content ideas"
    },
    {
      type: 'performance',
      title: 'Performance Spike',
      description: 'Latest video outperforming by 2x',
      icon: Zap,
      action: "Analyze performance factors"
    },
    {
      type: 'audience',
      title: 'Audience Growth Opportunity',
      description: 'Similar creators growing 3x faster with short-form content',
      icon: Users,
      action: "Explore growth strategy"
    },
    {
      type: 'monetization',
      title: 'Revenue Opportunity',
      description: 'Premium course potential: $15K/month based on demand',
      icon: DollarSign,
      action: "View revenue analysis"
    },
    {
      type: 'engagement',
      title: 'Engagement Pattern',
      description: 'Morning posts receiving 40% more interaction',
      icon: Activity,
      action: "Optimize posting schedule"
    },
    {
      type: 'crossplatform',
      title: 'Platform Expansion',
      description: 'Your content style matches well with LinkedIn',
      icon: Globe,
      action: "See platform strategy"
    },
    {
      type: 'content',
      title: 'Content Series Potential',
      description: 'High demand for beginner-friendly tutorials',
      icon: Video,
      action: "Plan content series"
    },
    {
      type: 'community',
      title: 'Community Insight',
      description: 'Active discussions around your coding tips',
      icon: MessageSquare,
      action: "View community trends"
    }
  ]

  const handleSendMessage = () => {
    if (!inputValue.trim()) return
    
    const newMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    // Simulate AI response with potential insight references
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: "Here's what I found based on our analysis...",
        timestamp: new Date().toISOString(),
        relatedInsights: activeInsight ? [activeInsight] : undefined
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const handleInsightClick = (action: string) => {
    setInputValue(action)
    setShowAmbient(false)
  }

  const loadConversation = (conversation: ChatHistory) => {
    setMessages(conversation.messages as ChatMessage[])
    setIsHistoryOpen(false)
    setShowAmbient(false)
  }

  return (
    <div className="h-full flex bg-white">
      {/* History Sidebar */}
      <div className={`${
        isHistoryOpen ? 'w-80' : 'w-0'
      } border-r border-gray-200 transition-all duration-300 overflow-hidden`}>
        <div className="h-full flex flex-col">
          {/* Fixed Search */}
          <div className="shrink-0 p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search history..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {/* Scrollable History */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadConversation(chat)}
                  className="p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 border"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-sm">{chat.topic}</h3>
                    {chat.starred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                  </div>
                  <p className="text-xs text-gray-600 mb-1 line-clamp-2">{chat.preview}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {chat.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Fixed Header */}
        <div className="shrink-0 border-b bg-white px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">AVA IRIS</h2>
              {showAmbient && (
                <div className="text-sm text-gray-500 mt-1 animate-pulse">
                  {liveInsights[currentInsight]}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <History className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {showAmbient && messages.length === 0 ? (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 max-w-5xl mx-auto">
                {ambientInsights.map((insight, index) => (
                  <div
                    key={index}
                    onClick={() => handleInsightClick(insight.action)}
                    className="bg-white border shadow-sm p-4 rounded-xl cursor-pointer 
                      hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <insight.icon className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm mb-1">{insight.title}</h3>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="max-w-5xl mx-auto space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.content}
                      <div className="text-xs mt-1 opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Section */}
        <div className="shrink-0 border-t bg-white">
          {showAmbient && messages.length === 0 && (
            <div className="border-b">
              <div className="max-w-5xl mx-auto px-6 py-3">
                <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {ambientInsights.map((insight, index) => (
                    <button
                      key={index}
                      onClick={() => handleInsightClick(insight.action)}
                      className="whitespace-nowrap px-3 py-1 text-sm bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {insight.action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Input Area */}
          <div className="p-4">
            <div className="max-w-5xl mx-auto flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Plus className="h-5 w-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Paperclip className="h-5 w-5 text-gray-500" />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setShowAmbient(e.target.value === '')
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about your content, analytics, or partnerships..."
                className="flex-1 p-2 border rounded-lg"
              />
              <button
                onClick={handleSendMessage}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatScreen