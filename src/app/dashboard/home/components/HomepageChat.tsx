'use client'

import React, { useState, useEffect, startTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useConversationState } from '@/app/dashboard/thinking_lab/hooks/useConversationState'
import { ChatInputBox } from './ChatInputBox'
import ChatMessagesList from '@/app/dashboard/thinking_lab/components/dialogue/components/ChatMessagesList'
import type { Id } from '@/convex/_generated/dataModel'
import { Home, RotateCcw } from 'lucide-react'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import { T } from '@/components/translation/T'
import { useTranslation } from '@/hooks/useTranslation'
import { InsightPills, type InsightWithOptionalIcon } from '@/components/ui/insight-pills'
import { Users, BarChart3, TrendingUp, Lightbulb, Target, Calendar, Zap } from 'lucide-react'

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
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  // Note: inputValue, showResetDialog, and isResetting are user interaction state - keep them
  const router = useRouter()
  const hasRedirectedRef = React.useRef(false)
  
  // Translations for titles and labels
  const { text: backToMainChatTitle } = useTranslation('Back to main chat', {
    sourceLang: 'en',
    context: 'dashboard.home.chat.back_to_main'
  })
  const { text: resetConversationTitle } = useTranslation('Reset conversation', {
    sourceLang: 'en',
    context: 'dashboard.home.chat.reset.title'
  })
  const { text: resetButtonText } = useTranslation('Reset', {
    sourceLang: 'en',
    context: 'button.reset'
  })
  const { text: cancelButtonText } = useTranslation('Cancel', {
    sourceLang: 'en',
    context: 'button.cancel'
  })
  const { text: projectChatTitle } = useTranslation('Project Chat', {
    sourceLang: 'en',
    context: 'dashboard.home.chat.project.title'
  })
  
  // Mutation for deleting conversation
  const deleteConversation = useMutation(api.chatMutations.deleteConversation)

  // Get project name for header display
  const project = useQuery(
    api.projectsQueries.getById,
    activeProjectId && userId ? { 
      projectId: activeProjectId as any,
      userId,
      includeContent: false
    } : 'skip'
  )

  // Use conversationState hook for functions and optimistic updates
  const {
    conversationId,
    optimisticMessages,
    sendMessage,
    startNewConversation,
  } = useConversationState(
    userId ?? undefined,
    activeProjectId ?? undefined, // projectId for project-scoped chat
    undefined, // no widgetId
    undefined, // no widgetOutputId
    undefined, // no notepad context
    undefined  // no chatId (HomepageChat always creates new or uses project conversation)
  )

  // Use new Convex query for state (replaces messages from useConversationState)
  const conversationData = useQuery(
    api.chatQueries.getConversationWithState,
    conversationId && userId ? { userId, conversationId: conversationId as Id<"conversations"> } : "skip"
  )

  // Extract messages and thinkingState from query result
  const convexMessages = conversationData?.messages || []
  const thinkingState = conversationData?.thinkingState
  const isLoading = thinkingState?.isLoading ?? false

  // Merge optimistic messages with Convex messages
  const messages = React.useMemo(() => {
    const list = [...convexMessages]
    
    // Add optimistic user messages
    optimisticMessages.forEach(optMsg => {
      if (optMsg.role === 'user' && !list.some(msg => msg.content === optMsg.content && msg.role === 'user')) {
        list.push({
          id: optMsg.id,
          content: optMsg.content,
          role: optMsg.role,
          timestamp: optMsg.timestamp.toString(),
          chat_response: optMsg.content,
          status: 'sent',
        } as any)
      }
    })
    
    // Sort by timestamp
    return list.sort((a, b) => {
      const timeA = typeof a.timestamp === 'string' ? parseInt(a.timestamp) : a.timestamp
      const timeB = typeof b.timestamp === 'string' ? parseInt(b.timestamp) : b.timestamp
      return timeA - timeB
    })
  }, [convexMessages, optimisticMessages])

  // Get AmbientInsights for pill display
  const convexInsights = useQuery(
    api.ambientInsights.getMostRecentByUserId,
    userId ? { userId } : 'skip'
  )

  // Icon mapping for different insight types
  const getIconForCategory = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'audience': <Users className="w-6 h-6" />,
      'data_driven': <BarChart3 className="w-6 h-6" />,
      'engagement': <TrendingUp className="w-6 h-6" />,
      'strategy': <Target className="w-6 h-6" />,
      'content': <Lightbulb className="w-6 h-6" />,
      'timing': <Calendar className="w-6 h-6" />,
      'boost': <Zap className="w-6 h-6" />,
      'default': <Lightbulb className="w-6 h-6" />
    }
    return iconMap[category.toLowerCase()] || iconMap['default']
  }

  // Map Convex data to InsightWithOptionalIcon format
  const mappedInsights = React.useMemo<InsightWithOptionalIcon[]>(() => {
    if (convexInsights && Array.isArray(convexInsights.data) && convexInsights.data.length > 0) {
      return convexInsights.data.map((item: any, index: number) => ({
        type: item.category || 'auto_generated',
        title: item.title,
        description: item.content,
        action: item.recommendation || '',
        recommendation: item.recommendation || '',
        icon: getIconForCategory(item.category || 'default'),
        id: `${convexInsights._id}-${index}`
      }))
    }
    return []
  }, [convexInsights?._id, convexInsights?.data])

  // Auto-redirect to Thinking Lab after first AI response completes
  // Wait for: user message + AI response + not loading
  useEffect(() => {
    // Check if we have at least one user message and one assistant message
    const hasUserMessage = messages.some((msg: any) => msg.role === 'user')
    const hasAssistantMessage = messages.some((msg: any) => {
      // Exclude A2A messages - we want the actual user-facing assistant response
      const A2A_MESSAGE_TYPES = ['a2a_announcement', 'widget_agent_announcement', 'widget_introduction', 'artifact_created', 'widget_status']
      return msg.role === 'assistant' && (!msg.contentType || !A2A_MESSAGE_TYPES.includes(msg.contentType))
    })
    
    // Only redirect when:
    // 1. We have a conversation
    // 2. User has sent a message
    // 3. AI has responded (assistant message exists)
    // 4. Not currently loading (thinking/processing complete)
    // 5. Haven't redirected yet
    if (conversationId && hasUserMessage && hasAssistantMessage && !isLoading && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      startTransition(() => {
        const params = new URLSearchParams()
        params.set('conversationId', conversationId)
        if (activeProjectId) {
          params.set('projectId', activeProjectId)
        }
        params.set('panel', 'widgets')
        router.push(`/dashboard/thinking_lab?${params.toString()}`)
      })
    }
  }, [conversationId, messages, isLoading, activeProjectId, router])

  // Handle insight click - format message and send
  const handleInsightClick = async (insight: InsightWithOptionalIcon) => {
    const message = `${insight.title}\n\n${insight.description}\n\n${insight.action}`
    await sendMessage(message.trim())
  }

  // Handle suggestion clicks
  const handleSuggestionClick = (suggestion: any, onSendMessage: (text: string) => void) => {
    if (typeof suggestion === 'string') {
      onSendMessage(suggestion)
    } else if (suggestion.action || suggestion.text || suggestion.description) {
      onSendMessage(suggestion.action || suggestion.text || suggestion.description)
    }
  }

  // Handle send from ChatInputBox
  const handleSend = async (message: string, fileAttachments?: any[]) => {
    if (message.trim()) {
      setInputValue('')
      // Note: sendMessage from useConversationState handles file attachments
      // The fileAttachments will be passed through the addMessageToConversation
      // sendMessage is async and will create conversation if needed
      // Auto-redirect is handled by useEffect above when streaming completes
      await sendMessage(message.trim(), fileAttachments)
    }
  }

  // Handle conversation reset
  const handleResetConversation = async () => {
    if (!conversationId || !userId) return

    setIsResetting(true)
    try {
      // Delete the conversation from Convex
      await deleteConversation({
        conversationId,
        userId,
      })
      
      // Clear local state - this will allow a fresh conversation to be created
      startNewConversation()
      
      // Clear URL parameter if present (redirect to thinking lab without chatId)
      const params = new URLSearchParams()
      if (activeProjectId) params.set('projectId', activeProjectId)
      router.push(`/dashboard/thinking_lab${params.toString() ? `?${params.toString()}` : ''}`)
      
      // Close the dialog
      setShowResetDialog(false)
    } catch (error) {
      console.error('Failed to reset conversation:', error)
      alert('Failed to reset conversation. Please try again.')
    } finally {
      setIsResetting(false)
    }
  }

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
                    title={backToMainChatTitle}
                  >
                    <Home className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">
                      {project?.name || projectChatTitle}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      <T context="dashboard.home.chat.project.description">Project conversation with your families</T>
                    </p>
                  </div>
                </div>
                {/* Reset conversation button - only show if conversation exists */}
                {conversationId && messages.length > 0 && (
                  <button
                    onClick={() => setShowResetDialog(true)}
                    disabled={isResetting}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={resetConversationTitle}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <T context="dashboard.home.chat.reset.button">Reset</T>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Messages Display - only show if messages exist */}
          {messages.length > 0 && (
            <div className="space-y-4 px-6 pt-6 pb-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {activeProjectId ? <T context="dashboard.home.chat.messages.family">Family Messages</T> : <T context="dashboard.home.chat.messages.conversation">Conversation</T>}
                </h3>
              </div>

              {/* Message List - scrollable with fixed height */}
              <div className="max-h-96 overflow-y-auto space-y-4">
                {/* User-facing messages - chat responses, preflight questions, etc. */}
                {/* Thinking component is now IN-LINE, rendered inside ChatMessagesList */}
                <ChatMessagesList
                  messages={messages}
                  conversationData={conversationData}
                  referencedMessage={null}
                  handleMessageReference={() => {}}
                  handleReferenceClick={() => {}}
                  handleOptionClick={sendMessage}
                  handleFollowUpClick={sendMessage}
                  userId={userId ?? undefined}
                  handleSuggestionClick={handleSuggestionClick}
                  handleSendMessage={sendMessage}
                  shouldShowThinking={thinkingState?.shouldShow}
                  a2aMessages={thinkingState?.a2aMessages}
                  isLoading={isLoading}
                  hasFinalArtifact={false}
                />
              </div>
            </div>
          )}

          {/* Chat Input - integrated at bottom */}
          <ChatInputBox 
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            isLoading={isLoading}
            conversationId={conversationId}
          />
        </div>
      </div>

      {/* Insight Pills - OUTSIDE chat container, below input bar */}
      {mappedInsights.length > 0 && (
        <InsightPills
          insights={mappedInsights}
          onInsightClick={handleInsightClick}
          isLoading={convexInsights === undefined}
        />
      )}

      {/* Reset Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleResetConversation}
        title={<T context="dialog.reset.conversation.title">Reset Conversation</T>}
        description={<T context="dialog.reset.conversation.description">Are you sure you want to reset this conversation? This will delete all messages and start fresh. This action cannot be undone.</T>}
        confirmText={resetButtonText}
        cancelText={cancelButtonText}
        isLoading={isResetting}
      />
    </div>
  )
}
