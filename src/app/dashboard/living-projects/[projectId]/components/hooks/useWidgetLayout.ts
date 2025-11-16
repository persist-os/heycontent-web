/**
 * WIDGET LAYOUT HOOK
 * 
 * Advanced widget layout algorithm for widget and content positioning using
 * force-directed placement, clustering, and connection generation.
 * Supports both widgets and content items with stored layout caching.
 */

import React from 'react'
import { WidgetConfig } from '@/types/projectWidgets'
import { 
  LayoutItem, 
  LayoutPosition, 
  LayoutConnection,
  checkCollision,
  findValidPosition,
  calculateImportance,
  clusterByEmbeddings,
  generateClusterCenters,
  calculateConnectionStrength
} from '../../utils/layoutAlgorithm'

export interface WidgetPosition {
  id: string
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  cluster?: number
  type?: 'widget' | 'note' | 'conversation' | 'crystal' | 'shard'
}

export interface WidgetConnection {
  from: string
  to: string
  strength: number
  type?: 'widget-widget' | 'content-widget' | 'content-content'
}

export interface StoredLayout {
  version: number;
  calculatedAt: number;
  items: Array<{
    itemId: string;
    itemType: 'widget' | 'note' | 'conversation' | 'crystal' | 'shard';
    x: number;
    y: number;
    size: string;
    importance: number;
  }>;
  canvasWidth: number;
  canvasHeight: number;
}

export interface WidgetLayoutResult {
  positions: WidgetPosition[]
  canvasWidth: number
  canvasHeight: number
  connections: WidgetConnection[]
  layoutVersion?: number
}

/**
 * Advanced widget layout hook for widget and content positioning
 * Uses force-directed algorithm with clustering and importance-based placement
 * Supports both widgets and content items with stored layout caching
 */
export function useWidgetLayout(
  widgets: WidgetConfig[], 
  contentItems?: any[], 
  storedLayout?: StoredLayout | null
): WidgetLayoutResult {
  return React.useMemo(() => {
    // Handle SSR - use default values when window is not available
    const isSSR = typeof window === 'undefined'
    const defaultWidth = isSSR ? 2400 : window.innerWidth * 3
    const defaultHeight = isSSR ? 1600 : window.innerHeight * 2.5
    
    const canvasWidth = Math.max(defaultWidth, 2400)
    const canvasHeight = Math.max(defaultHeight, 1600)

    // If we have a valid stored layout, use it
    if (storedLayout && storedLayout.items && storedLayout.items.length > 0) {
      const positions: WidgetPosition[] = storedLayout.items.map(item => ({
        id: item.itemId,
        x: item.x,
        y: item.y,
        size: item.size as 'small' | 'medium' | 'large',
        importance: item.importance,
        type: item.itemType
      }));

      // Generate connections from stored layout
      const connections: WidgetConnection[] = [];
      positions.forEach((pos1, i) => {
        positions.slice(i + 1).forEach(pos2 => {
          const distance = Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
          );
          if (distance < 400) {
            const strength = Math.max(0.1, 1 - distance / 400);
            const connectionType = pos1.type && pos2.type ? 
              (pos1.type === 'widget' && pos2.type === 'widget' ? 'widget-widget' :
               pos1.type !== 'widget' && pos2.type !== 'widget' ? 'content-content' : 'content-widget') :
              undefined;
            
            connections.push({
              from: pos1.id,
              to: pos2.id,
              strength,
              type: connectionType
            });
          }
        });
      });

      return {
        positions,
        canvasWidth: storedLayout.canvasWidth || canvasWidth,
        canvasHeight: storedLayout.canvasHeight || canvasHeight,
        connections,
        layoutVersion: storedLayout.version
      };
    }

    // No widgets or content to layout
    if (!widgets.length && (!contentItems || !contentItems.length)) {
      return {
        positions: [],
        canvasWidth,
        canvasHeight,
        connections: []
      }
    }

    // Convert widgets to layout items
    const widgetItems: LayoutItem[] = widgets.map(widget => ({
      id: widget._id,
      type: 'widget' as const,
      importance: calculateImportance({
        id: widget._id,
        type: 'widget',
        importance: 0.3 + (widget.priority > 7 ? 0.4 : 0) + (widget.size === 'large' ? 0.2 : 0) + 0.3, // Widgets are always recent
        size: widget.size as 'small' | 'medium' | 'large',
        metadata: widget
      }),
      size: widget.size as 'small' | 'medium' | 'large',
      metadata: widget
    }));

    // Convert content items to layout items
    const contentLayoutItems: LayoutItem[] = (contentItems || []).map((item: any) => {
      const contentType = item._contentType || 'note';
      const size = contentType === 'crystal' || contentType === 'shard' ? 'small' : 'medium';
      
      return {
        id: item._contentId || item._id,
        type: contentType,
        importance: calculateImportance({
          id: item._contentId || item._id,
          type: contentType,
          importance: 0.3,
          size,
          metadata: item
        }),
        size,
        metadata: item
      };
    });

    // Combine all items
    const allItems = [...widgetItems, ...contentLayoutItems];
    
    if (!allItems.length) {
      return {
        positions: [],
        canvasWidth,
        canvasHeight,
        connections: []
      };
    }

    // Sort by importance for cluster generation
    const sortedItems = [...allItems].sort((a, b) => b.importance - a.importance);

    // Generate cluster centers
    const numClusters = Math.min(Math.ceil(allItems.length / 4), 6);
    const clusterCenters = generateClusterCenters(sortedItems, numClusters, canvasWidth, canvasHeight);

    // Position items using force-directed algorithm
    const positions: WidgetPosition[] = [];
    const maxAttempts = 50;

    sortedItems.forEach((item, index) => {
      let bestPosition = { x: 0, y: 0 };
      let bestScore = -Infinity;

      // Try cluster center first for important items
      if (index < numClusters) {
        const center = clusterCenters[index];
        const x = center.x + (Math.random() - 0.5) * center.radius;
        const y = center.y + (Math.random() - 0.5) * center.radius;

        let hasCollision = false;
        for (const existingPos of positions) {
          if (checkCollision({ x, y }, { x: existingPos.x, y: existingPos.y })) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          bestPosition = { x, y };
          bestScore = item.importance;
        }
      }

      // If cluster center failed, try random positions
      if (bestScore === -Infinity) {
        const validPosition = findValidPosition(positions, {
          id: item.id,
          x: 0,
          y: 0,
          size: item.size,
          importance: item.importance
        }, maxAttempts, canvasWidth, canvasHeight);

        if (validPosition) {
          bestPosition = validPosition;
        } else {
          // Fallback to center if no valid position found
          bestPosition = {
            x: canvasWidth / 2 + (Math.random() - 0.5) * 200,
            y: canvasHeight / 2 + (Math.random() - 0.5) * 200
          };
        }
      }

      positions.push({
        id: item.id,
        x: bestPosition.x,
        y: bestPosition.y,
        size: item.size,
        importance: item.importance,
        cluster: Math.floor(index / Math.ceil(allItems.length / numClusters)),
        type: item.type
      });
    });

    // Generate connections between related items
    const connections: WidgetConnection[] = [];

    positions.forEach((pos1, i) => {
      positions.slice(i + 1).forEach(pos2 => {
        const item1 = allItems.find(item => item.id === pos1.id)!;
        const item2 = allItems.find(item => item.id === pos2.id)!;

        const strength = calculateConnectionStrength(pos1, pos2, item1, item2);

        // Only create connection if strength is above threshold
        if (strength > 0.25) {
          const connectionType = pos1.type && pos2.type ? 
            (pos1.type === 'widget' && pos2.type === 'widget' ? 'widget-widget' :
             pos1.type !== 'widget' && pos2.type !== 'widget' ? 'content-content' : 'content-widget') :
            undefined;

          connections.push({
            from: pos1.id,
            to: pos2.id,
            strength: Math.min(strength, 1),
            type: connectionType
          });
        }
      });
    });

    return {
      positions,
      canvasWidth,
      canvasHeight,
      connections
    }
  }, [widgets, contentItems, storedLayout])
}