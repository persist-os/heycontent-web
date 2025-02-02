import { MemoryNode } from './types';

export class MemoryIndices {
  private contentIndex: Map<string, Set<string>> = new Map();
  private typeIndex: Map<string, Set<string>> = new Map();
  private contextIndex: Map<string, Set<string>> = new Map();
  private temporalIndex: Map<string, Set<string>> = new Map();

  addNode(node: MemoryNode): void {
    // Index by content keywords
    const keywords = this.extractKeywords(node.content);
    keywords.forEach(keyword => {
      if (!this.contentIndex.has(keyword)) {
        this.contentIndex.set(keyword, new Set());
      }
      this.contentIndex.get(keyword)!.add(node.id);
    });

    // Index by type
    if (!this.typeIndex.has(node.type)) {
      this.typeIndex.set(node.type, new Set());
    }
    this.typeIndex.get(node.type)!.add(node.id);

    // Index by context
    const contextKey = node.context.situation;
    if (!this.contextIndex.has(contextKey)) {
      this.contextIndex.set(contextKey, new Set());
    }
    this.contextIndex.get(contextKey)!.add(node.id);

    // Index by time periods
    const timeKey = this.getTimePeriod(node.timestamp);
    if (!this.temporalIndex.has(timeKey)) {
      this.temporalIndex.set(timeKey, new Set());
    }
    this.temporalIndex.get(timeKey)!.add(node.id);
  }

  removeNode(node: MemoryNode): void {
    // Remove from content index
    const keywords = this.extractKeywords(node.content);
    keywords.forEach(keyword => {
      const nodeIds = this.contentIndex.get(keyword);
      if (nodeIds) {
        nodeIds.delete(node.id);
        if (nodeIds.size === 0) {
          this.contentIndex.delete(keyword);
        }
      }
    });

    // Remove from type index
    const typeNodes = this.typeIndex.get(node.type);
    if (typeNodes) {
      typeNodes.delete(node.id);
      if (typeNodes.size === 0) {
        this.typeIndex.delete(node.type);
      }
    }

    // Remove from context index
    const contextKey = node.context.situation;
    const contextNodes = this.contextIndex.get(contextKey);
    if (contextNodes) {
      contextNodes.delete(node.id);
      if (contextNodes.size === 0) {
        this.contextIndex.delete(contextKey);
      }
    }

    // Remove from temporal index
    const timeKey = this.getTimePeriod(node.timestamp);
    const timeNodes = this.temporalIndex.get(timeKey);
    if (timeNodes) {
      timeNodes.delete(node.id);
      if (timeNodes.size === 0) {
        this.temporalIndex.delete(timeKey);
      }
    }
  }

  searchByContent(query: string): Set<string> {
    const keywords = this.extractKeywords(query);
    const results = new Set<string>();
    let isFirstKeyword = true;

    keywords.forEach(keyword => {
      const nodeIds = this.contentIndex.get(keyword.toLowerCase());
      if (nodeIds) {
        if (isFirstKeyword) {
          nodeIds.forEach(id => results.add(id));
          isFirstKeyword = false;
        } else {
          // Intersection with existing results
          for (const id of results) {
            if (!nodeIds.has(id)) {
              results.delete(id);
            }
          }
        }
      }
    });

    return results;
  }

  searchByType(type: string): Set<string> {
    return this.typeIndex.get(type) || new Set();
  }

  searchByContext(context: string): Set<string> {
    return this.contextIndex.get(context) || new Set();
  }

  searchByTimeRange(startTime: number, endTime: number): Set<string> {
    const results = new Set<string>();
    const startPeriod = this.getTimePeriod(startTime);
    const endPeriod = this.getTimePeriod(endTime);

    for (const [timeKey, nodeIds] of this.temporalIndex.entries()) {
      if (timeKey >= startPeriod && timeKey <= endPeriod) {
        nodeIds.forEach(id => results.add(id));
      }
    }

    return results;
  }

  private extractKeywords(content: any): string[] {
    const text = JSON.stringify(content).toLowerCase();
    return text
      .split(/\W+/)
      .filter(word => word.length > 2) // Filter out short words
      .map(word => word.toLowerCase());
  }

  private getTimePeriod(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  getStats(): {
    contentIndexSize: number;
    typeIndexSize: number;
    contextIndexSize: number;
    temporalIndexSize: number;
  } {
    return {
      contentIndexSize: this.contentIndex.size,
      typeIndexSize: this.typeIndex.size,
      contextIndexSize: this.contextIndex.size,
      temporalIndexSize: this.temporalIndex.size
    };
  }
} 