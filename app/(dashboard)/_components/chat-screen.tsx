'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Send, Plus, Paperclip,
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
import type { InteractiveOption } from '@/lib/chat/interactive-response'

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

interface SuggestedAction {
  type: 'explore' | 'clarify' | 'action' | 'strategic';
  description: string;
  context?: string;
  confidence: number;
}

const SuggestionChip = ({ suggestion, onClick }: { 
  suggestion: SuggestedAction, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full flex items-center gap-2 transition-colors"
  >
    {suggestion.type === 'explore' && <Brain className="w-4 h-4" />}
    {suggestion.type === 'clarify' && <MessageSquare className="w-4 h-4" />}
    {suggestion.type === 'action' && <Zap className="w-4 h-4" />}
    {suggestion.type === 'strategic' && <Target className="w-4 h-4" />}
    {suggestion.description}
  </button>
);

const ChatScreen = () => {
  const { data: session, status } = useSession()
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // All state declarations
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showAmbient, setShowAmbient] = useState(true)
  const [currentInsight, setCurrentInsight] = useState(0)
  const [activeInsight, setActiveInsight] = useState<InsightReference | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [referencedMessage, setReferencedMessage] = useState<Message | null>(null)
  const [analyzedVideos, setAnalyzedVideos] = useState<Set<string>>(new Set());
  const [currentVideoContext, setCurrentVideoContext] = useState<string | null>(null);
  const [lastAnalysisType, setLastAnalysisType] = useState<'video' | 'email' | null>(null);

  // Add this ref map to store references to message elements
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Utility functions
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  // Analysis request detection
  const isAnalysisRequest = useCallback((content: string) => {
    const youtubeKeywords = [
      'video', 'channel', 'subscriber',
      'view', 'comment', 'like',
      'watch time', 'retention', 'audience',
      'youtube', 'content', 'upload'
    ];
    
    const emailKeywords = [
      'email', 'mail', 'gmail',
      'message', 'inbox', 'sent'
    ];
    
    const analysisKeywords = [
      'analyze', 'performance', 'engagement',
      'growth', 'trend', 'metric',
      'analytics', 'revenue', 'monetization',
      'stats', 'statistics', 'data'
    ];
    
    const questionPatterns = [
      'how many', 'what is', 'what are',
      'tell me about', 'show me', 'can you check',
      'how is', 'how are', 'why is',
      'when', 'which', 'this video'
    ];
    
    content = content.toLowerCase();

    // Check if this is an email-related query
    const hasEmailContext = emailKeywords.some(keyword => 
      content.includes(keyword)
    );

    // If it's an email query, clear video context
    if (hasEmailContext) {
      setCurrentVideoContext(null);
      setLastAnalysisType('email');
      return false; // Let it be handled by the chat endpoint
    }
    
    // Check for quoted titles or content between backticks
    const titleMatch = content.match(/"([^"]+)"/) || content.match(/`([^`]+)`/);
    if (titleMatch) {
      const newVideoTitle = titleMatch[1];
      // Only set as current if it's different from the last one
      if (newVideoTitle !== currentVideoContext) {
        setCurrentVideoContext(newVideoTitle);
        setAnalyzedVideos(prev => new Set([...prev, newVideoTitle]));
      }
      setLastAnalysisType('video');
      return true;
    }
    
    // If we have current video context, check if the question is still about videos
    if (currentVideoContext && lastAnalysisType === 'video') {
      const isStillAboutVideos = youtubeKeywords.some(keyword => 
        content.includes(keyword)
      ) || questionPatterns.some(pattern => 
        content.includes(pattern)
      );
      
      // If the question seems unrelated to videos, clear the context
      if (!isStillAboutVideos) {
        setCurrentVideoContext(null);
        setLastAnalysisType(null);
        return false;
      }
      return true;
    }
    
    // Must have YouTube context
    const hasYoutubeContext = youtubeKeywords.some(keyword => 
      content.includes(keyword)
    );
    
    // Must also have either analysis intent or be a question
    const hasAnalysisIntent = analysisKeywords.some(keyword =>
      content.includes(keyword)
    );
    
    const hasQuestionPattern = questionPatterns.some(pattern => 
      content.includes(pattern)
    );
    
    const isYoutubeAnalysis = hasYoutubeContext && (hasAnalysisIntent || hasQuestionPattern);
    if (isYoutubeAnalysis) {
      setLastAnalysisType('video');
    }
    return isYoutubeAnalysis;
  }, [currentVideoContext, lastAnalysisType, setCurrentVideoContext, setLastAnalysisType, setAnalyzedVideos]);

  const handleSendMessage = useCallback(async (content: string, insightId?: number) => {
    if (!content.trim()) return
    
    const newMessage: Message = {
      id: Date.now(),
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
      referencedMessage: referencedMessage ? {
        id: referencedMessage.id,
        content: referencedMessage.content
      } : undefined
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Add user message immediately
      setMessages(prev => [...prev, newMessage])
      
      // Add typing indicator
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: '...',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        status: 'typing'
      }])

      let response
      if (isAnalysisRequest(content)) {
        response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: content,
            type: 'youtube',
            context: {
              currentVideo: currentVideoContext,
              analyzedVideos: Array.from(analyzedVideos),
              lastAnalysisType
            }
          })
        });
      } else {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            insightId,
            referencedMessageId: referencedMessage?.id,
            previousMessages: messages.map(msg => ({
              id: msg.id,
              content: msg.content,
              role: msg.role,
              timestamp: msg.timestamp,
              referencedMessage: msg.referencedMessage ? {
                id: msg.referencedMessage.id,
                content: msg.referencedMessage.content
              } : undefined
            }))
          })
        })
      }

      if (!response.ok) throw new Error('Failed to send message')
      const data = await response.json()
      
      // Remove typing indicator and add AI response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => msg.status !== 'typing')
        return [...withoutTyping, {
          id: data.id || Date.now(),
          content: isAnalysisRequest(content) ? data.result.output : data.content,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          relatedInsights: data.relatedInsights || [],
          interactiveResponse: {
            options: isAnalysisRequest(content) ? data.result.interactiveResponse?.options : data.options,
            followUp: isAnalysisRequest(content) ? data.result.interactiveResponse?.followUp : data.followUp,
            contextualSuggestions: isAnalysisRequest(content) ? data.result.interactiveResponse?.contextualSuggestions : data.contextualSuggestions
          }
        }]
      })
      
      // Clear the reference after sending
      setReferencedMessage(null)
      scrollToBottom()
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove typing indicator and show error
      setMessages(prev => prev.filter(msg => msg.status !== 'typing'))
      setError((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [messages, referencedMessage, scrollToBottom, analyzedVideos, currentVideoContext, lastAnalysisType])

  const handleMessageReference = (message: Message) => {
    setReferencedMessage(message)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleClearReference = () => {
    setReferencedMessage(null)
  }

  // Add this function to handle reference clicks
  const handleReferenceClick = useCallback((messageId: number) => {
    const messageElement = messageRefs.current.get(messageId)
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      })
      // Add a brief highlight effect
      messageElement.classList.add('highlight-message')
      setTimeout(() => {
        messageElement.classList.remove('highlight-message')
      }, 2000)
    }
  }, [])

  const handleOptionClick = useCallback((option: InteractiveOption) => {
    if (option.action) {
      // Handle specific actions
      switch (option.action) {
        case 'show_metrics':
          handleSendMessage('Show me the detailed metrics');
          break;
        case 'view_partnerships':
          handleSendMessage('Tell me about available partnership opportunities');
          break;
        case 'view_content_insights':
          handleSendMessage('What insights do you have about the content?');
          break;
        case 'view_audience_insights':
          handleSendMessage('What do you know about the audience?');
          break;
        case 'personalize':
          handleSendMessage('Personalize the recommendations for me');
          break;
        case 'view_pending_actions':
          handleSendMessage('What actions are pending?');
          break;
        default:
          handleSendMessage(option.text);
      }
    } else {
      handleSendMessage(option.text);
    }
  }, [handleSendMessage]);

  const handleFollowUpClick = useCallback((choice: string) => {
    handleSendMessage(choice);
  }, [handleSendMessage]);

  // All useEffects
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % liveInsights.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!showAmbient && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showAmbient, messages.length])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const contextParam = params.get('context')
    const type = params.get('type')
    
    if (contextParam && !initializing) {
      try {
        const contextData = JSON.parse(decodeURIComponent(contextParam))
        setShowAmbient(false)
        setMessages([])

        if (type === 'insight') {
          // Handle full insight discussion
          handleSendMessage(
            `I'd like to discuss this insight about "${contextData.title}". Here's what I know:\n` +
            `- Description: ${contextData.description}\n` +
            `- Impact: ${contextData.impact}\n` +
            `- Timing: ${contextData.timing}\n` +
            `- Confidence: ${contextData.confidence}%\n\n` +
            `What specific recommendations do you have based on this information?`
          )
        } else if (type === 'action') {
          // Handle specific action step discussion
          const step = contextData.step
          handleSendMessage(
            `I want to work on this action step: "${step.content}"\n\n` +
            `This is part of the insight: "${contextData.insight.title}"\n` +
            `Context: ${contextData.insight.description}\n\n` +
            `Can you help me implement this step effectively?`
          )
        }

        // Clear URL parameters without refreshing
        window.history.replaceState({}, '', window.location.pathname)
      } catch (error) {
        console.error('Error parsing context:', error)
      }
    }
    setInitializing(false)
  }, [handleSendMessage, initializing])

  // Add error handling for session
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.error('Session not authenticated')
      return
    }
    
    if (status === 'authenticated' && session?.user?.id) {
      // Your session-dependent code here
    }
  }, [status, session])

  // Loading state
  if (status === 'loading') return null

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

  const handleInsightClick = (action: string, insight: typeof ambientInsights[0]) => {
    setShowAmbient(false)
    const message = `${action} - Regarding: ${insight.title} (${insight.description})`
    handleSendMessage(message)
  }

  const loadConversation = (conversation: ChatHistory) => {
    setMessages(conversation.messages as Message[])
    setShowAmbient(false)
  }

  const handleSuggestionClick = (suggestion: SuggestedAction) => {
    setInputValue(suggestion.description);
    inputRef.current?.focus();
  };

  if (initializing) return null

  return (
    <div className="h-full flex bg-white">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Fixed Header */}
        <div className="shrink-0 border-b bg-white px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">AVA IRIS</h2>
              <div className="text-sm text-gray-500 mt-1 animate-pulse">
                {liveInsights[currentInsight]}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAmbient(true)
                  setMessages([])
                  setReferencedMessage(null)
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                New Chat
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
                    onClick={() => handleInsightClick(insight.action, insight)}
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
                  <div
                    key={message.id}
                    ref={el => {
                      if (el) {
                        messageRefs.current.set(message.id, el)
                      }
                    }}
                    className="transition-all duration-300"
                  >
                    <MessageBubble
                      message={message}
                      isLastMessage={index === messages.length - 1}
                      onReference={handleMessageReference}
                      showReferenceButton={!referencedMessage && message.status !== 'typing'}
                      onReferenceClick={handleReferenceClick}
                      onOptionClick={handleOptionClick}
                      onFollowUpClick={handleFollowUpClick}
                    />
                    {message.relatedInsights && message.relatedInsights.length > 0 && (
                      <div className="ml-12 mt-2 space-y-2">
                        {message.relatedInsights.map((insight, i) => (
                          <div
                            key={i}
                            className="bg-blue-50 p-2 rounded-lg text-sm text-blue-800 cursor-pointer hover:bg-blue-100"
                            onClick={() => handleInsightClick(
                              `Tell me more about this ${insight.type}`,
                              { type: insight.type, title: insight.summary, description: '' } as any
                            )}
                          >
                            <div className="font-medium">{insight.type}</div>
                            <div className="text-blue-600">{insight.summary}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {message.role === 'assistant' && message.metadata?.suggestions && (
                      <div className="mt-3 flex flex-wrap gap-2 pl-12">
                        {message.metadata.suggestions.map((suggestion: SuggestedAction, index: number) => (
                          <SuggestionChip
                            key={index}
                            suggestion={suggestion}
                            onClick={() => handleSuggestionClick(suggestion)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                    <p className="text-red-600 text-sm">{error}</p>
                    <button 
                      onClick={() => setError(null)}
                      className="text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Section */}
        <div className="shrink-0 bg-white">
          {showAmbient && messages.length === 0 && (
            <div className="border-t border-gray-100">
              <div className="max-w-5xl mx-auto px-6 py-2">
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  {ambientInsights.map((insight, index) => (
                    <button
                      key={index}
                      onClick={() => handleInsightClick(insight.action, insight)}
                      className="shrink-0 px-4 h-8 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 
                        rounded-full flex items-center transition-colors"
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
            referencedMessage={referencedMessage}
            onClearReference={handleClearReference}
          />
        </div>
      </div>
    </div>
  )
}
export default ChatScreen
