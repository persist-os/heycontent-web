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
        quotedContent: "", // Content to be quoted to notepad
        // Project/widget context
        projectId: undefined,
        widgetId: undefined,
        widgetOutputId: undefined,

        // Actions
        sendMessage: async (content: string, fileAttachments?: FileUploadResponse[]) => {
            const { messages, sessionId, conversationId } = get()

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

                // Get project/widget context from store
                const { projectId, widgetId, widgetOutputId } = get()

                // Determine conversation type based on context
                const conversationType = widgetOutputId ? 'widget_prompt' : 'general'

                // ATOMIC PATTERN: Use conversationId (Convex ID) if available, null for first message
                const isFirstMessage = messages.length === 0
                const actualSessionId = isFirstMessage ? null : (conversationId || sessionId)

                console.log('[DialogueStore] Message context:', {
                    isFirstMessage,
                    conversationId,
                    sessionId,
                    actualSessionId,
                    messageCount: messages.length
                })

                // Prepare request parameters
                const requestParams: MessageTransmissionRequest = {
                    content,
                    isFirstMessage,
                    sessionIdentifier: actualSessionId,
                    workspaceContext: conversationId ? { contentId: conversationId } : null,
                    notepadContext, // Include notepad context
                    fileAttachments,
                    // Pass project/widget context
                    projectId,
                    widgetId,
                    widgetOutputId,
                    conversationType, // Set conversation type
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
                // Backend returns the Convex conversation ID as session_identifier
                const convexConversationId = response.session_identifier
                
                console.log('[DialogueStore] Response received:', {
                    session_identifier: response.session_identifier,
                    previousConversationId: get().conversationId,
                    previousSessionId: get().sessionId
                })
                
                set(state => ({
                    messages: state.messages.map(msg => 
                        msg.status === 'typing' ? assistantMessage : msg
                    ),
                    isLoading: false,
                    currentStatus: undefined,
                    conversationId: convexConversationId || state.conversationId,
                    // Keep sessionId as fallback but conversationId is the source of truth
                    sessionId: convexConversationId || state.sessionId
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
export const useDialogueMessages = () => useDialogueStore(state => state.messages)
export const useDialogueLoading = () => useDialogueStore(state => state.isLoading)
export const useDialogueActions = () => useDialogueStore(state => ({
    sendMessage: state.sendMessage,
    startNewConversation: state.startNewConversation,
    loadConversation: state.loadConversation,
    setQuotedContent: state.setQuotedContent,
    clearQuotedContent: state.clearQuotedContent
}))