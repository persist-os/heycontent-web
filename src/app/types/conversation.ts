export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  metadata?: {
    type?: string;
    context?: string;
    confidence?: number;
    [key: string]: any;
  };
} 