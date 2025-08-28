import { HeyContextBenchmark } from '../index';

/**
 * Basic usage example for the HeyContext Benchmarking System
 * 
 * This example demonstrates how to:
 * 1. Run a quick benchmark
 * 2. Run a full benchmark
 * 3. Export results in different formats
 * 4. Access benchmark data programmatically
 */

async function runBasicExample() {
  console.log('🚀 HeyContext Benchmarking System - Basic Usage Example\n');
  
  try {
    // Initialize the benchmark system
    const benchmark = new HeyContextBenchmark();
    
    // Example 1: Run a quick benchmark (functional tests only)
    console.log('📊 Example 1: Running Quick Benchmark');
    console.log('=' .repeat(50));
    
    const quickResult = await benchmark.runQuickBenchmark();
    
    console.log(`✅ Quick benchmark completed!`);
    console.log(`📈 Overall Score: ${(quickResult.summary.overallScore * 100).toFixed(1)}%`);
    console.log(`🎯 Tests Passed: ${quickResult.summary.passedTests}/${quickResult.summary.totalTests}`);
    console.log(`⏱️  Duration: ${quickResult.summary.totalTests > 0 ? 'N/A' : 'N/A'}\n`);
    
    // Example 2: Run a full benchmark across all categories
    console.log('📊 Example 2: Running Full Benchmark');
    console.log('=' .repeat(50));
    
    const fullResult = await benchmark.runFullBenchmark({
      parallel: true,
      maxConcurrency: 3,
      includeScreenshots: false
    });
    
    console.log(`✅ Full benchmark completed!`);
    console.log(`📈 Overall Score: ${(fullResult.summary.overallScore * 100).toFixed(1)}%`);
    console.log(`🎯 Tests Passed: ${fullResult.summary.passedTests}/${fullResult.summary.totalTests}`);
    
    // Show category breakdown
    console.log('\n📊 Category Breakdown:');
    fullResult.summary.categoryScores.forEach(category => {
      const status = category.averageScore >= 0.7 ? '✅' : 
                     category.averageScore >= 0.5 ? '⚠️' : '❌';
      console.log(`${status} ${category.categoryName}: ${(category.averageScore * 100).toFixed(1)}%`);
    });
    
    // Example 3: Access benchmark data programmatically
    console.log('\n📊 Example 3: Accessing Benchmark Data');
    console.log('=' .repeat(50));
    
    const results = benchmark.getResults();
    const summary = benchmark.getSummary();
    
    console.log(`📋 Total Results: ${results.length}`);
    console.log(`📊 Summary Available: ${summary ? 'Yes' : 'No'}`);
    
    if (results.length > 0) {
      console.log('\n🔍 Sample Test Results:');
      results.slice(0, 3).forEach((result, index) => {
        console.log(`${index + 1}. ${result.testCaseName}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Category: ${result.category}`);
        console.log(`   Duration: ${result.duration}ms`);
        
        if (result.scores.length > 0) {
          const overallScore = result.scores.reduce((sum, score) => sum + score.weightedScore, 0);
          console.log(`   Score: ${(overallScore * 100).toFixed(1)}%`);
        }
        console.log('');
      });
    }
    
    // Example 4: Export results in different formats
    console.log('📊 Example 4: Exporting Results');
    console.log('=' .repeat(50));
    
    // Export as HTML (default)
    const htmlPath = await benchmark.exportResults('html');
    console.log(`✅ HTML report exported to: ${htmlPath}`);
    
    // Export as JSON
    const jsonPath = await benchmark.exportResults('json');
    console.log(`✅ JSON report exported to: ${jsonPath}`);
    
    // Export as Markdown
    const markdownPath = await benchmark.exportResults('markdown');
    console.log(`✅ Markdown report exported to: ${markdownPath}`);
    
    console.log('\n🎉 Basic usage example completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   - Check the generated reports in the benchmark-reports/ directory');
    console.log('   - Run specific test categories: npm run benchmark category functional');
    console.log('   - Run specific tests: npm run benchmark specific memory_consistency_basic');
    console.log('   - Use the CLI: npm run benchmark help');
    
  } catch (error) {
    console.error('❌ Example failed:', error);
    process.exit(1);
  }
}

// Example 5: Custom test execution
async function runCustomExample() {
  console.log('\n🔧 Example 5: Custom Test Execution');
  console.log('=' .repeat(50));
  
  try {
    const benchmark = new HeyContextBenchmark();
    
    // Run specific test cases
    const specificResult = await benchmark.runSpecificTests([
      'memory_consistency_basic',
      'persona_consistency_dating_coach'
    ]);
    
    console.log(`✅ Custom test execution completed!`);
    console.log(`📈 Overall Score: ${(specificResult.summary.overallScore * 100).toFixed(1)}%`);
    console.log(`🎯 Tests Passed: ${specificResult.summary.passedTests}/${specificResult.summary.totalTests}`);
    
    // Show detailed results
    console.log('\n📊 Detailed Results:');
    specificResult.results.forEach(result => {
      console.log(`\n🔍 ${result.testCaseName}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Duration: ${result.duration}ms`);
      
      if (result.scores.length > 0) {
        console.log('   Metric Scores:');
        result.scores.forEach(score => {
          console.log(`     - ${score.metricName}: ${(score.score * 100).toFixed(1)}%`);
          if (score.notes) {
            console.log(`       Notes: ${score.notes}`);
          }
        });
      }
      
      if (result.details.errorDetails) {
        console.log(`   Error: ${result.details.errorDetails}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Custom example failed:', error);
  }
}

// Example 6: Performance monitoring
async function runPerformanceExample() {
  console.log('\n⚡ Example 6: Performance Monitoring');
  console.log('=' .repeat(50));
  
  try {
    const benchmark = new HeyContextBenchmark();
    
    // Run benchmark with performance tracking
    const startTime = process.hrtime.bigint();
    
    const result = await benchmark.runCategoryBenchmark(['functional'], {
      parallel: false // Sequential for accurate timing
    });
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    console.log(`✅ Performance benchmark completed!`);
    console.log(`⏱️  Total Execution Time: ${duration.toFixed(2)}ms`);
    console.log(`📈 Overall Score: ${(result.summary.overallScore * 100).toFixed(1)}%`);
    
    // Calculate performance metrics
    const avgTestTime = result.results.reduce((sum, test) => sum + test.duration, 0) / result.results.length;
    console.log(`📊 Average Test Time: ${avgTestTime.toFixed(2)}ms`);
    
    // Performance analysis
    const slowTests = result.results.filter(test => test.duration > avgTestTime * 2);
    if (slowTests.length > 0) {
      console.log(`🐌 Slow Tests (>${(avgTestTime * 2).toFixed(0)}ms):`);
      slowTests.forEach(test => {
        console.log(`   - ${test.testCaseName}: ${test.duration}ms`);
      });
    }
    
    const fastTests = result.results.filter(test => test.duration < avgTestTime * 0.5);
    if (fastTests.length > 0) {
      console.log(`⚡ Fast Tests (<${(avgTestTime * 0.5).toFixed(0)}ms):`);
      fastTests.forEach(test => {
        console.log(`   - ${test.testCaseName}: ${test.duration}ms`);
      });
    }
    
  } catch (error) {
    console.error('❌ Performance example failed:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting HeyContext Benchmarking Examples\n');
  
  try {
    // Run basic examples
    await runBasicExample();
    
    // Run custom examples
    await runCustomExample();
    
    // Run performance examples
    await runPerformanceExample();
    
    console.log('\n🎉 All examples completed successfully!');
    console.log('\n📚 For more information, check the README.md file');
    
  } catch (error) {
    console.error('❌ Examples failed:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { runBasicExample, runCustomExample, runPerformanceExample };
