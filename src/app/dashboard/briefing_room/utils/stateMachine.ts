/**
 * Briefing Room - State Machine Logic
 * 
 * Manages briefer state transitions and lifecycle.
 */

import { BrieferState, StateTransition } from "../types";

// ============================================================================
// State Machine Configuration
// ============================================================================

/**
 * Valid state transitions
 * Defines which states can transition to which other states
 */
const VALID_TRANSITIONS: Record<BrieferState, BrieferState[]> = {
  forming: ["waiting", "archived"], // Can cancel before completion
  waiting: ["requesting", "presenting", "dormant", "archived"],
  requesting: ["presenting", "waiting", "dormant", "archived"],
  presenting: ["acknowledged", "waiting", "archived"],
  acknowledged: ["dormant", "archived"],
  dormant: ["waiting", "requesting", "archived"],
  archived: [], // Terminal state
};

/**
 * Automatic transition rules
 * Conditions that trigger automatic state transitions
 */
interface TransitionRule {
  from: BrieferState;
  to: BrieferState;
  condition: (context: BrieferContext) => boolean;
  trigger: string;
}

export interface BrieferContext {
  timeWaiting: number;
  urgencyLevel: number;
  viewed: boolean;
  userAttention: boolean;
  roomCrowding: number;
}

const AUTOMATIC_TRANSITIONS: TransitionRule[] = [
  // Escalate to requesting after waiting too long
  {
    from: "waiting",
    to: "requesting",
    condition: (ctx) => ctx.timeWaiting > 5 * 60 * 1000, // 5 minutes
    trigger: "timeout_escalation"
  },
  
  // High urgency immediately requests attention
  {
    from: "waiting",
    to: "requesting",
    condition: (ctx) => ctx.urgencyLevel > 0.8,
    trigger: "high_urgency"
  },
  
  // Move to presenting when user gives attention
  {
    from: "requesting",
    to: "presenting",
    condition: (ctx) => ctx.userAttention,
    trigger: "attention_granted"
  },
  
  // Auto-acknowledge if viewed
  {
    from: "presenting",
    to: "acknowledged",
    condition: (ctx) => ctx.viewed,
    trigger: "auto_acknowledged"
  },
  
  // Go dormant after being acknowledged for a while
  {
    from: "acknowledged",
    to: "dormant",
    condition: (ctx) => ctx.timeWaiting > 15 * 60 * 1000, // 15 minutes
    trigger: "timeout_dormant"
  },
  
  // Return to waiting from dormant if room clears
  {
    from: "dormant",
    to: "waiting",
    condition: (ctx) => ctx.roomCrowding < 0.5,
    trigger: "room_cleared"
  },
];

// ============================================================================
// State Machine Functions
// ============================================================================

/**
 * Check if a state transition is valid
 */
export function isValidTransition(
  from: BrieferState,
  to: BrieferState
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

/**
 * Get all valid next states from current state
 */
export function getValidNextStates(
  currentState: BrieferState
): BrieferState[] {
  return VALID_TRANSITIONS[currentState] || [];
}

/**
 * Check for automatic transitions based on context
 * Returns the next state and trigger if a transition should occur
 */
export function checkAutomaticTransitions(
  currentState: BrieferState,
  context: BrieferContext
): { nextState: BrieferState; trigger: string } | null {
  for (const rule of AUTOMATIC_TRANSITIONS) {
    if (rule.from === currentState && rule.condition(context)) {
      return {
        nextState: rule.to,
        trigger: rule.trigger
      };
    }
  }
  return null;
}

/**
 * Create a state transition record
 */
export function createTransition(
  from: BrieferState,
  to: BrieferState,
  trigger: string
): StateTransition {
  return {
    from,
    to,
    timestamp: Date.now(),
    trigger,
  };
}

/**
 * Calculate time in current state
 */
export function getTimeInState(
  stateHistory: StateTransition[]
): number {
  if (stateHistory.length === 0) return 0;
  
  const lastTransition = stateHistory[stateHistory.length - 1];
  return Date.now() - lastTransition.timestamp;
}

/**
 * Get previous state
 */
export function getPreviousState(
  stateHistory: StateTransition[]
): BrieferState | null {
  if (stateHistory.length < 2) return null;
  
  return stateHistory[stateHistory.length - 2].to;
}

/**
 * Count transitions to a specific state
 */
export function countTransitionsTo(
  stateHistory: StateTransition[],
  state: BrieferState
): number {
  return stateHistory.filter(t => t.to === state).length;
}

/**
 * Has ever been in state
 */
export function hasBeenInState(
  stateHistory: StateTransition[],
  state: BrieferState
): boolean {
  return stateHistory.some(t => t.to === state);
}

// ============================================================================
// State Descriptions
// ============================================================================

/**
 * Get human-readable description of state
 */
export function getStateDescription(state: BrieferState): string {
  const descriptions: Record<BrieferState, string> = {
    forming: "Being created, preparing to enter the room",
    waiting: "Ready and waiting for attention",
    requesting: "Actively requesting attention",
    presenting: "Currently presenting to user",
    acknowledged: "User has acknowledged, action pending",
    dormant: "Moved to background, can be recalled",
    archived: "Dismissed and removed from room",
  };
  
  return descriptions[state];
}

/**
 * Get state priority for attention allocation
 */
export function getStatePriority(state: BrieferState): number {
  const priorities: Record<BrieferState, number> = {
    forming: 0,
    waiting: 2,
    requesting: 5,
    presenting: 10,
    acknowledged: 3,
    dormant: 1,
    archived: 0,
  };
  
  return priorities[state];
}

/**
 * Should briefer be visible in the room
 */
export function shouldBeVisible(state: BrieferState): boolean {
  return state !== "forming" && state !== "archived";
}

/**
 * Can briefer request attention in this state
 */
export function canRequestAttention(state: BrieferState): boolean {
  return state === "waiting" || state === "dormant";
}

/**
 * Is briefer actively engaging user
 */
export function isActivelyEngaging(state: BrieferState): boolean {
  return state === "requesting" || state === "presenting";
}

// ============================================================================
// State Analytics
// ============================================================================

/**
 * Calculate state distribution from history
 */
export function calculateStateDistribution(
  stateHistory: StateTransition[]
): Record<BrieferState, number> {
  const distribution: Record<BrieferState, number> = {
    forming: 0,
    waiting: 0,
    requesting: 0,
    presenting: 0,
    acknowledged: 0,
    dormant: 0,
    archived: 0,
  };
  
  // Calculate time spent in each state
  for (let i = 0; i < stateHistory.length; i++) {
    const transition = stateHistory[i];
    const nextTransition = stateHistory[i + 1];
    
    const timeInState = nextTransition
      ? nextTransition.timestamp - transition.timestamp
      : Date.now() - transition.timestamp;
    
    distribution[transition.to] += timeInState;
  }
  
  return distribution;
}

/**
 * Get average time to acknowledgment
 */
export function getAverageTimeToAcknowledgment(
  stateHistory: StateTransition[]
): number | null {
  const ackTransition = stateHistory.find(t => t.to === "acknowledged");
  if (!ackTransition) return null;
  
  const firstTransition = stateHistory[0];
  return ackTransition.timestamp - firstTransition.timestamp;
}

