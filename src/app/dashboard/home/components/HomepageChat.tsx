'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { useConversationState } from '@/app/dashboard/thinking_lab/hooks/useConversationState'
import { useMessageList } from '@/app/dashboard/thinking_lab/hooks/useMessageList'
import { ChatInputBox } from './ChatInputBox'
import ChatMessagesList from '@/app/dashboard/thinking_lab/components/dialogue/components/ChatMessagesList'
import { ArrowRight } from 'lucide-react'

/**
 * HomepageChat - Seamless chat with messages above styled input
 * 
 * Layout:
 * - Messages appear ABOVE the input (grow upward)
 * - Input stays fixed with gradient styling
 * - Seamless expansion when messages arrive
 */
export function HomepageChat() {
  const [userId, setUserId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const router = useRouter()

  // Get user ID on component mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.error('Failed to get user ID:', error)
      }
    }
    getUserId()
  }, [])

  // REUSE: useConversationState hook - all chat logic
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
    undefined, // no projectId
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
      {/* Messages Display - ABOVE input, only show if messages exist */}
      {messageList.length > 0 && (
        <div className="space-y-4">
          {/* Header with "Open in Lab" button */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Conversation</h3>
            {conversationId && (
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
          <div className="max-h-96 overflow-y-auto space-y-4 rounded-lg p-4">
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

      {/* Chat Input - ALWAYS at bottom with gradient styling */}
      <ChatInputBox 
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        isLoading={isStreaming}
      />
    </div>
  )
}
