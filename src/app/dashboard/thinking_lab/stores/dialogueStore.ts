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
        streamingContent: "", // Real-time streaming content as it arrives
        streamingComplete: false, // Streaming done, waiting for Convex
        expectedMessageCount: undefined, // Expected message count after completion
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
                pendingUserMessage: content
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

                // Call the backend - it writes to Convex immediately
                const response = await transmitMessageWithContext(requestParams)
                
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
                // Component subscription will replace optimistic messages with real ones
                set({
                    conversationId: convexConversationId || conversationId,
                    isLoading: false,
                    currentStatus: undefined,
                    pendingUserMessage: undefined, // Clear optimistic message
                    // Store suggestions temporarily for UI (they're ephemeral)
                    lastSuggestions: response.suggestions || []
                })
                
                console.log('[DialogueStore] Store updated with conversationId, subscription should fire')

            } catch (error) {
                console.error('Failed to send message:', error)
                set({
                    isLoading: false,
                    currentStatus: undefined,
                    pendingUserMessage: undefined, // Clear optimistic message on error
                    error: error instanceof Error ? error.message : 'Failed to send message'
                })
            }
        },

        // Streaming version of sendMessage - yields chunks in real-time
        sendMessageStream: async (content: string, fileAttachments?: FileUploadResponse[]) => {
            const { conversationId } = get()

            // Determine if this is the first message
            const isFirstMessage = !conversationId
            const actualSessionId = isFirstMessage ? null : conversationId

            // Set loading state with optimistic messages
            set({
                isLoading: true,
                error: undefined,
                currentStatus: 'Connecting...',
                pendingUserMessage: content, // User message for optimistic UI
                streamingContent: "", // Will be updated as chunks arrive
                streamingComplete: false, // Reset completion flag
                expectedMessageCount: undefined
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

                // Call the streaming backend - updates UI as chunks arrive
                const response = await transmitMessageWithStreaming(
                    requestParams,
                    (chunk: string) => {
                        // Update streaming content as chunks arrive
                        set(state => ({
                            streamingContent: state.streamingContent + chunk
                        }))
                    }
                    // Suggestions generated async, no callback needed
                )
                
                // Backend writes to Convex after streaming completes
                // Component subscription will update messages from Convex
                const convexConversationId = response.session_identifier || response.conversationId
                
                // Mark streaming as complete but KEEP isLoading true
                // We'll clear it only when Convex confirms the message arrived
                set({
                    conversationId: convexConversationId || conversationId,
                    streamingComplete: true, // Mark as complete, waiting for Convex
                    currentStatus: undefined,
                    // Keep isLoading, pendingUserMessage, and streamingContent until Convex confirms
                })

            } catch (error) {
                console.error('Failed to stream message:', error)
                set({
                    isLoading: false,
                    currentStatus: undefined,
                    pendingUserMessage: undefined,
                    streamingContent: "", // Clear streaming content on error
                    error: error instanceof Error ? error.message : 'Failed to stream message'
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
                lastSuggestions: []
            })
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