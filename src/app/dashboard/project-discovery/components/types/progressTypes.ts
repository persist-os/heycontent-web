/**
 * Progress Tracking Type Definitions
 * 
 * Specialized type definitions for progress tracking and field completion
 * in the project discovery system. Handles confidence calculations,
 * completion metrics, and missing field identification.
 * 
 * Used by: Progress calculation utilities, progress display components
 */

/**
 * Individual field completion status with confidence scoring
 */
export interface FieldCompletion {
  /** Field name from the fingerprint schema */
  fieldName: string;
  /** Completion status: 'empty', 'partial', or 'complete' */
  status: 'empty' | 'partial' | 'complete';
  /** Confidence score for this field (0.0-1.0) */
  confidence: number;
  /** Extracted information for this field */
  information?: any;
  /** Timestamp of last update */
  lastUpdated: string;
}

/**
 * Overall progress metrics for the discovery process
 */
export interface ProgressMetrics {
  /** Overall completion percentage (0.0-1.0) */
  completionPercentage: number;
  /** Field-based confidence score (0.0-1.0) */
  fieldBasedConfidence: number;
  /** Traditional confidence score (0.0-1.0) */
  traditionalConfidence: number;
  /** Number of completed fields */
  completedFields: number;
  /** Number of partially completed fields */
  partialFields: number;
  /** Number of empty fields */
  emptyFields: number;
  /** Total number of fields */
  totalFields: number;
}

/**
 * Confidence calculation inputs and outputs
 */
export interface ConfidenceData {
  /** Input data for confidence calculation */
  inputs: {
    fieldCompletions: FieldCompletion[];
    conversationSegments: number;
    userEngagementLevel: number;
    dataQualityScore: number;
  };
  /** Calculated confidence metrics */
  outputs: {
    fieldBasedConfidence: number;
    traditionalConfidence: number;
    weightedConfidence: number;
    confidenceTrend: 'increasing' | 'stable' | 'decreasing';
  };
}

/**
 * Identification of incomplete fields and missing areas
 */
export interface MissingFields {
  /** List of field names that are empty */
  emptyFields: string[];
  /** List of field names that are partially complete */
  partialFields: string[];
  /** List of missing areas/categories */
  missingAreas: string[];
  /** Next priority field to focus on */
  nextPriorityField?: string;
  /** Suggested questions to complete missing fields */
  suggestedQuestions: string[];
}
