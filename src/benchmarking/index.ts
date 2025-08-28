// Main entry point for the HeyContext Benchmarking System
export { BenchmarkRunner } from './test-runners/benchmark-runner';
export { TestCaseLoader } from './test-runners/test-case-loader';
export { BenchmarkEvaluator } from './grading/benchmark-evaluator';
export { ReportGenerator } from './reports/report-generator';

// Types
export * from './types';

// Configuration
export * from './configs/benchmark-config';

// Simple interface for running benchmarks
export class HeyContextBenchmark {
  private runner: BenchmarkRunner;

  constructor() {
    this.runner = new BenchmarkRunner();
  }

  /**
   * Run a quick benchmark with default settings
   */
  async runQuickBenchmark(): Promise<any> {
    console.log('🚀 Running quick benchmark...');
    
    try {
      const result = await this.runner.runBenchmark({
        categories: ['functional'], // Start with functional tests only
        parallel: false,
        includeScreenshots: false
      });
      
      console.log('✅ Quick benchmark completed!');
      return result;
      
    } catch (error) {
      console.error('❌ Quick benchmark failed:', error);
      throw error;
    }
  }

  /**
   * Run a comprehensive benchmark across all categories
   */
  async runFullBenchmark(options: {
    parallel?: boolean;
    maxConcurrency?: number;
    includeScreenshots?: boolean;
  } = {}): Promise<any> {
    console.log('🚀 Running full benchmark...');
    
    try {
      const result = await this.runner.runBenchmark({
        parallel: options.parallel || false,
        maxConcurrency: options.maxConcurrency || 3,
        includeScreenshots: options.includeScreenshots || false
      });
      
      console.log('✅ Full benchmark completed!');
      return result;
      
    } catch (error) {
      console.error('❌ Full benchmark failed:', error);
      throw error;
    }
  }

  /**
   * Run benchmark for specific categories
   */
  async runCategoryBenchmark(categories: string[], options: {
    parallel?: boolean;
    maxConcurrency?: number;
  } = {}): Promise<any> {
    console.log(`🚀 Running benchmark for categories: ${categories.join(', ')}`);
    
    try {
      const result = await this.runner.runBenchmark({
        categories,
        parallel: options.parallel || false,
        maxConcurrency: options.maxConcurrency || 3
      });
      
      console.log('✅ Category benchmark completed!');
      return result;
      
    } catch (error) {
      console.error('❌ Category benchmark failed:', error);
      throw error;
    }
  }

  /**
   * Run specific test cases
   */
  async runSpecificTests(testCaseIds: string[]): Promise<any> {
    console.log(`🚀 Running specific test cases: ${testCaseIds.join(', ')}`);
    
    try {
      const result = await this.runner.runBenchmark({
        testCases: testCaseIds,
        parallel: false
      });
      
      console.log('✅ Specific tests completed!');
      return result;
      
    } catch (error) {
      console.error('❌ Specific tests failed:', error);
      throw error;
    }
  }

  /**
   * Export results in specified format
   */
  async exportResults(format: 'json' | 'html' | 'markdown', outputPath?: string): Promise<string> {
    return this.runner.exportResults(format, outputPath);
  }

  /**
   * Get current results
   */
  getResults() {
    return this.runner.getResults();
  }

  /**
   * Get current summary
   */
  getSummary() {
    return this.runner.getSummary();
  }
}

// Default export for easy importing
export default HeyContextBenchmark;
