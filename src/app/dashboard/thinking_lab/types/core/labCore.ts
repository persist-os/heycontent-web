/**
 * Core Lab Types
 *
 * Fundamental interfaces for the thinking lab system.
 * These are the primary building blocks.
 */

export interface LabResponseData {
  response_content: string
  session_identifier: string
  user_input: string
  suggestions?: string[]
  metadata?: Record<string, any>
}

export interface WorkspaceContext {
  resourceId?: string
  contentId?: string
  title?: string
  analysis?: string
  publishedAt?: string
  metrics?: Record<string, any>
  content?: Record<string, any>
  convexData?: Record<string, any>
  deepInsight?: CompleteInsight
  fullInsight?: Record<string, any>
  actionStep?: string
  additionalContext?: Record<string, any>
}

export interface CompleteInsight {
  title: string
  impact: string
  whyNow: string[]
  actionSteps: string[]
  expectedOutcome: string
  sourceDetails: ResourceDetail[]
  relatedItems: ConnectedItem[]
}

export interface ResourceDetail {
  title: string
  url?: string
}

export interface ConnectedItem {
  id: string
  title: string
  type: string
}

export interface NotepadContext {
  content: string
  title?: string
}

export type ProgressUpdateCallback = (status: string) => void
export type ContentPlatform = 'conversations' | 'notes'

// Bottom Action Bar Types
export interface BottomBarAction {
  id: string
  text: string
  action: string
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

export interface DialogueState {
    messages: any[]
    isLoading: boolean
    sessionId: string
    conversationId?: string
    error?: string
    currentStatus?: string
    useContextSearch: boolean
    quotedContent: string
    // Project/widget context
    projectId?: string
    widgetId?: string
    widgetOutputId?: string
}

export interface DialogueActions {
    sendMessage: (content: string) => Promise<void>
    startNewConversation: () => void
    loadConversation: (conversationId: string) => Promise<void>
    clearMessages: () => void
    setError: (error: string | undefined) => void
    toggleContextSearch: () => void
    addMessage: (message: any) => void
    setLoading: (loading: boolean) => void
    setStatus: (status: string | undefined) => void
    setQuotedContent: (content: string) => void
    clearQuotedContent: () => void
    resetForWidget: () => void
    setProjectContext: (projectId?: string, widgetId?: string, widgetOutputId?: string) => void
    clearProjectContext: () => void
}

export interface DialogueContextValue {
    state: DialogueState
    actions: DialogueActions
}

export interface ReflectionState {
    isOpen: boolean
    noteId?: string
    content: string
    isDirty: boolean
    isSaving: boolean
    lastSaved?: number
    error?: string
    // AI refinement states
    refinementPreview?: string
    isRefining: boolean
    // Convex integration states
    isLoadingNotes: boolean
    notesList: Array<{
        _id: string
        _creationTime: number
        title: string
        type: string
        important: boolean
        tags: string[]
    }>
    hasMoreNotes: boolean
    notesCursor?: string
}

export interface ReflectionActions {
    openNotepad: (noteId?: string) => Promise<void>
    closeNotepad: () => void
    updateContent: (content: string) => void
    saveNote: () => Promise<void>
    insertQuote: (text: string, source: string) => void
    setDirty: (dirty: boolean) => void
    setSaving: (saving: boolean) => void
    setError: (error: string | undefined) => void
    autoSave: () => Promise<void>
    // AI functionality actions
    askAI: (prompt: string) => Promise<void>
    requestAnalysis: (noteType: string) => Promise<void>
    requestIdeas: () => Promise<void>
    refineText: (refinementType: string, selectedText: string) => Promise<string>
    acceptRefinement: () => Promise<void>
    rejectRefinement: () => Promise<void>
    retryRefinement: () => Promise<void>
    // Convex integration actions
    loadNotes: () => Promise<void>
    loadMoreNotes: () => Promise<void>
    createNewNote: (content?: string, title?: string) => Promise<void>
    deleteCurrentNote: () => Promise<void>
    toggleImportant: () => Promise<void>
    setLoadingNotes: (loading: boolean) => void
    setNotesList: (notes: any[]) => void
}

export interface ReflectionContextValue {
    state: ReflectionState
    actions: ReflectionActions
}

export interface InsightState {
    searchEnabled: boolean
    searchQuery: string
    searchResults: any[]
    isSearching: boolean
    activeContexts: any[]
    availableTypes: ('projects' | 'notes' | 'conversations' | 'crystals')[]
    error?: string
    currentStatus?: string
    embeddingStatus: { hasEmbeddings: boolean; count: number }
    isGeneratingEmbeddings: boolean
}

export interface InsightActions {
    toggleSearch: () => void
    updateSearchQuery: (query: string) => void
    performSearch: (query: string) => Promise<void>
    addContext: (context: any) => void
    removeContext: (contextId: string) => void
    injectContent: (content: any) => void
    clearSearch: () => void
    setError: (error: string | undefined) => void
    generateEmbeddings: (platform: 'conversations' | 'notes') => Promise<void>
    checkEmbeddingStatus: () => Promise<void>
}

export interface InsightContextValue {
    state: InsightState
    actions: InsightActions
}


// Provider prop interfaces
// Removed provider interfaces - using stores directly now

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

// =============================================================================
// LAYOUT TYPES
// =============================================================================

export type LabTab = 'dialogue' | 'reflection' | 'insight'

export interface LabLayoutState {
    isMobile: boolean
    activeTab: LabTab
    panelSizes: Record<string, number>  // Keep flexible for compatibility
    isReflectionCollapsed: boolean
    isInsightCollapsed: boolean
}

export interface LabLayoutActions {
    setMobile: (isMobile: boolean) => void
    setActiveTab: (tab: LabTab) => void
    updatePanelSizes: (sizes: Record<string, number>) => void
    toggleReflectionCollapse: () => void
    toggleInsightCollapse: () => void
    resetLayout: () => void
}

export interface LabLayoutContextValue {
    state: LabLayoutState
    actions: LabLayoutActions
}
