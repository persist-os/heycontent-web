/**
 * CENTRALIZED PERSONA CRYSTALLIZATION SCHEMA DEFINITION
 *
 * This file serves as the single source of truth for all Persona Crystallization fields.
 * It aligns perfectly with backend-new/app/models/persona_crystallization.py
 * 
 * Both frontend and backend must use this schema to ensure perfect alignment.
 * All crystallization operations (create, update, queries) should reference these field definitions.
 */

export interface CrystallizationField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'id' | 'float';
  required: boolean;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
    ge?: number;  // greater than or equal (Pydantic style)
    le?: number;  // less than or equal (Pydantic style)
  };
  default?: any;
}

// === ENUMS AND TYPES ===

export const TRACE_TYPES = [
  'preference',
  'behavior', 
  'goal',
  'constraint',
  'pattern',
  'value',
  'workflow',
  'communication_style',
  'temporal_preference',
  'emotional_pattern'
] as const;

export type TraceType = typeof TRACE_TYPES[number];

export const EVOLUTION_EVENT_TYPES = [
  'strengthened',
  'weakened', 
  'contradicted',
  'refined'
] as const;

export type EvolutionEventType = typeof EVOLUTION_EVENT_TYPES[number];

// === TRACE METADATA FIELDS ===

export const TRACE_METADATA_FIELDS: CrystallizationField[] = [
  {
    name: 'conversation_id',
    type: 'string',
    required: true,
    description: 'ID of the source conversation'
  },
  {
    name: 'message_timestamp',
    type: 'float',
    required: true,
    description: 'Unix timestamp of source message'
  },
  {
    name: 'extraction_timestamp',
    type: 'float',
    required: true,
    description: 'When the trace was extracted',
    default: () => Date.now() / 1000
  },
  {
    name: 'linguistic_markers',
    type: 'array',
    required: false,
    description: 'Linguistic indicators found',
    default: []
  },
  {
    name: 'context_length',
    type: 'number',
    required: true,
    description: 'Length of surrounding context'
  },
  {
    name: 'user_id',
    type: 'string',
    required: true,
    description: 'User who owns this trace'
  }
];

// === EVOLUTION EVENT FIELDS ===

export const EVOLUTION_EVENT_FIELDS: CrystallizationField[] = [
  {
    name: 'timestamp',
    type: 'float',
    required: true,
    description: 'When the evolution occurred'
  },
  {
    name: 'event_type',
    type: 'string',
    required: true,
    description: 'Type of evolution event',
    validation: {
      enum: [...EVOLUTION_EVENT_TYPES]
    }
  },
  {
    name: 'old_value',
    type: 'string',
    required: false,
    description: 'Previous insight value',
    default: null
  },
  {
    name: 'new_value',
    type: 'string',
    required: true,
    description: 'Updated insight value'
  },
  {
    name: 'trigger_trace_id',
    type: 'string',
    required: true,
    description: 'Trace that triggered this evolution (Convex ID format)',
    validation: {
      pattern: '^[a-z0-9]+$'
    }
  },
  {
    name: 'confidence_change',
    type: 'float',
    required: true,
    description: 'Change in confidence score'
  },
  {
    name: 'reason',
    type: 'string',
    required: true,
    description: 'Explanation for the evolution'
  }
];

// === PERSONA TRACE FIELDS ===

export const PERSONA_TRACE_FIELDS: CrystallizationField[] = [
  {
    name: 'trace_id',
    type: 'string',
    required: true,
    description: 'Unique identifier for this trace'
  },
  {
    name: 'convex_id',
    type: 'string',
    required: false,
    description: 'Convex document ID (_id field)',
    default: null
  },
  {
    name: 'trace_type',
    type: 'string',
    required: true,
    description: 'Category of psychological insight',
    validation: {
      enum: [...TRACE_TYPES]
    }
  },
  {
    name: 'verbatim_quote',
    type: 'string',
    required: true,
    description: 'Exact user words, preserved precisely',
    validation: {
      min: 1  // Cannot be empty
    }
  },
  {
    name: 'extracted_insight',
    type: 'string',
    required: true,
    description: 'Psychological interpretation'
  },
  {
    name: 'confidence',
    type: 'float',
    required: true,
    description: 'Confidence based on linguistic markers',
    validation: {
      ge: 0.0,
      le: 1.0
    }
  },
  {
    name: 'context',
    type: 'string',
    required: true,
    description: 'Surrounding conversation context'
  },
  {
    name: 'temporal_weight',
    type: 'float',
    required: true,
    description: 'Time-sensitivity of insight',
    validation: {
      ge: 0.0,
      le: 1.0
    }
  },
  {
    name: 'preference_strength',
    type: 'float',
    required: true,
    description: 'Intensity of user feeling',
    validation: {
      ge: 0.0,
      le: 1.0
    }
  },
  {
    name: 'decision_context',
    type: 'float',
    required: false,
    description: 'Decision-making context intensity',
    validation: {
      ge: 0.0,
      le: 1.0
    },
    default: 0.0
  },
  {
    name: 'emotional_intensity',
    type: 'float',
    required: false,
    description: 'Emotional weight of the psychological insight',
    validation: {
      ge: 0.0,
      le: 1.0
    },
    default: 0.0
  },
  {
    name: 'consistency_indicator',
    type: 'float',
    required: false,
    description: 'Consistency with previous behavioral patterns',
    validation: {
      ge: 0.0,
      le: 1.0
    },
    default: 0.0
  },
  {
    name: 'evolution_marker',
    type: 'float',
    required: false,
    description: 'Likelihood of behavioral pattern evolution',
    validation: {
      ge: 0.0,
      le: 1.0
    },
    default: 0.0
  },
  {
    name: 'interaction_style',
    type: 'float',
    required: false,
    description: 'Social interaction pattern strength',
    validation: {
      ge: 0.0,
      le: 1.0
    },
    default: 0.0
  },
  {
    name: 'value_alignment',
    type: 'float',
    required: false,
    description: 'Alignment with user core values',
    validation: {
      ge: 0.0,
      le: 1.0
    },
    default: 0.0
  },
  {
    name: 'cognitive_pattern',
    type: 'float',
    required: false,
    description: 'Cognitive processing pattern strength',
    validation: {
      ge: 0.0,
      le: 1.0
    },
    default: 0.0
  },
  {
    name: 'behavioral_trigger',
    type: 'float',
    required: false,
    description: 'Behavioral trigger identification strength',
    validation: {
      ge: 0.0,
      le: 1.0
    },
    default: 0.0
  },
  {
    name: 'processing_context',
    type: 'object',
    required: false,
    description: 'Token dam and processing metadata',
    default: {}
  },
  {
    name: 'metadata',
    type: 'object',
    required: true,
    description: 'Trace metadata'
  }
];

// === CRYSTALLIZED INSIGHT FIELDS ===

export const CRYSTALLIZED_INSIGHT_FIELDS: CrystallizationField[] = [
  {
    name: 'insight_id',
    type: 'string',
    required: true,
    description: 'Unique identifier for this insight'
  },
  {
    name: 'insight_type',
    type: 'string',
    required: true,
    description: 'Category of crystallized pattern'
  },
  {
    name: 'crystallized_insight',
    type: 'string',
    required: true,
    description: 'Stable psychological pattern'
  },
  {
    name: 'confidence',
    type: 'float',
    required: true,
    description: 'Aggregated confidence score',
    validation: {
      ge: 0.0,
      le: 1.0
    }
  },
  {
    name: 'supporting_traces',
    type: 'array',
    required: true,
    description: 'Evidence trace IDs (Convex ID format)',
    validation: {
      min: 1  // At least one supporting trace required
    }
  },
  {
    name: 'contradiction_flags',
    type: 'array',
    required: false,
    description: 'Conflicting trace IDs (Convex ID format)',
    default: []
  },
  {
    name: 'evolution_history',
    type: 'array',
    required: false,
    description: 'Change timeline',
    default: []
  },
  {
    name: 'temporal_stability',
    type: 'float',
    required: true,
    description: 'Resistance to change',
    validation: {
      ge: 0.0,
      le: 1.0
    }
  },
  {
    name: 'cross_pattern_correlations',
    type: 'array',
    required: false,
    description: 'Related insight IDs (Convex ID format)',
    default: []
  },
  {
    name: 'creation_timestamp',
    type: 'float',
    required: true,
    description: 'When insight was created',
    default: () => Date.now() / 1000
  },
  {
    name: 'last_updated',
    type: 'float',
    required: true,
    description: 'When insight was last updated',
    default: () => Date.now() / 1000
  },
  {
    name: 'user_id',
    type: 'string',
    required: true,
    description: 'User who owns this insight'
  },
  {
    name: 'metadata',
    type: 'object',
    required: false,
    description: 'Rich metadata from LLM analysis and processing',
    default: {}
  }
];

// === API REQUEST/RESPONSE FIELDS ===

export const EXTRACT_TRACES_REQUEST_FIELDS: CrystallizationField[] = [
  {
    name: 'user_id',
    type: 'string',
    required: true,
    description: 'User identifier'
  },
  {
    name: 'conversation_data',
    type: 'object',
    required: true,
    description: 'Conversation data to analyze'
  },
  {
    name: 'session_id',
    type: 'string',
    required: false,
    description: 'Optional session identifier',
    default: null
  }
];

export const EXTRACT_TRACES_RESPONSE_FIELDS: CrystallizationField[] = [
  {
    name: 'traces',
    type: 'array',
    required: true,
    description: 'Extracted psychological traces'
  },
  {
    name: 'extraction_metadata',
    type: 'object',
    required: true,
    description: 'Processing metadata'
  },
  {
    name: 'processing_time_ms',
    type: 'float',
    required: true,
    description: 'Time taken for extraction'
  }
];

export const CRYSTALLIZE_INSIGHTS_REQUEST_FIELDS: CrystallizationField[] = [
  {
    name: 'user_id',
    type: 'string',
    required: true,
    description: 'User identifier'
  },
  {
    name: 'trace_ids',
    type: 'array',
    required: false,
    description: 'Specific traces to crystallize',
    default: null
  },
  {
    name: 'min_confidence',
    type: 'float',
    required: false,
    description: 'Minimum confidence threshold',
    validation: {
      ge: 0.0,
      le: 1.0
    },
    default: 0.6
  }
];

export const CRYSTALLIZE_INSIGHTS_RESPONSE_FIELDS: CrystallizationField[] = [
  {
    name: 'insights',
    type: 'array',
    required: true,
    description: 'Crystallized insights'
  },
  {
    name: 'crystallization_metadata',
    type: 'object',
    required: true,
    description: 'Processing metadata'
  },
  {
    name: 'processing_time_ms',
    type: 'float',
    required: true,
    description: 'Time taken for crystallization'
  }
];

export const GET_INSIGHTS_RESPONSE_FIELDS: CrystallizationField[] = [
  {
    name: 'insights',
    type: 'array',
    required: true,
    description: 'User\'s crystallized insights'
  },
  {
    name: 'user_metadata',
    type: 'object',
    required: true,
    description: 'User insight statistics'
  }
];

// === PROCESSING RESULT FIELDS ===

export const LLM_EXTRACTION_RESULT_FIELDS: CrystallizationField[] = [
  {
    name: 'raw_response',
    type: 'string',
    required: true,
    description: 'Raw LLM response'
  },
  {
    name: 'parsed_traces',
    type: 'array',
    required: true,
    description: 'Parsed trace data'
  },
  {
    name: 'extraction_errors',
    type: 'array',
    required: false,
    description: 'Parsing errors',
    default: []
  },
  {
    name: 'processing_metadata',
    type: 'object',
    required: false,
    description: 'LLM metadata',
    default: {}
  }
];

export const CRYSTALLIZATION_RESULT_FIELDS: CrystallizationField[] = [
  {
    name: 'new_insights',
    type: 'array',
    required: false,
    description: 'Newly created insights',
    default: []
  },
  {
    name: 'updated_insights',
    type: 'array',
    required: false,
    description: 'Updated insights',
    default: []
  },
  {
    name: 'pattern_correlations',
    type: 'object',
    required: false,
    description: 'Pattern correlation mapping',
    default: {}
  },
  {
    name: 'contradiction_analysis',
    type: 'object',
    required: false,
    description: 'Contradiction analysis results',
    default: {}
  },
  {
    name: 'processing_metadata',
    type: 'object',
    required: false,
    description: 'Processing metadata',
    default: {}
  }
];

// === ERROR MODEL FIELDS ===

export const CRYSTALLIZATION_ERROR_FIELDS: CrystallizationField[] = [
  {
    name: 'error_type',
    type: 'string',
    required: true,
    description: 'Type of error'
  },
  {
    name: 'error_message',
    type: 'string',
    required: true,
    description: 'Human-readable error message'
  },
  {
    name: 'error_details',
    type: 'object',
    required: false,
    description: 'Additional error context',
    default: null
  },
  {
    name: 'request_id',
    type: 'string',
    required: false,
    description: 'Request identifier for debugging',
    default: null
  }
];

// === COMPLETE SCHEMA COLLECTIONS ===

export const ALL_TRACE_METADATA_FIELDS = [...TRACE_METADATA_FIELDS];
export const ALL_EVOLUTION_EVENT_FIELDS = [...EVOLUTION_EVENT_FIELDS];
export const ALL_PERSONA_TRACE_FIELDS = [...PERSONA_TRACE_FIELDS];
export const ALL_CRYSTALLIZED_INSIGHT_FIELDS = [...CRYSTALLIZED_INSIGHT_FIELDS];

export const ALL_API_REQUEST_FIELDS = [
  ...EXTRACT_TRACES_REQUEST_FIELDS,
  ...CRYSTALLIZE_INSIGHTS_REQUEST_FIELDS
];

export const ALL_API_RESPONSE_FIELDS = [
  ...EXTRACT_TRACES_RESPONSE_FIELDS,
  ...CRYSTALLIZE_INSIGHTS_RESPONSE_FIELDS,
  ...GET_INSIGHTS_RESPONSE_FIELDS
];

export const ALL_PROCESSING_RESULT_FIELDS = [
  ...LLM_EXTRACTION_RESULT_FIELDS,
  ...CRYSTALLIZATION_RESULT_FIELDS
];

export const ALL_CRYSTALLIZATION_FIELDS = [
  ...ALL_TRACE_METADATA_FIELDS,
  ...ALL_EVOLUTION_EVENT_FIELDS,
  ...ALL_PERSONA_TRACE_FIELDS,
  ...ALL_CRYSTALLIZED_INSIGHT_FIELDS,
  ...ALL_API_REQUEST_FIELDS,
  ...ALL_API_RESPONSE_FIELDS,
  ...ALL_PROCESSING_RESULT_FIELDS,
  ...CRYSTALLIZATION_ERROR_FIELDS
];

// === TYPESCRIPT INTERFACES (Generated from Python Models) ===

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
}

export interface CrystallizedInsight {
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
}

// === API INTERFACES ===

export interface ExtractTracesRequest {
  user_id: string;
  conversation_data: Record<string, any>;
  session_id?: string;
}

export interface ExtractTracesResponse {
  traces: PersonaTrace[];
  extraction_metadata: Record<string, any>;
  processing_time_ms: number;
}

export interface CrystallizeInsightsRequest {
  user_id: string;
  trace_ids?: string[];
  min_confidence: number;
}

export interface CrystallizeInsightsResponse {
  insights: CrystallizedInsight[];
  crystallization_metadata: Record<string, any>;
  processing_time_ms: number;
}

export interface GetInsightsResponse {
  insights: CrystallizedInsight[];
  user_metadata: Record<string, any>;
}

// === PROCESSING RESULT INTERFACES ===

export interface LLMExtractionResult {
  raw_response: string;
  parsed_traces: Record<string, any>[];
  extraction_errors: string[];
  processing_metadata: Record<string, any>;
}

export interface CrystallizationResult {
  new_insights: CrystallizedInsight[];
  updated_insights: CrystallizedInsight[];
  pattern_correlations: Record<string, string[]>;
  contradiction_analysis: Record<string, any>;
  processing_metadata: Record<string, any>;
}

// === ERROR INTERFACE ===

export interface PersonaCrystallizationError {
  error_type: string;
  error_message: string;
  error_details?: Record<string, any>;
  request_id?: string;
}

// === HELPER FUNCTIONS ===

export function getRequiredCrystallizationFields(): CrystallizationField[] {
  return ALL_CRYSTALLIZATION_FIELDS.filter(field => field.required);
}

export function getOptionalCrystallizationFields(): CrystallizationField[] {
  return ALL_CRYSTALLIZATION_FIELDS.filter(field => !field.required);
}

export function getCrystallizationFieldByName(name: string): CrystallizationField | undefined {
  return ALL_CRYSTALLIZATION_FIELDS.find(field => field.name === name);
}

export function validateCrystallizationFieldValue(fieldName: string, value: any): boolean {
  const field = getCrystallizationFieldByName(fieldName);
  if (!field) return false;

  if (field.required && (value === undefined || value === null || value === '')) {
    return false;
  }

  if (field.validation) {
    if (field.type === 'number' || field.type === 'float') {
      if (typeof value === 'number') {
        if (field.validation.min !== undefined && value < field.validation.min) return false;
        if (field.validation.max !== undefined && value > field.validation.max) return false;
        if (field.validation.ge !== undefined && value < field.validation.ge) return false;
        if (field.validation.le !== undefined && value > field.validation.le) return false;
      }
    }

    if (field.type === 'string' && field.validation.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) return false;
    }

    if (field.validation.enum && !field.validation.enum.includes(value)) {
      return false;
    }

    if (field.type === 'array' && Array.isArray(value)) {
      if (field.validation.min !== undefined && value.length < field.validation.min) return false;
      if (field.validation.max !== undefined && value.length > field.validation.max) return false;
    }
  }

  return true;
}

export function validateConvexIdFormat(id: string): boolean {
  const convexIdPattern = /^[a-z0-9]+$/;
  return convexIdPattern.test(id);
}

export function validateTraceType(traceType: string): traceType is TraceType {
  return TRACE_TYPES.includes(traceType as TraceType);
}

export function validateEvolutionEventType(eventType: string): eventType is EvolutionEventType {
  return EVOLUTION_EVENT_TYPES.includes(eventType as EvolutionEventType);
}

// === EXAMPLE DATA (Matching Python Examples) ===

export const EXAMPLE_TRACE_METADATA: TraceMetadata = {
  conversation_id: "conv_789",
  message_timestamp: 1642678800.0,
  extraction_timestamp: 1642678900.0,
  linguistic_markers: ["always", "prefer"],
  context_length: 150,
  user_id: "user_456"
};

export const EXAMPLE_PERSONA_TRACE: PersonaTrace = {
  trace_id: "trace_123456",
  trace_type: "preference",
  verbatim_quote: "I always prefer to work in the morning when my mind is fresh",
  extracted_insight: "User has strong temporal preference for morning productivity",
  confidence: 0.9,
  context: "Discussion about daily routines and productivity optimization",
  temporal_weight: 0.7,
  preference_strength: 0.9,
  decision_context: 0.8,
  emotional_intensity: 0.6,
  consistency_indicator: 0.9,
  evolution_marker: 0.3,
  interaction_style: 0.4,
  value_alignment: 0.8,
  cognitive_pattern: 0.7,
  behavioral_trigger: 0.5,
  processing_context: {
    token_dam_threshold: 0.75,
    extraction_method: "llm_analysis",
    confidence_boosters: ["temporal_indicators", "preference_markers"]
  },
  metadata: EXAMPLE_TRACE_METADATA
};

export const EXAMPLE_CRYSTALLIZED_INSIGHT: CrystallizedInsight = {
  insight_id: "insight_789",
  insight_type: "productivity_pattern",
  crystallized_insight: "User consistently demonstrates peak productivity during morning hours (7-10 AM) with strong preference for focused, uninterrupted work sessions",
  confidence: 0.85,
  supporting_traces: ["trace_123", "trace_124", "trace_125"],
  contradiction_flags: [],
  evolution_history: [],
  temporal_stability: 0.8,
  cross_pattern_correlations: ["insight_790", "insight_791"],
  creation_timestamp: 1642678800.0,
  last_updated: 1642678800.0,
  user_id: "user_456",
  metadata: {
    psychological_depth: "Deep analysis of underlying motivations and patterns",
    supporting_evidence: "Strong evidence from multiple consistent observations",
    llm_metadata: {
      pattern_strength: "high",
      cross_domain_relevance: "medium",
      emotional_intensity: "medium",
      behavioral_consistency: "high",
      evolution_potential: "stable"
    },
    generation_method: "llm_crystallization",
    trace_count: 3,
    avg_trace_confidence: 0.87,
    time_span_days: 14.5
  }
};
