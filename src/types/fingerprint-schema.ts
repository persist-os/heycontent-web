/**
 * Fingerprint Schema Definition
 * 
 * Centralized schema for project fingerprint fields used across the application.
 * This schema defines the structure, types, validation rules, and metadata for
 * all fingerprint fields used in Living Projects.
 * 
 * Fields match the backend Python model in backend/app/models/fingerprint_models.py
 * and follow camelCase naming convention for Convex compatibility.
 */

export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'id';

export interface FieldValidation {
  max?: number;
  min?: number;
  pattern?: string;
  enum?: string[];
  required?: boolean;
}

export interface FingerprintField {
  name: string;
  type: FieldType;
  description: string;
  required?: boolean;
  default?: any;
  validation?: FieldValidation;
  translationKey?: string;
}

/**
 * All fingerprint fields based on the backend FingerprintUpdate model
 * Fields are in camelCase to match Convex schema conventions
 */
export const ALL_FINGERPRINT_FIELDS: FingerprintField[] = [
  {
    name: 'goals',
    type: 'string',
    description: 'What they want to achieve or create',
    required: false,
    translationKey: 'fingerprint.field.goals.description'
  },
  {
    name: 'constraints',
    type: 'string',
    description: 'Limitations (time, money, skills, resources)',
    required: false,
    translationKey: 'fingerprint.field.constraints.description'
  },
  {
    name: 'timeline',
    type: 'string',
    description: 'When things need to happen (deadlines, milestones)',
    required: false,
    translationKey: 'fingerprint.field.timeline.description'
  },
  {
    name: 'people',
    type: 'string',
    description: "Who's involved or who this is for",
    required: false,
    translationKey: 'fingerprint.field.people.description'
  },
  {
    name: 'requirements',
    type: 'string',
    description: 'Must-haves, preferences, technical needs',
    required: false,
    translationKey: 'fingerprint.field.requirements.description'
  },
  {
    name: 'context',
    type: 'string',
    description: 'Why this matters, background, inspiration',
    required: false,
    translationKey: 'fingerprint.field.context.description'
  },
  {
    name: 'artifactsNeeded',
    type: 'string',
    description: 'What artifacts/documents to generate (reports, plans, trackers, lists, etc.)',
    required: false,
    translationKey: 'fingerprint.field.artifactsNeeded.description'
  },
  {
    name: 'helpWanted',
    type: 'string',
    description: 'How AI should help (brainstorm, organize, track, research, write, etc.)',
    required: false,
    translationKey: 'fingerprint.field.helpWanted.description'
  },
  {
    name: 'workingStyle',
    type: 'string',
    description: "User's preferred way of working (async updates, check-ins, autonomous, collaborative)",
    required: false,
    translationKey: 'fingerprint.field.workingStyle.description'
  }
];

/**
 * Evolution history fields (if needed for future use)
 */
export interface EvolutionHistoryField {
  name: string;
  type: FieldType;
  required: boolean;
  description: string;
}

export const FINGERPRINT_EVOLUTION_HISTORY_FIELDS: EvolutionHistoryField[] = [
  {
    name: 'confidence_score',
    type: 'number',
    required: false,
    description: 'Confidence score for the evolution (0-1)'
  },
  {
    name: 'evolution_trigger',
    type: 'string',
    required: false,
    description: 'What triggered this evolution'
  }
];

/**
 * Get a field by its name
 */
export function getFieldByName(name: string): FingerprintField | undefined {
  return ALL_FINGERPRINT_FIELDS.find(field => field.name === name);
}

/**
 * Get all required fields
 */
export function getRequiredFields(): FingerprintField[] {
  return ALL_FINGERPRINT_FIELDS.filter(field => field.required === true);
}

/**
 * Get all optional fields
 */
export function getOptionalFields(): FingerprintField[] {
  return ALL_FINGERPRINT_FIELDS.filter(field => field.required !== true);
}

/**
 * Validate a field value based on its type and validation rules
 */
export function validateFieldValue(fieldName: string, value: any): boolean {
  const field = getFieldByName(fieldName);
  if (!field) {
    return false;
  }

  // Type checking
  switch (field.type) {
    case 'string':
      if (typeof value !== 'string') return false;
      if (field.validation?.max && value.length > field.validation.max) return false;
      if (field.validation?.min && value.length < field.validation.min) return false;
      if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) return false;
      if (field.validation?.enum && !field.validation.enum.includes(value)) return false;
      return true;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) return false;
      if (field.validation?.max !== undefined && value > field.validation.max) return false;
      if (field.validation?.min !== undefined && value < field.validation.min) return false;
      return true;

    case 'boolean':
      return typeof value === 'boolean';

    case 'array':
      if (!Array.isArray(value)) return false;
      if (field.validation?.max && value.length > field.validation.max) return false;
      if (field.validation?.min && value.length < field.validation.min) return false;
      return true;

    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);

    case 'id':
      return typeof value === 'string' && value.length > 0;

    default:
      return false;
  }
}

