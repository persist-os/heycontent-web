/**
 * Enhanced validation utilities for Persona Crystallization System
 * Matches backend validation standards and provides comprehensive validation
 */

import { PersonaCrystallizationError } from "./personaTypes";

// Quality thresholds matching backend configuration
export const VALIDATION_THRESHOLDS = {
  MIN_CONFIDENCE: 0.3,
  MAX_CONFIDENCE: 0.95,
  MIN_INSIGHT_TEXT_LENGTH: 10,
  MAX_SUPPORTING_TRACES: 100,
  MAX_EVOLUTION_HISTORY_SIZE: 50,
  QUALITY_UPDATE_THRESHOLD: 0.5
} as const;

/**
 * Comprehensive validation for insight data
 * Returns null if valid, or error object if invalid
 */
export const validateInsightData = (insight: any, isUpdate: boolean = false): PersonaCrystallizationError | null => {
  // Validate required fields
  if (!insight.insight_type || typeof insight.insight_type !== 'string') {
    return {
      code: 'INVALID_INSIGHT_TYPE',
      message: 'Insight type must be a non-empty string',
      details: { insightType: insight.insight_type },
      timestamp: Date.now()
    };
  }

  if (!insight.crystallized_insight || typeof insight.crystallized_insight !== 'string') {
    return {
      code: 'INVALID_CRYSTALLIZED_INSIGHT',
      message: 'Insight text must be a non-empty string', 
      details: { crystallizedInsight: insight.crystallized_insight },
      timestamp: Date.now()
    };
  }

  // Validate minimum text length
  if (insight.crystallized_insight.trim().length < VALIDATION_THRESHOLDS.MIN_INSIGHT_TEXT_LENGTH) {
    return {
      code: 'INSIGHT_TEXT_TOO_SHORT',
      message: `Insight text must be at least ${VALIDATION_THRESHOLDS.MIN_INSIGHT_TEXT_LENGTH} characters`,
      details: { 
        length: insight.crystallized_insight.trim().length,
        minLength: VALIDATION_THRESHOLDS.MIN_INSIGHT_TEXT_LENGTH
      },
      timestamp: Date.now()
    };
  }

  // Enhanced confidence validation matching backend standards
  if (typeof insight.confidence !== 'number' || 
      insight.confidence < VALIDATION_THRESHOLDS.MIN_CONFIDENCE || 
      insight.confidence > VALIDATION_THRESHOLDS.MAX_CONFIDENCE) {
    return {
      code: 'INVALID_CONFIDENCE',
      message: `Confidence must be between ${VALIDATION_THRESHOLDS.MIN_CONFIDENCE} and ${VALIDATION_THRESHOLDS.MAX_CONFIDENCE}`,
      details: { 
        confidence: insight.confidence,
        validRange: [VALIDATION_THRESHOLDS.MIN_CONFIDENCE, VALIDATION_THRESHOLDS.MAX_CONFIDENCE]
      },
      timestamp: Date.now()
    };
  }

  // Validate temporal stability
  if (typeof insight.temporal_stability !== 'number' || insight.temporal_stability < 0 || insight.temporal_stability > 1) {
    return {
      code: 'INVALID_TEMPORAL_STABILITY',
      message: 'Temporal stability must be between 0 and 1',
      details: { temporalStability: insight.temporal_stability },
      timestamp: Date.now()
    };
  }

  // Enhanced supporting traces validation
  if (!Array.isArray(insight.supporting_traces)) {
    return {
      code: 'INVALID_SUPPORTING_TRACES',
      message: 'Supporting traces must be an array',
      details: { supportingTraces: insight.supporting_traces },
      timestamp: Date.now()
    };
  }

  if (insight.supporting_traces.length === 0) {
    return {
      code: 'NO_SUPPORTING_TRACES',
      message: 'At least one supporting trace is required',
      details: { count: insight.supporting_traces.length },
      timestamp: Date.now()
    };
  }

  if (insight.supporting_traces.length > VALIDATION_THRESHOLDS.MAX_SUPPORTING_TRACES) {
    return {
      code: 'TOO_MANY_SUPPORTING_TRACES',
      message: `Too many supporting traces (max: ${VALIDATION_THRESHOLDS.MAX_SUPPORTING_TRACES})`,
      details: { 
        count: insight.supporting_traces.length,
        maxAllowed: VALIDATION_THRESHOLDS.MAX_SUPPORTING_TRACES
      },
      timestamp: Date.now()
    };
  }

  if (!Array.isArray(insight.contradiction_flags)) {
    return {
      code: 'INVALID_CONTRADICTION_FLAGS',
      message: 'Contradiction flags must be an array',
      details: { contradictionFlags: insight.contradiction_flags },
      timestamp: Date.now()
    };
  }

  // Enhanced evolution history validation
  if (!Array.isArray(insight.evolution_history)) {
    return {
      code: 'INVALID_EVOLUTION_HISTORY',
      message: 'Evolution history must be an array',
      details: { evolutionHistory: insight.evolution_history },
      timestamp: Date.now()
    };
  }

  if (insight.evolution_history.length > VALIDATION_THRESHOLDS.MAX_EVOLUTION_HISTORY_SIZE) {
    return {
      code: 'EVOLUTION_HISTORY_TOO_LARGE',
      message: `Evolution history too large (max: ${VALIDATION_THRESHOLDS.MAX_EVOLUTION_HISTORY_SIZE})`,
      details: { 
        count: insight.evolution_history.length,
        maxAllowed: VALIDATION_THRESHOLDS.MAX_EVOLUTION_HISTORY_SIZE
      },
      timestamp: Date.now()
    };
  }

  // Validate evolution history events
  for (let i = 0; i < insight.evolution_history.length; i++) {
    const event = insight.evolution_history[i];
    if (!event.timestamp || typeof event.timestamp !== 'number') {
      return {
        code: 'INVALID_EVOLUTION_EVENT_TIMESTAMP',
        message: `Evolution event ${i} has invalid timestamp`,
        details: { eventIndex: i, timestamp: event.timestamp },
        timestamp: Date.now()
      };
    }
    if (!event.eventType || !['strengthened', 'weakened', 'contradicted', 'refined'].includes(event.eventType)) {
      return {
        code: 'INVALID_EVOLUTION_EVENT_TYPE',
        message: `Evolution event ${i} has invalid type`,
        details: { eventIndex: i, eventType: event.eventType },
        timestamp: Date.now()
      };
    }
    
    // Validate confidence changes make sense
    if (event.confidenceChange && Math.abs(event.confidenceChange) > 1.0) {
      return {
        code: 'INVALID_CONFIDENCE_CHANGE',
        message: `Evolution event ${i} has invalid confidence change`,
        details: { eventIndex: i, confidenceChange: event.confidenceChange },
        timestamp: Date.now()
      };
    }
  }

  if (!Array.isArray(insight.cross_pattern_correlations)) {
    return {
      code: 'INVALID_CROSS_PATTERN_CORRELATIONS',
      message: 'Cross-pattern correlations must be an array',
      details: { crossPatternCorrelations: insight.cross_pattern_correlations },
      timestamp: Date.now()
    };
  }

  // Validate timestamps - check both camelCase and snake_case field names
  const createdAt = insight.createdAt || insight.created_at || insight.creation_timestamp;
  const updatedAt = insight.updatedAt || insight.updated_at || insight.last_updated;
  
  if (typeof createdAt !== 'number' || createdAt <= 0) {
    return {
      code: 'INVALID_CREATED_AT',
      message: 'Created timestamp must be positive',
      details: { createdAt: createdAt, fieldChecked: 'createdAt/created_at/creation_timestamp' },
      timestamp: Date.now()
    };
  }

  if (typeof updatedAt !== 'number' || updatedAt <= 0) {
    return {
      code: 'INVALID_UPDATED_AT',
      message: 'Updated timestamp must be positive',
      details: { updatedAt: updatedAt, fieldChecked: 'updatedAt/updated_at/last_updated' },
      timestamp: Date.now()
    };
  }

  // Validate metadata structure
  if (!insight.metadata || typeof insight.metadata !== 'object') {
    return {
      code: 'INVALID_METADATA',
      message: 'Metadata must be an object',
      details: { metadata: insight.metadata },
      timestamp: Date.now()
    };
  }

  const metadata = insight.metadata;
  if (typeof metadata.first_observed !== 'number' || metadata.first_observed <= 0) {
    return {
      code: 'INVALID_METADATA_FIRST_OBSERVED',
      message: 'First observed timestamp must be positive',
      details: { firstObserved: metadata.first_observed },
      timestamp: Date.now()
    };
  }

  if (typeof metadata.last_observed !== 'number' || metadata.last_observed <= 0) {
    return {
      code: 'INVALID_METADATA_LAST_OBSERVED',
      message: 'Last observed timestamp must be positive',
      details: { lastObserved: metadata.last_observed },
      timestamp: Date.now()
    };
  }

  if (typeof metadata.frequency !== 'number' || metadata.frequency < 0) {
    return {
      code: 'INVALID_METADATA_FREQUENCY',
      message: 'Frequency must be non-negative',
      details: { frequency: metadata.frequency },
      timestamp: Date.now()
    };
  }

  if (!Array.isArray(metadata.contexts)) {
    return {
      code: 'INVALID_METADATA_CONTEXTS',
      message: 'Contexts must be an array',
      details: { contexts: metadata.contexts },
      timestamp: Date.now()
    };
  }

  if (!Array.isArray(metadata.confidence_history)) {
    return {
      code: 'INVALID_METADATA_CONFIDENCE_HISTORY',
      message: 'Confidence history must be an array',
      details: { confidenceHistory: metadata.confidence_history },
      timestamp: Date.now()
    };
  }

  // Quality threshold validation for updates
  if (isUpdate && insight.evolution_history.length > 0) {
    const latestEvent = insight.evolution_history[insight.evolution_history.length - 1];
    if (latestEvent.confidenceChange && latestEvent.confidenceChange < -0.1) {
      return {
        code: 'QUALITY_DECREASE_TOO_LARGE',
        message: 'Update would significantly decrease insight quality',
        details: { confidenceChange: latestEvent.confidenceChange },
        timestamp: Date.now()
      };
    }
  }

  return null; // No validation errors
};

/**
 * Validate user ID with actionable error messages
 */
export const validateUserId = (userId: string): PersonaCrystallizationError | null => {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return {
      code: 'INVALID_USER_ID',
      message: 'Please provide a valid user ID',
      details: { userId },
      timestamp: Date.now()
    };
  }
  return null;
};

/**
 * Enhanced confidence validation with strict/lenient modes
 */
export const validateConfidence = (confidence: number, isStrict: boolean = false): PersonaCrystallizationError | null => {
  const minThreshold = isStrict ? VALIDATION_THRESHOLDS.MIN_CONFIDENCE : 0;
  const maxThreshold = isStrict ? VALIDATION_THRESHOLDS.MAX_CONFIDENCE : 1;
  
  if (typeof confidence !== 'number' || confidence < minThreshold || confidence > maxThreshold) {
    return {
      code: 'INVALID_CONFIDENCE_RANGE',
      message: `Confidence must be between ${minThreshold} and ${maxThreshold}`,
      details: { 
        confidence,
        validRange: [minThreshold, maxThreshold],
        strictMode: isStrict
      },
      timestamp: Date.now()
    };
  }
  return null;
};

/**
 * Validate trace data for persona extraction
 */
export const validateTraceData = (trace: any): PersonaCrystallizationError | null => {
  if (!trace.traceId || typeof trace.traceId !== 'string') {
    return {
      code: 'INVALID_TRACE_ID',
      message: 'Trace must have a valid ID',
      details: { traceId: trace.traceId },
      timestamp: Date.now()
    };
  }

  if (!trace.verbatimQuote || typeof trace.verbatimQuote !== 'string') {
    return {
      code: 'INVALID_VERBATIM_QUOTE',
      message: 'Trace must include the original quote',
      details: { verbatimQuote: trace.verbatimQuote },
      timestamp: Date.now()
    };
  }

  if (!trace.extractedInsight || typeof trace.extractedInsight !== 'string') {
    return {
      code: 'INVALID_EXTRACTED_INSIGHT',
      message: 'Trace must include extracted insight',
      details: { extractedInsight: trace.extractedInsight },
      timestamp: Date.now()
    };
  }

  const confidenceError = validateConfidence(trace.confidence, true);
  if (confidenceError) {
    return confidenceError;
  }

  return null;
};

/**
 * Sanitize and clamp numeric values to valid ranges
 */
export const sanitizeInsightData = (insight: any) => {
  const sanitized = {
    ...insight,
    confidence: Math.max(VALIDATION_THRESHOLDS.MIN_CONFIDENCE, 
                        Math.min(VALIDATION_THRESHOLDS.MAX_CONFIDENCE, insight.confidence)),
    temporal_stability: Math.max(0, Math.min(1, insight.temporal_stability)),
    metadata: {
      ...insight.metadata,
      first_observed: Math.max(0, insight.metadata?.first_observed || 0),
      last_observed: Math.max(0, insight.metadata?.last_observed || 0),
      frequency: Math.max(0, insight.metadata?.frequency || 0)
    },
    updated_at: Math.max(insight.updated_at || 0, Date.now())
  };

  // Trim evolution history if too large
  if (sanitized.evolution_history?.length > VALIDATION_THRESHOLDS.MAX_EVOLUTION_HISTORY_SIZE) {
    const firstEvent = sanitized.evolution_history[0];
    const recentEvents = sanitized.evolution_history.slice(-(VALIDATION_THRESHOLDS.MAX_EVOLUTION_HISTORY_SIZE - 1));
    sanitized.evolution_history = [firstEvent, ...recentEvents];
  }

  // Trim supporting traces if too many
  if (sanitized.supporting_traces?.length > VALIDATION_THRESHOLDS.MAX_SUPPORTING_TRACES) {
    sanitized.supporting_traces = sanitized.supporting_traces.slice(-VALIDATION_THRESHOLDS.MAX_SUPPORTING_TRACES);
  }

  return sanitized;
};

/**
 * Create user-friendly error message from validation error
 */
export const getActionableErrorMessage = (error: PersonaCrystallizationError): string => {
  const actionableMessages: Record<string, string> = {
    'INVALID_CONFIDENCE': 'Please ensure confidence scores are within the acceptable range for quality insights.',
    'INSIGHT_TEXT_TOO_SHORT': 'Please provide more detailed insight text to ensure meaningful analysis.',
    'NO_SUPPORTING_TRACES': 'Please ensure there is supporting evidence for this insight.',
    'TOO_MANY_SUPPORTING_TRACES': 'This insight has too much supporting evidence. Consider splitting it into multiple insights.',
    'EVOLUTION_HISTORY_TOO_LARGE': 'This insight has been updated too many times. Consider archiving old updates.',
    'QUALITY_DECREASE_TOO_LARGE': 'This update would significantly reduce insight quality. Please review the new evidence.',
    'INVALID_USER_ID': 'Please ensure you are properly authenticated before proceeding.',
  };

  return actionableMessages[error.code] || error.message;
};