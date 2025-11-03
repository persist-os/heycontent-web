'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useConversationState } from '@/app/dashboard/thinking_lab/hooks/useConversationState'
import { useMessageList } from '@/app/dashboard/thinking_lab/hooks/useMessageList'
import { ChatInputBox } from './ChatInputBox'
import ChatMessagesList from '@/app/dashboard/thinking_lab/components/dialogue/components/ChatMessagesList'
import { ArrowRight, Home } from 'lucide-react'

interface HomepageChatProps {
  userId: string | null
  activeProjectId: string | null
  onBackToMainChat: () => void
}

/**
 * HomepageChat - Seamless chat with messages above styled input
 * 
 * Supports switching between main chat and project-scoped conversations.
 * When a pending question is clicked, switches to that project's conversation
 * where the family question already exists as an assistant message.
 * 
 * Like a text thread - the family already sent the message, user just replies.
 * 
 * Layout:
 * - Messages appear ABOVE the input (grow upward)
 * - Input stays fixed with gradient styling
 * - Seamless expansion when messages arrive
 */
export function HomepageChat({ 
  userId, 
  activeProjectId,
  onBackToMainChat
}: HomepageChatProps) {
  const [inputValue, setInputValue] = useState('')
  const router = useRouter()

  // Get project name for header display
  const project = useQuery(
    api.projectsQueries.getById,
    activeProjectId && userId ? { 
      projectId: activeProjectId as any,
      userId,
      includeContent: false
    } : 'skip'
  )

  // REUSE: useConversationState hook - all chat logic
  // Pass projectId when viewing project conversation
  const {
    conversationId,
    isStreaming,
    streamingContent,
    optimisticMessages,
    currentStreamingId,
    messages,
    sendMessage,
  } = useConversationState(
    userId ?? undefined,
    activeProjectId ?? undefined, // projectId for project-scoped chat
    undefined, // no widgetId
    undefined, // no widgetOutputId
    undefined  // no notepad context
  )

  // REUSE: useMessageList hook - combines all message sources
  const messageList = useMessageList({
    convexMessages: messages,
    optimisticMessages,
    streamingContent,
    currentStreamingId,
    isStreaming
  })

  // Navigate to Thinking Lab with conversation
  const openInThinkingLab = useCallback(() => {
    if (conversationId) {
      router.push(`/dashboard/thinking-lab?chatId=${conversationId}`)
    }
  }, [conversationId, router])

  // Handle suggestion clicks
  const handleSuggestionClick = useCallback((suggestion: any, onSendMessage: (text: string) => void) => {
    if (typeof suggestion === 'string') {
      onSendMessage(suggestion)
    } else if (suggestion.action || suggestion.text || suggestion.description) {
      onSendMessage(suggestion.action || suggestion.text || suggestion.description)
    }
  }, [])

  // Handle send from ChatInputBox
  const handleSend = useCallback((message: string, fileAttachments?: any[]) => {
    if (message.trim()) {
      // Note: sendMessage from useConversationState handles file attachments
      // The fileAttachments will be passed through the addMessageToConversation
      sendMessage(message.trim(), fileAttachments)
      setInputValue('')
    }
  }, [sendMessage])

  return (
    <div className="space-y-4">
      {/* Unified Chat Container - Messages + Input in one cohesive gradient box */}
      <div className="relative w-full rounded-[2rem] p-1 bg-gradient-to-r from-primary/60 via-primary-light/50 to-primary-dark/40 shadow-xl shadow-primary/20 border border-primary/30">
        {/* Inner glassmorphic container */}
        <div className="relative rounded-[2rem] bg-background/80 backdrop-blur-xl">
          
          {/* Header - always visible when in project chat */}
          {activeProjectId && (
            <div className="px-6 pt-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={onBackToMainChat}
                    className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                    title="Back to main chat"
                  >
                    <Home className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">
                      {project?.name || 'Project Chat'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Project conversation with your families
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messages Display - only show if messages exist */}
          {messageList.length > 0 && (
            <div className="space-y-4 px-6 pt-6 pb-4">
              {/* Header with "Open in Lab" button */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {activeProjectId ? 'Family Messages' : 'Conversation'}
                </h3>
                {conversationId && !activeProjectId && (
                  <button
                    onClick={openInThinkingLab}
                    className="text-sm text-primary-dark hover:text-primary flex items-center gap-2 transition-colors font-medium hover:underline"
                  >
                    Open in Thinking Lab
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Message List - scrollable with fixed height */}
              <div className="max-h-96 overflow-y-auto space-y-4">
                <ChatMessagesList
                  messages={messageList}
                  referencedMessage={null}
                  handleMessageReference={() => {}}
                  handleReferenceClick={() => {}}
                  handleOptionClick={sendMessage}
                  handleFollowUpClick={sendMessage}
                  userId={userId ?? undefined}
                  handleSuggestionClick={handleSuggestionClick}
                  handleSendMessage={sendMessage}
                />
              </div>
            </div>
          )}

          {/* Chat Input - integrated at bottom */}
          <ChatInputBox 
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            isLoading={isStreaming}
          />
        </div>
      </div>
    </div>
  )
}
