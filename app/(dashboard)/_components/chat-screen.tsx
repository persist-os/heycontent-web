'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Send, Plus, Paperclip, Search,
  Clock, Star, Archive, History,
  ChevronRight, Filter, Calendar,
  Zap, Target, Edit3, TrendingUp,
  MessageSquare
} from 'lucide-react'
import { ChatHistory } from '@/types'

const ChatScreen = () => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAmbient, setShowAmbient] = useState(true)
  const [currentInsight, setCurrentInsight] = useState(0)

  // Sample chat history
  const chatHistory = [
    {
      id: 1,
      topic: 'Content Strategy Analysis',
      preview: "Let's analyze your recent content performance...",
      date: '2024-12-01',
      messages: [
        { id: 1, type: 'user', content: 'Can you analyze my content strategy?', timestamp: new Date().toISOString() },
        { id: 2, type: 'ai', content: "Let's analyze your recent content performance...", timestamp: new Date().toISOString() }
      ],
      starred: true
    },
    {
      id: 2,
      topic: 'Partnership Opportunities',
      preview: "I've identified 3 potential partnership opportunities...",
      date: '2024-11-30',
      messages: [
        { id: 1, type: 'user', content: 'What partnership opportunities do you see?', timestamp: new Date().toISOString() },
        { id: 2, type: 'ai', content: "I've identified 3 potential partnerships...", timestamp: new Date().toISOString() }
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
    }
  ]

  // Live rotating insights
  const liveInsights = [
    "Engagement up 23% in last hour",
    "3 high-value comments need response",
    "New audience segment emerging",
    "Optimal posting window in 2 hours"
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % liveInsights.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return
    
    const newMessages = [
      ...messages,
      {
        id: messages.length + 1,
        type: 'user',
        content: inputValue,
        timestamp: new Date().toISOString()
      }
    ]
    
    setMessages(newMessages)
    setInputValue('')
    setShowAmbient(false)

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'ai',
        content: "I'll help you with that. Let me analyze the data...",
        timestamp: new Date().toISOString()
      }])
    }, 1000)
  }

  const handleInsightClick = (action: string) => {
    setInputValue(action)
    setShowAmbient(false)
  }

  const loadConversation = (conversation: ChatHistory) => {
    setMessages(conversation.messages)
    setIsHistoryOpen(false)
    setShowAmbient(false)
  }

  return (
    <div className="flex h-[calc(100vh-2rem)]">
      {/* History Sidebar */}
      <div 
        className={`${
          isHistoryOpen ? 'w-80' : 'w-0'
        } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}
      >
        {isHistoryOpen && (
          <div className="p-4 space-y-4 h-full">
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

            <div className="space-y-2 overflow-y-auto">
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
        )}
      </div>

      {/* Main Chat Interface */}
      <Card className="flex-1 flex flex-col relative">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>AI Assistant</CardTitle>
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
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 relative">
          {/* Ambient Insights Layer */}
          {showAmbient && messages.length === 0 && (
            <div className="absolute inset-0 p-6">
              <div className="grid grid-cols-2 gap-4">
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
                      <div>
                        <h3 className="font-medium text-sm mb-1">{insight.title}</h3>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

          {/* Quick Actions */}
          {showAmbient && messages.length === 0 && (
            <div className="px-4 py-2 border-t bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
              <div className="flex flex-wrap gap-2">
                {ambientInsights.map((insight, index) => (
                  <button
                    key={index}
                    onClick={() => handleInsightClick(insight.action)}
                    className="px-3 py-1 text-sm bg-white hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {insight.action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex items-center gap-2">
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
        </CardContent>
      </Card>
    </div>
  )
}

export default ChatScreen