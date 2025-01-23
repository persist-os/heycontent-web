import type { InteractiveOption } from '@/lib/chat/interactive-response'

export interface InteractiveResponse {
  options?: InteractiveOption[];
  followUp?: {
    question: string;
    choices?: string[];
  };
  contextualSuggestions?: string[];
}

export interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  status?: 'typing' | 'failed';
  referencedMessage?: {
    id: number;
    content: string;
  };
  relatedInsights?: Array<{
    type: string;
    summary: string;
  }>;
  metadata?: {
    suggestions?: Array<{
      type: 'explore' | 'clarify' | 'action' | 'strategic';
      description: string;
      context?: string;
      confidence: number;
    }>;
  };
  interactiveResponse?: InteractiveResponse;
}

export interface ChatHistory {
  id: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  title?: string;
}

export interface InsightReference {
  type: string;
  title: string;
  description: string;
  impact?: string;
  timing?: string;
  confidence?: number;
  step?: {
    content: string;
  };
  insight?: {
    title: string;
    description: string;
  };
} 