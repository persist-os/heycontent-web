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

export interface FileAttachment {
  file_url: string;
  file_metadata: {
    original_filename: string;
    content_type: string;
    file_size: number;
  };
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
  sessionId?: string;
  searchStatus?: string;
  statusHistory?: string[]; // Array of all status updates for progressive thinking
  fileAttachments?: FileAttachment[]; // File attachments for this message
  contentType?: 'text' | 'family_question' | 'family_update' | 'preflight_questions' | 'widget_coordination'; // Message content type
  decisionId?: string;  // Model selection decision ID (for feedback loop)
  contextDecisionId?: string;  // Context enrichment decision ID (for feedback loop)
  metadata?: {
    suggestions?: any[];
    [key: string]: any;
  };
  vectorSearchMetadata?: {
    foundRelevantContent: boolean;
    relevantItemsCount: number;
    relevantContent: Array<{
      title: string;
      contentType: string;
      score: number;
    }>;
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
  createdAt: string | number;
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