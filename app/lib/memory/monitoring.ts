import { MemorySystemMetrics } from './types';

export class MemorySystemMonitor {
  private metrics: MemorySystemMetrics[] = [];
  private readonly MAX_METRICS_LENGTH = 1000;

  recordOperation(operationType: string, startTime: number): void {
    const duration = Date.now() - startTime;
    const metrics: MemorySystemMetrics = {
      operationType,
      duration,
      timestamp: Date.now(),
      success: true,
      memoryUsage: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal
      }
    };

    this.metrics.push(metrics);
    if (this.metrics.length > this.MAX_METRICS_LENGTH) {
      this.metrics.shift(); // Remove oldest metric
    }
  }

  recordError(operationType: string, startTime: number, error: Error): void {
    const duration = Date.now() - startTime;
    const metrics: MemorySystemMetrics = {
      operationType,
      duration,
      timestamp: Date.now(),
      success: false,
      errorCount: 1,
      memoryUsage: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal
      }
    };

    this.metrics.push(metrics);
    if (this.metrics.length > this.MAX_METRICS_LENGTH) {
      this.metrics.shift();
    }
  }

  getPerformanceReport(): {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    memoryUsage: {
      average: number;
      peak: number;
    };
    operationCounts: Record<string, number>;
  } {
    const totalOperations = this.metrics.length;
    if (totalOperations === 0) {
      return {
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0,
        memoryUsage: {
          average: 0,
          peak: 0
        },
        operationCounts: {}
      };
    }

    const successfulOperations = this.metrics.filter(m => m.success).length;
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const memoryUsages = this.metrics
      .filter(m => m.memoryUsage)
      .map(m => m.memoryUsage!.heapUsed);

    const operationCounts: Record<string, number> = {};
    this.metrics.forEach(m => {
      operationCounts[m.operationType] = (operationCounts[m.operationType] || 0) + 1;
    });

    return {
      averageResponseTime: totalDuration / totalOperations,
      successRate: successfulOperations / totalOperations,
      errorRate: (totalOperations - successfulOperations) / totalOperations,
      memoryUsage: {
        average: memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length,
        peak: Math.max(...memoryUsages)
      },
      operationCounts
    };
  }

  getRecentMetrics(duration: number = 3600000): MemorySystemMetrics[] { // Default to last hour
    const cutoffTime = Date.now() - duration;
    return this.metrics.filter(m => m.timestamp >= cutoffTime);
  }

  clearMetrics(): void {
    this.metrics = [];
  }
} 