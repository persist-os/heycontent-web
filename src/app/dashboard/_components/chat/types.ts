import { ComponentType } from 'react';

export interface ChatResponseData {
  chat_response: string;
  suggestions?: string[];
  session_id: string;
  metadata?: {
    request_id: string;
    processing_time_ms: number;
  };
}

export interface SuggestedAction {
  type: 'explore' | 'clarify' | 'action' | 'strategic';
  description: string;
  context?: string;
  confidence: number;
}

export interface AmbientInsight {
  type: string;
  title: string;
  description: string;
  icon: ComponentType;
  action: string;
}

export interface ContentContext {
  platform: string;
  contentId: string;
  analysis?: string | null;
  title?: string;
  // Additional context fields that might be useful
  thumbnailUrl?: string;
  publishedAt?: string;
  metrics?: any;
  content?: any;
}

export interface ChatScreenProps {
  chatId?: string | null;
  contentContext?: ContentContext | null;
  askQuery?: string | null;
}
