'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { 
  Send, Plus, Paperclip,
  ChevronRight, Filter, Calendar,
  Zap, Target, Edit3, TrendingUp,
  MessageSquare, Brain, Settings,
  Users, DollarSign, Activity, Globe, Video
} from 'lucide-react'
import { Message, ChatHistory, InsightReference } from '@/app/types/chat'
import { actionableInsights } from '@/src/data/insights'
import { useSession } from 'next-auth/react'
import { MessageBubble } from './chat/message-bubble'
import { ChatInput } from './chat/chat-input'
import type { InteractiveOption } from '@/app/lib/chat/interactive-response'

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
    className="px-3 py-1.5 text-sm bg-heycontent-light-yellow hover:bg-heycontent-yellow/20 text-black rounded-full flex items-center gap-2 transition-colors"
  >
    {suggestion.type === 'explore' && <Brain className="w-4 h-4" />}
    {suggestion.type === 'clarify' && <MessageSquare className="w-4 h-4" />}
    {suggestion.type === 'action' && <Zap className="w-4 h-4" />}
    {suggestion.type === 'strategic' && <Target className="w-4 h-4" />}
    {suggestion.description}
  </button>
);

interface InteractiveResponse {
  options: Array<{
    text: string;
    action?: string;
  }>;
  followUp: Array<{
    question: string;
    choices?: string[];
  }>;
  contextualSuggestions: Array<{
    text: string;
    type: string;
  }>;
}

interface AnalysisResponse {
  result: {
    output: {
      content: string;
      insights?: any[];
      suggestions?: any[];
      response?: string;
    };
    suggestions?: any[];
    interactiveResponse?: InteractiveResponse;
  };
}

interface ChatResponse {
  id: number;
  content: string;
  metadata?: {
    suggestions?: any[];
    ambientInsight?: any;
  };
  options?: InteractiveResponse['options'];
  followUp?: InteractiveResponse['followUp'];
  contextualSuggestions?: InteractiveResponse['contextualSuggestions'];
}

function isAnalysisResponse(response: AnalysisResponse | ChatResponse): response is AnalysisResponse {
  return 'result' in response;
}

// Helper functions for generating interactive content
const generateContextualSuggestions = (content: string, type: 'video' | 'email' | null): string[] => {
  const suggestions: string[] = [];
  
  if (type === 'video') {
    if (content.includes('views') || content.includes('performance')) {
      suggestions.push('Compare with previous videos performance');
      suggestions.push('Show engagement trends over time');
      suggestions.push('Analyze audience retention patterns');
    }
    if (content.includes('comment') || content.includes('engagement')) {
      suggestions.push('Show most engaging video segments');
      suggestions.push('Analyze comment sentiment trends');
      suggestions.push('Identify top fan interactions');
    }
    if (content.includes('subscriber') || content.includes('growth')) {
      suggestions.push('Show subscriber growth patterns');
      suggestions.push('Analyze subscriber demographics');
      suggestions.push('Compare with channel benchmarks');
    }
  } else if (type === 'email') {
    if (content.includes('partnership') || content.includes('collaboration')) {
      suggestions.push('Review partnership history');
      suggestions.push('Analyze communication patterns');
      suggestions.push('Check similar partnerships');
    }
    if (content.includes('timeline') || content.includes('delay')) {
      suggestions.push('Analyze timeline impact');
      suggestions.push('Review similar delays');
      suggestions.push('Check alternative timelines');
    }
    if (content.includes('response') || content.includes('draft')) {
      suggestions.push('Review response templates');
      suggestions.push('Check communication best practices');
      suggestions.push('Analyze tone and style');
    }
  }
  
  // Add general suggestions if none were added
  if (suggestions.length === 0) {
    suggestions.push('Get more details');
    suggestions.push('See related insights');
    suggestions.push('Explore next steps');
  }
  
  return suggestions;
};

const generateFollowUpChoices = (content: string, type: 'video' | 'email' | null): string[] => {
  const choices: string[] = [];
  
  if (type === 'video') {
    if (content.includes('views') || content.includes('performance')) {
      choices.push('What caused these performance changes?');
      choices.push('How can we improve these metrics?');
      choices.push('What are the trends over time?');
    }
    if (content.includes('comment') || content.includes('engagement')) {
      choices.push('What drives the most engagement?');
      choices.push('How can we increase engagement?');
      choices.push('What are viewers saying?');
    }
    if (content.includes('subscriber') || content.includes('growth')) {
      choices.push('What is driving subscriber growth?');
      choices.push('How can we accelerate growth?');
      choices.push('Who are our most engaged subscribers?');
    }
  } else if (type === 'email') {
    if (content.includes('partnership') || content.includes('collaboration')) {
      choices.push('What are the next steps for this partnership?');
      choices.push('How can we optimize this collaboration?');
      choices.push('What are potential risks to consider?');
    }
    if (content.includes('timeline') || content.includes('delay')) {
      choices.push('How should we adjust our timeline?');
      choices.push('What are the implications of the delay?');
      choices.push('Should we explore alternatives?');
    }
    if (content.includes('response') || content.includes('draft')) {
      choices.push('What key points should we address?');
      choices.push('How can we improve the response?');
      choices.push('What tone should we use?');
    }
  }
  
  // Add general choices if none were added
  if (choices.length === 0) {
    choices.push('Can you provide more details?');
    choices.push('What are the key takeaways?');
    choices.push('What actions should we take?');
  }
  
  return choices;
};

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
    // Guard against undefined content
    if (!content || typeof content !== 'string') {
      console.warn('Attempted to send undefined or invalid message content');
      return;
    }

    if (!content.trim()) return;
    
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

      let response;
      let responseData: AnalysisResponse | ChatResponse;

      if (isAnalysisRequest(content)) {
        console.log('Sending analysis request with context:', {
          query: content,
          type: 'youtube',
          context: {
            currentVideo: currentVideoContext
          }
        });
        
        response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: content,
            type: 'youtube',
            context: {
              currentVideo: currentVideoContext
            }
          })
        });
      } else {
        console.log('Sending chat request with context:', {
          message: content,
          context: {
            currentVideo: currentVideoContext,
            previousMessages: messages
          }
        });
        
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            context: {
              currentVideo: currentVideoContext,
              previousMessages: messages
            }
          })
        });
      }

      if (!response.ok) {
        console.error('API response error:', {
          status: response.status,
          statusText: response.statusText
        });
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log('API response data:', {
        hasResult: !!data.result,
        resultType: data.result ? typeof data.result : 'none',
        hasOutput: data.result?.output ? 'yes' : 'no',
        hasInteractiveResponse: data.result?.interactiveResponse ? 'yes' : 'no',
        emailContext: data.result?.emailContext ? 'yes' : 'no'
      });
      
      // Remove typing indicator and add AI response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => msg.status !== 'typing')
        
        // Get the first followUp question if available
        const followUp = isAnalysisRequest(content) 
          ? data.result.interactiveResponse?.followUp?.[0]
          : data.followUp?.[0];
        
        // Extract contextual suggestions
        const contextualSuggestions = isAnalysisRequest(content)
          ? data.result.interactiveResponse?.contextualSuggestions
          : data.contextualSuggestions;

        return [...withoutTyping, {
          id: data.id || Date.now(),
          content: isAnalysisRequest(content) 
            ? (typeof data.result.output === 'object' 
                ? data.result.output.response || data.result.output.content || 'No response available'
                : data.result.output)
            : (typeof data.content === 'object'
                ? data.content.response || 'No response available'
                : data.content),
          role: 'assistant',
          timestamp: new Date().toISOString(),
          relatedInsights: data.relatedInsights || [],
          metadata: {
            suggestions: isAnalysisRequest(content) 
              ? (data.result.suggestions || [])
              : (data.metadata?.suggestions || []),
            insights: isAnalysisRequest(content)
              ? data.result.output.insights
              : data.metadata?.insights
          },
          interactiveResponse: {
            options: (isAnalysisRequest(content) 
              ? data.result.interactiveResponse?.options 
              : data.options)?.map((opt: InteractiveOption) => ({
              ...opt,
              type: opt.action ? 'action' : 'suggestion'
            })) || [],
            followUp: followUp ? {
              question: followUp.question,
              choices: followUp.choices || generateFollowUpChoices(
                isAnalysisRequest(content) 
                  ? data.result.output.content || data.result.output.response
                  : data.content,
                lastAnalysisType
              )
            } : undefined,
            contextualSuggestions: contextualSuggestions || generateContextualSuggestions(
              isAnalysisRequest(content)
                ? data.result.output.content || data.result.output.response
                : data.content,
              lastAnalysisType
            )
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
  }, [messages, referencedMessage, scrollToBottom, analyzedVideos, currentVideoContext, lastAnalysisType, isAnalysisRequest])

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
    if (!option?.text) return; // Guard against undefined options
    
    if (option.action) {
      // Handle specific actions with more contextual responses
      switch (option.action) {
        case 'show_metrics':
          handleSendMessage('Can you analyze the performance metrics for these partnership discussions?');
          break;
        case 'view_partnerships':
          handleSendMessage('What are the key points from this partnership discussion with AVA Setail?');
          break;
        case 'view_content_insights':
          handleSendMessage('What insights can you provide about the communication timeline and delays in this partnership discussion?');
          break;
        case 'view_audience_insights':
          handleSendMessage('How should we handle this partnership given the pregnancy situation?');
          break;
        case 'personalize':
          handleSendMessage('Can you help draft a response considering the current situation?');
          break;
        case 'view_pending_actions':
          handleSendMessage('What are the next steps needed for this partnership discussion?');
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
  }, [liveInsights.length])

  useEffect(() => {
    if (!showAmbient && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showAmbient])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, scrollToBottom])

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
  }, [handleSendMessage, initializing, setShowAmbient, setMessages])

  // Add error handling for session
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.error('Session not authenticated')
      return
    }
    
    if (status === 'authenticated' && session?.user?.id) {
      // Your session-dependent code here
    }
  }, [status, session?.user?.id])

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
              <h2 className="font-semibold text-lg">HeyContent</h2>
              <div className="text-sm text-text-gray mt-1 animate-pulse">
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
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-gray hover:bg-gray-50 rounded-lg"
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
                      <div className="p-2 rounded-lg bg-heycontent-light-yellow">
                        <insight.icon className="w-5 h-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm mb-1">{insight.title}</h3>
                        <p className="text-sm text-text-gray">{insight.description}</p>
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
                            className="bg-heycontent-light-yellow p-2 rounded-lg text-sm text-text-dark cursor-pointer hover:bg-heycontent-yellow/20"
                            onClick={() => handleInsightClick(
                              `Tell me more about this ${insight.type}`,
                              { type: insight.type, title: insight.summary, description: '' } as any
                            )}
                          >
                            <div className="font-medium">{insight.type}</div>
                            <div className="text-text-dark">{insight.summary}</div>
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
                      className="shrink-0 px-4 h-8 text-xs text-text-gray bg-gray-50 hover:bg-gray-100 
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
