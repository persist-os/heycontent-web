import { BenchmarkConfig, TestCategory, EvaluationMetric, OutputFormat } from '../types';

export const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  name: "HeyContext Chat System Benchmark",
  description: "Comprehensive benchmarking suite for HeyContext's memory infrastructure and vector search capabilities",
  version: "1.0.0",
  
  testCategories: [
    {
      id: "functional",
      name: "Functional Benchmarks",
      description: "Core functionality tests for memory consistency, persona awareness, and context linking",
      weight: 0.4,
      testCases: [] // Will be populated by test case files
    },
    {
      id: "user-centric",
      name: "User-Centric Benchmarks", 
      description: "Real-world user experience tests for repetition reduction, insight continuity, and emotional validation",
      weight: 0.35,
      testCases: []
    },
    {
      id: "system",
      name: "System Benchmarks",
      description: "Performance and technical tests for speed, accuracy, and robustness under load",
      weight: 0.25,
      testCases: []
    }
  ],

  evaluationMetrics: [
    // Memory Accuracy Metrics
    {
      id: "memory_accuracy",
      name: "Memory Accuracy",
      description: "How accurately the system recalls and applies previous context",
      type: "quantitative",
      scale: "0-1",
      weight: 0.25,
      calculationMethod: "LLM evaluation of response relevance to historical context"
    },
    {
      id: "contextual_relevance",
      name: "Contextual Relevance",
      description: "How well the response leverages retrieved context",
      type: "quantitative", 
      scale: "0-1",
      weight: 0.25,
      calculationMethod: "Semantic similarity between response and retrieved context"
    },
    {
      id: "user_friction_reduction",
      name: "User Friction Reduction",
      description: "How much the user needs to re-explain themselves",
      type: "quantitative",
      scale: "0-1", 
      weight: 0.2,
      calculationMethod: "Count of clarification requests needed vs baseline"
    },
    {
      id: "persona_consistency",
      name: "Persona Consistency",
      description: "How well the system maintains character across sessions",
      type: "quantitative",
      scale: "0-1",
      weight: 0.15,
      calculationMethod: "LLM evaluation of persona alignment"
    },
    {
      id: "vector_search_performance",
      name: "Vector Search Performance",
      description: "Speed and accuracy of content retrieval",
      type: "quantitative",
      scale: "0-1",
      weight: "0.15",
      calculationMethod: "Query time + F1 score of retrieved content"
    }
  ],

  outputFormats: [
    {
      type: "json",
      template: "detailed",
      includeCharts: false,
      includeScreenshots: true
    },
    {
      type: "html",
      template: "executive",
      includeCharts: true,
      includeScreenshots: true
    },
    {
      type: "markdown",
      template: "technical",
      includeCharts: false,
      includeScreenshots: false
    }
  ]
};

// Category-specific configurations
export const FUNCTIONAL_BENCHMARK_CONFIG: Partial<TestCategory> = {
  id: "functional",
  name: "Functional Benchmarks",
  description: "Core functionality tests for memory consistency, persona awareness, and context linking",
  weight: 0.4
};

export const USER_CENTRIC_BENCHMARK_CONFIG: Partial<TestCategory> = {
  id: "user-centric", 
  name: "User-Centric Benchmarks",
  description: "Real-world user experience tests for repetition reduction, insight continuity, and emotional validation",
  weight: 0.35
};

export const SYSTEM_BENCHMARK_CONFIG: Partial<TestCategory> = {
  id: "system",
  name: "System Benchmarks", 
  description: "Performance and technical tests for speed, accuracy, and robustness under load",
  weight: 0.25
};

// Test scenario configurations
export const TEST_SCENARIOS = {
  DATING_COACH: {
    name: "Dating Coach Persona",
    description: "Tests memory consistency across dating advice sessions",
    persona: "dating_coach",
    platforms: ["conversation", "note"],
    difficulty: "medium"
  },
  FITNESS_TRAINER: {
    name: "Fitness Trainer Persona", 
    description: "Tests workout plan continuity and injury memory",
    persona: "fitness_trainer",
    platforms: ["conversation", "note", "gmail"],
    difficulty: "medium"
  },
  THERAPIST: {
    name: "Therapist Persona",
    description: "Tests emotional memory and session continuity",
    persona: "therapist", 
    platforms: ["conversation", "note"],
    difficulty: "hard"
  },
  CONTENT_CREATOR: {
    name: "Content Creator Persona",
    description: "Tests cross-platform content memory and strategy continuity",
    persona: "content_creator",
    platforms: ["conversation", "note", "youtube", "instagram", "gmail"],
    difficulty: "hard"
  }
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 0.9,
  GOOD: 0.7,
  ACCEPTABLE: 0.5,
  POOR: 0.3
};

// Vector search specific thresholds
export const VECTOR_SEARCH_THRESHOLDS = {
  MIN_SIMILARITY_SCORE: 0.35,
  TARGET_QUERY_TIME_MS: 2000,
  MIN_RESULTS_COUNT: 3,
  MAX_RESULTS_COUNT: 10
};

// Memory accuracy thresholds
export const MEMORY_ACCURACY_THRESHOLDS = {
  EXCELLENT: 0.9,
  GOOD: 0.7,
  ACCEPTABLE: 0.5,
  POOR: 0.3
};

// Context linking thresholds
export const CONTEXT_LINKING_THRESHOLDS = {
  CROSS_PLATFORM_SUCCESS_RATE: 0.8,
  MIN_CONTEXT_RELEVANCE: 0.6,
  MAX_CONTEXT_INJECTION_FAILURES: 0.2
};
