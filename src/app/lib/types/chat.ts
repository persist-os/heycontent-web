export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  error?: string;
}

export interface ChatAgent {
  chat(message: string, context?: any): Promise<ChatResponse>;
  getHistory(): ChatMessage[];
} 