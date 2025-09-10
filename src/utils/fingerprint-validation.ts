/**
 * FINGERPRINT VALIDATION UTILITIES
 *
 * Centralized validation logic using the fingerprint schema definition.
 * Ensures all fingerprint operations maintain data integrity and consistency.
 */

import {
  ALL_FINGERPRINT_FIELDS,
  FINGERPRINT_EVOLUTION_HISTORY_FIELDS,
  getRequiredFields,
  getOptionalFields,
  validateFieldValue,
  type FingerprintField,
  type EvolutionHistoryField
} from '@/types/fingerprint-schema';

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Core validation function
export function validateFingerprintData(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];
  const requiredFields = getRequiredFields();

  // Check required fields
  for (const field of requiredFields) {
    if (!data[field.name] && data[field.name] !== 0 && data[field.name] !== false) {
      errors.push({
        field: field.name,
        message: `${field.name} is required`,
        value: data[field.name]
      });
    }
  }

  // Check all provided fields
  for (const [fieldName, value] of Object.entries(data)) {
    const field = ALL_FINGERPRINT_FIELDS.find(f => f.name === fieldName);

    if (!field) {
      errors.push({
        field: fieldName,
        message: `Unknown field: ${fieldName}`,
        value
      });
      continue;
    }

    // Validate field value
    if (!validateFieldValue(fieldName, value)) {
      errors.push({
        field: fieldName,
        message: `Invalid value for ${fieldName}`,
        value
      });
    }

    // Additional validations
    if (field.validation) {
      if (field.type === 'string' && typeof value === 'string') {
        if (field.validation.max && value.length > field.validation.max) {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be ${field.validation.max} characters or less`,
            value
          });
        }
        if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
          errors.push({
            field: fieldName,
            message: `${fieldName} does not match required pattern`,
            value
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate evolution history data
export function validateEvolutionHistoryData(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];

  // Check required fields
  for (const field of FINGERPRINT_EVOLUTION_HISTORY_FIELDS) {
    if (field.required && (!data[field.name] && data[field.name] !== 0)) {
      errors.push({
        field: field.name,
        message: `${field.name} is required`,
        value: data[field.name]
      });
    }
  }

  // Validate specific field types
  if (data.confidence_score !== undefined) {
    if (typeof data.confidence_score !== 'number' || data.confidence_score < 0 || data.confidence_score > 1) {
      errors.push({
        field: 'confidence_score',
        message: 'confidence_score must be a number between 0 and 1',
        value: data.confidence_score
      });
    }
  }

  if (data.evolution_trigger && ![
    'morning_update', 'evening_update', 'data_change', 'user_edit', 'milestone_reached',
    'ai_suggestion', 'user_feedback', 'external_trigger', 'scheduled_update'
  ].includes(data.evolution_trigger)) {
    errors.push({
      field: 'evolution_trigger',
      message: 'evolution_trigger must be a valid trigger type',
      value: data.evolution_trigger
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate fingerprint updates (only checks provided fields)
export function validateFingerprintUpdate(updates: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];

  // Check all provided fields
  for (const [fieldName, value] of Object.entries(updates)) {
    const field = ALL_FINGERPRINT_FIELDS.find(f => f.name === fieldName);

    if (!field) {
      errors.push({
        field: fieldName,
        message: `Unknown field: ${fieldName}`,
        value
      });
      continue;
    }

    // Validate field value
    if (!validateFieldValue(fieldName, value)) {
      errors.push({
        field: fieldName,
        message: `Invalid value for ${fieldName}`,
        value
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitize fingerprint data (remove unknown fields, set defaults)
export function sanitizeFingerprintData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const field of ALL_FINGERPRINT_FIELDS) {
    const value = data[field.name];

    if (value !== undefined && value !== null) {
      sanitized[field.name] = value;
    } else if (field.default !== undefined) {
      sanitized[field.name] = field.default;
    }
  }

  return sanitized;
}

// Get default values for all fields
export function getDefaultFingerprintValues(): Record<string, any> {
  const defaults: Record<string, any> = {};

  for (const field of ALL_FINGERPRINT_FIELDS) {
    if (field.default !== undefined) {
      defaults[field.name] = field.default;
    }
  }

  return defaults;
}

// Validate fingerprint status transition
export function validateStatusTransition(currentStatus: string, newStatus: string): ValidationResult {
  const validStatuses = ['discovering', 'active', 'evolving', 'completing', 'archived'];
  const errors: ValidationError[] = [];

  if (!validStatuses.includes(currentStatus)) {
    errors.push({
      field: 'current_status',
      message: `Invalid current status: ${currentStatus}`,
      value: currentStatus
    });
  }

  if (!validStatuses.includes(newStatus)) {
    errors.push({
      field: 'new_status',
      message: `Invalid new status: ${newStatus}`,
      value: newStatus
    });
  }

  // Define valid transitions
  const validTransitions: Record<string, string[]> = {
    discovering: ['active', 'archived'],
    active: ['evolving', 'completing', 'archived'],
    evolving: ['active', 'completing', 'archived'],
    completing: ['active', 'archived'],
    archived: ['discovering'] // Allow unarchiving
  };

  if (currentStatus !== newStatus && !validTransitions[currentStatus]?.includes(newStatus)) {
    errors.push({
      field: 'status_transition',
      message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
      value: { current: currentStatus, new: newStatus }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Utility to format validation errors for display
export function formatValidationErrors(result: ValidationResult): string {
  if (result.isValid) return '';

  return result.errors
    .map(error => `${error.field}: ${error.message}`)
    .join('\n');
}

// Check if fingerprint has all required fields for "active" status
export function canActivateFingerprint(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];

  // Core requirements for activation
  const requiredForActive = [
    'domain',
    'complexity_level',
    'core_intention',
    'success_vision',
    'natural_rhythm'
  ];

  for (const fieldName of requiredForActive) {
    if (!data[fieldName] || data[fieldName] === '') {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required to activate fingerprint`,
        value: data[fieldName]
      });
    }
  }

  // Check if key phases are defined
  if (!data.key_phases || data.key_phases.length === 0) {
    errors.push({
      field: 'key_phases',
      message: 'At least one key phase is required to activate fingerprint',
      value: data.key_phases
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
