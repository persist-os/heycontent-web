import { PlatformContentData } from '@/store/content-store';

// Performance metrics interface
export interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  scrollLatency: number;
  memoryUsage: number;
  itemsRendered: number;
  itemsInViewport: number;
  scrollVelocity: number;
  jankScore: number; // 0-100, lower is better
  timestamp: number;
}

// Performance thresholds
export interface PerformanceThresholds {
  minFPS: number;
  maxRenderTime: number;
  maxScrollLatency: number;
  maxMemoryUsage: number; // MB
  maxJankScore: number;
}

// Default performance thresholds
export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  minFPS: 55, // Target 60 FPS, warn below 55
  maxRenderTime: 16, // 16ms for 60fps
  maxScrollLatency: 5, // 5ms max scroll latency
  maxMemoryUsage: 100, // 100MB max memory usage
  maxJankScore: 20, // Acceptable jank score
};

// Performance monitor class
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private platform: keyof PlatformContentData;
  private isMonitoring: boolean = false;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private monitoringStartTime: number = 0;
  private renderTimes: number[] = [];
  private scrollLatencies: number[] = [];
  private jankEvents: number[] = [];
  private maxMetricsHistory: number = 100;
  private rafId: number | null = null;
  private observers: Array<(metrics: PerformanceMetrics) => void> = [];

  constructor(platform: keyof PlatformContentData, thresholds: Partial<PerformanceThresholds> = {}) {
    this.platform = platform;
    this.thresholds = { ...DEFAULT_PERFORMANCE_THRESHOLDS, ...thresholds };
  }

  // Start monitoring performance
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameCount = 0;
    this.monitoringStartTime = performance.now();
    this.lastFrameTime = this.monitoringStartTime;
    
    // Start frame monitoring
    this.monitorFrames();
    
    // Start memory monitoring
    this.monitorMemory();
    
    console.log(`[PERFORMANCE] Started monitoring for ${this.platform}`);
  }

  // Stop monitoring performance
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    console.log(`[PERFORMANCE] Stopped monitoring for ${this.platform}`);
  }

  // Monitor frame rate and jank
  private monitorFrames(): void {
    const frameCallback = (timestamp: number) => {
      if (!this.isMonitoring) return;
      
      this.frameCount++;
      
      // Calculate frame time
      const frameTime = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;
      
      // Track jank (frames taking longer than 16.67ms)
      if (frameTime > 16.67) {
        this.jankEvents.push(timestamp);
      }
      
      // Calculate metrics every 60 frames (~1 second at 60fps)
      if (this.frameCount % 60 === 0) {
        this.calculateMetrics();
      }
      
      this.rafId = requestAnimationFrame(frameCallback);
    };
    
    this.rafId = requestAnimationFrame(frameCallback);
  }

  // Monitor memory usage
  private monitorMemory(): void {
    const memoryCallback = () => {
      if (!this.isMonitoring) return;
      
      // Record current memory usage
      const memoryUsage = this.getMemoryUsage();
      
      // Store memory usage in performance metrics if available
      if (this.metrics.length > 0) {
        const latestMetrics = this.metrics[this.metrics.length - 1];
        latestMetrics.memoryUsage = memoryUsage;
      }
      
      // Schedule next memory check
      setTimeout(memoryCallback, 1000); // Check every second
    };
    
    memoryCallback();
  }

  // Calculate current performance metrics
  private calculateMetrics(): void {
    const now = performance.now();
    
    // Calculate FPS properly using elapsed time since monitoring started
    const elapsedSeconds = (now - this.monitoringStartTime) / 1000;
    const fps = elapsedSeconds > 0 ? this.frameCount / elapsedSeconds : 0;
    
    // Calculate average render time
    const avgRenderTime = this.renderTimes.length > 0 
      ? this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length 
      : 0;
    
    // Calculate average scroll latency
    const avgScrollLatency = this.scrollLatencies.length > 0
      ? this.scrollLatencies.reduce((sum, time) => sum + time, 0) / this.scrollLatencies.length
      : 0;
    
    // Calculate jank score
    const jankScore = this.calculateJankScore();
    
    // Get memory usage
    const memoryUsage = this.getMemoryUsage();
    
    const metrics: PerformanceMetrics = {
      fps: Math.round(fps),
      renderTime: Math.round(avgRenderTime * 100) / 100,
      scrollLatency: Math.round(avgScrollLatency * 100) / 100,
      memoryUsage: Math.round(memoryUsage * 100) / 100,
      itemsRendered: 0, // Will be set by component
      itemsInViewport: 0, // Will be set by component
      scrollVelocity: 0, // Will be set by component
      jankScore: Math.round(jankScore),
      timestamp: now,
    };
    
    this.recordMetrics(metrics);
    this.notifyObservers(metrics);
    
    // Reset counters
    this.renderTimes = [];
    this.scrollLatencies = [];
    this.cleanupOldJankEvents();
  }

  // Calculate jank score (0-100, lower is better)
  private calculateJankScore(): number {
    const oneSecondAgo = performance.now() - 1000;
    const recentJankEvents = this.jankEvents.filter(time => time > oneSecondAgo);
    
    // Score based on frequency and severity of jank
    const jankFrequency = recentJankEvents.length;
    const maxJankEvents = 10; // Arbitrary max for scoring
    
    return Math.min(100, (jankFrequency / maxJankEvents) * 100);
  }

  // Get memory usage in MB
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }

  // Clean up old jank events
  private cleanupOldJankEvents(): void {
    const fiveSecondsAgo = performance.now() - 5000;
    this.jankEvents = this.jankEvents.filter(time => time > fiveSecondsAgo);
  }

  // Record render time
  recordRenderTime(renderTime: number): void {
    this.renderTimes.push(renderTime);
    
    // Keep only recent render times
    if (this.renderTimes.length > 60) {
      this.renderTimes = this.renderTimes.slice(-60);
    }
  }

  // Record scroll latency
  recordScrollLatency(latency: number): void {
    this.scrollLatencies.push(latency);
    
    // Keep only recent scroll latencies
    if (this.scrollLatencies.length > 60) {
      this.scrollLatencies = this.scrollLatencies.slice(-60);
    }
  }

  // Update item counts
  updateItemCounts(itemsRendered: number, itemsInViewport: number): void {
    if (this.metrics.length > 0) {
      const latestMetrics = this.metrics[this.metrics.length - 1];
      latestMetrics.itemsRendered = itemsRendered;
      latestMetrics.itemsInViewport = itemsInViewport;
    }
  }

  // Update scroll velocity
  updateScrollVelocity(velocity: number): void {
    if (this.metrics.length > 0) {
      const latestMetrics = this.metrics[this.metrics.length - 1];
      latestMetrics.scrollVelocity = velocity;
    }
  }

  // Record metrics
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep metrics history under limit
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  // Get current metrics
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  // Get metrics history
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Get performance summary
  getPerformanceSummary() {
    if (this.metrics.length === 0) return null;
    
    const recentMetrics = this.metrics.slice(-10); // Last 10 metrics
    
    const avgFPS = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    const avgRenderTime = recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / recentMetrics.length;
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    const avgJankScore = recentMetrics.reduce((sum, m) => sum + m.jankScore, 0) / recentMetrics.length;
    
    const performanceScore = this.calculatePerformanceScore(avgFPS, avgRenderTime, avgMemoryUsage, avgJankScore);
    
    return {
      averageFPS: Math.round(avgFPS),
      averageRenderTime: Math.round(avgRenderTime * 100) / 100,
      averageMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
      averageJankScore: Math.round(avgJankScore),
      performanceScore: Math.round(performanceScore),
      performanceGrade: this.getPerformanceGrade(performanceScore),
      isPerformant: performanceScore >= 80,
      warnings: this.getPerformanceWarnings(),
    };
  }

  // Calculate overall performance score (0-100)
  private calculatePerformanceScore(fps: number, renderTime: number, memoryUsage: number, jankScore: number): number {
    const fpsScore = Math.min(100, (fps / this.thresholds.minFPS) * 100);
    const renderTimeScore = Math.max(0, 100 - ((renderTime / this.thresholds.maxRenderTime) * 100));
    const memoryScore = Math.max(0, 100 - ((memoryUsage / this.thresholds.maxMemoryUsage) * 100));
    const jankScoreNormalized = Math.max(0, 100 - jankScore);
    
    // Weighted average
    return (fpsScore * 0.3 + renderTimeScore * 0.3 + memoryScore * 0.2 + jankScoreNormalized * 0.2);
  }

  // Get performance grade
  private getPerformanceGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // Get performance warnings
  private getPerformanceWarnings(): string[] {
    const warnings: string[] = [];
    const current = this.getCurrentMetrics();
    
    if (!current) return warnings;
    
    if (current.fps < this.thresholds.minFPS) {
      warnings.push(`Low FPS: ${current.fps} (target: ${this.thresholds.minFPS})`);
    }
    
    if (current.renderTime > this.thresholds.maxRenderTime) {
      warnings.push(`High render time: ${current.renderTime}ms (target: ${this.thresholds.maxRenderTime}ms)`);
    }
    
    if (current.memoryUsage > this.thresholds.maxMemoryUsage) {
      warnings.push(`High memory usage: ${current.memoryUsage}MB (target: ${this.thresholds.maxMemoryUsage}MB)`);
    }
    
    if (current.jankScore > this.thresholds.maxJankScore) {
      warnings.push(`High jank score: ${current.jankScore} (target: ${this.thresholds.maxJankScore})`);
    }
    
    return warnings;
  }

  // Subscribe to metrics updates
  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(observer);
    
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }

  // Notify observers
  private notifyObservers(metrics: PerformanceMetrics): void {
    this.observers.forEach(observer => {
      try {
        observer(metrics);
      } catch (error) {
        console.error('Error in performance metrics observer:', error);
      }
    });
  }

  // Destroy monitor
  destroy(): void {
    this.stopMonitoring();
    this.metrics = [];
    this.renderTimes = [];
    this.scrollLatencies = [];
    this.jankEvents = [];
    this.observers = [];
  }
}

// Performance optimization utilities
export const PerformanceOptimizer = {
  // Debounce scroll events
  debounceScroll: (callback: () => void, delay: number = 16) => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  },

  // Throttle scroll events
  throttleScroll: (callback: () => void, delay: number = 16) => {
    let isThrottled = false;
    return () => {
      if (!isThrottled) {
        callback();
        isThrottled = true;
        setTimeout(() => {
          isThrottled = false;
        }, delay);
      }
    };
  },

  // Optimize render function
  optimizeRender: <T extends (...args: any[]) => any>(fn: T, monitor: PerformanceMonitor): T => {
    return ((...args: Parameters<T>) => {
      const startTime = performance.now();
      const result = fn(...args);
      const endTime = performance.now();
      
      monitor.recordRenderTime(endTime - startTime);
      
      return result;
    }) as T;
  },

  // Check if device is low-end
  isLowEndDevice: (): boolean => {
    // Check for indicators of low-end devices
    const navigator = window.navigator;
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const memory = (navigator as any).deviceMemory || 1;
    const connection = (navigator as any).connection;
    
    // Low-end indicators
    if (hardwareConcurrency <= 2) return true;
    if (memory <= 2) return true;
    if (connection && connection.effectiveType === 'slow-2g') return true;
    
    return false;
  },

  // Get optimal configuration for device
  getOptimalConfig: () => {
    const isLowEnd = PerformanceOptimizer.isLowEndDevice();
    
    return {
      pageSize: isLowEnd ? 10 : 20,
      maxItemsInMemory: isLowEnd ? 200 : 500,
      overscan: isLowEnd ? 3 : 5,
      enableVirtualization: true,
      enableLazyLoading: true,
      debounceDelay: isLowEnd ? 32 : 16, // 30fps vs 60fps
      throttleDelay: isLowEnd ? 32 : 16,
    };
  },

  // Measure component performance
  measureComponent: (componentName: string, fn: () => void): number => {
    const startTime = performance.now();
    fn();
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${componentName}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  },

  // Memory pressure detection
  detectMemoryPressure: (): boolean => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedRatio = memory.usedJSHeapSize / memory.totalJSHeapSize;
      return usedRatio > 0.8; // 80% memory usage
    }
    return false;
  },

  // Frame budget checker
  checkFrameBudget: (startTime: number, budgetMs: number = 16): boolean => {
    const elapsed = performance.now() - startTime;
    return elapsed < budgetMs;
  },
};

// Hook for performance monitoring
export function usePerformanceMonitor(
  platform: keyof PlatformContentData,
  thresholds?: Partial<PerformanceThresholds>
) {
  const monitor = new PerformanceMonitor(platform, thresholds);
  
  return {
    monitor,
    startMonitoring: () => monitor.startMonitoring(),
    stopMonitoring: () => monitor.stopMonitoring(),
    recordRenderTime: (time: number) => monitor.recordRenderTime(time),
    recordScrollLatency: (latency: number) => monitor.recordScrollLatency(latency),
    updateItemCounts: (rendered: number, inViewport: number) => monitor.updateItemCounts(rendered, inViewport),
    updateScrollVelocity: (velocity: number) => monitor.updateScrollVelocity(velocity),
    getCurrentMetrics: () => monitor.getCurrentMetrics(),
    getPerformanceSummary: () => monitor.getPerformanceSummary(),
    subscribe: (observer: (metrics: PerformanceMetrics) => void) => monitor.subscribe(observer),
    destroy: () => monitor.destroy(),
  };
}

// Performance monitoring context
export interface PerformanceContext {
  isMonitoring: boolean;
  metrics: PerformanceMetrics | null;
  summary: ReturnType<PerformanceMonitor['getPerformanceSummary']>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

// Global performance monitoring utilities
export const GlobalPerformanceMonitor = {
  monitors: new Map<keyof PlatformContentData, PerformanceMonitor>(),
  
  // Start monitoring all platforms
  startGlobalMonitoring: () => {
    const platforms: Array<keyof PlatformContentData> = ['notes', 'youtube', 'instagram', 'gmail', 'insights'];
    
    platforms.forEach(platform => {
      const monitor = new PerformanceMonitor(platform);
      monitor.startMonitoring();
      GlobalPerformanceMonitor.monitors.set(platform, monitor);
    });
  },
  
  // Stop monitoring all platforms
  stopGlobalMonitoring: () => {
    GlobalPerformanceMonitor.monitors.forEach(monitor => monitor.stopMonitoring());
    GlobalPerformanceMonitor.monitors.clear();
  },
  
  // Get global performance summary
  getGlobalSummary: () => {
    const summaries: Record<keyof PlatformContentData, any> = {} as any;
    
    GlobalPerformanceMonitor.monitors.forEach((monitor, platform) => {
      summaries[platform] = monitor.getPerformanceSummary();
    });
    
    return summaries;
  },
  
  // Check if any platform is underperforming
  hasPerformanceIssues: (): boolean => {
    return Array.from(GlobalPerformanceMonitor.monitors.values()).some(monitor => {
      const summary = monitor.getPerformanceSummary();
      return summary && !summary.isPerformant;
    });
  },
}; 