export interface Message {
  id: number
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  relatedInsights?: InsightReference[]
  status?: 'sending' | 'sent' | 'failed'
  referencedMessage?: {
    id: number
    content: string
  }
  isReferenced?: boolean
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