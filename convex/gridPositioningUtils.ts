import { v } from "convex/values";

interface Project {
  _id: string;
  position_x: number;
  position_y: number;
  space_radius: number;
  grid_x?: number;
  grid_y?: number;
  grid_width?: number;
  grid_height?: number;
}

/**
 * Generate next available grid position for new projects
 */
export function generateNextGridPosition(existingProjects: Project[]): { grid_x: number, grid_y: number } {
  const usedPositions = new Set<string>();
  
  // Mark existing positions as used
  existingProjects.forEach(project => {
    if (project.grid_x !== undefined && project.grid_y !== undefined) {
      usedPositions.add(`${project.grid_x},${project.grid_y}`);
    }
  });

  // Spiral pattern from center (0,0)
  const maxAttempts = 100;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const position = generateSpiralGridPosition(attempt);
    const key = `${position.grid_x},${position.grid_y}`;
    
    if (!usedPositions.has(key)) {
      return position;
    }
  }
  
  // Fallback: random position
  return {
    grid_x: Math.floor(Math.random() * 10) - 5,
    grid_y: Math.floor(Math.random() * 10) - 5,
  };
}

/**
 * Generate position using spiral pattern from center
 */
function generateSpiralGridPosition(attempt: number): { grid_x: number, grid_y: number } {
  if (attempt === 0) return { grid_x: 0, grid_y: 0 };
  
  const ring = Math.ceil(Math.sqrt(attempt));
  const positionInRing = attempt - (ring - 1) * (ring - 1);
  const maxPositionsInRing = ring * 4 - 4; // Square pattern: 4, 8, 12, 16...
  
  if (positionInRing < ring) {
    // Top edge
    return { grid_x: positionInRing - ring + 1, grid_y: -ring };
  } else if (positionInRing < ring * 2) {
    // Right edge
    return { grid_x: ring, grid_y: positionInRing - ring * 2 + ring + 1 };
  } else if (positionInRing < ring * 3) {
    // Bottom edge
    return { grid_x: ring - (positionInRing - ring * 2), grid_y: ring };
  } else {
    // Left edge
    return { grid_x: -ring, grid_y: ring - (positionInRing - ring * 3) };
  }
}

/**
 * Check if two grid positions overlap
 */
export function doGridPositionsOverlap(
  grid1: { grid_x: number, grid_y: number },
  grid2: { grid_x: number, grid_y: number }
): boolean {
  // Since all grid cells are the same size, we just need to check if they're the same position
  return grid1.grid_x === grid2.grid_x && grid1.grid_y === grid2.grid_y;
}
