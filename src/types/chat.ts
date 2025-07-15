export interface InteractiveOption {
  text: string
  type: 'action' | 'detail' | 'suggestion' | 'explore'
  action?: string
}

export interface InteractiveResponse {
  options?: InteractiveOption[]
  followUp?: {
    question: string
    choices?: string[]
  }
  contextualSuggestions?: string[]
}

export interface Message {
  id: number
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  relatedInsights?: InsightReference[]
  status?: 'sending' | 'sent' | 'failed' | 'typing'
  searchStatus?: string // Current search status
  statusHistory?: string[] // Array of all status updates for progressive thinking
  referencedMessage?: {
    id: number
    content: string
  }
  isReferenced?: boolean
  interactiveResponse?: InteractiveResponse
  metadata?: {
    suggestions?: Array<{
      type: 'explore' | 'clarify' | 'action' | 'strategic'
      description: string
      context?: string
      confidence: number
    }>
    ambientInsight?: any
    [key: string]: any
  }
  vector_search_metadata?: {
    foundRelevantContent: boolean
    relevantItemsCount: number
    relevantContent: Array<{
      title: string
      contentType: string
      score: number
      summary?: string
    }>
  }
}

export interface ChatHistory {
  id: number
  topic: string
  preview: string
  date: string
  messages: Message[]
  starred: boolean
}

export interface InsightReference {
  id: number
  type: string
  summary: string
  timestamp: string
}

export interface ChatResponse {
  message: string
  timestamp: string
  id: number
  role: 'assistant'
}

export interface ChatError {
  message: string
  code: string
}