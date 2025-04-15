'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Message } from '@/app/types/chat'
import { auth } from '@/app/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
// import { useRouter } from 'next/navigation'
import { MessageBubble } from './chat/message-bubble'
import { ChatInput } from './chat/chat-input'
import { MessageSquare } from 'lucide-react'

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

const ChatScreen = () => {
  // const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [referencedMessage, setReferencedMessage] = useState<Message | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

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

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: content,
          is_first_message: !sessionId,
          session_id: sessionId
        })
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
        setSessionId(data.session_id);
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

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth not initialized')
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        const sessionId = Date.now().toString();
        setSessionId(sessionId);
      }
      setLoading(false)
    })

    return () => {
      unsubscribe();
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, scrollToBottom])

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
                setMessages([])
                setReferencedMessage(null)
                setSessionId(Date.now().toString())
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
          className="h-full overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 pb-28 sm:pb-32"
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
            {/* Left sidebar spacer - matches the dashboard layout */}
            <div className="hidden md:block w-16 lg:w-64 flex-shrink-0"></div>
            {/* Main content area with the chat input */}
            <div className="flex-1 bg-white shadow-md">
              <div className="max-w-6xl mx-auto px-2 sm:px-4">
                <ChatInput
                  inputRef={inputRef}
                  onSend={handleSendMessage}
                  isLoading={isLoading}
                  referencedMessage={referencedMessage}
                  onClearReference={handleClearReference}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatScreen
