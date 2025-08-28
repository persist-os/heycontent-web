# HeyContext Benchmarking System

A comprehensive benchmarking suite for evaluating HeyContext's memory infrastructure and vector search capabilities against traditional stateless AI systems.

## 🎯 Overview

The HeyContext Benchmarking System is designed to prove that HeyContext's memory infrastructure delivers **superior real-world performance** versus traditional stateless AI systems. It moves beyond simple "faster/smarter" metrics to provide **qualitative memory benchmarks** that investors, creators, and developers can immediately understand.

## 🏗️ Architecture

The benchmarking system is organized into several key components:

```
src/benchmarking/
├── types.ts                 # Core type definitions
├── configs/                 # Configuration files
│   └── benchmark-config.ts  # Main benchmark configuration
├── test-runners/            # Test execution engine
│   ├── benchmark-runner.ts  # Main benchmark orchestrator
│   └── test-case-loader.ts  # Test case management
├── grading/                 # Evaluation and scoring
│   └── benchmark-evaluator.ts # Test result evaluation
├── reports/                 # Report generation
│   └── report-generator.ts  # Multi-format report generation
├── index.ts                 # Main entry point
├── cli.ts                   # Command-line interface
└── README.md                # This file
```

## 📊 Benchmark Categories

### 1. Functional Benchmarks (40% weight)
- **Memory consistency** across sessions
- **Persona-awareness** (does it stay "in character" across time?)
- **Context linking** (does Gmail ↔ YouTube ↔ Notes connect meaningfully?)

### 2. User-Centric Benchmarks (35% weight)
- **Reduced repetition** (how often users must re-explain themselves)
- **Continuity of insights** (advice evolving across multiple sessions)
- **Emotional validation** (user satisfaction and engagement)

### 3. System Benchmarks (25% weight)
- **Speed/latency** vs baseline LLM calls
- **Accuracy of recall** (F1-score, precision, recall)
- **Robustness under load** (multiple platforms, shifting personas, long histories)

## 🚀 Quick Start

### Installation

The benchmarking system is already included in your HeyContext project. No additional installation is required.

### Running Your First Benchmark

```bash
# Quick benchmark (functional tests only)
npm run benchmark quick

# Full benchmark across all categories
npm run benchmark full

# Benchmark specific categories
npm run benchmark category functional user-centric

# Run specific test cases
npm run benchmark specific memory_consistency_basic
```

### Using the API

```typescript
import { HeyContextBenchmark } from './src/benchmarking';

const benchmark = new HeyContextBenchmark();

// Run a quick benchmark
const result = await benchmark.runQuickBenchmark();
console.log(`Overall Score: ${(result.summary.overallScore * 100).toFixed(1)}%`);

// Export results
await benchmark.exportResults('html');
```

## 📋 Available Test Cases

### Functional Tests
- `memory_consistency_basic`: Basic memory consistency test
- `persona_consistency_dating_coach`: Dating coach persona consistency
- `context_linking_cross_platform`: Cross-platform context linking

### User-Centric Tests
- `repetition_reduction_workout_plan`: Workout plan continuity
- `insight_continuity_therapy`: Therapy session continuity

### System Tests
- `vector_search_speed`: Vector search performance
- `load_testing_multiple_queries`: Load testing

## ⚙️ Configuration

### Benchmark Configuration

The system uses a centralized configuration in `configs/benchmark-config.ts`:

```typescript
export const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  name: "HeyContext Chat System Benchmark",
  version: "1.0.0",
  testCategories: [
    { id: "functional", weight: 0.4 },
    { id: "user-centric", weight: 0.35 },
    { id: "system", weight: 0.25 }
  ],
  evaluationMetrics: [
    { id: "memory_accuracy", weight: 0.25 },
    { id: "contextual_relevance", weight: 0.25 },
    { id: "user_friction_reduction", weight: 0.2 },
    // ... more metrics
  ]
};
```

### Performance Thresholds

```typescript
export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 0.9,
  GOOD: 0.7,
  ACCEPTABLE: 0.5,
  POOR: 0.3
};
```

## 📈 Evaluation Metrics

### Memory Accuracy (25% weight)
- **Calculation**: LLM evaluation of response relevance to historical context
- **Scoring**: 0-1 scale based on context recall accuracy
- **Penalties**: Asking for information that should be remembered

### Contextual Relevance (25% weight)
- **Calculation**: Semantic similarity between response and retrieved context
- **Scoring**: 0-1 scale based on context utilization
- **Bonus**: Leveraging multiple context sources

### User Friction Reduction (20% weight)
- **Calculation**: Count of clarification requests needed vs baseline
- **Scoring**: 0-1 scale with penalties for repetitive questions
- **Bonus**: Building upon previous context

### Persona Consistency (15% weight)
- **Calculation**: LLM evaluation of persona alignment
- **Scoring**: 0-1 scale based on persona characteristic maintenance
- **Focus**: Maintaining character across sessions

### Vector Search Performance (15% weight)
- **Calculation**: Query time + F1 score of retrieved content
- **Scoring**: 0-1 scale with speed and accuracy components
- **Target**: <2 second query time with >70% relevance

## 📊 Report Generation

The system generates comprehensive reports in multiple formats:

### HTML Reports
- Beautiful, interactive dashboards
- Category performance breakdowns
- Top performer analysis
- Areas for improvement
- Recommendations

### JSON Reports
- Raw data for programmatic analysis
- Complete test results and metrics
- Machine-readable format

### Markdown Reports
- Developer-friendly format
- Easy to include in documentation
- Version control friendly

## 🔧 Extending the System

### Adding New Test Cases

1. **Create the test case** in the appropriate loader method:

```typescript
// In test-case-loader.ts
private async loadFunctionalTestCases(): Promise<TestCase[]> {
  return [
    // ... existing tests
    {
      id: 'my_new_test',
      name: 'My New Test',
      description: 'Description of what this test does',
      category: 'functional',
      input: {
        query: 'Test query',
        context: { /* test context */ }
      },
      expectedOutput: {
        shouldRememberContext: true,
        expectedMemoryAccuracy: 0.8,
        expectedContextualRelevance: 0.9,
        expectedUserFrictionReduction: 0.8,
        specificAssertions: ['Expected behavior 1', 'Expected behavior 2']
      },
      metadata: {
        difficulty: 'medium',
        tags: ['memory', 'new_feature'],
        estimatedDuration: 45,
        requiresExternalAPIs: false,
        platformDependencies: ['conversation']
      }
    }
  ];
}
```

2. **Implement test execution logic** in the benchmark runner:

```typescript
// In benchmark-runner.ts
private async executeTest(testCase: TestCase): Promise<any> {
  switch (testCase.id) {
    case 'my_new_test':
      return await this.executeMyNewTest(testCase);
    default:
      return this.executeDefaultTest(testCase);
  }
}
```

### Adding New Evaluation Metrics

1. **Define the metric** in the configuration:

```typescript
// In benchmark-config.ts
evaluationMetrics: [
  // ... existing metrics
  {
    id: "my_new_metric",
    name: "My New Metric",
    description: "Description of what this metric measures",
    type: "quantitative",
    scale: "0-1",
    weight: 0.1,
    calculationMethod: "How this metric is calculated"
  }
]
```

2. **Implement evaluation logic** in the evaluator:

```typescript
// In benchmark-evaluator.ts
private async evaluateMyNewMetric(testCase: TestCase, actualOutput: any): Promise<MetricScore> {
  const metric = this.config.evaluationMetrics.find(m => m.id === 'my_new_metric')!;
  
  // Implement your evaluation logic here
  const score = this.calculateMyNewMetricScore(testCase, actualOutput);
  
  return {
    metricId: metric.id,
    metricName: metric.name,
    score,
    maxScore: 1,
    weight: metric.weight,
    weightedScore: score * metric.weight,
    notes: `My new metric score: ${(score * 100).toFixed(1)}%`
  };
}
```

### Adding New Report Formats

1. **Extend the ReportGenerator** class:

```typescript
// In report-generator.ts
async generateReport(
  benchmarkRun: BenchmarkRun, 
  format: 'json' | 'html' | 'markdown' | 'my_new_format', 
  outputPath?: string
): Promise<string> {
  switch (format) {
    case 'my_new_format':
      return this.generateMyNewFormatReport(benchmarkRun);
    // ... existing formats
  }
}

private generateMyNewFormatReport(benchmarkRun: BenchmarkRun): string {
  // Implement your custom report format
  return `My custom report format for ${benchmarkRun.id}`;
}
```

## 🧪 Testing the System

### Running Tests

```bash
# Run all tests
npm test

# Run specific test files
npm test -- --testPathPattern=benchmarking

# Run with coverage
npm test -- --coverage --testPathPattern=benchmarking
```

### Test Structure

Tests are organized to mirror the source structure:

```
src/benchmarking/
├── __tests__/
│   ├── test-runners/
│   │   ├── benchmark-runner.test.ts
│   │   └── test-case-loader.test.ts
│   ├── grading/
│   │   └── benchmark-evaluator.test.ts
│   └── reports/
│       └── report-generator.test.ts
```

## 📚 API Reference

### HeyContextBenchmark Class

The main interface for running benchmarks.

#### Methods

- `runQuickBenchmark()`: Run functional tests only
- `runFullBenchmark(options)`: Run all test categories
- `runCategoryBenchmark(categories, options)`: Run specific categories
- `runSpecificTests(testCaseIds)`: Run specific test cases
- `exportResults(format, outputPath)`: Export results to file
- `getResults()`: Get current benchmark results
- `getSummary()`: Get current benchmark summary

#### Options

```typescript
interface BenchmarkOptions {
  parallel?: boolean;           // Run tests in parallel
  maxConcurrency?: number;      // Maximum concurrent tests
  includeScreenshots?: boolean; // Include screenshots in reports
}
```

### BenchmarkRunner Class

Lower-level interface for advanced usage.

#### Methods

- `runBenchmark(options)`: Run benchmark with full control
- `getResults()`: Get benchmark results
- `getSummary()`: Get benchmark summary
- `exportResults(format, outputPath)`: Export results

## 🚨 Troubleshooting

### Common Issues

1. **Tests failing with "Evaluation failed"**
   - Check that all required dependencies are available
   - Verify test case configuration is correct
   - Check console logs for specific error details

2. **Reports not generating**
   - Ensure the `benchmark-reports` directory exists
   - Check file permissions for the output directory
   - Verify the report format is supported

3. **Performance issues**
   - Reduce concurrency with `--concurrency` option
   - Run tests sequentially by removing `--parallel` flag
   - Check system resources during benchmark execution

### Debug Mode

Enable detailed logging by setting the `DEBUG` environment variable:

```bash
DEBUG=* npm run benchmark full
```

## 🔮 Future Enhancements

### Planned Features

1. **LLM Integration**: Direct integration with OpenAI, Claude, and other LLMs for automated evaluation
2. **Real-time Monitoring**: Live dashboard for benchmark execution
3. **Performance Profiling**: Detailed performance analysis and bottleneck identification
4. **Test Case Templates**: Pre-built templates for common testing scenarios
5. **Continuous Integration**: GitHub Actions integration for automated benchmarking

### Contributing

To contribute to the benchmarking system:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For questions or issues with the benchmarking system:

1. Check this README for common solutions
2. Review the test cases for examples
3. Check the console output for error details
4. Create an issue in the repository

## 📄 License

This benchmarking system is part of the HeyContext project and follows the same licensing terms.
