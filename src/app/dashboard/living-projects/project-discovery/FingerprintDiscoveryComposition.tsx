'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Message } from '@/app/types/chat'
import { ChatInput } from '@/app/dashboard/thinking_lab/components/dialogue/input/chat-input'
import ChatMessagesList from '@/app/dashboard/thinking_lab/components/dialogue/components/ChatMessagesList'
import { sendDiscoveryMessage } from './services/discoveryService'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { useResizablePanes } from '@/app/dashboard/thinking_lab/hooks/useResizablePanes'
import AmbientFingerprintCanvas from './components/AmbientFingerprintCanvas'

interface FingerprintDiscoveryCompositionProps {
  projectId?: Id<"projects">
}

const FingerprintDiscoveryComposition: React.FC<FingerprintDiscoveryCompositionProps> = ({
  projectId
}) => {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const resizable = useResizablePanes(0.6)

  // Convex mutations
  const createConversation = useMutation(api.chatMutations.createConversation)
  const addMessage = useMutation(api.chatMutations.addMessageToConversation)
  const linkConversation = useMutation(api.projectFingerprintMutations.linkDiscoveryConversation)

  // Get project and fingerprint details
  const project = useQuery(
    api.projectsQueries.getById,
    projectId && userId ? { projectId, userId } : 'skip'
  )

  const fingerprint = useQuery(
    api.projectFingerprintQueries.getByProject,
    projectId ? { projectId } : 'skip'
  )

  // Load existing conversation if fingerprint has one
  const existingConversation = useQuery(
    api.chatQueries.getConversation,
    fingerprint?.discoveryConversationId && userId 
      ? { conversationId: fingerprint.discoveryConversationId, userId } 
      : 'skip'
  )

  // Initialize userId
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.error('Failed to get user ID:', error)
        setUserId(null)
      }
    }
    fetchUserId()
  }, [])

  // Initialize conversation and load messages
  useEffect(() => {
    if (!userId || !projectId || !project || isInitialized) return

    const initializeConversation = async () => {
      try {
        // If fingerprint already has a conversation, load it
        if (fingerprint?.discoveryConversationId && existingConversation) {
          setConversationId(fingerprint.discoveryConversationId)
          
          // Convert Convex messages to Message format
          const loadedMessages: Message[] = existingConversation.messages.map((msg: any, idx: number) => ({
            id: `msg-${idx}`,
            content: msg.content,
            role: msg.role as 'user' | 'assistant',
            timestamp: msg.timestamp?.toString() || Date.now().toString(),
            chat_response: msg.content,
            status: 'delivered' as const,
            suggestions: [],
          }))
          
          setMessages(loadedMessages)
          setIsInitialized(true)
          return
        }

        // Create new conversation for discovery
        const conversationTitle = `Discovery: ${project.name}`
        const newConversationId = await createConversation({
          userId,
          title: conversationTitle,
          messages: [],
        })

        setConversationId(newConversationId)

        // Link conversation to fingerprint
        if (fingerprint?._id) {
          await linkConversation({
            projectId,
            conversationId: newConversationId,
          })
        }

        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize conversation:', error)
        setIsInitialized(true)
      }
    }

    initializeConversation()
  }, [userId, projectId, project, fingerprint, existingConversation, isInitialized, createConversation, linkConversation])

  // Auto-snap to full screen when dragged close to edges
  useEffect(() => {
    if (!resizable.state.isDragging) {
      const { splitRatio } = resizable.state
      if (splitRatio > 0.95) {
        resizable.actions.snapToLeft()
      } else if (splitRatio < 0.05) {
        resizable.actions.snapToRight()
      }
    }
  }, [resizable.state.isDragging, resizable.state.splitRatio, resizable.actions])

  const handleSendMessage = useCallback(async (message: string) => {
    if (!userId || !message.trim() || !conversationId) {
      console.warn('Cannot send message: missing userId, conversationId, or empty message')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: 'user',
      timestamp: Date.now().toString(),
      chat_response: message.trim(),
      status: 'sent'
    }

    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      content: '',
      role: 'assistant',
      timestamp: Date.now().toString(),
      chat_response: '',
      status: 'typing',
      statusHistory: []
    }

    setMessages(prev => [...prev, userMessage, typingMessage])
    setIsLoading(true)
    setInputValue('')

    try {
      // Save user message to Convex
      await addMessage({
        userId,
        conversationId,
        message: {
          content: message.trim(),
          role: 'user',
          timestamp: Date.now(),
        }
      })

      // Send to backend for AI response
      const response = await sendDiscoveryMessage({
        query: message.trim(),
        projectId: projectId,
        isFirstMessage: messages.length === 0,
        sessionId: conversationId, // Use conversation ID as session ID
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        role: 'assistant',
        timestamp: Date.now().toString(),
        chat_response: response.response,
        suggestions: response.suggestions || [],
        status: 'delivered',
        metadata: {
          suggestions: response.suggestions || []
        }
      }

      // Save assistant message to Convex
      await addMessage({
        userId,
        conversationId,
        message: {
          content: response.response,
          role: 'assistant',
          timestamp: Date.now(),
        }
      })

      // Replace typing message with actual response
      setMessages(prev => prev.map(msg => 
        msg.status === 'typing' ? assistantMessage : msg
      ))

    } catch (error) {
      console.error('Discovery error:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Could you try again?",
        role: 'assistant',
        timestamp: Date.now().toString(),
        chat_response: "I'm having trouble connecting right now. Could you try again?",
        suggestions: ["Let's start over", "Tell me about your project"],
        status: 'failed',
        metadata: {
          suggestions: ["Let's start over", "Tell me about your project"]
        }
      }

      setMessages(prev => prev.map(msg => 
        msg.status === 'typing' ? errorMessage : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }, [userId, messages.length, projectId, conversationId, addMessage])

  const handleSuggestionClick = useCallback((suggestion: any) => {
    const text = typeof suggestion === 'string' ? suggestion : suggestion?.text || suggestion
    if (text) {
      setInputValue(prev => {
        const current = prev.trim()
        return current ? `${current} ${text}` : text
      })
      inputRef.current?.focus()
    }
  }, [])

  // Auto-start conversation when initialized
  useEffect(() => {
    if (userId && project && !hasAutoStarted && messages.length === 0 && !isLoading && isInitialized && conversationId) {
      setHasAutoStarted(true)
      
      const projectName = project.name
      const projectDescription = project.description || ''
      
      const autoMessage = [
        `I have a mission called "${projectName}"${projectDescription ? `: ${projectDescription}` : ''}.`,
        `I want to set this up properly so you can understand how I work best and what I'm trying to achieve.`,
        `Help me think through the key aspects - my working style, goals, success criteria, and how I want to approach this.`,
        `Ask me the questions that will help you really understand what I need.`
      ].join(' ')
      
      handleSendMessage(autoMessage)
    }
  }, [userId, project, hasAutoStarted, messages.length, isLoading, isInitialized, conversationId, handleSendMessage])

  if (!userId || !isInitialized) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Resizable Split Panes */}
      <div ref={resizable.containerRef} className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div style={resizable.styles.leftPanelStyle} className="flex flex-col h-full overflow-hidden">
          {/* Header Spacer */}
          {messages.length > 0 && (
            <div className="flex-shrink-0 h-24 border-b border-border/20" />
          )}
          
          {/* Messages Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="p-4 sm:p-6 pl-12 sm:pl-12">
                <div className="max-w-4xl mx-auto space-y-6">
                  <ChatMessagesList
                    messages={messages}
                    referencedMessage={null}
                    handleMessageReference={() => {}}
                    handleReferenceClick={() => {}}
                    handleOptionClick={handleSendMessage}
                    handleFollowUpClick={handleSendMessage}
                    userId={userId}
                    handleSuggestionClick={(suggestion: any, onSend: any) => handleSuggestionClick(suggestion)}
                    handleSendMessage={handleSendMessage}
                    onInputPopulate={(text: string) => setInputValue(prev => prev.trim() ? `${prev.trim()} ${text}` : text)}
                    notepadOpen={true}
                    onQuoteToNotepad={() => {}}
                    onContentClick={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border flex-shrink-0">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <ChatInput
                onSend={handleSendMessage}
                isLoading={isLoading}
                inputRef={inputRef}
                autoFocus={true}
                inputValue={inputValue}
                onInputChange={setInputValue}
                notepadOpen={true}
              />
            </div>
          </div>
        </div>

        {/* Draggable Divider */}
        <div
          className="w-2 cursor-col-resize flex-shrink-0 hover:bg-border/20 transition-colors duration-200"
          style={resizable.styles.dividerStyle}
          onMouseDown={resizable.actions.startDrag}
          title="Drag to resize panels"
        />

        {/* Fingerprint Canvas Panel */}
        <div style={resizable.styles.rightPanelStyle} className="overflow-hidden bg-background">
          <AmbientFingerprintCanvas
            projectId={projectId}
            messageCount={messages.length}
            isActive={true}
          />
        </div>
      </div>
    </div>
  )
}

export default FingerprintDiscoveryComposition
