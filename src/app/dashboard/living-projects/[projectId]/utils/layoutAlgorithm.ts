/**
 * SHARED LAYOUT ALGORITHM UTILITIES
 * 
 * Extracted core functions from useWidgetLayout for reuse across widgets and content.
 * Provides collision detection, position calculation, and similarity grouping.
 */

export interface LayoutItem {
  id: string;
  type: 'widget' | 'note' | 'conversation' | 'crystal' | 'shard';
  importance: number;
  size: 'small' | 'medium' | 'large';
  metadata?: any;
}

export interface LayoutPosition {
  id: string;
  x: number;
  y: number;
  size: 'small' | 'medium' | 'large';
  importance: number;
  cluster?: number;
}

export interface LayoutConnection {
  from: string;
  to: string;
  strength: number;
  type: 'widget-widget' | 'content-widget' | 'content-content';
}

/**
 * Check if two positions would collide given minimum distance
 */
export function checkCollision(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number },
  minDistance: number = 120
): boolean {
  const distance = Math.sqrt(
    Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
  );
  return distance < minDistance;
}

/**
 * Find a valid position for an item given existing positions
 */
export function findValidPosition(
  existing: LayoutPosition[],
  candidate: LayoutPosition,
  maxAttempts: number = 50,
  canvasWidth: number = 2400,
  canvasHeight: number = 1600
): { x: number; y: number } | null {
  const margin = 100;
  const minX = margin;
  const minY = margin;
  const maxX = canvasWidth - margin;
  const maxY = canvasHeight - margin;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = Math.random() * (maxX - minX) + minX;
    const y = Math.random() * (maxY - minY) + minY;

    // Check collision with existing positions
    let hasCollision = false;
    for (const existingPos of existing) {
      if (checkCollision({ x, y }, { x: existingPos.x, y: existingPos.y })) {
        hasCollision = true;
        break;
      }
    }

    if (!hasCollision) {
      return { x, y };
    }
  }

  return null; // No valid position found
}

/**
 * Calculate importance score for a content item
 */
export function calculateImportance(item: LayoutItem): number {
  let importance = 0.3; // Base importance

  // Type-based importance
  switch (item.type) {
    case 'note':
      importance += 0.3;
      break;
    case 'conversation':
      importance += 0.25;
      break;
    case 'crystal':
      importance += 0.2;
      break;
    case 'shard':
      importance += 0.15;
      break;
  }

  // Size-based importance
  switch (item.size) {
    case 'large':
      importance += 0.2;
      break;
    case 'medium':
      importance += 0.1;
      break;
    case 'small':
      importance += 0.05;
      break;
  }

  // Metadata-based importance (if available)
  if (item.metadata) {
    // For notes: recent creation, high word count
    if (item.type === 'note' && item.metadata.createdAt) {
      const daysSinceCreation = (Date.now() - item.metadata.createdAt) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 7) importance += 0.1;
    }

    // For conversations: message count, starred status
    if (item.type === 'conversation' && item.metadata.messageCount) {
      if (item.metadata.messageCount > 10) importance += 0.1;
    }

    // For crystals: confidence score
    if (item.type === 'crystal' && item.metadata.confidence) {
      importance += item.metadata.confidence * 0.2;
    }

    // For shards: confidence level
    if (item.type === 'shard' && item.metadata.confidence_level) {
      importance += item.metadata.confidence_level * 0.15;
    }
  }

  return Math.min(importance, 1); // Cap at 1.0
}

/**
 * Cluster items by similarity using embeddings (simplified implementation)
 * Returns array of cluster IDs for each item
 */
export function clusterByEmbeddings(
  items: LayoutItem[],
  threshold: number = 0.7
): number[] {
  const clusters: number[] = new Array(items.length).fill(-1);
  let nextClusterId = 0;

  // Simple clustering based on type and importance similarity
  // In a full implementation, this would use actual embeddings
  for (let i = 0; i < items.length; i++) {
    if (clusters[i] !== -1) continue; // Already clustered

    clusters[i] = nextClusterId;

    // Find similar items
    for (let j = i + 1; j < items.length; j++) {
      if (clusters[j] !== -1) continue; // Already clustered

      const similarity = calculateSimilarity(items[i], items[j]);
      if (similarity > threshold) {
        clusters[j] = nextClusterId;
      }
    }

    nextClusterId++;
  }

  return clusters;
}

/**
 * Calculate similarity between two items (simplified)
 * In a full implementation, this would use actual embeddings
 */
function calculateSimilarity(item1: LayoutItem, item2: LayoutItem): number {
  let similarity = 0;

  // Same type = high similarity
  if (item1.type === item2.type) {
    similarity += 0.5;
  }

  // Similar importance = medium similarity
  const importanceDiff = Math.abs(item1.importance - item2.importance);
  similarity += (1 - importanceDiff) * 0.3;

  // Same size = low similarity
  if (item1.size === item2.size) {
    similarity += 0.2;
  }

  return similarity;
}

/**
 * Generate cluster centers for important items
 */
export function generateClusterCenters(
  items: LayoutItem[],
  numClusters: number,
  canvasWidth: number = 2400,
  canvasHeight: number = 1600
): Array<{ x: number; y: number; radius: number }> {
  const clusterCenters: Array<{ x: number; y: number; radius: number }> = [];
  const margin = 200;

  for (let i = 0; i < numClusters; i++) {
    const angle = (i / numClusters) * Math.PI * 2;
    const radius = Math.min(canvasWidth, canvasHeight) * 0.3;
    
    const x = canvasWidth / 2 + Math.cos(angle) * radius;
    const y = canvasHeight / 2 + Math.sin(angle) * radius;

    clusterCenters.push({
      x: Math.max(margin, Math.min(canvasWidth - margin, x)),
      y: Math.max(margin, Math.min(canvasHeight - margin, y)),
      radius: 150
    });
  }

  return clusterCenters;
}

/**
 * Calculate connection strength between two positions
 */
export function calculateConnectionStrength(
  pos1: LayoutPosition,
  pos2: LayoutPosition,
  item1: LayoutItem,
  item2: LayoutItem
): number {
  let strength = 0;

  // Same cluster = stronger connection
  if (pos1.cluster === pos2.cluster && pos1.cluster !== undefined) {
    strength += 0.3;
  }

  // Same type = related
  if (item1.type === item2.type) {
    strength += 0.2;
  }

  // Similar importance = related
  const importanceDiff = Math.abs(item1.importance - item2.importance);
  strength += (1 - importanceDiff) * 0.2;

  // Distance-based connection (closer = more likely to connect)
  const distance = Math.sqrt(
    Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
  );
  if (distance < 300) {
    strength += 0.2 * (1 - distance / 300);
  }

  // Content to widget connections (if applicable)
  if (item1.type !== 'widget' && item2.type === 'widget') {
    strength += 0.1; // Slight boost for content-widget connections
  }

  return Math.min(strength, 1);
}
