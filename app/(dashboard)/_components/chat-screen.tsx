'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Send, Plus, Paperclip, Search,
  Clock, Star, Archive, History,
  ChevronRight, Filter, Calendar,
  Zap, Target, Edit3, TrendingUp,
  MessageSquare, Brain, Settings,
  Users, DollarSign, Activity, Globe, Video
} from 'lucide-react'
import { Message, ChatHistory, InsightReference } from '@/types/chat'
import { actionableInsights } from '@/data/insights'
import { useSession } from 'next-auth/react'
import { MessageBubble } from './chat/message-bubble'
import { ChatInput } from './chat/chat-input'
import { SidebarStorage } from '@/utils/storage'

interface AIActionableInsight {
  id: number;
  opportunity: {
    title: string;
  };
}

const liveInsights = [
  "Engagement up 23% in last hour",
  "3 high-value comments need response",
  "New audience segment emerging",
  "Optimal posting window in 2 hours"
]

const ChatScreen = () => {
  const { data: session, status } = useSession()
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // All state declarations
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(() => 
    SidebarStorage.get(session?.user?.id)
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [showAmbient, setShowAmbient] = useState(true)
  const [currentInsight, setCurrentInsight] = useState(0)
  const [activeInsight, setActiveInsight] = useState<InsightReference | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  // All useCallbacks
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  const handleSendMessage = useCallback(async (content: string, insightId?: number) => {
    if (!content.trim()) return
    
    const newMessage: Message = {
      id: Date.now(),
      content,
      role: 'user',
      timestamp: new Date().toISOString()
    }
    
    try {
      setIsLoading(true)
      
      // For initial insight message, we'll wait for both messages before setting
      if (insightId) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content, insightId })
        })

        if (!response.ok) throw new Error('Failed to send message')
        const aiResponse = await response.json()
        
        // Set both messages at once for initial insight
        setMessages([newMessage, aiResponse])
      } else {
        // Normal message flow - unchanged
        setMessages(prev => [...prev, newMessage])
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content })
        })

        if (!response.ok) throw new Error('Failed to send message')
        const aiResponse = await response.json()
        setMessages(prev => [...prev, aiResponse])
      }
      
      scrollToBottom()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }, [scrollToBottom])

  const toggleHistory = useCallback(() => {
    const newState = !isHistoryOpen
    setIsHistoryOpen(newState)
    SidebarStorage.set(newState, session?.user?.id)
  }, [isHistoryOpen, session?.user?.id])

  // All useEffects
  useEffect(() => {
    if (showAmbient) {
      const timer = setInterval(() => {
        setCurrentInsight((prev) => (prev + 1) % liveInsights.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [showAmbient, liveInsights.length])

  useEffect(() => {
    if (!showAmbient && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showAmbient, messages.length])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const insightId = params.get('context')
    
    if (insightId) {
      const insight = actionableInsights.find(i => i.id === Number(insightId))
      if (insight) {
        setShowAmbient(false)
        setMessages([])
        handleSendMessage(
          `I'd like to discuss the "${insight.opportunity.title}" opportunity.`,
          Number(insightId)
        )
      }
    }
    setInitializing(false)
  }, [handleSendMessage])

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
          content: 'Can you analyze my content strategy?', 
          role: 'user', 
          timestamp: new Date().toISOString() 
        },
        { 
          id: 2, 
          content: "Let's analyze your recent content performance...", 
          role: 'assistant',  
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
          content: 'What partnership opportunities do you see?', 
          role: 'user', 
          timestamp: new Date().toISOString() 
        },
        { 
          id: 2, 
          content: "I've identified 3 potential partnerships...", 
          role: 'assistant',  
          timestamp: new Date().toISOString() 
        }
      ],
      starred: false
    }
  ]

  const filteredHistory = chatHistory.filter(chat => 
    chat.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.preview.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  const handleInsightClick = (action: string) => {
    handleSendMessage(action)
    setShowAmbient(false)
  }

  const loadConversation = (conversation: ChatHistory) => {
    setMessages(conversation.messages as Message[])
    setIsHistoryOpen(false)
    setShowAmbient(false)
  }

  const handleBackToInsights = () => {
    setShowAmbient(true)
    setMessages([])  // Clear messages when going back to insights
  }

  if (initializing) return null

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
              {filteredHistory.map((chat) => (
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
            <div className="flex gap-2">
              {!showAmbient && (
                <button
                  onClick={handleBackToInsights}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Brain className="w-5 h-5 text-gray-500" />
                </button>
              )}
              <button
                onClick={toggleHistory}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <History className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50"
        >
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
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isLastMessage={index === messages.length - 1}
                  />
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
          <ChatInput 
            onSend={(content) => {
              handleSendMessage(content)
              setShowAmbient(content === '')
            }}
            isLoading={isLoading}
            inputRef={inputRef}
          />
        </div>
      </div>
    </div>
  )
}

export default ChatScreen