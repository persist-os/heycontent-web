import type { MarkdownNotepadRef } from '../components/notepad/types'
import type { ChatStateReturnType } from '../hooks/useChatState'
import type { Message } from '@/app/types/chat'

export interface AuthData {
  user: any
  userId?: string
  userEmail?: string
  isAuthenticated: boolean
  isLoading: boolean
}

export interface EmbeddingInfo {
  hasEmbeddings: boolean
  count: number
}

export interface ContextConsumption {
  hasConsumed: boolean
  isDisplayed: boolean
}

export interface OverlayContent {
  contentType: 'note' | 'smart_note' | 'insight'
  contentId: string
}

export interface ChatContainerState {
  // UI State
  inputValue: string
  embeddingInfo: EmbeddingInfo
  contextConsumption: ContextConsumption
  useContextSearch: boolean
  includeNotepadInMessages: boolean
  
  // Modal State
  showNotepadWarning: boolean
  pendingNewChat: boolean
  overlayContent: OverlayContent | null
  
  // API State
  apiKey: string | null
}

export interface ChatContainerRefs {
  loadedConversationRef: React.MutableRefObject<string | null>
  askQueryProcessedRef: React.MutableRefObject<string | null>
  notepadRef: React.RefObject<MarkdownNotepadRef>
}

export interface ChatContainerHandlers {
  handleSendMessageWithUpdateCheck: (message: string) => void
  handleNewChat: () => void
  handleConfirmDiscardNotepad: () => void
  handleCancelDiscardNotepad: () => void
  handleRemoveContext: () => void
  handleActionClick: (action: string) => void
  handleSuggestionClick: (suggestion: any, onSendMessage: (msg: string) => void) => void
  handleInsightClick: (action: string, insight: any) => void
  handleReferenceClick: (messageId: string) => void
  handleFollowUpPopulate: (choice: string) => void
  handleInputAppend: (text: string) => void
  handleContentClick: (contentType: string, contentId: string) => void
  handleOverlayClose: () => void
  handleQuoteToNotepadEnhanced: (text: string) => void
  quotedForNotepad: string
  handleClearQuoted: () => void
}

// Props interface for the consolidated useChatContainer hook
export interface UseChatContainerProps {
  authData: AuthData
  chatState: ChatStateReturnType
  handleSendMessage: (message: string, includeNotepad?: boolean) => void
  handleClearReference: () => void
  clearContentContext: () => void
  resetChat: () => void
  messages: Message[]
  askQuery?: string
  chatId?: string
  handleLoadConversation: (id: string) => void
  chatContainerRef: React.RefObject<HTMLDivElement>
  isMobile: boolean
  activeTab: string
  chatScrollPosition: number
  saveScrollPosition: (tab: string, position: number) => void
  notepadOpen: boolean
  insertTextToNotepad: (text: string) => void
}

// Return type for the consolidated useChatContainer hook
export interface UseChatContainerReturn extends ChatContainerHandlers {
  state: ChatContainerState
  setters: {
    setInputValue: (value: string | ((prev: string) => string)) => void
    setEmbeddingInfo: (info: EmbeddingInfo) => void
    setContextConsumption: (consumption: ContextConsumption) => void
    setUseContextSearch: (use: boolean) => void
    setIncludeNotepadInMessages: (include: boolean) => void
    setShowNotepadWarning: (show: boolean) => void
    setPendingNewChat: (pending: boolean) => void
    setOverlayContent: (content: OverlayContent | null) => void
    setApiKey: (key: string | null) => void
  }
  refs: ChatContainerRefs
}
