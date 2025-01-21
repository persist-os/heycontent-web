export interface Message {
  id: number
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  relatedInsights?: InsightReference[]
  status?: 'sending' | 'sent' | 'failed' | 'typing'
  referencedMessage?: {
    id: number
    content: string
  }
  isReferenced?: boolean
  metadata?: {
    suggestions?: Array<{
      type: 'explore' | 'clarify' | 'action' | 'strategic';
      description: string;
      context?: string;
      confidence: number;
    }>;
    ambientInsight?: any;
    [key: string]: any;
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