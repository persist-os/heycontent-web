'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import { useQuery } from 'convex/react'
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
  const [hasAutoStarted, setHasAutoStarted] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const resizable = useResizablePanes(0.6)

  // Get project details for auto-start
  const project = useQuery(
    api.projectsQueries.getById,
    projectId && userId ? { projectId, userId } : 'skip'
  )

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
    if (!userId || !message.trim()) {
      console.warn('Cannot send message: missing userId or empty message')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: 'user',
      timestamp: Date.now().toString(),
      chat_response: message.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setInputValue('')

    try {
      const response = await sendDiscoveryMessage({
        query: message.trim(),
        projectId: projectId,
        isFirstMessage: messages.length === 0,
        sessionId: sessionStorage.getItem('discovery_session_id') || undefined
      })

      if (response.session_id) {
        sessionStorage.setItem('discovery_session_id', response.session_id)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        role: 'assistant',
        timestamp: Date.now().toString(),
        chat_response: response.response,
        suggestions: response.suggestions || [],
        metadata: {
          suggestions: response.suggestions || []
        }
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Discovery error:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Could you try again?",
        role: 'assistant',
        timestamp: Date.now().toString(),
        chat_response: "I'm having trouble connecting right now. Could you try again?",
        suggestions: ["Let's start over", "Tell me about your project"],
        metadata: {
          suggestions: ["Let's start over", "Tell me about your project"]
        }
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [userId, messages.length, projectId])

  const handleSuggestionClick = useCallback((suggestion: any) => {
    const text = typeof suggestion === 'string' ? suggestion : suggestion?.text || suggestion
    if (text) {
      // Append to existing input instead of sending immediately
      setInputValue(prev => {
        const current = prev.trim()
        return current ? `${current} ${text}` : text
      })
      // Focus the input so user can edit or send
      inputRef.current?.focus()
    }
  }, [])

  // Auto-start conversation when project loads
  useEffect(() => {
    if (userId && project && !hasAutoStarted && messages.length === 0 && !isLoading) {
      setHasAutoStarted(true)
      
      const projectName = project.name
      const projectDescription = project.description || ''
      
      // Build focused, effective auto-start message
      const autoMessage = [
        `I'm working on a project called "${projectName}"${projectDescription ? `: ${projectDescription}` : ''}.`,
        `I want to set this up properly so you can understand how I work best and what I'm trying to achieve.`,
        `Help me think through the key aspects - my working style, goals, success criteria, and how I want to approach this.`,
        `Ask me the questions that will help you really understand what I need.`
      ].join(' ')
      
      handleSendMessage(autoMessage)
    }
  }, [userId, project, hasAutoStarted, messages.length, isLoading, handleSendMessage])

  if (!userId) {
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
          {/* Messages Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="p-4 sm:p-6">
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
            onAllStarsDiscovered={() => {
              if (projectId) {
                router.push(`/dashboard/living-projects/${projectId}`)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default FingerprintDiscoveryComposition
