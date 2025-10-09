/**
 * Briefing Room - State Management Hook
 * 
 * Manages briefer state machine and automatic transitions.
 */

import { useState, useEffect, useCallback } from "react";
import { BrieferAgent, BrieferState, BrieferContext } from "../types";
import {
  checkAutomaticTransitions,
  isValidTransition,
  createTransition,
  getTimeInState,
} from "../utils/stateMachine";

// ============================================================================
// State Management Hook
// ============================================================================

/**
 * Hook for managing briefer state machine
 * Handles automatic transitions based on context
 */
export function useBrieferState(briefer: BrieferAgent, roomContext: {
  userAttention: boolean;
  roomCrowding: number;
}) {
  const [currentState, setCurrentState] = useState<BrieferState>(briefer.state);
  const [timeInCurrentState, setTimeInCurrentState] = useState(0);
  
  // Calculate briefer context for state machine
  const brieferContext: BrieferContext = {
    timeWaiting: briefer.timeWaiting,
    urgencyLevel: briefer.urgencyLevel,
    viewed: briefer.content ? false : true, // Simplified, would check actual view status
    userAttention: roomContext.userAttention,
    roomCrowding: roomContext.roomCrowding,
  };
  
  // Check for automatic state transitions
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const autoTransition = checkAutomaticTransitions(currentState, brieferContext);
      
      if (autoTransition) {
        console.log(`Auto-transitioning briefer ${briefer.id}: ${currentState} -> ${autoTransition.nextState} (${autoTransition.trigger})`);
        setCurrentState(autoTransition.nextState);
        
        // In a real implementation, would call mutation to update in DB
        // updateBrieferState(briefer.eventId, autoTransition.nextState, autoTransition.trigger);
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(checkInterval);
  }, [currentState, brieferContext, briefer.id]);
  
  // Update time in state
  useEffect(() => {
    const stateInterval = setInterval(() => {
      setTimeInCurrentState(prev => prev + 1000);
    }, 1000);
    
    return () => clearInterval(stateInterval);
  }, [currentState]);
  
  // Reset time when state changes
  useEffect(() => {
    setTimeInCurrentState(0);
  }, [currentState]);
  
  // Manual state transition
  const transitionTo = useCallback((newState: BrieferState, trigger: string) => {
    if (!isValidTransition(currentState, newState)) {
      console.warn(`Invalid transition: ${currentState} -> ${newState}`);
      return false;
    }
    
    setCurrentState(newState);
    
    // In real implementation, would call mutation
    // updateBrieferState(briefer.eventId, newState, trigger);
    
    return true;
  }, [currentState]);
  
  return {
    currentState,
    timeInCurrentState,
    transitionTo,
    isTransitioning: false, // Could track animation state
  };
}

// ============================================================================
// Urgency Escalation Hook
// ============================================================================

/**
 * Hook for managing urgency escalation over time
 * Urgency increases the longer a briefer waits
 */
export function useUrgencyEscalation(
  initialUrgency: number,
  timeWaiting: number,
  priority: "critical" | "high" | "medium" | "low"
) {
  const [urgency, setUrgency] = useState(initialUrgency);
  
  useEffect(() => {
    // Calculate escalation rate based on priority
    const escalationRates = {
      critical: 0.1,   // Escalates 10% per minute
      high: 0.05,      // 5% per minute
      medium: 0.02,    // 2% per minute
      low: 0.01,       // 1% per minute
    };
    
    const rate = escalationRates[priority];
    const minutes = timeWaiting / (60 * 1000);
    const escalation = rate * minutes;
    
    // Calculate new urgency (clamped to [0, 1])
    const newUrgency = Math.min(1, initialUrgency + escalation);
    
    setUrgency(newUrgency);
  }, [timeWaiting, priority, initialUrgency]);
  
  return urgency;
}

// ============================================================================
// Attention Tracking Hook
// ============================================================================

/**
 * Hook for tracking user attention on a briefer
 * Uses mouse position/scroll to determine "gaze"
 */
export function useAttentionTracking(brieferId: string, elementRef: React.RefObject<HTMLElement>) {
  const [hasAttention, setHasAttention] = useState(false);
  const [attentionDuration, setAttentionDuration] = useState(0);
  
  useEffect(() => {
    if (!elementRef.current) return;
    
    const element = elementRef.current;
    let attentionTimer: NodeJS.Timeout | null = null;
    
    // Check if element is in viewport and near mouse
    const checkAttention = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Check if mouse is near element (within 200px)
      const isNearX = mouseX >= rect.left - 200 && mouseX <= rect.right + 200;
      const isNearY = mouseY >= rect.top - 200 && mouseY <= rect.bottom + 200;
      const isNear = isNearX && isNearY;
      
      // Check if element is in viewport
      const isInViewport = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
      
      const attention = isNear && isInViewport;
      setHasAttention(attention);
      
      // Track attention duration
      if (attention) {
        if (!attentionTimer) {
          attentionTimer = setInterval(() => {
            setAttentionDuration(prev => prev + 100);
          }, 100);
        }
      } else {
        if (attentionTimer) {
          clearInterval(attentionTimer);
          attentionTimer = null;
        }
        setAttentionDuration(0);
      }
    };
    
    window.addEventListener("mousemove", checkAttention);
    
    return () => {
      window.removeEventListener("mousemove", checkAttention);
      if (attentionTimer) {
        clearInterval(attentionTimer);
      }
    };
  }, [elementRef]);
  
  return {
    hasAttention,
    attentionDuration,
    shouldAcknowledge: attentionDuration > 2000, // Auto-acknowledge after 2 seconds
  };
}

