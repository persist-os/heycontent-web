/**
 * Lab Context Providers
 *
 * React context provider implementations that bridge existing Zustand stores
 * with the new lab context system.
 *
 * ✅ COMPLETED: All providers now use real stores instead of mocks
 */

import React, { useMemo, useEffect } from 'react'
import {
    DialogueContext,
    ReflectionContext,
    InsightContext,
    LabLayoutContext
} from './LabContexts'
import type {
    DialogueProviderProps,
    ReflectionProviderProps,
    InsightProviderProps,
    LabLayoutProviderProps,
    ThinkingLabProviderProps
} from '../types/core/labCore'
import type {
    DialogueContextValue,
    ReflectionContextValue,
    InsightContextValue,
    LabLayoutContextValue,
    LabTab
} from '../types'

// Import stores
import { useDialogueStore } from '../stores/dialogueStore'
import { useInsightStore } from '../stores/insightStore'
import { useLayoutStore } from '../stores/layoutStore'
import { useReflectionStore } from '../stores/reflectionStore'

// =============================================================================
// DIALOGUE PROVIDER
// =============================================================================

export function DialogueProvider({ children, chatId, askQuery }: DialogueProviderProps) {
    // Use the real dialogue store
    const dialogueStore = useDialogueStore()

    const value = useMemo(() => ({
        state: {
            messages: dialogueStore.messages,
            isLoading: dialogueStore.isLoading,
            sessionId: dialogueStore.sessionId,
            conversationId: chatId,
            error: dialogueStore.error,
            currentStatus: dialogueStore.currentStatus,
            useContextSearch: dialogueStore.useContextSearch
        },
        actions: {
            sendMessage: dialogueStore.sendMessage,
            startNewConversation: dialogueStore.startNewConversation,
            loadConversation: dialogueStore.loadConversation,
            quoteMessage: dialogueStore.quoteMessage,
            clearMessages: dialogueStore.clearMessages,
            setError: dialogueStore.setError,
            toggleContextSearch: dialogueStore.toggleContextSearch,
            addMessage: dialogueStore.addMessage,
            setLoading: dialogueStore.setLoading,
            setStatus: dialogueStore.setStatus
        }
    }), [
        dialogueStore.messages,
        dialogueStore.isLoading,
        dialogueStore.sessionId,
        dialogueStore.error,
        dialogueStore.currentStatus,
        dialogueStore.useContextSearch,
        chatId
    ])

    return (
        <DialogueContext.Provider value={value}>
            {children}
        </DialogueContext.Provider>
    )
}

// =============================================================================
// REFLECTION PROVIDER
// =============================================================================

export function ReflectionProvider({ children, noteId, autoOpen = true }: ReflectionProviderProps) {
    // ✅ REAL: Use the actual reflection store with Convex integration
    const reflectionStore = useReflectionStore()

    // Auto-open notepad if noteId provided or autoOpen is true
    React.useEffect(() => {
        if (autoOpen || noteId) {
            reflectionStore.openNotepad(noteId)
        }
    }, [noteId, autoOpen, reflectionStore])

    const value = useMemo(() => ({
        state: {
            isOpen: reflectionStore.isOpen,
            noteId: reflectionStore.noteId,
            content: reflectionStore.content,
            isDirty: reflectionStore.isDirty,
            isSaving: reflectionStore.isSaving,
            lastSaved: reflectionStore.lastSaved,
            error: reflectionStore.error,
            isRefining: reflectionStore.isRefining || false,
            // Convex integration states
            isLoadingNotes: reflectionStore.isLoadingNotes,
            notesList: reflectionStore.notesList,
            hasMoreNotes: reflectionStore.hasMoreNotes,
            notesCursor: reflectionStore.notesCursor
        },
        actions: {
            // Core UI actions (sync)
            openNotepad: async (noteId?: string) => { reflectionStore.openNotepad(noteId) },
            closeNotepad: reflectionStore.closeNotepad,
            updateContent: reflectionStore.updateContent,
            insertQuote: reflectionStore.insertQuote,
            setDirty: reflectionStore.setDirty,
            setSaving: reflectionStore.setSaving,
            setError: reflectionStore.setError,
            // Store state setters (for hook coordination)
            setLoadingNotes: reflectionStore.setLoadingNotes,
            setNotesList: reflectionStore.setNotesList,
            // Async actions - placeholder implementations (hooks will override these)
            saveNote: async () => { /* To be handled by hooks */ },
            autoSave: async () => { /* To be handled by hooks */ },
            loadNotes: async () => { /* To be handled by hooks */ },
            loadMoreNotes: async () => { /* To be handled by hooks */ },
            createNewNote: async () => { /* To be handled by hooks */ },
            deleteCurrentNote: async () => { /* To be handled by hooks */ },
            toggleImportant: async () => { /* To be handled by hooks */ },
            // AI-related actions
            askAI: async () => { /* To be handled by hooks */ },
            requestAnalysis: async () => { /* To be handled by hooks */ },
            requestIdeas: async () => { /* To be handled by hooks */ },
            refineText: async (refinementType: string, selectedText: string) => { 
                /* To be handled by hooks */ 
                return '' 
            },
            acceptRefinement: async () => { /* To be handled by hooks */ },
            rejectRefinement: async () => { /* To be handled by hooks */ },
            retryRefinement: async () => { /* To be handled by hooks */ }
        }
    }), [
        reflectionStore.isOpen,
        reflectionStore.noteId,
        reflectionStore.content,
        reflectionStore.isDirty,
        reflectionStore.isSaving,
        reflectionStore.lastSaved,
        reflectionStore.error,
        reflectionStore.isRefining,
        reflectionStore.isLoadingNotes,
        reflectionStore.notesList,
        reflectionStore.hasMoreNotes,
        reflectionStore.notesCursor
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
    // Use the real insight store
    const insightStore = useInsightStore()

    const value = useMemo(() => ({
        state: {
            searchEnabled: insightStore.searchEnabled,
            searchQuery: insightStore.searchQuery,
            searchResults: insightStore.searchResults,
            isSearching: insightStore.isSearching,
            activeContexts: insightStore.activeContexts,
            availableTypes: insightStore.availableTypes,
            error: insightStore.error,
            currentStatus: insightStore.currentStatus,
            embeddingStatus: insightStore.embeddingStatus,
            isGeneratingEmbeddings: insightStore.isGeneratingEmbeddings
        },
        actions: {
            toggleSearch: insightStore.toggleSearch,
            updateSearchQuery: insightStore.updateSearchQuery,
            performSearch: insightStore.performSearch,
            addContext: insightStore.addContext,
            removeContext: insightStore.removeContext,
            injectContent: insightStore.injectContent,
            clearSearch: insightStore.clearSearch,
            setError: insightStore.setError,
            generateEmbeddings: insightStore.generateEmbeddings,
            checkEmbeddingStatus: insightStore.checkEmbeddingStatus
        }
    }), [
        insightStore.searchEnabled,
        insightStore.searchQuery,
        insightStore.searchResults,
        insightStore.isSearching,
        insightStore.activeContexts,
        insightStore.availableTypes,
        insightStore.error,
        insightStore.currentStatus,
        insightStore.embeddingStatus,
        insightStore.isGeneratingEmbeddings,
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
    // Use the real layout store
    const layoutStore = useLayoutStore()

    // Responsive detection
    React.useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            layoutStore.setMobile(mobile)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Simple responsive detection - you can enhance this
    const isActuallyMobile = isMobile ?? layoutStore.isMobile

    const value = useMemo(() => ({
        state: {
            isMobile: isActuallyMobile,
            activeTab: layoutStore.activeTab,
            panelSizes: layoutStore.panelSizes,
            isReflectionCollapsed: layoutStore.isReflectionCollapsed,
            isInsightCollapsed: layoutStore.isInsightCollapsed
        },
        actions: {
            setMobile: layoutStore.setMobile,
            setActiveTab: layoutStore.setActiveTab,
            updatePanelSizes: layoutStore.updatePanelSizes,
            toggleReflectionCollapse: layoutStore.toggleReflectionCollapse,
            toggleInsightCollapse: layoutStore.toggleInsightCollapse,
            resetLayout: layoutStore.resetLayout
        }
    }), [
        isActuallyMobile,
        layoutStore.activeTab,
        layoutStore.panelSizes,
        layoutStore.isReflectionCollapsed,
        layoutStore.isInsightCollapsed
    ])

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