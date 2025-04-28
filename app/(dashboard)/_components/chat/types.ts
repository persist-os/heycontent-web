import { Message } from '@/app/types/chat';
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

export interface ChatScreenProps {
  chatId?: string | null;
}
