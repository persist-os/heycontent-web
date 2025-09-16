import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Constants for positioning
const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1600;
const MIN_PROJECT_SEPARATION = 500; // Minimum distance between project centers (increased for 20% zoom)
const PROJECT_BOUNDARY_MARGIN = 200; // Distance from canvas edges

export interface Position {
  x: number;
  y: number;
}

export interface ProjectPosition extends Position {
  id: string;
  space_radius: number;
}

// Type for existing projects from database
export interface ExistingProject {
  _id: string;
  position_x: number;
  position_y: number;
  space_radius: number;
}

/**
 * Generate a non-overlapping position for a new project
 */
export async function generateProjectPosition(
  ctx: any,
  userId: string,
  existingProjects: ExistingProject[] = []
): Promise<Position> {
  // If no existing projects, start at center
  if (existingProjects.length === 0) {
    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
    };
  }

  // Generate candidate positions using spiral pattern
  const maxAttempts = 100;
  const spiralStep = 80; // Increased to accommodate larger spacing
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidatePosition = generateSpiralPosition(attempt, spiralStep);
    
    // Check if position is within canvas bounds
    if (!isPositionWithinBounds(candidatePosition)) {
      continue;
    }
    
    // Check for collisions with existing projects
    const hasCollision = existingProjects.some(existingProject => {
      const distance = Math.sqrt(
        Math.pow(candidatePosition.x - existingProject.position_x, 2) +
        Math.pow(candidatePosition.y - existingProject.position_y, 2)
      );
      return distance < MIN_PROJECT_SEPARATION;
    });
    
    if (!hasCollision) {
      return candidatePosition;
    }
  }
  
  // Fallback: use random position if spiral fails
  return generateRandomPosition();
}

/**
 * Generate position using spiral pattern from center
 */
function generateSpiralPosition(attempt: number, step: number): Position {
  const angle = attempt * 0.5; // Golden angle approximation
  const radius = step * Math.sqrt(attempt);
  
  return {
    x: CANVAS_WIDTH / 2 + Math.cos(angle) * radius,
    y: CANVAS_HEIGHT / 2 + Math.sin(angle) * radius,
  };
}

/**
 * Generate random position within canvas bounds
 */
function generateRandomPosition(): Position {
  return {
    x: PROJECT_BOUNDARY_MARGIN + Math.random() * (CANVAS_WIDTH - 2 * PROJECT_BOUNDARY_MARGIN),
    y: PROJECT_BOUNDARY_MARGIN + Math.random() * (CANVAS_HEIGHT - 2 * PROJECT_BOUNDARY_MARGIN),
  };
}

/**
 * Check if position is within canvas bounds
 */
function isPositionWithinBounds(position: Position): boolean {
  return (
    position.x >= PROJECT_BOUNDARY_MARGIN &&
    position.x <= CANVAS_WIDTH - PROJECT_BOUNDARY_MARGIN &&
    position.y >= PROJECT_BOUNDARY_MARGIN &&
    position.y <= CANVAS_HEIGHT - PROJECT_BOUNDARY_MARGIN
  );
}

/**
 * Calculate canvas bounds to fit all projects
 */
export function calculateCanvasBounds(projects: ProjectPosition[]): {
  width: number;
  height: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (projects.length === 0) {
    return {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      minX: 0,
      minY: 0,
      maxX: CANVAS_WIDTH,
      maxY: CANVAS_HEIGHT,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  projects.forEach(project => {
    const radius = project.space_radius || 120;
    minX = Math.min(minX, project.x - radius);
    minY = Math.min(minY, project.y - radius);
    maxX = Math.max(maxX, project.x + radius);
    maxY = Math.max(maxY, project.y + radius);
  });

  // Add padding
  const padding = 200;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  // Ensure minimum canvas size
  const width = Math.max(CANVAS_WIDTH, maxX - minX);
  const height = Math.max(CANVAS_HEIGHT, maxY - minY);

  return {
    width,
    height,
    minX,
    minY,
    maxX,
    maxY,
  };
}

/**
 * Calculate project space radius based on widget count
 */
export function calculateProjectSpaceRadius(widgetCount: number): number {
  // Base radius (increased for better clickability at 20% zoom)
  const baseRadius = 200;
  
  // Increase radius based on widget count
  const widgetRadius = Math.min(300, widgetCount * 20);
  
  return Math.max(baseRadius, widgetRadius);
}
