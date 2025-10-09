/**
 * Briefing Room - Briefer Agent Types
 * 
 * Defines the core types for autonomous briefer agents.
 * Briefers are living entities with identity, state, and behavior.
 */

import { Id } from "@/convex/_generated/dataModel";

// ============================================================================
// Core Briefer Types
// ============================================================================

/**
 * Briefer Category - Represents different agent civilizations
 */
export type BrieferCategory = 
  | "crystal"         // Crystal Consciousness ambassadors
  | "widget"          // Widget Collective delegates
  | "dream"           // Dream Synthesizer reporters
  | "collaboration"   // Collaboration agents
  | "system";         // System intelligence alerts

/**
 * Briefer State - Autonomous lifecycle stages
 */
export type BrieferState = 
  | "forming"         // Being created, not yet ready
  | "waiting"         // Ready but not demanding attention
  | "requesting"      // Wants attention (subtle indication)
  | "presenting"      // Actively briefing user
  | "acknowledged"    // User has seen, waiting for action
  | "dormant"         // Dismissed but still in room
  | "archived";       // Left the room

/**
 * Priority Level - Urgency indication
 */
export type PriorityLevel = 
  | "critical"
  | "high"
  | "medium"
  | "low";

/**
 * State Transition - History of state changes
 */
export interface StateTransition {
  from: BrieferState;
  to: BrieferState;
  timestamp: number;
  trigger: string; // What caused the transition
}

/**
 * Spatial Position - 3D position in briefing room space
 */
export interface SpatialPosition {
  x: number;  // Horizontal position
  y: number;  // Vertical position
  z: number;  // Depth (distance from user)
}

/**
 * Briefer Personality - Typography and visual identity
 */
export interface BrieferPersonality {
  category: BrieferCategory;
  typographyStyle: {
    headerClass: string;      // Tailwind classes for main text
    subheaderClass: string;   // Tailwind classes for secondary text
    bodyClass: string;        // Tailwind classes for body text
  };
  colorTheme: {
    primary: string;          // Main color (e.g., "blue-600")
    secondary: string;        // Secondary color
    accent: string;           // Accent color for highlights
  };
  animationStyle: {
    breathingDuration: number;  // Breathing animation duration (ms)
    breathingScale: number;     // Scale factor for breathing (1.02 = 2%)
    entranceDelay: number;      // Delay before entrance (ms)
  };
}

/**
 * Briefing Content - The actual intelligence being delivered
 */
export interface BriefingContent {
  title: string;
  subtitle?: string;
  summary: string;
  details?: Record<string, any>;  // Category-specific data
  actions?: BriefingAction[];     // Suggested user actions
  relatedBriefings?: string[];    // IDs of related briefings
}

/**
 * Briefing Action - User action suggestion
 */
export interface BriefingAction {
  id: string;
  label: string;
  type: "primary" | "secondary" | "tertiary";
  handler?: string; // Action handler identifier
}

/**
 * Agent Message - Inter-briefer communication
 */
export interface AgentMessage {
  type: "cluster_invitation" | "attention_defer" | "related_content" | "coordination";
  payload: Record<string, any>;
  timestamp: number;
}

/**
 * Feedback Entry - User interaction history
 */
export interface FeedbackEntry {
  type: "viewed" | "action_taken" | "dismissed" | "rated";
  timestamp: number;
  value?: any;
}

// ============================================================================
// Main Briefer Agent Interface
// ============================================================================

/**
 * BrieferAgent - The complete living entity specification
 * 
 * This is not just a data model - it's a living entity with:
 * - Identity and personality
 * - State machine lifecycle
 * - Temporal awareness
 * - Spatial presence
 * - Relationships with other briefers
 * - Communication capabilities
 * - Learning from feedback
 */
export interface BrieferAgent {
  // ===== Identity =====
  id: string;
  eventId: Id<"briefing_events">;  // Link to Convex event
  category: BrieferCategory;
  personality: BrieferPersonality;
  
  // ===== State Machine =====
  state: BrieferState;
  stateHistory: StateTransition[];
  
  // ===== Temporal Awareness =====
  born: number;              // When briefer was created
  lastPresented?: number;    // Last time it presented
  timeWaiting: number;       // How long it's been waiting (ms)
  urgencyLevel: number;      // 0-1, escalates over time
  
  // ===== Spatial Semantics =====
  position: SpatialPosition;
  targetPosition: SpatialPosition;
  spatialPriority: number;   // Influences positioning
  
  // ===== Relationships =====
  relatedBriefers: string[]; // IDs of related briefers
  clusterId?: string;        // If part of a cluster
  
  // ===== Communication =====
  messages: AgentMessage[];  // Received messages
  
  // ===== Intelligence =====
  content: BriefingContent;
  priority: PriorityLevel;
  
  // ===== Learning =====
  adaptationHistory: FeedbackEntry[];
}

// ============================================================================
// Cluster Types
// ============================================================================

/**
 * Briefer Cluster - Group of related briefers
 */
export interface BrieferCluster {
  id: string;
  brieferIds: string[];
  centerPosition: SpatialPosition;
  reason: string;  // Why they clustered
  formed: number;  // When cluster formed
}

// ============================================================================
// Type Guards
// ============================================================================

export function isBrieferState(value: string): value is BrieferState {
  return [
    "forming",
    "waiting",
    "requesting",
    "presenting",
    "acknowledged",
    "dormant",
    "archived"
  ].includes(value);
}

export function isBrieferCategory(value: string): value is BrieferCategory {
  return ["crystal", "widget", "dream", "collaboration", "system"].includes(value);
}

export function isPriorityLevel(value: string): value is PriorityLevel {
  return ["critical", "high", "medium", "low"].includes(value);
}

