'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Message } from '@/app/types/chat'
import { auth } from '@/app/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { MessageBubble } from './chat/message-bubble'
import { ChatInput } from './chat/chat-input'
import { MessageSquare, RefreshCw, Plus } from 'lucide-react'
import { useSidebar } from '@/app/context/sidebar-context'

// Import newly extracted types, components and utilities
import { ChatResponseData, ChatScreenProps, SuggestedAction, AmbientInsight } from './chat/types'
import { SuggestionChip } from './chat/components/SuggestionChip'
import { AmbientInsights } from './chat/components/AmbientInsights'
import { ambientInsights } from './chat/data/ambient-insights'
import { 
  sendChatMessage, 
  saveConversation, 
  loadConversation, 
  generateLocalSessionId 
} from './chat/utils/api-utils'

const ChatScreen = ({ chatId }: ChatScreenProps) => {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { isExpanded } = useSidebar()

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [referencedMessage, setReferencedMessage] = useState<Message | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [conversationSaved, setConversationSaved] = useState(false)
  const [showAmbient, setShowAmbient] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [ambientLoading, setAmbientLoading] = useState(false)

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  const scrollToMessage = useCallback((messageId: number) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect
      messageElement.classList.add('bg-yellow-100/50');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100/50');
      }, 2000);
    }
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content || typeof content !== 'string' || !content.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
      referencedMessage: referencedMessage ? {
        id: referencedMessage.id,
        content: referencedMessage.content
      } : undefined,
      chat_response: content
    }

    try {
      setIsLoading(true)
      setError(null)

      // Add user message and typing indicator
      setMessages(prev => [
        ...prev,
        newMessage,
        {
          id: Date.now(),
          content: '...',
          role: 'assistant',
          timestamp: new Date().toISOString(),
          status: 'typing',
          chat_response: ''
        }
      ]);

      // For the first message, don't send a session_id
      const isFirstMessage = messages.length === 0;

      // Send message to the backend
      const data = await sendChatMessage(content, isFirstMessage, sessionId);

      // Update messages with the response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => msg.status !== 'typing');
        return [...withoutTyping, {
          id: Date.now(),
          content: data.chat_response,
          chat_response: data.chat_response,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          suggestions: data.suggestions || []
        }];
      });

      // Handle session ID with a fallback
      if (data.session_id) {
        console.log('Received session ID from API:', data.session_id);
        setSessionId(data.session_id);
      } else {
        console.warn('No session ID received from API, generating local one');
        // If the API doesn't return a session ID, generate one locally
        setSessionId(generateLocalSessionId());
      }

      setReferencedMessage(null)
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.filter(msg => msg.status !== 'typing'))
      setError((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [referencedMessage, sessionId])

  const handleMessageReference = (message: Message) => {
    setReferencedMessage(message)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleClearReference = () => {
    setReferencedMessage(null)
  }

  const handleOptionClick = useCallback((option: { text: string }) => {
    if (!option?.text) return;
    handleSendMessage(option.text);
  }, [handleSendMessage]);

  const handleFollowUpClick = useCallback((choice: string) => {
    handleSendMessage(choice);
  }, [handleSendMessage]);

  const handleInsightClick = useCallback((action: string, insight: AmbientInsight) => {
    setShowAmbient(false)
    const message = `${action} - Regarding: ${insight.title} (${insight.description})`
    handleSendMessage(message)
  }, [handleSendMessage])

  const handleSuggestionClick = useCallback((suggestion: SuggestedAction) => {
    if (inputRef.current) {
      inputRef.current.value = suggestion.description
      inputRef.current.focus()
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLastRefresh(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  const handleReferenceClick = useCallback((messageId: number) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
      // Add a brief highlight effect
      messageElement.classList.add('bg-yellow-100/50');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100/50');
      }, 2000);
    }
  }, []);

  // Save conversation to backend
  const handleSaveConversation = useCallback(async () => {
    // Only save if we have at least 2 messages (a user message and a response)
    if (messages.length < 2 || conversationSaved) {
      console.log('Skipping save conversation:', {
        messageCount: messages.length,
        alreadySaved: conversationSaved
      });
      return;
    }

    try {
      // Generate a title from the first user message
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      const title = firstUserMessage ?
        (firstUserMessage.content.length > 30 ?
          firstUserMessage.content.substring(0, 30) + '...' :
          firstUserMessage.content) :
        'Chat conversation';

      const conversationId = await saveConversation(messages, title, sessionId);
      if (conversationId) {
        setConversationSaved(true);
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }, [messages, sessionId, conversationSaved]);

  // Load conversation by ID
  const handleLoadConversation = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      
      const data = await loadConversation(id);

      if (data.conversation) {
        setMessages(data.conversation.messages);
        // Use the conversation ID as the session ID for continuing the conversation
        setSessionId(data.conversation.id);
        setConversationSaved(true); // Mark as saved since it's loaded from history
        console.log('Loaded conversation:', data.conversation.id);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setError('Failed to load conversation. Starting a new chat.');
      // Start a new session if loading fails
      setSessionId(Date.now().toString());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth not initialized')
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        if (chatId) {
          // If we have a chat ID, we'll load the conversation in a separate effect
        } else {
          // For a new chat, set sessionId to null initially
          // It will be set after the first message is sent
          setSessionId(null);
        }
      }
      setLoading(false)
    })

    return () => {
      unsubscribe();
    }
  }, [chatId])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, scrollToBottom])

  // Scroll to bottom when sidebar state changes
  useEffect(() => {
    if (messages.length > 0) {
      // Add a small delay to allow the layout to update
      const timer = setTimeout(() => {
        scrollToBottom()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isExpanded, scrollToBottom, messages.length])

  // Add resize observer to handle window resizing
  useEffect(() => {
    if (messages.length > 0) {
      const handleResize = () => {
        scrollToBottom()
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [scrollToBottom, messages.length])

  // Save conversation when messages change
  useEffect(() => {
    // Only save if we have at least 2 messages (a user message and a response)
    if (messages.length >= 2 && !conversationSaved) {
      console.log('Scheduling conversation save after message change');
      // Save after a short delay to avoid saving too frequently
      const saveTimeout = setTimeout(() => {
        console.log('Executing scheduled conversation save');
        handleSaveConversation()
      }, 1000) // 1 second delay

      return () => clearTimeout(saveTimeout)
    }
  }, [messages, handleSaveConversation, conversationSaved])

  // Force save conversation after a certain number of messages
  useEffect(() => {
    // Force save after 4 messages regardless of previous save status
    if (messages.length >= 4) {
      console.log('Force saving conversation due to message count threshold');
      handleSaveConversation();
    }
  }, [messages.length, handleSaveConversation])

  // Save conversation when component unmounts
  useEffect(() => {
    return () => {
      // Save conversation if it hasn't been saved yet
      if (messages.length >= 2 && !conversationSaved) {
        handleSaveConversation()
      }
    }
  }, [messages.length, conversationSaved, handleSaveConversation])

  // Load conversation when user and chatId are available
  useEffect(() => {
    if (user && chatId && !loading) {
      handleLoadConversation(chatId)
    }
  }, [user, chatId, loading, handleLoadConversation])

  if (loading) {
    return <div className="flex items-center justify-center h-full w-full p-4">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-white w-full">
      {/* Header */}
      <div className="shrink-0 h-14 flex items-center justify-between px-6">
        <div className="w-5" /> {/* Empty div for spacing */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-base font-medium text-gray-900">Chat With Content</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-lg ${
              isRefreshing 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-900 hover:text-blue-600 hover:bg-blue-50'
            } transition-colors`}
            title="Refresh Insights"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setShowAmbient(true)
              setMessages([])
              setReferencedMessage(null)
            }}
            className="p-2 rounded-lg text-gray-900 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="New Chat"
          >
            <svg className="w-5 h-5" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(0,512) scale(0.1,-0.1)">
                <path d="M712 4835 c-205 -49 -390 -239 -431 -443 -8 -36 -11 -476 -11 -1410 0 -1495 -4 -1408 62 -1542 41 -82 161 -206 238 -245 124 -63 148 -67 390 -74 248 -7 261 -10 317 -75 43 -48 51 -81 56 -236 4 -102 10 -150 26 -194 59 -166 186 -274 367 -314 93 -20 189 -9 284 33 59 26 96 60 425 386 264 262 373 364 405 378 44 20 64 21 760 21 795 0 795 0 930 66 98 48 211 160 257 254 67 137 63 47 63 1543 0 934 -3 1373 -11 1409 -19 95 -85 213 -161 289 -75 75 -189 138 -286 158 -83 17 -3609 14 -3680 -4z m1936 -1077 c18 -11 41 -37 52 -59 18 -35 20 -59 20 -293 l0 -255 263 -3 c255 -3 263 -4 300 -27 51 -31 81 -91 74 -149 -5 -50 -29 -87 -77 -119 -32 -22 -40 -23 -296 -23 l-263 0 -3 -269 c-3 -255 -4 -271 -24 -298 -35 -48 -82 -73 -134 -73 -52 0 -99 25 -134 73 -20 27 -21 43 -24 298 l-3 269 -263 0 c-256 0 -264 1 -296 23 -77 52 -100 138 -58 211 45 77 58 81 356 84 l262 3 0 255 c0 232 2 258 19 293 24 45 39 59 88 77 45 16 96 10 141 -18z" fill="currentColor"/>
              </g>
            </svg>
          </button>
        </div>
      </div>

      {/* Main chat container */}
      <div className="flex-1 overflow-hidden relative">
        <div 
          ref={chatContainerRef}
          className="h-full overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 pb-28 sm:pb-32 md:pb-36"
        >
          {showAmbient && messages.length === 0 ? (
            <div className="p-6">
              <AmbientInsights 
                insights={ambientInsights}
                loading={ambientLoading}
                error={error}
                onInsightClick={handleInsightClick}
              />
            </div>
          ) : (
            <div className="p-6">
              <div className="max-w-5xl mx-auto space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    id={`message-${message.id}`}
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
                    {message.role === 'assistant' && message.metadata?.suggestions && (
                      <div className="mt-3 flex flex-wrap gap-2 pl-12">
                        {message.metadata.suggestions.map((suggestion, index) => (
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

        {/* Responsive chat input container that respects the dashboard layout */}
        <div className="fixed bottom-0 right-0 left-0 z-10">
          {showAmbient && messages.length === 0 && (
            <div className="border-t border-gray-200">
              <div className="max-w-5xl mx-auto px-6 py-2">
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  {ambientInsights.map((insight, index) => (
                    <button
                      key={index}
                      onClick={() => handleInsightClick(insight.action, insight)}
                      className="shrink-0 px-4 h-8 text-xs text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 
                        rounded-full flex items-center transition-colors"
                    >
                      {insight.action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="h-px bg-gray-200 w-full"></div>
          <div className="flex w-full">
            {/* Left sidebar spacer - dynamically matches the dashboard layout */}
            <div className={`hidden md:block flex-shrink-0 ${isExpanded ? 'md:w-64' : 'md:w-16'}`}></div>
            {/* Main content area with the chat input */}
            <div className="flex-1 bg-white shadow-md">
              <div className="max-w-6xl mx-auto px-2 sm:px-4 pb-safe">
                <ChatInput
                  inputRef={inputRef}
                  onSend={(content) => {
                    handleSendMessage(content)
                    setShowAmbient(content === '')
                  }}
                  isLoading={isLoading}
                  referencedMessage={referencedMessage}
                  onClearReference={handleClearReference}
                />
              </div>
            </div>
            {/* Right padding to ensure the input doesn't overlap with any right sidebar */}
            <div className="hidden lg:block w-0 flex-shrink-0"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatScreen
