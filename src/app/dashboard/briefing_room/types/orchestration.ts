/**
 * Briefing Room - Orchestration Types
 * 
 * Defines types for room-level coordination and emergent behavior.
 * The room is an orchestrator, not a controller - it provides stage and resources.
 */

import { BrieferAgent, BrieferCluster, SpatialPosition } from "./briefer";

// ============================================================================
// Room Configuration
// ============================================================================

/**
 * Room Configuration - Stage setup
 */
export interface RoomConfiguration {
  dimensions: {
    width: number;    // Stage width (px)
    height: number;   // Stage height (px)
    depth: number;    // Z-depth range
  };
  limits: {
    maxActiveBriefers: number;        // Max briefers on stage
    maxRequestingAttention: number;   // Max briefers requesting attention at once
    maxClusters: number;              // Max number of clusters
  };
  physics: {
    collisionDetection: boolean;
    springStiffness: number;    // For clustering physics
    springDamping: number;      // For smooth movements
  };
}

/**
 * Attention Economy - Managing who gets user attention
 */
export interface AttentionEconomy {
  budget: number;                     // Total attention budget
  allocated: Map<string, number>;     // Per-briefer allocation
  requestQueue: string[];             // Briefers waiting for attention
}

/**
 * Coordination Event - Room-level events
 */
export interface CoordinationEvent {
  type: "cluster_formed" | "attention_shift" | "urgency_escalation" | "briefer_completed";
  timestamp: number;
  affectedBriefers: string[];
  metadata: Record<string, any>;
}

// ============================================================================
// Spatial Management
// ============================================================================

/**
 * Spatial Zone - Areas of the briefing room
 */
export type SpatialZone = 
  | "center-stage"      // Primary attention area
  | "waiting-left"      // Waiting area (left side)
  | "waiting-right"     // Waiting area (right side)
  | "background"        // Background/dormant area
  | "urgent-front";     // Urgent items (closest to user)

/**
 * Spatial Layout - Current positioning strategy
 */
export interface SpatialLayout {
  zones: Map<SpatialZone, SpatialPosition>;
  assignments: Map<string, SpatialZone>;  // briefer ID -> zone
  occupancy: Map<SpatialZone, string[]>;  // zone -> briefer IDs
}

/**
 * Collision Info - For physics-based positioning
 */
export interface CollisionInfo {
  brieferId: string;
  position: SpatialPosition;
  radius: number;  // Collision radius
}

// ============================================================================
// Orchestration State
// ============================================================================

/**
 * Room State - Current state of the briefing room
 */
export interface RoomState {
  briefers: Map<string, BrieferAgent>;
  clusters: Map<string, BrieferCluster>;
  layout: SpatialLayout;
  attentionEconomy: AttentionEconomy;
  history: CoordinationEvent[];
  userContext: UserContext;
}

/**
 * User Context - What the user is focusing on
 */
export interface UserContext {
  gazePosition?: { x: number; y: number };  // Where user is looking
  activeBrieferId?: string;                 // Currently viewing briefer
  lastInteraction: number;                  // Last interaction timestamp
  preferences: UserPreferences;
}

/**
 * User Preferences - How user wants briefings
 */
export interface UserPreferences {
  enabledCategories: {
    crystal: boolean;
    widget: boolean;
    collaboration: boolean;
    dream: boolean;
    system: boolean;
  };
  minimumPriority: "critical" | "high" | "medium" | "low";
  maxBriefersVisible: number;
  animationsEnabled: boolean;
  soundEnabled: boolean;
}

// ============================================================================
// Orchestration Actions
// ============================================================================

/**
 * Orchestration Action - Actions the room can take
 */
export type OrchestrationAction =
  | { type: "position_briefer"; brieferId: string; position: SpatialPosition }
  | { type: "form_cluster"; brieferIds: string[]; reason: string }
  | { type: "dissolve_cluster"; clusterId: string }
  | { type: "allocate_attention"; brieferId: string; amount: number }
  | { type: "escalate_urgency"; brieferId: string }
  | { type: "archive_briefer"; brieferId: string };

/**
 * Orchestration Result - Result of an action
 */
export interface OrchestrationResult {
  success: boolean;
  action: OrchestrationAction;
  effects: CoordinationEvent[];
  newState?: Partial<RoomState>;
}

// ============================================================================
// Emergent Behavior
// ============================================================================

/**
 * Pattern Detection - Emerging patterns in the room
 */
export interface EmergentPattern {
  type: "clustering_tendency" | "attention_flow" | "urgency_wave" | "category_dominance";
  confidence: number;
  description: string;
  affectedBriefers: string[];
  detectedAt: number;
}

/**
 * Adaptation Strategy - How room adapts to patterns
 */
export interface AdaptationStrategy {
  pattern: EmergentPattern;
  adjustments: OrchestrationAction[];
  rationale: string;
}

// ============================================================================
// Performance Metrics
// ============================================================================

/**
 * Room Metrics - Performance and health metrics
 */
export interface RoomMetrics {
  totalBriefers: number;
  activeBriefers: number;
  averageWaitTime: number;
  attentionEfficiency: number;  // How well attention is allocated
  clusteringRate: number;       // Frequency of cluster formation
  urgencyEscalations: number;   // Count of urgency escalations
  userEngagement: {
    viewedRate: number;         // % of briefers viewed
    actionRate: number;         // % of briefers acted upon
    dismissalRate: number;      // % of briefers dismissed
  };
}

// ============================================================================
// Orchestrator Interface
// ============================================================================

/**
 * Orchestrator - Main room coordination interface
 * (This is used by the orchestration logic, not by components directly)
 */
export interface Orchestrator {
  state: RoomState;
  config: RoomConfiguration;
  metrics: RoomMetrics;
  
  // Core coordination
  addBriefer: (briefer: BrieferAgent) => void;
  removeBriefer: (brieferId: string) => void;
  updateBrieferState: (brieferId: string, newState: Partial<BrieferAgent>) => void;
  
  // Spatial management
  assignZone: (brieferId: string, zone: SpatialZone) => void;
  calculatePosition: (brieferId: string) => SpatialPosition;
  detectCollisions: () => CollisionInfo[];
  
  // Attention management
  requestAttention: (brieferId: string) => boolean;
  releaseAttention: (brieferId: string) => void;
  
  // Clustering
  suggestCluster: (brieferIds: string[]) => BrieferCluster | null;
  formCluster: (brieferIds: string[], reason: string) => string;
  dissolveCluster: (clusterId: string) => void;
  
  // Emergent behavior
  detectPatterns: () => EmergentPattern[];
  adaptToPatterns: (patterns: EmergentPattern[]) => AdaptationStrategy[];
  
  // Metrics
  updateMetrics: () => void;
  getMetrics: () => RoomMetrics;
}

