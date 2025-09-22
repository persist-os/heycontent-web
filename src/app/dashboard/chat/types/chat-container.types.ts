import type { MarkdownNotepadRef } from '../components/notepad/types'

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
  contentType: 'insight' | 'note'
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
