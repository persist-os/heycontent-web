/**
 * Briefing Room - Spatial Positioning Hook
 * 
 * Manages briefer positions with smooth animations and collision detection.
 */

import { useState, useEffect, useCallback } from "react";
import { useSpring } from "framer-motion";
import { SpatialPosition, BrieferAgent } from "../types";
import {
  calculatePosition,
  calculateDistance,
  arePositionsTooClose,
  resolveCollision,
  calculateVisualScale,
  calculateDepthOpacity,
} from "../utils/spatialSemantics";

// ============================================================================
// Spatial Positioning Hook
// ============================================================================

/**
 * Hook for managing briefer spatial position
 * Calculates position and provides spring-animated values
 */
export function useSpatialPositioning(
  briefer: BrieferAgent,
  allBriefers: BrieferAgent[]
) {
  // Calculate target position
  const targetPosition = calculatePosition({
    category: briefer.category,
    state: briefer.state,
    priority: briefer.priority,
    urgencyLevel: briefer.urgencyLevel,
    timeWaiting: briefer.timeWaiting,
  });
  
  // Detect and resolve collisions
  const [resolvedPosition, setResolvedPosition] = useState(targetPosition);
  
  useEffect(() => {
    let position = targetPosition;
    
    // Check for collisions with other briefers
    for (const other of allBriefers) {
      if (other.id === briefer.id) continue;
      
      if (arePositionsTooClose(position, other.position)) {
        const resolved = resolveCollision(position, other.position);
        position = resolved.pos1;
      }
    }
    
    setResolvedPosition(position);
  }, [targetPosition, allBriefers, briefer.id]);
  
  // Animated springs for smooth movement
  const x = useSpring(resolvedPosition.x, { stiffness: 100, damping: 20 });
  const y = useSpring(resolvedPosition.y, { stiffness: 100, damping: 20 });
  const z = useSpring(resolvedPosition.z, { stiffness: 100, damping: 20 });
  
  // Update springs when position changes
  useEffect(() => {
    x.set(resolvedPosition.x);
    y.set(resolvedPosition.y);
    z.set(resolvedPosition.z);
  }, [resolvedPosition, x, y, z]);
  
  // Calculate visual properties based on Z-depth
  const visualScale = calculateVisualScale(resolvedPosition.z);
  const depthOpacity = calculateDepthOpacity(resolvedPosition.z);
  
  return {
    position: resolvedPosition,
    animatedX: x,
    animatedY: y,
    animatedZ: z,
    visualScale,
    depthOpacity,
  };
}

// ============================================================================
// Room Layout Hook
// ============================================================================

/**
 * Hook for managing overall room layout
 * Tracks all briefer positions and handles global layout concerns
 */
export function useRoomLayout(briefers: BrieferAgent[]) {
  const [positions, setPositions] = useState<Map<string, SpatialPosition>>(
    new Map()
  );
  
  // Calculate positions for all briefers
  useEffect(() => {
    const newPositions = new Map<string, SpatialPosition>();
    
    for (const briefer of briefers) {
      const position = calculatePosition({
        category: briefer.category,
        state: briefer.state,
        priority: briefer.priority,
        urgencyLevel: briefer.urgencyLevel,
        timeWaiting: briefer.timeWaiting,
      });
      
      newPositions.set(briefer.id, position);
    }
    
    setPositions(newPositions);
  }, [briefers]);
  
  // Calculate room crowding (0-1)
  const crowding = Math.min(1, briefers.length / 10);
  
  // Find center of mass (average position)
  const centerOfMass = useCallback(() => {
    if (positions.size === 0) {
      return { x: 0, y: 0, z: 200 };
    }
    
    let sumX = 0, sumY = 0, sumZ = 0;
    
    for (const pos of positions.values()) {
      sumX += pos.x;
      sumY += pos.y;
      sumZ += pos.z;
    }
    
    return {
      x: sumX / positions.size,
      y: sumY / positions.size,
      z: sumZ / positions.size,
    };
  }, [positions]);
  
  return {
    positions,
    crowding,
    centerOfMass: centerOfMass(),
    brieferCount: briefers.length,
  };
}

// ============================================================================
// Cluster Positioning Hook
// ============================================================================

/**
 * Hook for positioning briefers in a cluster
 * Arranges briefers in a circular pattern around cluster center
 */
export function useClusterPositioning(
  clusterCenter: SpatialPosition,
  brieferIds: string[],
  radius: number = 150
) {
  const [positions, setPositions] = useState<Map<string, SpatialPosition>>(
    new Map()
  );
  
  useEffect(() => {
    const newPositions = new Map<string, SpatialPosition>();
    const count = brieferIds.length;
    
    brieferIds.forEach((id, index) => {
      // Arrange in circle around center
      const angle = (index / count) * 2 * Math.PI;
      const x = clusterCenter.x + Math.cos(angle) * radius;
      const y = clusterCenter.y + Math.sin(angle) * radius;
      const z = clusterCenter.z;
      
      newPositions.set(id, { x, y, z });
    });
    
    setPositions(newPositions);
  }, [clusterCenter, brieferIds, radius]);
  
  return positions;
}

// ============================================================================
// Camera/Viewport Hook
// ============================================================================

/**
 * Hook for camera/viewport management
 * Allows panning and zooming the briefing room
 */
export function useRoomViewport() {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  
  const panX = useSpring(pan.x, { stiffness: 100, damping: 20 });
  const panY = useSpring(pan.y, { stiffness: 100, damping: 20 });
  const zoomValue = useSpring(zoom, { stiffness: 100, damping: 20 });
  
  useEffect(() => {
    panX.set(pan.x);
    panY.set(pan.y);
    zoomValue.set(zoom);
  }, [pan, zoom, panX, panY, zoomValue]);
  
  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    setPan(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  }, []);
  
  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  }, []);
  
  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);
  
  return {
    pan: { x: panX, y: panY },
    zoom: zoomValue,
    handlePan,
    handleZoom,
    resetView,
  };
}

