import { ComponentType } from 'react';

export interface ChatResponseData {
  chat_response: string;
  response?: string; // For backward compatibility
  suggestions?: string[];
  session_id: string;
  metadata?: {
    suggestions?: string[];
    request_id: string;
    processing_time_ms: number;
    is_persona_flow?: boolean; // Indicates if this is part of the persona creation flow
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
