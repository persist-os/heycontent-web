export interface InteractiveOption {
  text: string;
  type?: string;
  action?: string;
}

export interface InteractiveResponse {
  options?: InteractiveOption[];
  followUp?: {
    question: string;
    choices?: string[];
  };
  contextualSuggestions?: string[];
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  referencedMessage?: {
    id: string;
    content: string;
  };
  status?: 'typing' | 'sent' | 'delivered' | 'read' | 'failed';
  chat_response: string;
  suggestions?: any[];
  metadata?: {
    suggestions?: any[];
    [key: string]: any;
  };
  relatedInsights?: {
    type: string;
    summary: string;
  }[];
  followUpQuestions?: {
    question: string;
    choices: string[];
  }[];
}

export interface ChatHistory {
  id: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  title?: string;
  topic: string;
  preview: string;
  starred?: boolean;
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