/**
 * Store Types
 *
 * Interfaces specific to Zustand stores and state management.
 * These define the contracts for store state and actions.
 */

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
  // Extended properties for full chat compatibility
  status?: 'typing' | 'complete' | 'error'
  chat_response?: string
  metadata?: Record<string, any>
  referencedMessage?: Message
  suggestions?: string[]
  searchStatus?: string
  statusHistory?: string[]
  vectorSearchMetadata?: {
    foundRelevantContent?: boolean
    [key: string]: any
  }
}

export interface DialogueState {
  messages: Message[]
  isLoading: boolean
  sessionId: string
  conversationId?: string
  error?: string
  currentStatus?: string
  useContextSearch: boolean
}

export interface DialogueActions {
  sendMessage: (content: string) => Promise<void>
  addMessage: (message: Message) => void
  setLoading: (loading: boolean) => void
  startNewConversation: () => void
  loadConversation: (conversationId: string) => Promise<void>
  quoteMessage: (messageId: string) => void
  clearMessages: () => void
  setError: (error: string | undefined) => void
  setStatus: (status: string | undefined) => void
  toggleContextSearch: () => void
}

export interface ContextItem {
  id: string
  type: ContextType
  title: string
  content: string
  relevance?: number
}

export type ContextType = 'projects' | 'notes' | 'conversations' | 'crystals'

export interface InsightState {
  searchEnabled: boolean
  searchQuery: string
  searchResults: ContextItem[]
  isSearching: boolean
  activeContexts: ContextItem[]
  availableTypes: ContextType[]
  error?: string
  currentStatus?: string
  embeddingStatus: { hasEmbeddings: boolean; count: number }
  isGeneratingEmbeddings: boolean
}

export interface InsightActions {
  toggleSearch: () => void
  updateSearchQuery: (query: string) => void
  performSearch: (query: string) => Promise<void>
  addContext: (context: ContextItem) => void
  removeContext: (contextId: string) => void
  injectContent: (content: ContextItem) => void
  clearSearch: () => void
  setError: (error: string | undefined) => void
  loadContextByType: (type: ContextType) => Promise<void>
  generateEmbeddings: (platform: 'conversations' | 'notes') => Promise<void>
  checkEmbeddingStatus: () => Promise<void>
  setStatus: (status: string | undefined) => void
}
