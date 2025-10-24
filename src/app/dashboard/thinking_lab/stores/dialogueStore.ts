/**
 * Dialogue Store
 *
 * Zustand store for managing conversation state and actions.
 * This replaces/wraps your existing chat store.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Import API services
import { transmitMessageWithContext, transmitMessageWithStreaming } from '../modules/api/messageService'
import { useLayoutStore } from './layoutStore' // For getting context preferences
import { useNotepadStore } from './notepadStore' // For getting notepad context

// Import proper chat types for compatibility
import type { Message } from '@/app/types/chat'
import type { DialogueState, DialogueActions, MessageTransmissionRequest } from '../types'
import type { FileUploadResponse } from '@/lib/file-upload'

type DialogueStore = DialogueState & DialogueActions

export const useDialogueStore = create<DialogueStore>()(
    subscribeWithSelector((set, get) => ({
        // Initial state - UI state only, NO messages (Convex is source of truth)
        isLoading: false,
        conversationId: undefined,
        error: undefined,
        currentStatus: undefined,
        quotedContent: "", // Content to be quoted to notepad
        lastSuggestions: [], // Ephemeral suggestions from last response
        pendingUserMessage: undefined, // Optimistic UI: user message before Convex write
        streamingContent: "", // Real-time streaming content during chat
        // Project/widget context
        projectId: undefined,
        widgetId: undefined,
        widgetOutputId: undefined,

        // Actions
        sendMessage: async (content: string, fileAttachments?: FileUploadResponse[]) => {
            const { conversationId } = get()

            // Determine if this is the first message
            const isFirstMessage = !conversationId
            const actualSessionId = isFirstMessage ? null : conversationId

            // Set loading state + optimistic user message immediately
            set({
                isLoading: true,
                error: undefined,
                currentStatus: 'Thinking...',
                pendingUserMessage: content,
                streamingContent: "" // Clear any previous streaming content
            })

            try {
                // Get notepad context if enabled
                const notepadState = useNotepadStore.getState()
                const notepadContext = notepadState.includeInMessages && notepadState.currentContent
                    ? {
                        content: notepadState.currentContent,
                        title: notepadState.currentTitle || 'Untitled'
                      }
                    : null

                // Get project/widget context from store
                const { projectId, widgetId, widgetOutputId } = get()

                // Determine conversation type based on context
                const conversationType = widgetOutputId ? 'widget_prompt' : 'general'

                // Prepare request parameters
                const requestParams: MessageTransmissionRequest = {
                    content,
                    isFirstMessage,
                    sessionIdentifier: actualSessionId,
                    workspaceContext: conversationId ? { contentId: conversationId } : null,
                    notepadContext,
                    fileAttachments,
                    projectId,
                    widgetId,
                    widgetOutputId,
                    conversationType,
                    onStatusUpdate: (status: string) => {
                        set({ currentStatus: status })
                    }
                }

                // Call the streaming backend - accumulate chunks in store state
                const response = await transmitMessageWithStreaming(
                    requestParams,
                    (chunk: string) => {
                        // Accumulate streaming chunks in store state for real-time UI updates
                        console.log('[DialogueStore] Received chunk:', chunk.length, 'chars')
                        set(state => ({
                            streamingContent: state.streamingContent + chunk
                        }))
                    }
                )
                
                console.log('[DialogueStore] Backend response:', {
                    response,
                    session_identifier: response.session_identifier,
                    conversationId: response.conversationId,
                    suggestions: response.suggestions
                })
                
                // Backend no longer returns message content, just conversationId and suggestions
                // Component subscription will automatically update messages from Convex
                const convexConversationId = response.session_identifier || response.conversationId
                
                console.log('[DialogueStore] Setting conversationId:', convexConversationId)
                
                // Update conversationId and suggestions, clear loading state
                // Keep streamingContent until Convex subscription updates with real message
                set({
                    conversationId: convexConversationId || conversationId,
                    isLoading: false,
                    currentStatus: undefined,
                    pendingUserMessage: undefined, // Clear optimistic message
                    // Keep streamingContent until Convex subscription replaces it
                    // streamingContent: "", // Don't clear immediately - let Convex subscription handle it
                    // Store suggestions temporarily for UI (they're ephemeral)
                    lastSuggestions: response.suggestions || []
                })
                
                console.log('[DialogueStore] Store updated with conversationId, subscription should fire')
                
                // Keep streaming content until message is confirmed in Convex
                // This will be cleared when:
                // 1. User starts a new conversation (startNewConversation action)
                // 2. User navigates away (component unmount)
                // 3. Message is confirmed to exist in Convex (via component query)
                console.log('[DialogueStore] Keeping streaming content until new conversation or navigation')

            } catch (error) {
                console.error('Failed to send message:', error)
                set({
                    isLoading: false,
                    currentStatus: undefined,
                    pendingUserMessage: undefined, // Clear optimistic message on error
                    streamingContent: "", // Clear streaming content on error
                    error: error instanceof Error ? error.message : 'Failed to send message'
                })
            }
        },


        setLoading: (loading: boolean) => {
            set({ isLoading: loading })
        },

        startNewConversation: () => {
            set({
                conversationId: undefined,
                error: undefined,
                currentStatus: undefined,
                pendingUserMessage: undefined,
                streamingContent: "", // Clear streaming content when starting new conversation
                lastSuggestions: []
            })
        },

        clearStreamingContent: () => {
            set({ streamingContent: "" })
        },

        loadConversation: async (conversationId: string) => {
            // Just set conversationId - component's useQuery will load messages
            console.log('[DialogueStore] loadConversation - setting conversationId:', conversationId)
            set({ conversationId })
        },

        setError: (error: string | undefined) => {
            set({ error })
        },

        setStatus: (status: string | undefined) => {
            set({ currentStatus: status })
        },


        // Quote functionality
        setQuotedContent: (content: string) => {
            set({ quotedContent: content })
        },

        clearQuotedContent: () => {
            set({ quotedContent: "" })
        },

        // Reset for widget context
        resetForWidget: () => {
            set({
                conversationId: undefined,
                error: undefined,
                currentStatus: undefined,
                quotedContent: "",
                pendingUserMessage: undefined,
                streamingContent: "",
                lastSuggestions: []
            })
        },

        // Set project/widget context
        setProjectContext: (projectId?: string, widgetId?: string, widgetOutputId?: string) => {
            console.log('[DIALOGUE STORE] Setting context:', { projectId, widgetId, widgetOutputId });
            set({
                projectId,
                widgetId,
                widgetOutputId
            })
        },

        // Clear project/widget context (exit container)
        clearProjectContext: () => {
            console.log('[DIALOGUE STORE] Clearing context');
            set({
                projectId: undefined,
                widgetId: undefined,
                widgetOutputId: undefined
            })
        }
    }))
)

// Additional selectors for convenience
export const useDialogueLoading = () => useDialogueStore(state => state.isLoading)
export const useDialogueActions = () => useDialogueStore(state => ({
    sendMessage: state.sendMessage,
    startNewConversation: state.startNewConversation,
    loadConversation: state.loadConversation,
    setQuotedContent: state.setQuotedContent,
    clearQuotedContent: state.clearQuotedContent
}))