import { useState } from 'react'
import type { ChatContainerState, EmbeddingInfo, ContextConsumption, OverlayContent } from '../types/chat-container.types'

export function useChatContainerState() {
  // UI state - grouped related state together
  const [updatePersonaRequested, setUpdatePersonaRequested] = useState(false)
  const [embeddingInfo, setEmbeddingInfo] = useState<EmbeddingInfo>({ 
    hasEmbeddings: false, 
    count: 0 
  })
  
  // Content context consumption tracking
  const [contextConsumption, setContextConsumption] = useState<ContextConsumption>({
    hasConsumed: false,
    isDisplayed: false
  })

  // Context search state - disable by default to reduce complexity
  const [useContextSearch, setUseContextSearch] = useState(false)
  
  // Notepad inclusion state - enable by default for better context
  const [includeNotepadInMessages, setIncludeNotepadInMessages] = useState(true)
  
  // Modal state for notepad warning
  const [showNotepadWarning, setShowNotepadWarning] = useState(false)
  const [pendingNewChat, setPendingNewChat] = useState(false)
  
  // Overlay state for content links
  const [overlayContent, setOverlayContent] = useState<OverlayContent | null>(null)
  
  // API state
  const [apiKey, setApiKey] = useState<string | null>(null)

  const state: ChatContainerState = {
    updatePersonaRequested,
    embeddingInfo,
    contextConsumption,
    useContextSearch,
    includeNotepadInMessages,
    showNotepadWarning,
    pendingNewChat,
    overlayContent,
    apiKey
  }

  const setters = {
    setUpdatePersonaRequested,
    setEmbeddingInfo,
    setContextConsumption,
    setUseContextSearch,
    setIncludeNotepadInMessages,
    setShowNotepadWarning,
    setPendingNewChat,
    setOverlayContent,
    setApiKey
  }

  return { state, setters }
}
