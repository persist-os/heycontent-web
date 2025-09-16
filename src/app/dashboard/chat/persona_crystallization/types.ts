/**
 * Shared types and interfaces for persona crystallization system
 * Updated to match the full crystallization schema
 */

// Import types from the centralized schema
export type TraceType = 'preference' | 'behavior' | 'goal' | 'constraint' | 'pattern' | 'value' | 'workflow' | 'communication_style' | 'temporal_preference' | 'emotional_pattern';

export type EvolutionEventType = 'strengthened' | 'weakened' | 'contradicted' | 'refined';

export interface TraceMetadata {
  conversation_id: string;
  message_timestamp: number;
  extraction_timestamp: number;
  linguistic_markers: string[];
  context_length: number;
  user_id: string;
}

export interface EvolutionEvent {
  timestamp: number;
  event_type: EvolutionEventType;
  old_value: string | null;
  new_value: string;
  trigger_trace_id: string;
  confidence_change: number;
  reason: string;
}

export interface PersonaTrace {
  trace_id: string;
  convex_id?: string;
  trace_type: TraceType;
  verbatim_quote: string;
  extracted_insight: string;
  confidence: number;
  context: string;
  temporal_weight: number;
  preference_strength: number;
  decision_context?: number;
  emotional_intensity?: number;
  consistency_indicator?: number;
  evolution_marker?: number;
  interaction_style?: number;
  value_alignment?: number;
  cognitive_pattern?: number;
  behavioral_trigger?: number;
  processing_context?: Record<string, any>;
  metadata: TraceMetadata;
  created_at: number; // Keep for backward compatibility
}

export interface PersonaInsight {
  insight_id: string;
  insight_type: string;
  crystallized_insight: string;
  confidence: number;
  supporting_traces: string[];
  contradiction_flags: string[];
  evolution_history: EvolutionEvent[];
  temporal_stability: number;
  cross_pattern_correlations: string[];
  creation_timestamp: number;
  last_updated: number;
  user_id: string;
  metadata: Record<string, any>;
  // Keep for backward compatibility
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
