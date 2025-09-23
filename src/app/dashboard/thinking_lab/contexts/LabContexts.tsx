/**
 * Lab Context Definitions
 *
 * Core React contexts and TypeScript interfaces for the collaborative thinking lab.
 * Contains only context definitions and types - no implementation logic.
 */

import { createContext } from 'react'

// =============================================================================
// DIALOGUE CONTEXT
// =============================================================================

export interface DialogueState {
    messages: any[]
    isLoading: boolean
    sessionId: string
    conversationId?: string
}

export interface DialogueActions {
    sendMessage: (content: string) => void
    startNewConversation: () => void
    quoteMessage: (messageId: string) => void
}

export interface DialogueContextValue {
    state: DialogueState
    actions: DialogueActions
}

export const DialogueContext = createContext<DialogueContextValue | null>(null)

// =============================================================================
// REFLECTION CONTEXT
// =============================================================================

export interface ReflectionState {
    isOpen: boolean
    noteId?: string
    content: string
    isDirty: boolean
    isSaving: boolean
}

export interface ReflectionActions {
    openNotepad: (noteId?: string) => void
    closeNotepad: () => void
    updateContent: (content: string) => void
    saveNote: () => Promise<void>
    insertQuote: (text: string, source: string) => void
}

export interface ReflectionContextValue {
    state: ReflectionState
    actions: ReflectionActions
}

export const ReflectionContext = createContext<ReflectionContextValue | null>(null)

// =============================================================================
// INSIGHT CONTEXT
// =============================================================================

export interface InsightState {
    searchEnabled: boolean
    searchQuery: string
    searchResults: any[]
    isSearching: boolean
    activeContexts: any[]
    availableTypes: ('projects' | 'notes' | 'conversations' | 'crystals')[]
}

export interface InsightActions {
    toggleSearch: () => void
    updateSearchQuery: (query: string) => void
    performSearch: (query: string) => void
    addContext: (context: any) => void
    removeContext: (contextId: string) => void
    injectContent: (content: any) => void
}

export interface InsightContextValue {
    state: InsightState
    actions: InsightActions
}

export const InsightContext = createContext<InsightContextValue | null>(null)

// =============================================================================
// LAB LAYOUT CONTEXT
// =============================================================================

export interface LabLayoutState {
    isMobile: boolean
    activeTab: 'dialogue' | 'reflection' | 'insight'
    panelSizes: { dialogue: number; reflection: number }
    isReflectionCollapsed: boolean
}

export interface LabLayoutActions {
    setActiveTab: (tab: 'dialogue' | 'reflection' | 'insight') => void
    toggleReflectionCollapse: () => void
    updatePanelSizes: (sizes: { dialogue: number; reflection: number }) => void
}

export interface LabLayoutContextValue {
    state: LabLayoutState
    actions: LabLayoutActions
}

export const LabLayoutContext = createContext<LabLayoutContextValue | null>(null)

// =============================================================================
// PROVIDER PROPS INTERFACES
// =============================================================================

export interface DialogueProviderProps {
    children: React.ReactNode
    chatId?: string
    askQuery?: string
}

export interface ReflectionProviderProps {
    children: React.ReactNode
    noteId?: string
    autoOpen?: boolean
}

export interface InsightProviderProps {
    children: React.ReactNode
    contentContext?: any
    searchTypes?: ('projects' | 'notes' | 'conversations' | 'crystals')[]
}

export interface LabLayoutProviderProps {
    children: React.ReactNode
    isMobile?: boolean
}

export interface ThinkingLabProviderProps {
    children: React.ReactNode
    chatId?: string
    noteId?: string
    askQuery?: string
    contentContext?: any
}