export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  status?: 'sending' | 'sent' | 'error' | 'typing';
  metadata?: {
    insights?: any[];
    context?: any;
    suggestions?: Array<{
      type: 'explore' | 'clarify' | 'action' | 'strategic';
      description: string;
      context?: string;
      confidence: number;
    }>;
    [key: string]: any;
  };
}

export interface Conversation {
  id: string;
  messages: Message[];
  title?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  status: 'active' | 'archived' | 'deleted';
  metadata?: {
    context?: any;
    persona?: any;
    [key: string]: any;
  };
}

export interface ConversationContext {
  userId: string;
  conversationId?: string;
  previousMessages?: Message[];
  persona?: any;
  insights?: any[];
  [key: string]: any;
} 