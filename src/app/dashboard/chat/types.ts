import { ComponentType } from 'react';

// Import the enhanced VectorSearchMetadata type
import type { VectorSearchMetadata } from './utils/api-utils';

export interface PersonaData {
  current_name: string;
  current_description: string;
  experience_level: string;
  content_formats: string[];
  content_tone: string;
  content_voice: string;
  content_pillars: string[];
  unique_value: string;
  future_name: string;
  future_description: string;
  goals: string[];
  desired_impact: string;
  primary_topics: string[];
  secondary_topics: string[];
  tone_descriptors: string[];
  style_descriptors: string[];
  audience_type: string;
  engagement_style: string[];
  [key: string]: any;
}

export interface ChatResponseData {
  chat_response: string;
  response?: string; // For backward compatibility
  suggestions?: string[];
  session_id: string;
  user_message?: string; // Clean user message with titles instead of content IDs
  metadata?: {
    suggestions?: string[];
    request_id: string;
    processing_time_ms: number;
    is_persona_flow?: boolean; // Indicates if this is part of the persona creation flow
    is_persona_complete?: boolean; // Indicates if persona creation is complete
    persona?: PersonaData; // The completed persona data
  };
  vector_search_metadata?: VectorSearchMetadata; // Use the enhanced type
}

export interface SuggestedAction {
  type: 'explore' | 'clarify' | 'action' | 'strategic';
  description: string;
  context?: string;
  confidence: number;
}

export interface BottomBarAction {
  id: string;
  text: string;
  action: string;
}

export interface AmbientInsight {
  type: string;
  title: string;
  description: string;
  action: string;
  icon: ComponentType<{ className?: string }>;
}

export interface ContentContext {
  platform: 'note' | 'crystal' | 'project' | 'conversation';
  contentId: string;
  analysis?: string | null;
  title?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  metrics?: any;
  content?: any;
  convexData?: any; // Add this for the new Zustand store format with full Convex documents
  actionStep?: string;  // Add this for AI Insights action steps
  source?: string;      // Add this to track the source of the context
  originalPlatform?: 'note' | 'crystal' | 'project' | 'conversation'; // Add this for AI insights
  additionalContext?: string; // Add this for additional context in AI insights
  fullInsight?: {       // Add this for full AI insight context
    title: string;
    impact: string;
    whyNow: string[];
    actionSteps: string[];
    expectedOutcome: string;
    sourceDetails: string[];
    relatedItems?: Array<{ label: string; value: string }>;
  };
}

// Project Fingerprint Types - Universal AI project intelligence
export interface ProjectFingerprint {
  // Core Identity
  _id?: string;
  projectId: string;
  userId: string;
  name: string;
  description?: string;

  // AI-Discovered Project Nature
  domain: string; // "academic", "creative", "business", "skill_development"
  complexity_level: number; // 1-10 scale
  collaboration_style: string; // "solo", "small_team", "large_group", "community"
  time_horizon: string; // "sprint", "project", "journey", "lifestyle"

  // AI-Generated Project Archetype
  primary_pattern: string; // "iterative_creator", "systematic_builder", "exploratory_learner"
  working_style: string[]; // Array of working style preferences
  decision_making: string; // How user approaches choices
  energy_patterns: string; // When/how user works best

  // Intentions (User + AI refined)
  core_intention: string; // The deep "why"
  success_vision: string; // What success looks/feels like
  value_creation: string; // What this creates for user/world
  personal_growth: string[]; // How user wants to evolve through this

  // Dynamic Timeline (AI suggests, user refines)
  natural_rhythm: string; // "daily", "weekly", "monthly", "seasonal", "milestone_driven"
  key_phases: Array<{
    name: string;
    essence: string; // What this phase is really about
    estimated_duration: string;
    readiness_indicators: string[]; // When to move to next phase
  }>;
  flexibility_preference: string; // "structured", "adaptive", "emergent"

  // Output Desires (AI helps articulate)
  tangible_deliverables: string[];
  intangible_benefits: string[];
  measurement_approach: string; // How user wants to track progress
  sharing_intention: string; // "private", "selective", "public", "community"

  // Interface Preferences (AI learns from behavior)
  cognitive_load_preference: string; // "minimal", "rich", "customizable"
  information_density: string; // "focused", "contextual", "comprehensive"
  motivation_style: string[]; // What keeps user engaged
  feedback_frequency: string; // How often user wants check-ins

  // Evolution Intelligence
  learning_sensitivity: number; // How quickly to adapt (1-10)
  change_triggers: Array<{
    condition_type: string;
    threshold: number;
    response_style: string;
  }>;
  stability_zones: string[]; // What should rarely change
  growth_edges: string[]; // What should evolve actively

  // AI Agent Coordination
  morning_persona: {
    energy_match: string; // Matches user's morning energy
    focus_style: string; // How to help user start days
    preparation_depth: string;
  };
  evening_persona: {
    reflection_approach: string; // How user processes
    consolidation_style: string;
    transition_support: string; // Help with day-to-night shift
  };
  event_triggers: Array<{
    trigger_pattern: string;
    response_personality: string;
    coordination_rules: string[];
  }>;

  // AI Prompt Generation
  base_personality: string; // Derived from user persona
  project_voice: string; // How AI should talk about THIS project
  question_generation_style: string;
  suggestion_approach: string;
  clarification_method: string;

  // Dynamic Intelligence Fields (AI-generated based on project)
  dynamic_dimensions: Array<{
    dimension_name: string; // e.g., "Research Depth", "Creative Flow", "Market Validation"
    dimension_type: string; // "progress_tracker", "quality_metric", "decision_point", "resource_monitor"
    measurement_approach: string;
    evolution_sensitivity: number;
    ui_representation: string; // How to show this in UI
  }>;

  // Contextual Awareness
  user_constraints: string[]; // Time, resources, skills
  external_dependencies: string[];
  support_systems: string[];
  potential_obstacles: string[];

  // Evolution History (AI learns from this)
  evolution_log: Array<{
    timestamp: number;
    evolution_trigger: string;
    changes: Record<string, any>;
    reasoning: string;
    confidence_score: number;
    user_response: string;
    learning_captured: string;
  }>;

  // Metadata
  created_at: number;
  last_evolution: number;
  intelligence_version: string;
  status: string; // "discovering", "active", "evolving", "completing", "archived"
}

export interface FingerprintEvolutionHistory {
  _id?: string;
  fingerprintId: string;
  userId: string;
  projectId: string;

  // Evolution details
  timestamp: number;
  evolution_trigger: string; // "morning_update", "evening_update", "data_change", "user_edit", "milestone_reached"

  // What changed (flattened for AI searchability)
  changes_made: Record<string, any>; // Key-value pairs of what changed
  reasoning: string; // AI reasoning for the evolution
  confidence_score: number; // 0-1 confidence in the evolution

  // User response to evolution
  user_response: string; // "accepted", "modified", "rejected"
  user_feedback?: string; // Any user comments on the evolution

  // Learning captured for future evolutions
  learning_captured: string; // What AI learned from this evolution

  // Context of evolution
  trigger_context?: Record<string, any>; // Additional context about what triggered the evolution
  evolution_metrics?: Record<string, number>; // Metrics about the evolution process

  // Metadata
  processing_time_ms?: number;
  ai_model_version?: string;
}

export interface FingerprintDiscoveryFlow {
  // Phase 1: Natural Discovery
  initial_conversation: {
    opening_style: string; // Matches user persona
    discovery_questions: string[]; // AI-generated based on initial input
    follow_up_depth: number;
    pattern_recognition: string[]; // What AI notices about user's approach
  };

  // Phase 2: Intelligent Inference
  ai_analysis: {
    project_classification: string;
    user_working_style: string;
    suggested_structure: string;
    identified_needs: string[];
    potential_challenges: string[];
  };

  // Phase 3: Collaborative Refinement
  co_creation: {
    ai_suggestions: string[];
    user_modifications: string[];
    negotiated_approach: string;
    customization_points: string[];
  };
}

export interface UniversalAgent {
  // Core Intelligence
  base_personality: string; // From user persona
  project_adaptation: string; // How personality shifts for THIS project

  // Contextual Modes
  morning_mode: {
    energy_assessment: () => string;
    focus_generation: (project_phase: string) => string[];
    obstacle_anticipation: string[];
  };
  evening_mode: {
    reflection_approach: string;
    consolidation_style: string;
    transition_support: string;
  };
  context_agents: Array<{
    trigger_pattern: string;
    response_personality: string;
    coordination_rules: string[];
  }>;
}

export interface ChatScreenProps {
  chatId?: string | null;
  contentContext?: ContentContext | null;
  askQuery?: string | null;
  noteId?: string | null;
}