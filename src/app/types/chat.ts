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
    is_persona_flow?: boolean;
    is_persona_complete?: boolean;
    persona?: {
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
    };
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