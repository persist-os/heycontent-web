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

// Import centralized types
import type { Message, DialogueState, DialogueActions, MessageTransmissionRequest } from '../types'

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

        // Actions
        sendMessage: async (content: string) => {
            const { messages, sessionId, conversationId, useContextSearch } = get()

            // Add user message immediately
            const userMessage: Message = {
                id: `msg-${Date.now()}`,
                content,
                role: 'user',
                timestamp: Date.now()
            }

            set({
                messages: [...messages, userMessage],
                isLoading: true,
                error: undefined,
                currentStatus: 'Sending your message...'
            })

            try {
                // Prepare request parameters
                const requestParams: MessageTransmissionRequest = {
                    content,
                    isFirstMessage: messages.length === 0,
                    sessionIdentifier: sessionId,
                    workspaceContext: conversationId ? { contentId: conversationId } : null,
                    useContextSearch,
                    onStatusUpdate: (status: string) => {
                        set({ currentStatus: status })
                    }
                }

                // Call the enhanced message service
                const response = await transmitMessageWithContext(requestParams)

                // Create assistant message from response
                const assistantMessage: Message = {
                    id: `msg-${Date.now() + 1}`,
                    content: response.response_content || 'No response received',
                    role: 'assistant',
                    timestamp: Date.now(),
                    suggestions: response.suggestions || []
                }

                set(state => ({
                    messages: [...state.messages, assistantMessage],
                    isLoading: false,
                    currentStatus: undefined,
                    sessionId: response.session_identifier || state.sessionId,
                    conversationId: response.session_identifier || state.conversationId
                }))

            } catch (error) {
                console.error('Failed to send message:', error)
                set({
                    isLoading: false,
                    currentStatus: undefined,
                    error: error instanceof Error ? error.message : 'Failed to send message'
                })
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
                // TODO: Replace with your actual API call
                // const conversation = await loadConversation(conversationId)

                // TODO: Mock conversation loading - replace with actual API
                const mockMessages: Message[] = [
                    {
                        id: 'msg-1',
                        content: 'Hello! This is a loaded conversation.',
                        role: 'user',
                        timestamp: Date.now() - 10000
                    },
                    {
                        id: 'msg-2',
                        content: 'Welcome back to this conversation!',
                        role: 'assistant',
                        timestamp: Date.now() - 5000
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
                // TODO: Integrate with reflection store to insert quote
                // You might want to dispatch an action to the reflection store here
                console.log('Quoting message:', message.content)

                // TODO: How do you want to handle quote integration?
                // Option 1: Direct integration with reflection store
                // Option 2: Event system
                // Option 3: Callback system
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
        }
    }))
)

// TODO: Add any additional selectors you need
export const useDialogueMessages = () => useDialogueStore(state => state.messages)
export const useDialogueLoading = () => useDialogueStore(state => state.isLoading)
export const useDialogueActions = () => useDialogueStore(state => ({
    sendMessage: state.sendMessage,
    startNewConversation: state.startNewConversation,
    loadConversation: state.loadConversation,
    quoteMessage: state.quoteMessage
}))