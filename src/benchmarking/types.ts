export interface BenchmarkConfig {
  name: string;
  description: string;
  version: string;
  testCategories: TestCategory[];
  evaluationMetrics: EvaluationMetric[];
  outputFormats: OutputFormat[];
}

export interface TestCategory {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  weight: number; // Importance weight for overall scoring
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  input: TestInput;
  expectedOutput: ExpectedOutput;
  metadata: TestMetadata;
}

export interface TestInput {
  query: string;
  context?: {
    userId: string;
    sessionId?: string;
    persona?: string;
    platform?: string;
    previousMessages?: Message[];
    contentContext?: ContentContext;
  };
  vectorSearchMetadata?: VectorSearchMetadata;
}

export interface ExpectedOutput {
  shouldRememberContext: boolean;
  expectedMemoryAccuracy: number; // 0-1
  expectedContextualRelevance: number; // 0-1
  expectedUserFrictionReduction: number; // 0-1
  specificAssertions: string[];
}

export interface TestMetadata {
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  estimatedDuration: number; // seconds
  requiresExternalAPIs: boolean;
  platformDependencies: string[];
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ContentContext {
  type: 'gmail' | 'youtube' | 'instagram' | 'note' | 'conversation';
  id: string;
  title: string;
  content: string;
  score: number;
}

export interface VectorSearchMetadata {
  foundRelevantContent: boolean;
  relevantItemsCount: number;
  relevantContent: Array<{
    title: string;
    contentType: string;
    score: number;
  }>;
}

export interface EvaluationMetric {
  id: string;
  name: string;
  description: string;
  type: 'quantitative' | 'qualitative';
  scale: '0-1' | '0-100' | 'percentage' | 'count';
  weight: number;
  calculationMethod: string;
}

export interface OutputFormat {
  type: 'json' | 'csv' | 'html' | 'markdown';
  template: string;
  includeCharts: boolean;
  includeScreenshots: boolean;
}

export interface BenchmarkResult {
  testCaseId: string;
  testCaseName: string;
  category: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'passed' | 'failed' | 'error' | 'skipped';
  scores: MetricScore[];
  details: TestDetails;
  screenshots?: string[];
  logs: string[];
}

export interface MetricScore {
  metricId: string;
  metricName: string;
  score: number;
  maxScore: number;
  weight: number;
  weightedScore: number;
  notes?: string;
}

export interface TestDetails {
  input: TestInput;
  actualOutput: any;
  expectedOutput: ExpectedOutput;
  memoryAccuracy: number;
  contextualRelevance: number;
  userFrictionReduction: number;
  vectorSearchPerformance?: VectorSearchPerformance;
  errorDetails?: string;
}

export interface VectorSearchPerformance {
  queryTime: number;
  resultsCount: number;
  topResultScore: number;
  relevanceDistribution: number[];
  contextInjectionSuccess: boolean;
}

export interface BenchmarkSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  errorTests: number;
  overallScore: number;
  categoryScores: CategoryScore[];
  topPerformers: TopPerformer[];
  areasForImprovement: string[];
  recommendations: string[];
}

export interface CategoryScore {
  categoryId: string;
  categoryName: string;
  totalTests: number;
  passedTests: number;
  averageScore: number;
  weight: number;
  weightedScore: number;
}

export interface TopPerformer {
  testCaseId: string;
  testCaseName: string;
  category: string;
  overallScore: number;
  strengths: string[];
}

export interface BenchmarkRun {
  id: string;
  timestamp: string;
  config: BenchmarkConfig;
  results: BenchmarkResult[];
  summary: BenchmarkSummary;
  environment: EnvironmentInfo;
  metadata: RunMetadata;
}

export interface EnvironmentInfo {
  nodeVersion: string;
  platform: string;
  memory: {
    total: number;
    free: number;
    used: number;
  };
  convexVersion: string;
  testDataSize: number;
}

export interface RunMetadata {
  branch: string;
  commit: string;
  author: string;
  description?: string;
  tags: string[];
}
