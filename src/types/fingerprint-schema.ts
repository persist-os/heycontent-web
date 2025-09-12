/**
 * CENTRALIZED FINGERPRINT SCHEMA DEFINITION
 *
 * This file serves as the single source of truth for all Project Fingerprint fields.
 * Both frontend and backend must use this schema to ensure perfect alignment.
 *
 * All fingerprint operations (create, update, queries) should reference these field definitions.
 */

export interface FingerprintField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'id';
  required: boolean;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
  default?: any;
}

// Core Identity Fields
export const FINGERPRINT_CORE_IDENTITY_FIELDS: FingerprintField[] = [
  {
    name: 'projectId',
    type: 'id',
    required: true,
    description: 'Reference to the parent project'
  },
  {
    name: 'userId',
    type: 'string',
    required: true,
    description: 'Owner of this fingerprint'
  },
  {
    name: 'name',
    type: 'string',
    required: true,
    description: 'Display name for the fingerprint',
    validation: { max: 200 }
  },
  {
    name: 'description',
    type: 'string',
    required: false,
    description: 'Optional description',
    validation: { max: 1000 }
  }
];

// AI-Discovered Project Nature Fields
export const FINGERPRINT_AI_NATURE_FIELDS: FingerprintField[] = [
  {
    name: 'domain',
    type: 'string',
    required: true,
    description: 'Project domain classification',
    validation: {
      enum: ['academic', 'creative', 'business', 'skill_development', 'personal', 'professional']
    }
  },
  {
    name: 'complexity_level',
    type: 'number',
    required: true,
    description: 'Complexity level (1-10 scale)',
    validation: { min: 1, max: 10 },
    default: 1
  },
  {
    name: 'collaboration_style',
    type: 'string',
    required: true,
    description: 'How the project involves others',
    validation: {
      enum: ['solo', 'small_team', 'large_group', 'community', 'distributed']
    },
    default: 'solo'
  },
  {
    name: 'time_horizon',
    type: 'string',
    required: true,
    description: 'Expected timeframe for completion',
    validation: {
      enum: ['sprint', 'project', 'journey', 'lifestyle', 'ongoing']
    },
    default: 'project'
  },
  {
    name: 'primary_pattern',
    type: 'string',
    required: true,
    description: 'Primary working pattern identified',
    validation: {
      enum: ['iterative_creator', 'systematic_builder', 'exploratory_learner', 'collaborative_orchestrator']
    },
    default: 'iterative_creator'
  },
  {
    name: 'working_style',
    type: 'array',
    required: false,
    description: 'Array of working style preferences',
    default: []
  }
];

// AI-Generated Project Archetype Fields
export const FINGERPRINT_ARCHETYPE_FIELDS: FingerprintField[] = [
  {
    name: 'decision_making',
    type: 'string',
    required: false,
    description: 'How user approaches decisions',
    default: ''
  },
  {
    name: 'energy_patterns',
    type: 'string',
    required: false,
    description: 'When and how user works best',
    default: ''
  }
];

// Intentions Fields
export const FINGERPRINT_INTENTIONS_FIELDS: FingerprintField[] = [
  {
    name: 'core_intention',
    type: 'string',
    required: false,
    description: 'The deep "why" behind the project',
    default: ''
  },
  {
    name: 'success_vision',
    type: 'string',
    required: false,
    description: 'What success looks and feels like',
    default: ''
  },
  {
    name: 'value_creation',
    type: 'string',
    required: false,
    description: 'What this creates for user/world',
    default: ''
  },
  {
    name: 'personal_growth',
    type: 'array',
    required: false,
    description: 'How user wants to evolve through this project',
    default: []
  }
];

// Dynamic Timeline Fields
export const FINGERPRINT_TIMELINE_FIELDS: FingerprintField[] = [
  {
    name: 'natural_rhythm',
    type: 'string',
    required: false,
    description: 'Natural working rhythm',
    validation: {
      enum: ['daily', 'weekly', 'monthly', 'seasonal', 'milestone_driven']
    },
    default: 'daily'
  },
  {
    name: 'key_phases',
    type: 'array',
    required: false,
    description: 'Major project phases with details',
    default: []
  },
  {
    name: 'flexibility_preference',
    type: 'string',
    required: false,
    description: 'How structured vs flexible the approach is',
    validation: {
      enum: ['structured', 'adaptive', 'emergent']
    },
    default: 'adaptive'
  }
];

// Output Desires Fields
export const FINGERPRINT_OUTPUTS_FIELDS: FingerprintField[] = [
  {
    name: 'tangible_deliverables',
    type: 'array',
    required: false,
    description: 'Concrete outputs/deliverables',
    default: []
  },
  {
    name: 'intangible_benefits',
    type: 'array',
    required: false,
    description: 'Intangible benefits and outcomes',
    default: []
  },
  {
    name: 'measurement_approach',
    type: 'string',
    required: false,
    description: 'How progress will be measured',
    default: ''
  },
  {
    name: 'sharing_intention',
    type: 'string',
    required: false,
    description: 'Who the work will be shared with',
    validation: {
      enum: ['private', 'selective', 'public', 'community']
    },
    default: 'private'
  }
];

// Interface Preferences Fields
export const FINGERPRINT_INTERFACE_FIELDS: FingerprintField[] = [
  {
    name: 'cognitive_load_preference',
    type: 'string',
    required: false,
    description: 'How much information to show at once',
    validation: {
      enum: ['minimal', 'rich', 'customizable']
    },
    default: 'rich'
  },
  {
    name: 'information_density',
    type: 'string',
    required: false,
    description: 'How dense the information display should be',
    validation: {
      enum: ['focused', 'contextual', 'comprehensive']
    },
    default: 'contextual'
  },
  {
    name: 'motivation_style',
    type: 'array',
    required: false,
    description: 'What keeps the user motivated',
    default: []
  },
  {
    name: 'feedback_frequency',
    type: 'string',
    required: false,
    description: 'How often to provide feedback/check-ins',
    validation: {
      enum: ['daily', 'weekly', 'monthly', 'milestone', 'as_needed']
    },
    default: 'weekly'
  }
];

// Evolution Intelligence Fields
export const FINGERPRINT_EVOLUTION_FIELDS: FingerprintField[] = [
  {
    name: 'learning_sensitivity',
    type: 'number',
    required: false,
    description: 'How quickly to adapt (1-10)',
    validation: { min: 1, max: 10 },
    default: 5
  },
  {
    name: 'change_triggers',
    type: 'array',
    required: false,
    description: 'What triggers evolution suggestions',
    default: []
  },
  {
    name: 'stability_zones',
    type: 'array',
    required: false,
    description: 'What should rarely change',
    default: []
  },
  {
    name: 'growth_edges',
    type: 'array',
    required: false,
    description: 'What should evolve actively',
    default: []
  }
];

// AI Agent Coordination Fields
export const FINGERPRINT_AGENT_FIELDS: FingerprintField[] = [
  {
    name: 'morning_persona',
    type: 'object',
    required: false,
    description: 'Morning AI behavior configuration',
    default: {
      energy_match: '',
      focus_style: '',
      preparation_depth: ''
    }
  },
  {
    name: 'evening_persona',
    type: 'object',
    required: false,
    description: 'Evening AI behavior configuration',
    default: {
      reflection_approach: '',
      consolidation_style: '',
      transition_support: ''
    }
  },
  {
    name: 'event_triggers',
    type: 'array',
    required: false,
    description: 'Contextual triggers for AI responses',
    default: []
  }
];

// AI Prompt Generation Fields
export const FINGERPRINT_PROMPT_FIELDS: FingerprintField[] = [
  {
    name: 'base_personality',
    type: 'string',
    required: false,
    description: 'Base AI personality derived from user',
    default: ''
  },
  {
    name: 'project_voice',
    type: 'string',
    required: false,
    description: 'AI voice specific to this project',
    default: ''
  },
  {
    name: 'question_generation_style',
    type: 'string',
    required: false,
    description: 'How AI generates questions',
    default: ''
  },
  {
    name: 'suggestion_approach',
    type: 'string',
    required: false,
    description: 'How AI provides suggestions',
    default: ''
  },
  {
    name: 'clarification_method',
    type: 'string',
    required: false,
    description: 'How AI seeks clarification',
    default: ''
  }
];

// Dynamic Intelligence Fields
export const FINGERPRINT_DYNAMIC_FIELDS: FingerprintField[] = [
  {
    name: 'dynamic_dimensions',
    type: 'array',
    required: false,
    description: 'AI-generated custom dimensions',
    default: []
  }
];

// Contextual Awareness Fields
export const FINGERPRINT_CONTEXT_FIELDS: FingerprintField[] = [
  {
    name: 'user_constraints',
    type: 'array',
    required: false,
    description: 'User limitations and constraints',
    default: []
  },
  {
    name: 'external_dependencies',
    type: 'array',
    required: false,
    description: 'External factors that affect the project',
    default: []
  },
  {
    name: 'support_systems',
    type: 'array',
    required: false,
    description: 'Available support and resources',
    default: []
  },
  {
    name: 'potential_obstacles',
    type: 'array',
    required: false,
    description: 'Potential challenges and obstacles',
    default: []
  }
];

// Metadata Fields
export const FINGERPRINT_METADATA_FIELDS: FingerprintField[] = [
  {
    name: 'created_at',
    type: 'number',
    required: true,
    description: 'When fingerprint was created'
  },
  {
    name: 'last_evolution',
    type: 'number',
    required: true,
    description: 'Last time fingerprint was evolved'
  },
  {
    name: 'intelligence_version',
    type: 'string',
    required: true,
    description: 'Version of intelligence schema',
    default: '1.0'
  },
  {
    name: 'status',
    type: 'string',
    required: true,
    description: 'Current fingerprint status',
    validation: {
      enum: ['discovering', 'active', 'evolving', 'completing', 'archived']
    },
    default: 'discovering'
  }
];

// ALL FINGERPRINT FIELDS - Complete schema definition
export const ALL_FINGERPRINT_FIELDS: FingerprintField[] = [
  ...FINGERPRINT_CORE_IDENTITY_FIELDS,
  ...FINGERPRINT_AI_NATURE_FIELDS,
  ...FINGERPRINT_ARCHETYPE_FIELDS,
  ...FINGERPRINT_INTENTIONS_FIELDS,
  ...FINGERPRINT_TIMELINE_FIELDS,
  ...FINGERPRINT_OUTPUTS_FIELDS,
  ...FINGERPRINT_INTERFACE_FIELDS,
  ...FINGERPRINT_EVOLUTION_FIELDS,
  ...FINGERPRINT_AGENT_FIELDS,
  ...FINGERPRINT_PROMPT_FIELDS,
  ...FINGERPRINT_DYNAMIC_FIELDS,
  ...FINGERPRINT_CONTEXT_FIELDS,
  ...FINGERPRINT_METADATA_FIELDS
];

// Helper functions
export function getRequiredFields(): FingerprintField[] {
  return ALL_FINGERPRINT_FIELDS.filter(field => field.required);
}

export function getOptionalFields(): FingerprintField[] {
  return ALL_FINGERPRINT_FIELDS.filter(field => !field.required);
}

export function getFieldByName(name: string): FingerprintField | undefined {
  return ALL_FINGERPRINT_FIELDS.find(field => field.name === name);
}

export function validateFieldValue(fieldName: string, value: any): boolean {
  const field = getFieldByName(fieldName);
  if (!field) return false;

  if (field.required && (value === undefined || value === null || value === '')) {
    return false;
  }

  if (field.validation) {
    if (field.type === 'number' && typeof value === 'number') {
      if (field.validation.min !== undefined && value < field.validation.min) return false;
      if (field.validation.max !== undefined && value > field.validation.max) return false;
    }

    if (field.validation.enum && !field.validation.enum.includes(value)) {
      return false;
    }
  }

  return true;
}

// Evolution History Schema
export interface EvolutionHistoryField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'id';
  required: boolean;
  description: string;
}

export const FINGERPRINT_EVOLUTION_HISTORY_FIELDS: EvolutionHistoryField[] = [
  {
    name: 'fingerprintId',
    type: 'id',
    required: true,
    description: 'Reference to the fingerprint'
  },
  {
    name: 'userId',
    type: 'string',
    required: true,
    description: 'Owner of this evolution entry'
  },
  {
    name: 'projectId',
    type: 'id',
    required: true,
    description: 'Project this evolution belongs to'
  },
  {
    name: 'timestamp',
    type: 'number',
    required: true,
    description: 'When this evolution occurred'
  },
  {
    name: 'evolution_trigger',
    type: 'string',
    required: true,
    description: 'What triggered this evolution'
  },
  {
    name: 'changes_made',
    type: 'object',
    required: true,
    description: 'Key-value pairs of what changed'
  },
  {
    name: 'reasoning',
    type: 'string',
    required: true,
    description: 'AI reasoning for the evolution'
  },
  {
    name: 'confidence_score',
    type: 'number',
    required: true,
    description: 'Confidence in the evolution (0-1)'
  },
  {
    name: 'user_response',
    type: 'string',
    required: false,
    description: 'User response to the evolution'
  },
  {
    name: 'user_feedback',
    type: 'string',
    required: false,
    description: 'Any user comments on the evolution'
  },
  {
    name: 'learning_captured',
    type: 'string',
    required: true,
    description: 'What AI learned from this evolution'
  },
  {
    name: 'trigger_context',
    type: 'object',
    required: false,
    description: 'Additional context about what triggered the evolution'
  },
  {
    name: 'evolution_metrics',
    type: 'object',
    required: false,
    description: 'Metrics about the evolution process'
  },
  {
    name: 'processing_time_ms',
    type: 'number',
    required: false,
    description: 'How long the evolution took to process'
  },
  {
    name: 'ai_model_version',
    type: 'string',
    required: false,
    description: 'Which AI model version was used'
  }
];
