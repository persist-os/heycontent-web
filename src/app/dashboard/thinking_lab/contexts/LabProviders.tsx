/**
 * Lab Context Providers
 *
 * React context provider implementations that bridge existing Zustand stores
 * with the new lab context system.
 */

import React, { useMemo } from 'react'
import {
    DialogueContext,
    ReflectionContext,
    InsightContext,
    LabLayoutContext,
    type DialogueProviderProps,
    type ReflectionProviderProps,
    type InsightProviderProps,
    type LabLayoutProviderProps,
    type ThinkingLabProviderProps
} from './LabContexts'

// Import stores
import { useChatStore } from '../../../stores/chatStore'
import { useNotepadStore } from '../../../stores/notepadStore'
import { useContentContext } from '../../../stores/contentStore'

// =============================================================================
// DIALOGUE PROVIDER
// =============================================================================

export function DialogueProvider({ children, chatId, askQuery }: DialogueProviderProps) {
    // TODO: Replace with actual import
    // const chatStore = useChatStore()

    // TEMPORARY: Mock implementation - replace with actual store
    const mockChatStore = {
        messages: [],
        isLoading: false,
        sessionId: 'session-123',
        sendMessage: (content: string) => console.log('Send:', content),
        startNewConversation: () => console.log('New conversation'),
        quoteMessage: (messageId: string) => console.log('Quote:', messageId)
    }

    const value = useMemo(() => ({
        state: {
            messages: mockChatStore.messages,
            isLoading: mockChatStore.isLoading,
            sessionId: mockChatStore.sessionId,
            conversationId: chatId
        },
        actions: {
            sendMessage: mockChatStore.sendMessage,
            startNewConversation: mockChatStore.startNewConversation,
            quoteMessage: mockChatStore.quoteMessage
        }
    }), [mockChatStore.messages, mockChatStore.isLoading, mockChatStore.sessionId, chatId])

    return (
        <DialogueContext.Provider value={value}>
            {children}
        </DialogueContext.Provider>
    )
}

// =============================================================================
// REFLECTION PROVIDER
// =============================================================================

export function ReflectionProvider({ children, noteId, autoOpen = false }: ReflectionProviderProps) {
    // TODO: Replace with actual import
    // const notepadStore = useNotepadStore()

    // TEMPORARY: Mock implementation - replace with actual store
    const mockNotepadStore = {
        isOpen: autoOpen || !!noteId,
        content: '',
        isDirty: false,
        isSaving: false,
        openNotepad: (id?: string) => console.log('Open notepad:', id),
        closeNotepad: () => console.log('Close notepad'),
        updateContent: (content: string) => console.log('Update content:', content),
        saveNote: async () => console.log('Save note'),
        insertQuote: (text: string, source: string) => console.log('Insert quote:', text, source)
    }

    const value = useMemo(() => ({
        state: {
            isOpen: mockNotepadStore.isOpen,
            noteId,
            content: mockNotepadStore.content,
            isDirty: mockNotepadStore.isDirty,
            isSaving: mockNotepadStore.isSaving
        },
        actions: {
            openNotepad: mockNotepadStore.openNotepad,
            closeNotepad: mockNotepadStore.closeNotepad,
            updateContent: mockNotepadStore.updateContent,
            saveNote: mockNotepadStore.saveNote,
            insertQuote: mockNotepadStore.insertQuote
        }
    }), [
        mockNotepadStore.isOpen,
        mockNotepadStore.content,
        mockNotepadStore.isDirty,
        mockNotepadStore.isSaving,
        noteId
    ])

    return (
        <ReflectionContext.Provider value={value}>
            {children}
        </ReflectionContext.Provider>
    )
}

// =============================================================================
// INSIGHT PROVIDER
// =============================================================================

export function InsightProvider({
                                    children,
                                    contentContext,
                                    searchTypes = ['projects', 'notes', 'conversations', 'crystals']
                                }: InsightProviderProps) {
    // TODO: Replace with actual import
    // const contentStore = useContentContext()

    // TEMPORARY: Mock implementation - replace with actual store
    const mockSearchStore = {
        searchEnabled: false,
        searchQuery: '',
        searchResults: [],
        isSearching: false,
        activeContexts: [],
        toggleSearch: () => console.log('Toggle search'),
        updateSearchQuery: (query: string) => console.log('Update query:', query),
        performSearch: (query: string) => console.log('Perform search:', query),
        addContext: (context: any) => console.log('Add context:', context),
        removeContext: (contextId: string) => console.log('Remove context:', contextId),
        injectContent: (content: any) => console.log('Inject content:', content)
    }

    const value = useMemo(() => ({
        state: {
            searchEnabled: mockSearchStore.searchEnabled,
            searchQuery: mockSearchStore.searchQuery,
            searchResults: mockSearchStore.searchResults,
            isSearching: mockSearchStore.isSearching,
            activeContexts: mockSearchStore.activeContexts,
            availableTypes: searchTypes
        },
        actions: {
            toggleSearch: mockSearchStore.toggleSearch,
            updateSearchQuery: mockSearchStore.updateSearchQuery,
            performSearch: mockSearchStore.performSearch,
            addContext: mockSearchStore.addContext,
            removeContext: mockSearchStore.removeContext,
            injectContent: mockSearchStore.injectContent
        }
    }), [
        mockSearchStore.searchEnabled,
        mockSearchStore.searchQuery,
        mockSearchStore.searchResults,
        mockSearchStore.isSearching,
        mockSearchStore.activeContexts,
        searchTypes
    ])

    return (
        <InsightContext.Provider value={value}>
            {children}
        </InsightContext.Provider>
    )
}

// =============================================================================
// LAB LAYOUT PROVIDER
// =============================================================================

export function LabLayoutProvider({ children, isMobile }: LabLayoutProviderProps) {
    // Simple responsive detection - you can enhance this
    const isActuallyMobile = isMobile ?? (typeof window !== 'undefined' && window.innerWidth < 768)

    const value = useMemo(() => ({
        state: {
            isMobile: isActuallyMobile,
            activeTab: 'dialogue' as const,
            panelSizes: { dialogue: 50, reflection: 50 },
            isReflectionCollapsed: false
        },
        actions: {
            setActiveTab: (tab: 'dialogue' | 'reflection' | 'insight') => console.log('Set tab:', tab),
            toggleReflectionCollapse: () => console.log('Toggle reflection collapse'),
            updatePanelSizes: (sizes: { dialogue: number; reflection: number }) => console.log('Update panel sizes:', sizes)
        }
    }), [isActuallyMobile])

    return (
        <LabLayoutContext.Provider value={value}>
            {children}
        </LabLayoutContext.Provider>
    )
}

// =============================================================================
// COMPOSITE PROVIDER
// =============================================================================

export function ThinkingLabProvider({
                                        children,
                                        chatId,
                                        noteId,
                                        askQuery,
                                        contentContext
                                    }: ThinkingLabProviderProps) {
    return (
        <LabLayoutProvider>
            <DialogueProvider chatId={chatId} askQuery={askQuery}>
                <ReflectionProvider noteId={noteId} autoOpen={!!noteId}>
                    <InsightProvider contentContext={contentContext}>
                        {children}
                    </InsightProvider>
                </ReflectionProvider>
            </DialogueProvider>
        </LabLayoutProvider>
    )
}