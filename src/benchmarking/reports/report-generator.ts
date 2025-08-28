import { BenchmarkRun, BenchmarkResult, BenchmarkSummary } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class ReportGenerator {
  private outputDir = 'benchmark-reports';

  constructor() {
    this.ensureOutputDirectory();
  }

  /**
   * Generate a report in the specified format
   */
  async generateReport(
    benchmarkRun: BenchmarkRun, 
    format: 'json' | 'html' | 'markdown', 
    outputPath?: string
  ): Promise<string> {
    console.log(`📊 Generating ${format.toUpperCase()} report...`);
    
    try {
      let reportContent: string;
      let fileExtension: string;
      
      switch (format) {
        case 'json':
          reportContent = this.generateJSONReport(benchmarkRun);
          fileExtension = 'json';
          break;
        case 'html':
          reportContent = this.generateHTMLReport(benchmarkRun);
          fileExtension = 'html';
          break;
        case 'markdown':
          reportContent = this.generateMarkdownReport(benchmarkRun);
          fileExtension = 'md';
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      // Determine output path
      const finalOutputPath = outputPath || this.generateOutputPath(benchmarkRun.id, fileExtension);
      
      // Write report to file
      await this.writeReportToFile(finalOutputPath, reportContent);
      
      console.log(`✅ Report generated successfully: ${finalOutputPath}`);
      return finalOutputPath;
      
    } catch (error) {
      console.error(`❌ Error generating ${format} report:`, error);
      throw error;
    }
  }

  /**
   * Generate JSON report
   */
  private generateJSONReport(benchmarkRun: BenchmarkRun): string {
    return JSON.stringify(benchmarkRun, null, 2);
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(benchmarkRun: BenchmarkRun): string {
    const { summary, results, config, environment, metadata } = benchmarkRun;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HeyContext Benchmark Report - ${benchmarkRun.id}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header .subtitle {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.2em;
        }
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .score-excellent { color: #28a745; }
        .score-good { color: #ffc107; }
        .score-acceptable { color: #fd7e14; }
        .score-poor { color: #dc3545; }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .results-table th,
        .results-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .results-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        .status-passed { color: #28a745; font-weight: bold; }
        .status-failed { color: #dc3545; font-weight: bold; }
        .status-error { color: #dc3545; font-weight: bold; }
        .status-skipped { color: #6c757d; font-weight: bold; }
        .metric-scores {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-top: 10px;
        }
        .metric-score {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .recommendations {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2196f3;
        }
        .recommendations h3 {
            margin-top: 0;
            color: #1976d2;
        }
        .recommendations ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #ddd;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>HeyContext Benchmark Report</h1>
            <p class="subtitle">${config.description}</p>
            <p>Run ID: ${benchmarkRun.id}</p>
            <p>Generated: ${new Date(benchmarkRun.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary-stats">
            <div class="stat-card">
                <div class="stat-number score-${this.getScoreClass(summary.overallScore)}">${(summary.overallScore * 100).toFixed(1)}%</div>
                <div class="stat-label">Overall Score</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${summary.totalTests}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number status-passed">${summary.passedTests}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number status-failed">${summary.failedTests}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number status-error">${summary.errorTests}</div>
                <div class="stat-label">Errors</div>
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Category Performance</h2>
                <div class="chart-container">
                    <h3>Category Scores</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        ${summary.categoryScores.map(category => `
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                                <h4 style="margin: 0 0 10px 0;">${category.categoryName}</h4>
                                <div style="font-size: 1.5em; font-weight: bold; color: #667eea;">${(category.averageScore * 100).toFixed(1)}%</div>
                                <div style="color: #666; font-size: 0.9em;">${category.passedTests}/${category.totalTests} tests passed</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Top Performers</h2>
                <div class="chart-container">
                    ${summary.topPerformers.map((performer, index) => `
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
                            <h4 style="margin: 0 0 10px 0;">#${index + 1}: ${performer.testCaseName}</h4>
                            <div style="font-size: 1.2em; font-weight: bold; color: #667eea;">${(performer.overallScore * 100).toFixed(1)}%</div>
                            <div style="color: #666; font-size: 0.9em;">Category: ${performer.category}</div>
                            <div style="color: #666; font-size: 0.9em;">Strengths: ${performer.strengths.join(', ')}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="section">
                <h2>Test Results</h2>
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Test Case</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Overall Score</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(result => `
                            <tr>
                                <td><strong>${result.testCaseName}</strong></td>
                                <td>${result.category}</td>
                                <td class="status-${result.status}">${result.status.toUpperCase()}</td>
                                <td>${result.duration}ms</td>
                                <td>${result.scores.length > 0 ? (result.scores.reduce((sum, score) => sum + score.weightedScore, 0) * 100).toFixed(1) + '%' : 'N/A'}</td>
                                <td>
                                    <div class="metric-scores">
                                        ${result.scores.map(score => `
                                            <div class="metric-score">
                                                ${score.metricName}: ${(score.score * 100).toFixed(1)}%
                                            </div>
                                        `).join('')}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            ${summary.areasForImprovement.length > 0 ? `
                <div class="section">
                    <h2>Areas for Improvement</h2>
                    <div class="recommendations">
                        <ul>
                            ${summary.areasForImprovement.map(area => `<li>${area}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            ` : ''}
            
            ${summary.recommendations.length > 0 ? `
                <div class="section">
                    <h2>Recommendations</h2>
                    <div class="recommendations">
                        <ul>
                            ${summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            ` : ''}
            
            <div class="section">
                <h2>Environment Information</h2>
                <div class="chart-container">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <strong>Node Version:</strong> ${environment.nodeVersion}
                        </div>
                        <div>
                            <strong>Platform:</strong> ${environment.platform}
                        </div>
                        <div>
                            <strong>Convex Version:</strong> ${environment.convexVersion}
                        </div>
                        <div>
                            <strong>Test Data Size:</strong> ${environment.testDataSize} items
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Run Metadata</h2>
                <div class="chart-container">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <strong>Branch:</strong> ${metadata.branch}
                        </div>
                        <div>
                            <strong>Commit:</strong> ${metadata.commit}
                        </div>
                        <div>
                            <strong>Author:</strong> ${metadata.author}
                        </div>
                        <div>
                            <strong>Tags:</strong> ${metadata.tags.join(', ')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by HeyContext Benchmark Suite v${config.version}</p>
            <p>Report ID: ${benchmarkRun.id}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(benchmarkRun: BenchmarkRun): string {
    const { summary, results, config, environment, metadata } = benchmarkRun;
    
    return `# HeyContext Benchmark Report

**Run ID:** ${benchmarkRun.id}  
**Generated:** ${new Date(benchmarkRun.timestamp).toLocaleString()}  
**Configuration:** ${config.name} v${config.version}

## Executive Summary

**Overall Score:** ${(summary.overallScore * 100).toFixed(1)}%  
**Total Tests:** ${summary.totalTests}  
**Tests Passed:** ${summary.passedTests}  
**Tests Failed:** ${summary.failedTests}  
**Tests with Errors:** ${summary.errorTests}

## Category Performance

${summary.categoryScores.map(category => `
### ${category.categoryName}
- **Score:** ${(category.averageScore * 100).toFixed(1)}%
- **Tests:** ${category.passedTests}/${category.totalTests} passed
- **Weight:** ${(category.weight * 100).toFixed(0)}%
`).join('')}

## Top Performers

${summary.topPerformers.map((performer, index) => `
${index + 1}. **${performer.testCaseName}** (${performer.category})
   - Score: ${(performer.overallScore * 100).toFixed(1)}%
   - Strengths: ${performer.strengths.join(', ')}
`).join('')}

## Test Results

| Test Case | Category | Status | Duration | Overall Score |
|-----------|----------|--------|----------|---------------|
${results.map(result => {
  const overallScore = result.scores.length > 0 
    ? (result.scores.reduce((sum, score) => sum + score.weightedScore, 0) * 100).toFixed(1) + '%'
    : 'N/A';
  return `| ${result.testCaseName} | ${result.category} | ${result.status.toUpperCase()} | ${result.duration}ms | ${overallScore} |`;
}).join('\n')}

## Detailed Metrics

${results.map(result => `
### ${result.testCaseName}
- **Status:** ${result.status}
- **Duration:** ${result.duration}ms
- **Category:** ${result.category}

**Metric Scores:**
${result.scores.map(score => `- ${score.metricName}: ${(score.score * 100).toFixed(1)}% (${score.notes || 'No notes'})`).join('\n')}
`).join('\n')}

${summary.areasForImprovement.length > 0 ? `
## Areas for Improvement

${summary.areasForImprovement.map(area => `- ${area}`).join('\n')}
` : ''}

${summary.recommendations.length > 0 ? `
## Recommendations

${summary.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}

## Environment Information

- **Node Version:** ${environment.nodeVersion}
- **Platform:** ${environment.platform}
- **Convex Version:** ${environment.convexVersion}
- **Test Data Size:** ${environment.testDataSize} items

## Run Metadata

- **Branch:** ${metadata.branch}
- **Commit:** ${metadata.commit}
- **Author:** ${metadata.author}
- **Tags:** ${metadata.tags.join(', ')}

---

*Generated by HeyContext Benchmark Suite v${config.version}*
*Report ID: ${benchmarkRun.id}*`;
  }

  /**
   * Get CSS class for score styling
   */
  private getScoreClass(score: number): string {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.5) return 'acceptable';
    return 'poor';
  }

  /**
   * Generate output path for reports
   */
  private generateOutputPath(runId: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-report-${runId}-${timestamp}.${extension}`;
    return path.join(this.outputDir, filename);
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Write report to file
   */
  private async writeReportToFile(filePath: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Generate comparison report between multiple benchmark runs
   */
  async generateComparisonReport(benchmarkRuns: BenchmarkRun[]): Promise<string> {
    console.log(`📊 Generating comparison report for ${benchmarkRuns.length} benchmark runs...`);
    
    const comparisonData = this.analyzeBenchmarkRuns(benchmarkRuns);
    const reportContent = this.generateComparisonHTML(comparisonData);
    
    const outputPath = this.generateOutputPath('comparison', 'html');
    await this.writeReportToFile(outputPath, reportContent);
    
    console.log(`✅ Comparison report generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Analyze multiple benchmark runs for comparison
   */
  private analyzeBenchmarkRuns(benchmarkRuns: BenchmarkRun[]) {
    const analysis = {
      runs: benchmarkRuns,
      trends: {
        overallScore: this.calculateTrend(benchmarkRuns.map(r => r.summary.overallScore)),
        totalTests: this.calculateTrend(benchmarkRuns.map(r => r.summary.totalTests)),
        passRate: this.calculateTrend(benchmarkRuns.map(r => r.summary.passedTests / r.summary.totalTests))
      },
      improvements: this.identifyImprovements(benchmarkRuns),
      regressions: this.identifyRegressions(benchmarkRuns)
    };
    
    return analysis;
  }

  /**
   * Calculate trend for a metric
   */
  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.ceil(values.length / 2));
    const secondHalf = values.slice(Math.ceil(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    if (Math.abs(change) < 0.05) return 'stable';
    return change > 0 ? 'improving' : 'declining';
  }

  /**
   * Identify improvements across runs
   */
  private identifyImprovements(benchmarkRuns: BenchmarkRun[]): string[] {
    const improvements: string[] = [];
    
    if (benchmarkRuns.length < 2) return improvements;
    
    const latest = benchmarkRuns[benchmarkRuns.length - 1];
    const previous = benchmarkRuns[benchmarkRuns.length - 2];
    
    if (latest.summary.overallScore > previous.summary.overallScore) {
      improvements.push(`Overall score improved from ${(previous.summary.overallScore * 100).toFixed(1)}% to ${(latest.summary.overallScore * 100).toFixed(1)}%`);
    }
    
    if (latest.summary.passedTests > previous.summary.passedTests) {
      improvements.push(`More tests passed: ${previous.summary.passedTests} → ${latest.summary.passedTests}`);
    }
    
    return improvements;
  }

  /**
   * Identify regressions across runs
   */
  private identifyRegressions(benchmarkRuns: BenchmarkRun[]): string[] {
    const regressions: string[] = [];
    
    if (benchmarkRuns.length < 2) return regressions;
    
    const latest = benchmarkRuns[benchmarkRuns.length - 1];
    const previous = benchmarkRuns[benchmarkRuns.length - 2];
    
    if (latest.summary.overallScore < previous.summary.overallScore) {
      regressions.push(`Overall score declined from ${(previous.summary.overallScore * 100).toFixed(1)}% to ${(latest.summary.overallScore * 100).toFixed(1)}%`);
    }
    
    if (latest.summary.failedTests > previous.summary.failedTests) {
      regressions.push(`More tests failed: ${previous.summary.failedTests} → ${latest.summary.failedTests}`);
    }
    
    return regressions;
  }

  /**
   * Generate comparison HTML report
   */
  private generateComparisonHTML(analysis: any): string {
    // Simplified comparison HTML - could be expanded with charts
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Benchmark Comparison Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .trend { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .trend.improving { background: #d4edda; color: #155724; }
        .trend.declining { background: #f8d7da; color: #721c24; }
        .trend.stable { background: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <h1>Benchmark Comparison Report</h1>
    <h2>Trends</h2>
    <div class="trend ${analysis.trends.overallScore}">
        Overall Score: ${analysis.trends.overallScore}
    </div>
    <div class="trend ${analysis.trends.passRate}">
        Pass Rate: ${analysis.trends.passRate}
    </div>
    
    <h2>Improvements</h2>
    <ul>
        ${analysis.improvements.map(imp => `<li>${imp}</li>`).join('')}
    </ul>
    
    <h2>Regressions</h2>
    <ul>
        ${analysis.regressions.map(reg => `<li>${reg}</li>`).join('')}
    </ul>
</body>
</html>`;
  }
}
