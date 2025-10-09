/**
 * Briefing Room - Spatial Semantics
 * 
 * Calculates meaningful spatial positions for briefers.
 * Position = Meaning (not arbitrary placement)
 */

import {
  SpatialPosition,
  BrieferCategory,
  BrieferState,
  PriorityLevel,
} from "../types";

// ============================================================================
// Stage Configuration
// ============================================================================

export interface StageConfig {
  width: number;
  height: number;
  depth: number;
  centerX: number;
  centerY: number;
}

export const DEFAULT_STAGE: StageConfig = {
  width: 1200,
  height: 800,
  depth: 500,
  centerX: 0,
  centerY: 0,
};

// ============================================================================
// Zone Definitions
// ============================================================================

/**
 * Spatial zones with semantic meaning
 */
export interface Zone {
  name: string;
  centerX: number;
  centerY: number;
  centerZ: number;
  radius: number;
  meaning: string;
}

export const ZONES: Record<string, Zone> = {
  // Center stage - primary attention
  centerStage: {
    name: "Center Stage",
    centerX: 0,
    centerY: 0,
    centerZ: 0,
    radius: 150,
    meaning: "Primary attention, actively presenting",
  },
  
  // Category-based zones (spread across horizontal axis)
  crystalZone: {
    name: "Crystal Territory",
    centerX: -400,
    centerY: 0,
    centerZ: 200,
    radius: 120,
    meaning: "Crystal consciousness briefings",
  },
  
  widgetZone: {
    name: "Widget Territory",
    centerX: -200,
    centerY: -50,
    centerZ: 200,
    radius: 120,
    meaning: "Widget completion reports",
  },
  
  dreamZone: {
    name: "Dream Territory",
    centerX: 0,
    centerY: 50,
    centerZ: 250,
    radius: 150,
    meaning: "Dream synthesis reports",
  },
  
  collaborationZone: {
    name: "Collaboration Territory",
    centerX: 200,
    centerY: -50,
    centerZ: 200,
    radius: 120,
    meaning: "Collaboration notifications",
  },
  
  systemZone: {
    name: "System Territory",
    centerX: 400,
    centerY: 0,
    centerZ: 200,
    radius: 120,
    meaning: "System intelligence alerts",
  },
  
  // Urgency-based zones (Z-axis)
  urgentFront: {
    name: "Urgent Front",
    centerX: 0,
    centerY: -100,
    centerZ: 50,
    radius: 200,
    meaning: "Critical/high priority items",
  },
  
  // Waiting areas (periphery)
  waitingLeft: {
    name: "Waiting Left",
    centerX: -500,
    centerY: 100,
    centerZ: 350,
    radius: 150,
    meaning: "Low priority, waiting",
  },
  
  waitingRight: {
    name: "Waiting Right",
    centerX: 500,
    centerY: 100,
    centerZ: 350,
    radius: 150,
    meaning: "Low priority, waiting",
  },
  
  // Background (dormant)
  background: {
    name: "Background",
    centerX: 0,
    centerY: 200,
    centerZ: 450,
    radius: 300,
    meaning: "Dormant, acknowledged items",
  },
};

// ============================================================================
// Position Calculation
// ============================================================================

/**
 * Calculate ideal position based on briefer properties
 */
export function calculatePosition(params: {
  category: BrieferCategory;
  state: BrieferState;
  priority: PriorityLevel;
  urgencyLevel: number;
  timeWaiting: number;
  stage?: StageConfig;
}): SpatialPosition {
  const stage = params.stage || DEFAULT_STAGE;
  
  // Start with category-based position
  let position = getCategoryBasePosition(params.category);
  
  // Adjust for state
  position = adjustForState(position, params.state, params.urgencyLevel);
  
  // Adjust for priority and urgency
  position = adjustForUrgency(position, params.priority, params.urgencyLevel);
  
  // Adjust for time waiting (gradual drift forward)
  position = adjustForTimeWaiting(position, params.timeWaiting);
  
  // Add natural variation
  position = addNaturalVariation(position);
  
  // Constrain to stage boundaries
  position = constrainToStage(position, stage);
  
  return position;
}

/**
 * Get base position for category
 */
function getCategoryBasePosition(category: BrieferCategory): SpatialPosition {
  const zoneMap: Record<BrieferCategory, Zone> = {
    crystal: ZONES.crystalZone,
    widget: ZONES.widgetZone,
    dream: ZONES.dreamZone,
    collaboration: ZONES.collaborationZone,
    system: ZONES.systemZone,
  };
  
  const zone = zoneMap[category];
  return {
    x: zone.centerX,
    y: zone.centerY,
    z: zone.centerZ,
  };
}

/**
 * Adjust position based on state
 */
function adjustForState(
  position: SpatialPosition,
  state: BrieferState,
  urgencyLevel: number
): SpatialPosition {
  switch (state) {
    case "presenting":
      // Move to center stage
      return {
        x: ZONES.centerStage.centerX,
        y: ZONES.centerStage.centerY,
        z: ZONES.centerStage.centerZ,
      };
      
    case "requesting":
      // Move toward center, but not fully there
      return {
        x: position.x * 0.3, // Move 70% toward center
        y: position.y * 0.3,
        z: position.z * 0.5, // Move closer on Z
      };
      
    case "acknowledged":
    case "dormant":
      // Move to background
      return {
        x: position.x * 1.2, // Spread out more
        y: position.y + 100, // Move down/back
        z: Math.max(position.z, ZONES.background.centerZ),
      };
      
    default:
      return position;
  }
}

/**
 * Adjust position based on urgency
 */
function adjustForUrgency(
  position: SpatialPosition,
  priority: PriorityLevel,
  urgencyLevel: number
): SpatialPosition {
  // Higher urgency = closer Z (toward user)
  const urgencyZAdjustment = (1 - urgencyLevel) * 200;
  
  // Critical items move toward urgent front zone
  if (priority === "critical" || urgencyLevel > 0.8) {
    return {
      x: position.x * 0.5 + ZONES.urgentFront.centerX * 0.5,
      y: position.y * 0.5 + ZONES.urgentFront.centerY * 0.5,
      z: Math.min(position.z, ZONES.urgentFront.centerZ) - urgencyZAdjustment,
    };
  }
  
  return {
    ...position,
    z: position.z - urgencyZAdjustment,
  };
}

/**
 * Adjust position based on time waiting (gradual drift forward)
 */
function adjustForTimeWaiting(
  position: SpatialPosition,
  timeWaiting: number
): SpatialPosition {
  // After 5 minutes, start drifting forward (smaller Z)
  const minutes = timeWaiting / (60 * 1000);
  const driftAmount = Math.min(minutes * 5, 100); // Max 100px drift
  
  return {
    ...position,
    z: position.z - driftAmount,
  };
}

/**
 * Add natural variation to prevent exact alignment
 */
function addNaturalVariation(position: SpatialPosition): SpatialPosition {
  return {
    x: position.x + (Math.random() - 0.5) * 60,
    y: position.y + (Math.random() - 0.5) * 60,
    z: position.z + (Math.random() - 0.5) * 30,
  };
}

/**
 * Constrain position to stage boundaries
 */
function constrainToStage(
  position: SpatialPosition,
  stage: StageConfig
): SpatialPosition {
  return {
    x: Math.max(-stage.width / 2, Math.min(stage.width / 2, position.x)),
    y: Math.max(-stage.height / 2, Math.min(stage.height / 2, position.y)),
    z: Math.max(0, Math.min(stage.depth, position.z)),
  };
}

// ============================================================================
// Clustering & Collision
// ============================================================================

/**
 * Calculate cluster center position
 */
export function calculateClusterCenter(
  positions: SpatialPosition[]
): SpatialPosition {
  if (positions.length === 0) {
    return { x: 0, y: 0, z: 200 };
  }
  
  const sum = positions.reduce(
    (acc, pos) => ({
      x: acc.x + pos.x,
      y: acc.y + pos.y,
      z: acc.z + pos.z,
    }),
    { x: 0, y: 0, z: 0 }
  );
  
  return {
    x: sum.x / positions.length,
    y: sum.y / positions.length,
    z: sum.z / positions.length,
  };
}

/**
 * Check if two positions are too close (collision detection)
 */
export function arePositionsTooClose(
  pos1: SpatialPosition,
  pos2: SpatialPosition,
  minDistance: number = 80
): boolean {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return distance < minDistance;
}

/**
 * Resolve collision between two briefers
 */
export function resolveCollision(
  pos1: SpatialPosition,
  pos2: SpatialPosition,
  minDistance: number = 80
): { pos1: SpatialPosition; pos2: SpatialPosition } {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  if (distance >= minDistance) {
    return { pos1, pos2 }; // No collision
  }
  
  // Push apart along collision vector
  const pushDistance = (minDistance - distance) / 2;
  const ratio = pushDistance / distance;
  
  return {
    pos1: {
      x: pos1.x + dx * ratio,
      y: pos1.y + dy * ratio,
      z: pos1.z + dz * ratio,
    },
    pos2: {
      x: pos2.x - dx * ratio,
      y: pos2.y - dy * ratio,
      z: pos2.z - dz * ratio,
    },
  };
}

// ============================================================================
// Distance & Relationships
// ============================================================================

/**
 * Calculate distance between two positions
 */
export function calculateDistance(
  pos1: SpatialPosition,
  pos2: SpatialPosition
): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Find briefers within a radius
 */
export function findNearbyPositions(
  center: SpatialPosition,
  positions: Map<string, SpatialPosition>,
  radius: number
): string[] {
  const nearby: string[] = [];
  
  for (const [id, pos] of positions.entries()) {
    if (calculateDistance(center, pos) <= radius) {
      nearby.push(id);
    }
  }
  
  return nearby;
}

/**
 * Calculate visual size based on Z-depth
 * Closer = larger (perspective effect)
 */
export function calculateVisualScale(z: number, maxZ: number = 500): number {
  // Perspective scaling: closer objects appear larger
  const normalizedZ = z / maxZ;
  return 1.5 - normalizedZ * 0.7; // Scale from 1.5 (close) to 0.8 (far)
}

/**
 * Calculate opacity based on Z-depth
 * Farther = more transparent
 */
export function calculateDepthOpacity(z: number, maxZ: number = 500): number {
  const normalizedZ = z / maxZ;
  return 1.0 - normalizedZ * 0.4; // Opacity from 1.0 (close) to 0.6 (far)
}

/**
 * Sort briefers by Z-depth for rendering order
 */
export function sortByDepth(
  positions: Map<string, SpatialPosition>
): string[] {
  return Array.from(positions.entries())
    .sort((a, b) => b[1].z - a[1].z) // Farther first (render back-to-front)
    .map(([id]) => id);
}

