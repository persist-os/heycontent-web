#!/usr/bin/env node

import { HeyContextBenchmark } from './index';
import { DEFAULT_BENCHMARK_CONFIG } from './configs/benchmark-config';

// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0];

// Help text
const helpText = `
HeyContext Benchmark CLI

Usage:
  npm run benchmark [command] [options]

Commands:
  quick           Run a quick benchmark (functional tests only)
  full            Run a comprehensive benchmark across all categories
  category        Run benchmark for specific categories
  specific        Run specific test cases
  help            Show this help message

Options:
  --parallel      Run tests in parallel
  --concurrency   Maximum concurrent tests (default: 3)
  --screenshots   Include screenshots in reports
  --format        Output format: json, html, markdown (default: html)
  --output        Custom output path for reports

Examples:
  npm run benchmark quick
  npm run benchmark full --parallel --concurrency 5
  npm run benchmark category functional user-centric
  npm run benchmark specific memory_consistency_basic persona_consistency_dating_coach
  npm run benchmark full --format markdown --output ./my-report.md

Categories:
  - functional: Memory consistency, persona awareness, context linking
  - user-centric: Repetition reduction, insight continuity, emotional validation
  - system: Speed, accuracy, robustness under load
`;

// Main CLI function
async function main() {
  try {
    const benchmark = new HeyContextBenchmark();
    
    switch (command) {
      case 'quick':
        await runQuickBenchmark(benchmark);
        break;
        
      case 'full':
        await runFullBenchmark(benchmark);
        break;
        
      case 'category':
        await runCategoryBenchmark(benchmark);
        break;
        
      case 'specific':
        await runSpecificTests(benchmark);
        break;
        
      case 'help':
      case '--help':
      case '-h':
        console.log(helpText);
        break;
        
      default:
        if (!command) {
          console.log('No command specified. Use "npm run benchmark help" for usage information.');
        } else {
          console.log(`Unknown command: ${command}`);
          console.log('Use "npm run benchmark help" for usage information.');
        }
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Quick benchmark command
async function runQuickBenchmark(benchmark: HeyContextBenchmark) {
  console.log('🚀 Starting quick benchmark...');
  console.log('📋 This will run functional tests only for a quick assessment.\n');
  
  const startTime = Date.now();
  const result = await benchmark.runQuickBenchmark();
  const duration = Date.now() - startTime;
  
  console.log('\n📊 Quick Benchmark Results:');
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📈 Overall Score: ${(result.summary.overallScore * 100).toFixed(1)}%`);
  console.log(`✅ Tests Passed: ${result.summary.passedTests}/${result.summary.totalTests}`);
  
  // Export results
  const format = getFormatOption();
  const outputPath = await benchmark.exportResults(format);
  console.log(`📄 Report exported to: ${outputPath}`);
}

// Full benchmark command
async function runFullBenchmark(benchmark: HeyContextBenchmark) {
  console.log('🚀 Starting full benchmark...');
  console.log('📋 This will run all test categories for comprehensive assessment.\n');
  
  const options = {
    parallel: hasFlag('--parallel'),
    maxConcurrency: getConcurrencyOption(),
    includeScreenshots: hasFlag('--screenshots')
  };
  
  console.log('⚙️  Options:', options);
  
  const startTime = Date.now();
  const result = await benchmark.runFullBenchmark(options);
  const duration = Date.now() - startTime;
  
  console.log('\n📊 Full Benchmark Results:');
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📈 Overall Score: ${(result.summary.overallScore * 100).toFixed(1)}%`);
  console.log(`✅ Tests Passed: ${result.summary.passedTests}/${result.summary.totalTests}`);
  
  // Show category breakdown
  console.log('\n📊 Category Breakdown:');
  result.summary.categoryScores.forEach(category => {
    const status = category.averageScore >= 0.7 ? '✅' : 
                   category.averageScore >= 0.5 ? '⚠️' : '❌';
    console.log(`${status} ${category.categoryName}: ${(category.averageScore * 100).toFixed(1)}%`);
  });
  
  // Export results
  const format = getFormatOption();
  const outputPath = await benchmark.exportResults(format);
  console.log(`📄 Report exported to: ${outputPath}`);
}

// Category benchmark command
async function runCategoryBenchmark(benchmark: HeyContextBenchmark) {
  const categories = args.slice(1);
  
  if (categories.length === 0) {
    console.error('❌ Please specify categories to run.');
    console.log('Available categories: functional, user-centric, system');
    process.exit(1);
  }
  
  // Validate categories
  const validCategories = ['functional', 'user-centric', 'system'];
  const invalidCategories = categories.filter(cat => !validCategories.includes(cat));
  
  if (invalidCategories.length > 0) {
    console.error(`❌ Invalid categories: ${invalidCategories.join(', ')}`);
    console.log(`Valid categories: ${validCategories.join(', ')}`);
    process.exit(1);
  }
  
  console.log(`🚀 Starting category benchmark for: ${categories.join(', ')}`);
  
  const options = {
    parallel: hasFlag('--parallel'),
    maxConcurrency: getConcurrencyOption()
  };
  
  const startTime = Date.now();
  const result = await benchmark.runCategoryBenchmark(categories, options);
  const duration = Date.now() - startTime;
  
  console.log('\n📊 Category Benchmark Results:');
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📈 Overall Score: ${(result.summary.overallScore * 100).toFixed(1)}%`);
  console.log(`✅ Tests Passed: ${result.summary.passedTests}/${result.summary.totalTests}`);
  
  // Export results
  const format = getFormatOption();
  const outputPath = await benchmark.exportResults(format);
  console.log(`📄 Report exported to: ${outputPath}`);
}

// Specific tests command
async function runSpecificTests(benchmark: HeyContextBenchmark) {
  const testCaseIds = args.slice(1);
  
  if (testCaseIds.length === 0) {
    console.error('❌ Please specify test case IDs to run.');
    console.log('Example: npm run benchmark specific memory_consistency_basic');
    process.exit(1);
  }
  
  console.log(`🚀 Starting specific tests: ${testCaseIds.join(', ')}`);
  
  const startTime = Date.now();
  const result = await benchmark.runSpecificTests(testCaseIds);
  const duration = Date.now() - startTime;
  
  console.log('\n📊 Specific Tests Results:');
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📈 Overall Score: ${(result.summary.overallScore * 100).toFixed(1)}%`);
  console.log(`✅ Tests Passed: ${result.summary.passedTests}/${result.summary.totalTests}`);
  
  // Show individual test results
  console.log('\n📊 Test Results:');
  result.results.forEach(testResult => {
    const status = testResult.status === 'passed' ? '✅' : 
                   testResult.status === 'failed' ? '❌' : 
                   testResult.status === 'error' ? '💥' : '⏭️';
    const score = testResult.scores.length > 0 
      ? (testResult.scores.reduce((sum, score) => sum + score.weightedScore, 0) * 100).toFixed(1) + '%'
      : 'N/A';
    console.log(`${status} ${testResult.testCaseName}: ${score} (${testResult.status})`);
  });
  
  // Export results
  const format = getFormatOption();
  const outputPath = await benchmark.exportResults(format);
  console.log(`📄 Report exported to: ${outputPath}`);
}

// Helper functions
function hasFlag(flag: string): boolean {
  return args.includes(flag);
}

function getConcurrencyOption(): number {
  const concurrencyIndex = args.indexOf('--concurrency');
  if (concurrencyIndex !== -1 && concurrencyIndex + 1 < args.length) {
    const value = parseInt(args[concurrencyIndex + 1]);
    if (!isNaN(value) && value > 0) {
      return value;
    }
  }
  return 3; // Default
}

function getFormatOption(): 'json' | 'html' | 'markdown' {
  const formatIndex = args.indexOf('--format');
  if (formatIndex !== -1 && formatIndex + 1 < args.length) {
    const format = args[formatIndex + 1];
    if (['json', 'html', 'markdown'].includes(format)) {
      return format as 'json' | 'html' | 'markdown';
    }
  }
  return 'html'; // Default
}

// Show available test cases
function showAvailableTestCases() {
  console.log('\n📋 Available Test Cases:');
  console.log('\nFunctional Tests:');
  console.log('  - memory_consistency_basic: Basic memory consistency test');
  console.log('  - persona_consistency_dating_coach: Dating coach persona consistency');
  console.log('  - context_linking_cross_platform: Cross-platform context linking');
  
  console.log('\nUser-Centric Tests:');
  console.log('  - repetition_reduction_workout_plan: Workout plan continuity');
  console.log('  - insight_continuity_therapy: Therapy session continuity');
  
  console.log('\nSystem Tests:');
  console.log('  - vector_search_speed: Vector search performance');
  console.log('  - load_testing_multiple_queries: Load testing');
}

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
