/**
 * Shared types and interfaces for persona crystallization system
 */

export interface PersonaTrace {
  trace_type: string;
  extracted_insight: string;
  confidence: number;
  context: string;
  temporal_weight: number;
  preference_strength: number;
  created_at: number;
}

export interface PersonaInsight {
  insight_type: string;
  crystallized_insight: string;
  confidence: number;
  temporal_stability: number;
  contexts: string[];
  last_observed: number;
}

export interface TokenDam {
  conversation_id: string;
  status: string;
  accumulated_tokens: number;
  token_limit: number;
  progress_percentage: number;
  message_count: number;
  is_processing: boolean;
}

export interface DamStatus {
  totalDams: number;
  dams: TokenDam[];
}

export interface DebugInfo {
  triggerCount: number;
  processingStatus: string;
  userId?: string;
}

export interface PersonaCrystallizationContextType {
  // Data
  recentTraces: PersonaTrace[];
  crystallizedInsights: PersonaInsight[];
  isLoading: boolean;
  
  // Processing status
  isProcessing: boolean;
  lastUpdate: number | null;
  
  // Profile info
  profileCompleteness: number;
  overallConfidence: number;
  totalTraces: number;
  totalInsights: number;
  
  // Token Dam info
  damStatus?: DamStatus;
  
  // Actions
  refreshData: () => void;
  
  // Development info
  debugInfo?: DebugInfo;
}

export interface PersonaCrystallizationProviderProps {
  userId?: string;
  children: React.ReactNode;
}

export interface MarkdownOptions {
  showConfidence: boolean;
  showMetadata: boolean;
  compactMode: boolean;
}

export interface SectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  onCopy?: () => void;
  title: string;
  count: number;
  copyTitle?: string;
}

export interface ExpandableContentProps {
  isExpanded: boolean;
  children: React.ReactNode;
  maxHeight?: string;
}
