/**
 * Dialogue Store
 *
 * Zustand store for managing conversation state and actions.
 * This replaces/wraps your existing chat store.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Import API services
import { transmitMessageWithContext } from '../modules/api/messageService'
import { useLayoutStore } from './layoutStore' // For getting context preferences
import { useNotepadStore } from './notepadStore' // For getting notepad context

// Import proper chat types for compatibility
import type { Message } from '@/app/types/chat'
import type { DialogueState, DialogueActions, MessageTransmissionRequest } from '../types'
import type { FileUploadResponse } from '@/lib/file-upload'

type DialogueStore = DialogueState & DialogueActions

export const useDialogueStore = create<DialogueStore>()(
    subscribeWithSelector((set, get) => ({
        // Initial state
        messages: [],
        isLoading: false,
        sessionId: `session-${Date.now()}`,
        conversationId: undefined,
        error: undefined,
        currentStatus: undefined,
        useContextSearch: true, // Default to enabled
        quotedContent: "", // Content to be quoted to notepad

        // Actions
        sendMessage: async (content: string, fileAttachments?: FileUploadResponse[]) => {
            const { messages, sessionId, conversationId, useContextSearch } = get()

            // Add user message immediately
            const userMessage: Message = {
                id: `msg-${Date.now()}`,
                content,
                role: 'user',
                timestamp: Date.now().toString(),
                chat_response: content,
                status: 'sent',
                fileAttachments: fileAttachments || undefined
            }

            // Create typing message for thinking indicator
            const typingMessage: Message = {
                id: `typing-${Date.now()}`,
                content: '',
                role: 'assistant',
                timestamp: Date.now().toString(),
                chat_response: '',
                status: 'typing',
                statusHistory: []
            }

            set({
                messages: [...messages, userMessage, typingMessage],
                isLoading: true,
                error: undefined,
                currentStatus: 'Thinking...'
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
                
                console.log('[DialogueStore] Sending message with notepad context:', {
                    hasNotepadContext: !!notepadContext,
                    includeInMessages: notepadState.includeInMessages,
                    contentLength: notepadState.currentContent.length,
                    title: notepadState.currentTitle
                })

                // Prepare request parameters
                const requestParams: MessageTransmissionRequest = {
                    content,
                    isFirstMessage: messages.length === 0,
                    sessionIdentifier: sessionId,
                    workspaceContext: conversationId ? { contentId: conversationId } : null,
                    notepadContext, // Include notepad context
                    useContextSearch,
                    fileAttachments,
                    onStatusUpdate: (status: string) => {
                        set({ currentStatus: status })
                        // Update the typing message with status updates
                        set(state => ({
                            messages: state.messages.map(msg => 
                                msg.status === 'typing' 
                                    ? { 
                                        ...msg, 
                                        statusHistory: [...(msg.statusHistory || []), status],
                                        searchStatus: status
                                    }
                                    : msg
                            )
                        }))
                    }
                }

                // Call the enhanced message service
                const response = await transmitMessageWithContext(requestParams)
                
                console.log('[DialogueStore] Received response from messageService:', {
                    hasResponse: !!response,
                    responseKeys: response ? Object.keys(response) : [],
                    response_content: response?.response_content,
                    response_content_length: response?.response_content?.length,
                    session_identifier: response?.session_identifier
                })

                // Create assistant message from response
                const assistantMessage: Message = {
                    id: `msg-${Date.now() + 1}`,
                    content: response.response_content || 'No response received',
                    role: 'assistant',
                    timestamp: Date.now().toString(),
                    chat_response: response.response_content || 'No response received',
                    status: 'delivered',
                    suggestions: response.suggestions || [],
                    metadata: response.suggestions ? { suggestions: response.suggestions } : undefined
                }

                // Replace typing message with real response
                set(state => ({
                    messages: state.messages.map(msg => 
                        msg.status === 'typing' ? assistantMessage : msg
                    ),
                    isLoading: false,
                    currentStatus: undefined,
                    sessionId: response.session_identifier || state.sessionId,
                    conversationId: response.session_identifier || state.conversationId
                }))

            } catch (error) {
                console.error('Failed to send message:', error)
                // Replace typing message with error message
                const errorMessage: Message = {
                    id: `error-${Date.now()}`,
                    content: 'Sorry, I encountered an error. Please try again.',
                    role: 'assistant',
                    timestamp: Date.now().toString(),
                    chat_response: 'Error occurred',
                    status: 'failed'
                }

                set(state => ({
                    messages: state.messages.map(msg => 
                        msg.status === 'typing' ? errorMessage : msg
                    ),
                    isLoading: false,
                    currentStatus: undefined,
                    error: error instanceof Error ? error.message : 'Failed to send message'
                }))
            }
        },

        addMessage: (message: Message) => {
            set(state => ({
                messages: [...state.messages, message]
            }))
        },

        setLoading: (loading: boolean) => {
            set({ isLoading: loading })
        },

        startNewConversation: () => {
            set({
                messages: [],
                sessionId: `session-${Date.now()}`,
                conversationId: undefined,
                error: undefined,
                currentStatus: undefined
            })
        },

        loadConversation: async (conversationId: string) => {
            set({ isLoading: true, error: undefined })

            try {
                // Mock conversation loading
                const mockMessages: Message[] = [
                    {
                        id: 'msg-1',
                        content: 'Hello! This is a loaded conversation.',
                        role: 'user',
                        timestamp: (Date.now() - 10000).toString(),
                        chat_response: 'Hello! This is a loaded conversation.'
                    },
                    {
                        id: 'msg-2',
                        content: 'Welcome back to this conversation!',
                        role: 'assistant',
                        timestamp: (Date.now() - 5000).toString(),
                        chat_response: 'Welcome back to this conversation!'
                    }
                ]

                set({
                    messages: mockMessages,
                    conversationId,
                    isLoading: false
                })

            } catch (error) {
                console.error('Failed to load conversation:', error)
                set({
                    isLoading: false,
                    error: error instanceof Error ? error.message : 'Failed to load conversation'
                })
            }
        },

        quoteMessage: (messageId: string) => {
            const { messages } = get()
            const message = messages.find(m => m.id === messageId)

            if (message) {
                console.log('Quoting message:', message.content)
                // Quote integration handled by parent components
            }
        },

        clearMessages: () => {
            set({ messages: [] })
        },

        setError: (error: string | undefined) => {
            set({ error })
        },

        setStatus: (status: string | undefined) => {
            set({ currentStatus: status })
        },

        toggleContextSearch: () => {
            set(state => ({ useContextSearch: !state.useContextSearch }))
        },

        // Quote functionality
        setQuotedContent: (content: string) => {
            set({ quotedContent: content })
        },

        clearQuotedContent: () => {
            set({ quotedContent: "" })
        },

        // Reset for widget context - clears messages but preserves widget context
        resetForWidget: () => {
            set({
                messages: [],
                sessionId: `session-${Date.now()}`,
                error: undefined,
                currentStatus: undefined,
                quotedContent: "",
                // Note: conversationId is preserved for widget context
            })
        }
    }))
)

// Additional selectors for convenience
export const useDialogueMessages = () => useDialogueStore(state => state.messages)
export const useDialogueLoading = () => useDialogueStore(state => state.isLoading)
export const useDialogueActions = () => useDialogueStore(state => ({
    sendMessage: state.sendMessage,
    startNewConversation: state.startNewConversation,
    loadConversation: state.loadConversation,
    setQuotedContent: state.setQuotedContent,
    clearQuotedContent: state.clearQuotedContent
}))