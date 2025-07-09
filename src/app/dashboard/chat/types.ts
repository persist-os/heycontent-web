import { ComponentType } from 'react';

// Import the enhanced VectorSearchMetadata type
import type { VectorSearchMetadata } from './utils/api-utils';

export interface PersonaData {
  current_name: string;
  current_description: string;
  experience_level: string;
  content_formats: string[];
  content_tone: string;
  content_voice: string;
  content_pillars: string[];
  unique_value: string;
  future_name: string;
  future_description: string;
  goals: string[];
  desired_impact: string;
  primary_topics: string[];
  secondary_topics: string[];
  tone_descriptors: string[];
  style_descriptors: string[];
  audience_type: string;
  engagement_style: string[];
  [key: string]: any;
}

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
    is_persona_complete?: boolean; // Indicates if persona creation is complete
    persona?: PersonaData; // The completed persona data
  };
  vector_search_metadata?: VectorSearchMetadata; // Use the enhanced type
}

export interface SuggestedAction {
  type: 'explore' | 'clarify' | 'action' | 'strategic';
  description: string;
  context?: string;
  confidence: number;
}

export interface BottomBarAction {
  id: string;
  text: string;
  action: string;
}

export interface AmbientInsight {
  type: string;
  title: string;
  description: string;
  action: string;
  icon: ComponentType<{ className?: string }>;
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
  convexData?: any; // Add this for the new Zustand store format with full Convex documents
  actionStep?: string;  // Add this for AI Insights action steps
  source?: string;      // Add this to track the source of the context
  originalPlatform?: 'youtube' | 'instagram' | 'gmail'; // Add this for AI insights
  fullInsight?: {       // Add this for full AI insight context
    title: string;
    impact: string;
    whyNow: string[];
    actionSteps: string[];
    expectedOutcome: string;
    sourceDetails: string[];
    relatedItems?: Array<{ label: string; value: string }>;
  };
}

export interface ChatScreenProps {
  chatId?: string | null;
  contentContext?: ContentContext | null;
  askQuery?: string | null;
  welcome?: boolean;
}