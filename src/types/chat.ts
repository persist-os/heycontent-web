export interface Message {
  id: number
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  relatedInsights?: InsightReference[]
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