import { 
  BenchmarkConfig, 
  BenchmarkResult, 
  BenchmarkSummary, 
  BenchmarkRun,
  TestCase,
  TestCategory,
  EnvironmentInfo,
  RunMetadata,
  MetricScore,
  CategoryScore,
  TopPerformer
} from '../types';
import { DEFAULT_BENCHMARK_CONFIG } from '../configs/benchmark-config';
import { BenchmarkEvaluator } from '../grading/benchmark-evaluator';
import { ReportGenerator } from '../reports/report-generator';
import { TestCaseLoader } from './test-case-loader';

export class BenchmarkRunner {
  private config: BenchmarkConfig;
  private evaluator: BenchmarkEvaluator;
  private reportGenerator: ReportGenerator;
  private testCaseLoader: TestCaseLoader;
  private results: BenchmarkResult[] = [];
  private startTime: Date;
  private endTime?: Date;

  constructor(config?: Partial<BenchmarkConfig>) {
    this.config = { ...DEFAULT_BENCHMARK_CONFIG, ...config };
    this.evaluator = new BenchmarkEvaluator();
    this.reportGenerator = new ReportGenerator();
    this.testCaseLoader = new TestCaseLoader();
    this.startTime = new Date();
  }

  /**
   * Run the complete benchmark suite
   */
  async runBenchmark(options: {
    categories?: string[];
    testCases?: string[];
    includeScreenshots?: boolean;
    parallel?: boolean;
    maxConcurrency?: number;
  } = {}): Promise<BenchmarkRun> {
    console.log('🚀 Starting HeyContext Benchmark Suite...');
    console.log(`📊 Configuration: ${this.config.name} v${this.config.version}`);
    
    try {
      // Load test cases
      const testCases = await this.loadTestCases(options);
      console.log(`📋 Loaded ${testCases.length} test cases`);

      // Execute tests
      if (options.parallel) {
        await this.runTestsParallel(testCases, options.maxConcurrency || 3);
      } else {
        await this.runTestsSequential(testCases);
      }

      // Generate summary
      const summary = this.generateSummary();
      
      // Generate environment info
      const environment = await this.getEnvironmentInfo();
      
      // Generate run metadata
      const metadata = await this.getRunMetadata();

      this.endTime = new Date();

      const benchmarkRun: BenchmarkRun = {
        id: this.generateRunId(),
        timestamp: this.startTime.toISOString(),
        config: this.config,
        results: this.results,
        summary,
        environment,
        metadata
      };

      console.log('✅ Benchmark completed successfully!');
      console.log(`📈 Overall Score: ${(summary.overallScore * 100).toFixed(1)}%`);
      console.log(`🎯 Tests Passed: ${summary.passedTests}/${summary.totalTests}`);

      return benchmarkRun;

    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      throw error;
    }
  }

  /**
   * Load test cases based on options
   */
  private async loadTestCases(options: {
    categories?: string[];
    testCases?: string[];
  }): Promise<TestCase[]> {
    let allTestCases: TestCase[] = [];

    if (options.testCases && options.testCases.length > 0) {
      // Load specific test cases
      allTestCases = await this.testCaseLoader.loadSpecificTestCases(options.testCases);
    } else if (options.categories && options.categories.length > 0) {
      // Load test cases by category
      allTestCases = await this.testCaseLoader.loadTestCasesByCategory(options.categories);
    } else {
      // Load all test cases
      allTestCases = await this.testCaseLoader.loadAllTestCases();
    }

    return allTestCases;
  }

  /**
   * Run tests sequentially
   */
  private async runTestsSequential(testCases: TestCase[]): Promise<void> {
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🔄 Running test ${i + 1}/${testCases.length}: ${testCase.name}`);
      
      try {
        const result = await this.executeTestCase(testCase);
        this.results.push(result);
        
        const status = result.status === 'passed' ? '✅' : 
                      result.status === 'failed' ? '❌' : 
                      result.status === 'error' ? '💥' : '⏭️';
        console.log(`${status} ${testCase.name}: ${result.status}`);
        
      } catch (error) {
        console.error(`💥 Error executing test case ${testCase.name}:`, error);
        const errorResult = this.createErrorResult(testCase, error);
        this.results.push(errorResult);
      }
    }
  }

  /**
   * Run tests in parallel with concurrency control
   */
  private async runTestsParallel(testCases: TestCase[], maxConcurrency: number): Promise<void> {
    const chunks = this.chunkArray(testCases, maxConcurrency);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`\n🔄 Running batch ${i + 1}/${chunks.length} (${chunk.length} tests in parallel)`);
      
      const promises = chunk.map(async (testCase) => {
        try {
          const result = await this.executeTestCase(testCase);
          return result;
        } catch (error) {
          console.error(`💥 Error executing test case ${testCase.name}:`, error);
          return this.createErrorResult(testCase, error);
        }
      });

      const chunkResults = await Promise.all(promises);
      this.results.push(...chunkResults);
      
      // Log batch results
      chunkResults.forEach(result => {
        const status = result.status === 'passed' ? '✅' : 
                      result.status === 'failed' ? '❌' : 
                      result.status === 'error' ? '💥' : '⏭️';
        console.log(`${status} ${result.testCaseName}: ${result.status}`);
      });
    }
  }

  /**
   * Execute a single test case
   */
  private async executeTestCase(testCase: TestCase): Promise<BenchmarkResult> {
    const startTime = new Date();
    const logs: string[] = [];
    
    try {
      logs.push(`Starting test case: ${testCase.name}`);
      
      // Execute the test case
      const actualOutput = await this.executeTest(testCase);
      
      // Evaluate results
      const scores = await this.evaluator.evaluateTestCase(testCase, actualOutput);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const result: BenchmarkResult = {
        testCaseId: testCase.id,
        testCaseName: testCase.name,
        category: testCase.category,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        status: this.determineTestStatus(scores),
        scores,
        details: {
          input: testCase.input,
          actualOutput,
          expectedOutput: testCase.expectedOutput,
          memoryAccuracy: this.getScoreByMetric(scores, 'memory_accuracy'),
          contextualRelevance: this.getScoreByMetric(scores, 'contextual_relevance'),
          userFrictionReduction: this.getScoreByMetric(scores, 'user_friction_reduction'),
          vectorSearchPerformance: this.extractVectorSearchPerformance(actualOutput)
        },
        logs
      };

      return result;

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      logs.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        testCaseId: testCase.id,
        testCaseName: testCase.name,
        category: testCase.category,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        status: 'error',
        scores: [],
        details: {
          input: testCase.input,
          actualOutput: null,
          expectedOutput: testCase.expectedOutput,
          memoryAccuracy: 0,
          contextualRelevance: 0,
          userFrictionReduction: 0,
          errorDetails: error instanceof Error ? error.message : String(error)
        },
        logs
      };
    }
  }

  /**
   * Execute the actual test logic
   */
  private async executeTest(testCase: TestCase): Promise<any> {
    // This will be implemented based on the specific test case type
    // For now, we'll return a mock response
    return {
      response: `Mock response for test case: ${testCase.name}`,
      vectorSearchResults: [],
      executionTime: Date.now()
    };
  }

  /**
   * Create error result for failed test cases
   */
  private createErrorResult(testCase: TestCase, error: any): BenchmarkResult {
    return {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      category: testCase.category,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: 0,
      status: 'error',
      scores: [],
      details: {
        input: testCase.input,
        actualOutput: null,
        expectedOutput: testCase.expectedOutput,
        memoryAccuracy: 0,
        contextualRelevance: 0,
        userFrictionReduction: 0,
        errorDetails: error instanceof Error ? error.message : String(error)
      },
      logs: [`Error: ${error instanceof Error ? error.message : String(error)}`]
    };
  }

  /**
   * Determine test status based on scores
   */
  private determineTestStatus(scores: MetricScore[]): 'passed' | 'failed' | 'error' | 'skipped' {
    if (scores.length === 0) return 'error';
    
    const overallScore = scores.reduce((sum, score) => sum + score.weightedScore, 0);
    return overallScore >= 0.7 ? 'passed' : 'failed';
  }

  /**
   * Get score by metric ID
   */
  private getScoreByMetric(scores: MetricScore[], metricId: string): number {
    const score = scores.find(s => s.metricId === metricId);
    return score ? score.score : 0;
  }

  /**
   * Extract vector search performance metrics
   */
  private extractVectorSearchPerformance(actualOutput: any): any {
    // This will be implemented based on the actual output structure
    return {
      queryTime: 0,
      resultsCount: 0,
      topResultScore: 0,
      relevanceDistribution: [],
      contextInjectionSuccess: false
    };
  }

  /**
   * Generate benchmark summary
   */
  private generateSummary(): BenchmarkSummary {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const errorTests = this.results.filter(r => r.status === 'error').length;
    const skippedTests = this.results.filter(r => r.status === 'skipped').length;

    // Calculate overall score
    const overallScore = this.results.length > 0 
      ? this.results.reduce((sum, result) => {
          const resultScore = result.scores.reduce((s, score) => s + score.weightedScore, 0);
          return sum + resultScore;
        }, 0) / this.results.length
      : 0;

    // Generate category scores
    const categoryScores = this.generateCategoryScores();

    // Find top performers
    const topPerformers = this.findTopPerformers();

    // Identify areas for improvement
    const areasForImprovement = this.identifyAreasForImprovement();

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      errorTests,
      overallScore,
      categoryScores,
      topPerformers,
      areasForImprovement,
      recommendations
    };
  }

  /**
   * Generate category scores
   */
  private generateCategoryScores(): CategoryScore[] {
    const categoryMap = new Map<string, CategoryScore>();

    this.results.forEach(result => {
      if (!categoryMap.has(result.category)) {
        categoryMap.set(result.category, {
          categoryId: result.category,
          categoryName: result.category,
          totalTests: 0,
          passedTests: 0,
          averageScore: 0,
          weight: 0,
          weightedScore: 0
        });
      }

      const category = categoryMap.get(result.category)!;
      category.totalTests++;
      if (result.status === 'passed') category.passedTests++;

      const resultScore = result.scores.reduce((sum, score) => sum + score.weightedScore, 0);
      category.averageScore = (category.averageScore * (category.totalTests - 1) + resultScore) / category.totalTests;
    });

    return Array.from(categoryMap.values());
  }

  /**
   * Find top performing test cases
   */
  private findTopPerformers(): TopPerformer[] {
    return this.results
      .filter(r => r.status === 'passed')
      .map(result => {
        const overallScore = result.scores.reduce((sum, score) => sum + score.weightedScore, 0);
        const strengths = result.scores
          .filter(score => score.score >= 0.8)
          .map(score => score.metricName);

        return {
          testCaseId: result.testCaseId,
          testCaseName: result.testCaseName,
          category: result.category,
          overallScore,
          strengths
        };
      })
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5);
  }

  /**
   * Identify areas for improvement
   */
  private identifyAreasForImprovement(): string[] {
    const areas: string[] = [];
    
    // Check for low scores in specific metrics
    const metricScores = new Map<string, number[]>();
    
    this.results.forEach(result => {
      result.scores.forEach(score => {
        if (!metricScores.has(score.metricId)) {
          metricScores.set(score.metricId, []);
        }
        metricScores.get(score.metricId)!.push(score.score);
      });
    });

    metricScores.forEach((scores, metricId) => {
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (averageScore < 0.6) {
        areas.push(`Low performance in ${metricId} (average: ${(averageScore * 100).toFixed(1)}%)`);
      }
    });

    // Check for high error rates
    const errorRate = this.results.filter(r => r.status === 'error').length / this.results.length;
    if (errorRate > 0.1) {
      areas.push(`High error rate: ${(errorRate * 100).toFixed(1)}% of tests failed`);
    }

    return areas;
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze performance patterns
    const passedTests = this.results.filter(r => r.status === 'passed');
    const failedTests = this.results.filter(r => r.status === 'failed');
    
    if (failedTests.length > 0) {
      recommendations.push(`Focus on improving ${failedTests.length} failed test cases`);
    }

    // Check for specific metric weaknesses
    const metricScores = new Map<string, number[]>();
    this.results.forEach(result => {
      result.scores.forEach(score => {
        if (!metricScores.has(score.metricId)) {
          metricScores.set(score.metricId, []);
        }
        metricScores.get(score.metricId)!.push(score.score);
      });
    });

    metricScores.forEach((scores, metricId) => {
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (averageScore < 0.7) {
        recommendations.push(`Improve ${metricId} performance (current: ${(averageScore * 100).toFixed(1)}%)`);
      }
    });

    return recommendations;
  }

  /**
   * Get environment information
   */
  private async getEnvironmentInfo(): Promise<EnvironmentInfo> {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        total: 0, // Will be populated with actual values
        free: 0,
        used: 0
      },
      convexVersion: '1.24.6', // From package.json
      testDataSize: 0 // Will be populated based on actual test data
    };
  }

  /**
   * Get run metadata
   */
  private async getRunMetadata(): Promise<RunMetadata> {
    // This would typically get git information
    return {
      branch: 'feature/chat-benchmarking-environment',
      commit: 'development',
      author: 'HeyContext Team',
      description: 'Initial benchmarking environment setup',
      tags: ['benchmarking', 'chat-system', 'vector-search']
    };
  }

  /**
   * Generate unique run ID
   */
  private generateRunId(): string {
    return `benchmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper method to chunk array for parallel processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get benchmark results
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }

  /**
   * Get benchmark summary
   */
  getSummary(): BenchmarkSummary | null {
    if (this.results.length === 0) return null;
    return this.generateSummary();
  }

  /**
   * Export results to specified format
   */
  async exportResults(format: 'json' | 'html' | 'markdown', outputPath?: string): Promise<string> {
    const benchmarkRun: BenchmarkRun = {
      id: this.generateRunId(),
      timestamp: this.startTime.toISOString(),
      config: this.config,
      results: this.results,
      summary: this.generateSummary(),
      environment: await this.getEnvironmentInfo(),
      metadata: await this.getRunMetadata()
    };

    return this.reportGenerator.generateReport(benchmarkRun, format, outputPath);
  }
}
