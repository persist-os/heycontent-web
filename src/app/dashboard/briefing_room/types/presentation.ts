/**
 * Briefing Room - Presentation Types
 * 
 * Defines how briefers present themselves to users.
 * Presentation strategies determine visual appearance and interaction patterns.
 */

import { BrieferCategory, BrieferState, PriorityLevel } from "./briefer";

// ============================================================================
// Presentation Strategy
// ============================================================================

/**
 * Presentation Mode - How briefer presents itself
 */
export type PresentationMode = 
  | "minimal"       // Compact, unobtrusive
  | "standard"      // Normal presentation
  | "expanded"      // Full details visible
  | "urgent";       // Attention-demanding

/**
 * Animation Timing - Entrance and exit timing
 */
export interface AnimationTiming {
  entrance: {
    delay: number;        // ms delay before entrance
    duration: number;     // ms for entrance animation
    easing: string;       // CSS easing function
  };
  exit: {
    duration: number;     // ms for exit animation
    easing: string;       // CSS easing function
  };
  transition: {
    duration: number;     // ms for state transitions
    easing: string;       // CSS easing function
  };
}

/**
 * Visual Effects - Dynamic visual properties
 */
export interface VisualEffects {
  breathing: {
    enabled: boolean;
    scale: number;        // Scale factor (1.02 = 2% larger)
    duration: number;     // ms per breath cycle
  };
  glow: {
    enabled: boolean;
    color: string;        // Glow color
    intensity: number;    // 0-1
  };
  blur: {
    enabled: boolean;
    amount: number;       // px
  };
}

/**
 * Interaction State - Current interaction mode
 */
export type InteractionState = 
  | "idle"          // Not being interacted with
  | "hovered"       // Mouse over
  | "focused"       // Has focus (gaze or click)
  | "active"        // Being actively engaged
  | "transitioning"; // In state transition

/**
 * Gesture - User interaction gesture
 */
export type Gesture = 
  | "gaze"          // Looking at briefer
  | "hover"         // Mouse hover
  | "click"         // Direct click
  | "swipe"         // Swipe gesture
  | "dismiss";      // Dismissal gesture

// ============================================================================
// Category-Specific Presentation
// ============================================================================

/**
 * Crystal Presentation - Ethereal, light, mysterious
 */
export interface CrystalPresentation {
  category: "crystal";
  style: {
    opacity: number;          // 0-1, crystals are semi-transparent
    gradientFrom: string;     // Gradient start color
    gradientTo: string;       // Gradient end color
    shimmer: boolean;         // Subtle shimmer effect
  };
}

/**
 * Widget Presentation - Efficient, warm, helpful
 */
export interface WidgetPresentation {
  category: "widget";
  style: {
    borderAccent: string;     // Accent color for border
    iconDisplay: boolean;     // Show widget icon
    progressBar: boolean;     // Show completion progress
  };
}

/**
 * Dream Presentation - Flowing, poetic, mysterious
 */
export interface DreamPresentation {
  category: "dream";
  style: {
    flowEffect: boolean;      // Flowing text effect
    mysteryLevel: number;     // 0-1, how mysterious to appear
    fadeEdges: boolean;       // Fade edges like a dream
  };
}

/**
 * Collaboration Presentation - Social, warm, inviting
 */
export interface CollaborationPresentation {
  category: "collaboration";
  style: {
    avatarDisplay: boolean;   // Show collaborator avatar
    connectionLines: boolean; // Show connection visualization
    warmth: number;           // 0-1, warmth level
  };
}

/**
 * System Presentation - Clean, technical, precise
 */
export interface SystemPresentation {
  category: "system";
  style: {
    monospace: boolean;       // Use monospace font
    gridOverlay: boolean;     // Show technical grid
    precision: number;        // 0-1, level of technical detail
  };
}

/**
 * Category Presentation - Union of all category styles
 */
export type CategoryPresentation = 
  | CrystalPresentation
  | WidgetPresentation
  | DreamPresentation
  | CollaborationPresentation
  | SystemPresentation;

// ============================================================================
// Presentation Configuration
// ============================================================================

/**
 * Presentation Config - Complete presentation setup
 */
export interface PresentationConfig {
  category: BrieferCategory;
  mode: PresentationMode;
  categoryStyle: CategoryPresentation;
  effects: VisualEffects;
  timing: AnimationTiming;
  interactionState: InteractionState;
}

/**
 * Presentation Context - Context for presentation decisions
 */
export interface PresentationContext {
  brieferState: BrieferState;
  priority: PriorityLevel;
  urgency: number;              // 0-1
  timeWaiting: number;          // ms
  userAttention: boolean;       // Has user attention
  clustered: boolean;           // Part of cluster
  roomCrowding: number;         // 0-1, how crowded is the room
}

// ============================================================================
// Presentation Strategy Interface
// ============================================================================

/**
 * Presentation Strategy - Determines how to present
 */
export interface PresentationStrategy {
  /**
   * Calculate presentation config based on context
   */
  calculatePresentation: (context: PresentationContext) => PresentationConfig;
  
  /**
   * Handle user gesture
   */
  handleGesture: (gesture: Gesture, context: PresentationContext) => PresentationConfig;
  
  /**
   * Adapt presentation based on urgency
   */
  escalateUrgency: (currentConfig: PresentationConfig, urgency: number) => PresentationConfig;
  
  /**
   * Transition between modes
   */
  transitionMode: (
    from: PresentationMode,
    to: PresentationMode,
    duration: number
  ) => PresentationConfig;
}

// ============================================================================
// Layout Presentation
// ============================================================================

/**
 * Layout Style - How briefers are laid out
 */
export type LayoutStyle = 
  | "organic"       // Natural, flowing layout
  | "geometric"     // Structured, grid-like
  | "radial"        // Circular, radiating from center
  | "layered";      // Depth layers

/**
 * Transform Properties - CSS transform values
 */
export interface TransformProperties {
  translateX: number;       // px
  translateY: number;       // px
  translateZ: number;       // px
  rotateX: number;          // degrees
  rotateY: number;          // degrees
  rotateZ: number;          // degrees
  scale: number;            // scale factor
}

/**
 * Layout Constraints - Boundaries and rules
 */
export interface LayoutConstraints {
  minDistance: number;      // Min distance between briefers (px)
  maxDistance: number;      // Max distance from center (px)
  depthLayers: number;      // Number of Z-depth layers
  clusterRadius: number;    // Max radius for clusters (px)
}

// ============================================================================
// Typography Presentation
// ============================================================================

/**
 * Typography Config - Font and text styling
 */
export interface TypographyConfig {
  fontFamily: string;
  fontSize: {
    title: string;          // e.g., "text-4xl"
    subtitle: string;       // e.g., "text-xl"
    body: string;           // e.g., "text-base"
  };
  fontWeight: {
    title: string;          // e.g., "font-light"
    subtitle: string;       // e.g., "font-normal"
    body: string;           // e.g., "font-normal"
  };
  letterSpacing: {
    title: string;          // e.g., "tracking-tight"
    subtitle: string;       // e.g., "tracking-normal"
    body: string;           // e.g., "tracking-normal"
  };
  lineHeight: {
    title: string;          // e.g., "leading-tight"
    subtitle: string;       // e.g., "leading-relaxed"
    body: string;           // e.g., "leading-relaxed"
  };
}

/**
 * Color Scheme - Color palette for presentation
 */
export interface ColorScheme {
  primary: string;          // Primary text color
  secondary: string;        // Secondary text color
  accent: string;           // Accent/highlight color
  background: string;       // Background color
  border: string;           // Border color (if any)
  gradient: {
    from: string;
    to: string;
    direction: string;      // e.g., "to-r", "to-br"
  };
}

// ============================================================================
// Export Helpers
// ============================================================================

/**
 * Default presentation configs for each category
 */
export const DEFAULT_PRESENTATIONS: Record<BrieferCategory, PresentationConfig> = {
  crystal: {
    category: "crystal",
    mode: "standard",
    categoryStyle: {
      category: "crystal",
      style: {
        opacity: 0.95,
        gradientFrom: "blue-400",
        gradientTo: "blue-600",
        shimmer: true,
      },
    },
    effects: {
      breathing: { enabled: true, scale: 1.02, duration: 4000 },
      glow: { enabled: true, color: "blue-400", intensity: 0.3 },
      blur: { enabled: false, amount: 0 },
    },
    timing: {
      entrance: { delay: 0, duration: 1200, easing: "ease-out" },
      exit: { duration: 800, easing: "ease-in" },
      transition: { duration: 500, easing: "ease-in-out" },
    },
    interactionState: "idle",
  },
  widget: {
    category: "widget",
    mode: "standard",
    categoryStyle: {
      category: "widget",
      style: {
        borderAccent: "amber-500",
        iconDisplay: true,
        progressBar: false,
      },
    },
    effects: {
      breathing: { enabled: true, scale: 1.015, duration: 3000 },
      glow: { enabled: false, color: "", intensity: 0 },
      blur: { enabled: false, amount: 0 },
    },
    timing: {
      entrance: { delay: 0, duration: 800, easing: "ease-out" },
      exit: { duration: 600, easing: "ease-in" },
      transition: { duration: 400, easing: "ease-in-out" },
    },
    interactionState: "idle",
  },
  dream: {
    category: "dream",
    mode: "standard",
    categoryStyle: {
      category: "dream",
      style: {
        flowEffect: true,
        mysteryLevel: 0.7,
        fadeEdges: true,
      },
    },
    effects: {
      breathing: { enabled: true, scale: 1.03, duration: 5000 },
      glow: { enabled: true, color: "purple-400", intensity: 0.4 },
      blur: { enabled: true, amount: 0.5 },
    },
    timing: {
      entrance: { delay: 200, duration: 1500, easing: "ease-out" },
      exit: { duration: 1000, easing: "ease-in" },
      transition: { duration: 600, easing: "ease-in-out" },
    },
    interactionState: "idle",
  },
  collaboration: {
    category: "collaboration",
    mode: "standard",
    categoryStyle: {
      category: "collaboration",
      style: {
        avatarDisplay: true,
        connectionLines: false,
        warmth: 0.8,
      },
    },
    effects: {
      breathing: { enabled: true, scale: 1.02, duration: 3500 },
      glow: { enabled: false, color: "", intensity: 0 },
      blur: { enabled: false, amount: 0 },
    },
    timing: {
      entrance: { delay: 0, duration: 900, easing: "ease-out" },
      exit: { duration: 700, easing: "ease-in" },
      transition: { duration: 450, easing: "ease-in-out" },
    },
    interactionState: "idle",
  },
  system: {
    category: "system",
    mode: "standard",
    categoryStyle: {
      category: "system",
      style: {
        monospace: false,
        gridOverlay: false,
        precision: 0.9,
      },
    },
    effects: {
      breathing: { enabled: false, scale: 1, duration: 0 },
      glow: { enabled: false, color: "", intensity: 0 },
      blur: { enabled: false, amount: 0 },
    },
    timing: {
      entrance: { delay: 0, duration: 600, easing: "ease-out" },
      exit: { duration: 500, easing: "ease-in" },
      transition: { duration: 350, easing: "ease-in-out" },
    },
    interactionState: "idle",
  },
};

