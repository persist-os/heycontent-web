import { RAGSystem, AVAMetadata } from "../rag";
import { PrismaClient } from "@prisma/client";

interface BatchItem {
  content: string;
  metadata: AVAMetadata;
  timestamp: Date;
}

export class BatchProcessor {
  private batchQueue: Map<string, BatchItem[]> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(
    private rag: RAGSystem,
    private prisma: PrismaClient
  ) {
    this.startProcessing();
  }

  async queueForBatch(userId: string, content: string, metadata: AVAMetadata) {
    const userQueue = this.batchQueue.get(userId) || [];
    userQueue.push({
      content,
      metadata,
      timestamp: new Date()
    });
    this.batchQueue.set(userId, userQueue);

    // If batch size threshold is reached, process immediately
    if (userQueue.length >= this.BATCH_SIZE) {
      await this.processBatchForUser(userId);
    }
  }

  private async processBatchForUser(userId: string) {
    const batch = this.batchQueue.get(userId);
    if (!batch || batch.length === 0) return;

    try {
      // Group similar insights
      const groupedInsights = this.groupSimilarInsights(batch);

      // Process each group
      for (const group of groupedInsights) {
        const combinedContent = this.combineGroupContent(group);
        const metadata = this.mergeGroupMetadata(group);

        // Store in RAG system
        await this.rag.addDocument(combinedContent, metadata);
      }

      // Clear processed batch
      this.batchQueue.set(userId, []);
    } catch (error) {
      console.error('Error processing batch for user:', userId, error);
    }
  }

  private groupSimilarInsights(batch: BatchItem[]): BatchItem[][] {
    const groups: BatchItem[][] = [];
    const processed = new Set<number>();

    batch.forEach((item, index) => {
      if (processed.has(index)) return;

      const group = [item];
      processed.add(index);

      // Group similar insights based on type and timestamp
      batch.slice(index + 1).forEach((other, otherIndex) => {
        if (this.areSimilarInsights(item, other)) {
          group.push(other);
          processed.add(index + 1 + otherIndex);
        }
      });

      groups.push(group);
    });

    return groups;
  }

  private areSimilarInsights(a: BatchItem, b: BatchItem): boolean {
    return (
      a.metadata.type === b.metadata.type &&
      Math.abs(a.timestamp.getTime() - b.timestamp.getTime()) < 60 * 60 * 1000 // 1 hour
    );
  }

  private combineGroupContent(group: BatchItem[]): string {
    return group
      .map(item => item.content)
      .join('\n---\n');
  }

  private mergeGroupMetadata(group: BatchItem[]): AVAMetadata {
    const base = { ...group[0].metadata };
    const allTags = new Set<string>();

    group.forEach(item => {
      item.metadata.tags?.forEach(tag => allTags.add(tag));
    });

    return {
      ...base,
      tags: Array.from(allTags),
      batch_size: group.length,
      batch_timestamp: new Date().toISOString()
    };
  }

  private startProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(async () => {
      for (const userId of this.batchQueue.keys()) {
        await this.processBatchForUser(userId);
      }
    }, this.BATCH_INTERVAL);
  }

  public stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
} 