/**
 * Progress Calculation Utilities
 * 
 * Utility functions for calculating progress metrics, confidence scores,
 * and field completion analysis in the project discovery system.
 * Centralizes all progress-related calculations for consistency.
 * 
 * Used by: State hooks, services, progress display components
 */

import { FieldCompletion, ProgressMetrics, MissingFields } from '../types/progressTypes';

/**
 * Calculate completion percentage based on completed and total fields
 * @param completed - Number of completed fields
 * @param total - Total number of fields
 * @returns Completion percentage as a decimal (0.0-1.0)
 */
export function calculateCompletionPercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.max(completed / total, 0), 1);
}

/**
 * Identify missing fields by comparing completed fields against all required fields
 * @param completedFields - Array of completed field names
 * @param allFields - Array of all required field names
 * @returns Array of missing field names
 */
export function identifyMissingFields(completedFields: string[], allFields: string[]): string[] {
  return allFields.filter(field => !completedFields.includes(field));
}

/**
 * Calculate confidence score based on field completion data
 * @param fieldData - Field completion data containing confidence scores
 * @returns Overall confidence score (0.0-1.0)
 */
export function calculateConfidence(fieldData: FieldCompletion[]): number {
  if (fieldData.length === 0) return 0;
  
  const totalConfidence = fieldData.reduce((sum, field) => sum + field.confidence, 0);
  return Math.min(Math.max(totalConfidence / fieldData.length, 0), 1);
}

/**
 * Determine the next priority field to focus on from missing fields
 * @param missingFields - Array of missing field names
 * @returns Next priority field name or null if no fields are missing
 */
export function getNextPriorityField(missingFields: string[]): string | null {
  if (missingFields.length === 0) return null;
  
  // Priority order based on importance for project discovery
  const priorityOrder = [
    'domain', 'core_intention', 'success_vision', 'complexity_level',
    'natural_rhythm', 'key_phases', 'stakeholders', 'constraints'
  ];
  
  // Find the first missing field in priority order
  for (const priority of priorityOrder) {
    if (missingFields.includes(priority)) {
      return priority;
    }
  }
  
  // If no priority field is missing, return the first missing field
  return missingFields[0];
}
