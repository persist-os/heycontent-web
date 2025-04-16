'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Message } from '@/app/types/chat'
import { auth } from '@/app/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { MessageBubble } from './chat/message-bubble'
import { ChatInput } from './chat/chat-input'
import { MessageSquare } from 'lucide-react'
import { useSidebar } from '@/app/context/sidebar-context'

// Interface for the chat response from the API
interface ChatResponseData {
  chat_response: string;
  suggestions?: string[];
  session_id: string;
  metadata?: {
    request_id: string;
    processing_time_ms: number;
  };
}

interface ChatScreenProps {
  chatId?: string | null;
}

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

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

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

      const requestBody: any = {
        query: content,
        is_first_message: isFirstMessage
      };

      // Only include session_id for subsequent messages
      if (!isFirstMessage && sessionId) {
        requestBody.session_id = sessionId;
      }

      console.log('Sending chat message:', requestBody);

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data: ChatResponseData = await response.json();

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

      if (data.session_id) {
        console.log('Received session ID from API:', data.session_id);
        setSessionId(data.session_id);
      } else {
        console.warn('No session ID received from API');
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

  // Save conversation to Convex
  const saveConversation = useCallback(async () => {
    // Only save if we have at least 2 messages (a user message and a response)
    if (messages.length < 2 || conversationSaved) {
      console.log('Skipping save conversation:', {
        messageCount: messages.length,
        alreadySaved: conversationSaved
      });
      return;
    }

    try {
      console.log('Saving conversation with messages:', messages.length);

      // Generate a title from the first user message
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      const title = firstUserMessage ?
        (firstUserMessage.content.length > 30 ?
          firstUserMessage.content.substring(0, 30) + '...' :
          firstUserMessage.content) :
        'Chat conversation';

      const response = await fetch('/api/chat/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          title,
          sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to save conversation - API error:', {
          status: response.status,
          error: errorData
        });
        throw new Error(`Failed to save conversation: ${response.status}`);
      }

      const data = await response.json();
      console.log('Conversation saved successfully:', data);
      setConversationSaved(true);
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }, [messages, sessionId, conversationSaved]);

  // Load conversation by ID
  const loadConversation = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/chat/conversation/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to load conversation: ${response.status}`);
      }

      const data = await response.json();

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
        saveConversation()
      }, 1000) // 1 second delay

      return () => clearTimeout(saveTimeout)
    }
  }, [messages, saveConversation, conversationSaved])

  // Force save conversation after a certain number of messages
  useEffect(() => {
    // Force save after 4 messages regardless of previous save status
    if (messages.length >= 4) {
      console.log('Force saving conversation due to message count threshold');
      saveConversation();
    }
  }, [messages.length, saveConversation])

  // Save conversation when component unmounts
  useEffect(() => {
    return () => {
      // Save conversation if it hasn't been saved yet
      if (messages.length >= 2 && !conversationSaved) {
        saveConversation()
      }
    }
  }, [messages.length, conversationSaved, saveConversation])

  // Load conversation when user and chatId are available
  useEffect(() => {
    if (user && chatId && !loading) {
      loadConversation(chatId)
    }
  }, [user, chatId, loading, loadConversation])

  if (loading) {
    return <div className="flex items-center justify-center h-full w-full p-4">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-white w-full">
      {/* Responsive header */}
      <div className="shrink-0 border-b bg-white px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-pink-500" />
            <h2 className="font-semibold text-lg">Chat</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Save current conversation if needed before starting a new one
                if (messages.length >= 2 && !conversationSaved) {
                  saveConversation()
                }

                // Navigate to a clean chat page
                if (chatId) {
                  router.push('/chat')
                } else {
                  // If we're already on a clean page, just reset the state
                  setMessages([])
                  setReferencedMessage(null)
                  setSessionId(null) // Set to null for first message
                  setConversationSaved(false)
                }
              }}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-text-gray hover:bg-gray-50 rounded-lg"
            >
              New Chat
            </button>
          </div>
        </div>
      </div>
      {/* Main chat container */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={chatContainerRef}
          className="h-full overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 pb-28 sm:pb-32 md:pb-36"
        >
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLastMessage={index === messages.length - 1}
              onReference={handleMessageReference}
              showReferenceButton={true}
              onOptionClick={handleOptionClick}
              onFollowUpClick={handleFollowUpClick}
            />
          ))}
          {error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded mx-2 sm:mx-0">
              {error}
            </div>
          )}
        </div>
        {/* Responsive chat input container that respects the dashboard layout */}
        <div className="fixed bottom-0 right-0 left-0 z-10">
          <div className="h-px bg-gray-200 w-full"></div>
          <div className="flex w-full">
            {/* Left sidebar spacer - dynamically matches the dashboard layout */}
            <div className={`hidden md:block flex-shrink-0 ${isExpanded ? 'md:w-64' : 'md:w-16'}`}></div>
            {/* Main content area with the chat input */}
            <div className="flex-1 bg-white shadow-md">
              <div className="max-w-6xl mx-auto px-2 sm:px-4 pb-safe">
                <ChatInput
                  inputRef={inputRef}
                  onSend={handleSendMessage}
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
