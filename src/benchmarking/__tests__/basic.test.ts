import { HeyContextBenchmark, TestCaseLoader, BenchmarkEvaluator } from '../index';

describe('HeyContext Benchmarking System', () => {
  describe('Basic Imports', () => {
    it('should import HeyContextBenchmark class', () => {
      expect(HeyContextBenchmark).toBeDefined();
      expect(typeof HeyContextBenchmark).toBe('function');
    });

    it('should import TestCaseLoader class', () => {
      expect(TestCaseLoader).toBeDefined();
      expect(typeof TestCaseLoader).toBe('function');
    });

    it('should import BenchmarkEvaluator class', () => {
      expect(BenchmarkEvaluator).toBeDefined();
      expect(typeof BenchmarkEvaluator).toBe('function');
    });
  });

  describe('HeyContextBenchmark Instance', () => {
    let benchmark: HeyContextBenchmark;

    beforeEach(() => {
      benchmark = new HeyContextBenchmark();
    });

    it('should create an instance', () => {
      expect(benchmark).toBeInstanceOf(HeyContextBenchmark);
    });

    it('should have required methods', () => {
      expect(typeof benchmark.runQuickBenchmark).toBe('function');
      expect(typeof benchmark.runFullBenchmark).toBe('function');
      expect(typeof benchmark.runCategoryBenchmark).toBe('function');
      expect(typeof benchmark.runSpecificTests).toBe('function');
      expect(typeof benchmark.exportResults).toBe('function');
      expect(typeof benchmark.getResults).toBe('function');
      expect(typeof benchmark.getSummary).toBe('function');
    });

    it('should return empty results initially', () => {
      const results = benchmark.getResults();
      const summary = benchmark.getSummary();
      
      expect(results).toEqual([]);
      expect(summary).toBeNull();
    });
  });

  describe('TestCaseLoader', () => {
    let loader: TestCaseLoader;

    beforeEach(() => {
      loader = new TestCaseLoader();
    });

    it('should create an instance', () => {
      expect(loader).toBeInstanceOf(TestCaseLoader);
    });

    it('should have required methods', () => {
      expect(typeof loader.loadAllTestCases).toBe('function');
      expect(typeof loader.loadTestCasesByCategory).toBe('function');
      expect(typeof loader.loadSpecificTestCases).toBe('function');
      expect(typeof loader.getTestCase).toBe('function');
      expect(typeof loader.getAllTestCases).toBe('function');
      expect(typeof loader.getTestCasesByCategory).toBe('function');
      expect(typeof loader.getTestCasesByTag).toBe('function');
      expect(typeof loader.getTestCasesByDifficulty).toBe('function');
      expect(typeof loader.getTestCaseStats).toBe('function');
    });
  });

  describe('BenchmarkEvaluator', () => {
    let evaluator: BenchmarkEvaluator;

    beforeEach(() => {
      evaluator = new BenchmarkEvaluator();
    });

    it('should create an instance', () => {
      expect(evaluator).toBeInstanceOf(BenchmarkEvaluator);
    });

    it('should have required methods', () => {
      expect(typeof evaluator.evaluateTestCase).toBe('function');
    });
  });

  describe('Test Case Loading', () => {
    let loader: TestCaseLoader;

    beforeEach(async () => {
      loader = new TestCaseLoader();
    });

    it('should load functional test cases', async () => {
      const testCases = await loader.loadTestCasesByCategory(['functional']);
      expect(testCases.length).toBeGreaterThan(0);
      
      testCases.forEach(testCase => {
        expect(testCase.category).toBe('functional');
        expect(testCase.id).toBeDefined();
        expect(testCase.name).toBeDefined();
        expect(testCase.description).toBeDefined();
        expect(testCase.input).toBeDefined();
        expect(testCase.expectedOutput).toBeDefined();
        expect(testCase.metadata).toBeDefined();
      });
    });

    it('should load user-centric test cases', async () => {
      const testCases = await loader.loadTestCasesByCategory(['user-centric']);
      expect(testCases.length).toBeGreaterThan(0);
      
      testCases.forEach(testCase => {
        expect(testCase.category).toBe('user-centric');
      });
    });

    it('should load system test cases', async () => {
      const testCases = await loader.loadTestCasesByCategory(['system']);
      expect(testCases.length).toBeGreaterThan(0);
      
      testCases.forEach(testCase => {
        expect(testCase.category).toBe('system');
      });
    });

    it('should load all test cases', async () => {
      const allTestCases = await loader.loadAllTestCases();
      expect(allTestCases.length).toBeGreaterThan(0);
      
      const categories = [...new Set(allTestCases.map(tc => tc.category))];
      expect(categories).toContain('functional');
      expect(categories).toContain('user-centric');
      expect(categories).toContain('system');
    });

    it('should get test case statistics', async () => {
      await loader.loadAllTestCases();
      const stats = loader.getTestCaseStats();
      
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byCategory).toBeDefined();
      expect(stats.byDifficulty).toBeDefined();
      expect(stats.byTag).toBeDefined();
      
      expect(stats.byCategory.functional).toBeGreaterThan(0);
      expect(stats.byCategory['user-centric']).toBeGreaterThan(0);
      expect(stats.byCategory.system).toBeGreaterThan(0);
    });
  });

  describe('Test Case Validation', () => {
    let loader: TestCaseLoader;

    beforeEach(async () => {
      loader = new TestCaseLoader();
      await loader.loadAllTestCases();
    });

    it('should have valid test case structure', () => {
      const allTestCases = loader.getAllTestCases();
      
      allTestCases.forEach(testCase => {
        // Validate required fields
        expect(testCase.id).toMatch(/^[a-z_]+$/);
        expect(testCase.name.length).toBeGreaterThan(0);
        expect(testCase.description.length).toBeGreaterThan(0);
        expect(['functional', 'user-centric', 'system']).toContain(testCase.category);
        
        // Validate input structure
        expect(testCase.input.query).toBeDefined();
        expect(typeof testCase.input.query).toBe('string');
        
        // Validate expected output structure
        expect(testCase.expectedOutput.shouldRememberContext).toBeDefined();
        expect(typeof testCase.expectedOutput.expectedMemoryAccuracy).toBe('number');
        expect(testCase.expectedOutput.expectedMemoryAccuracy).toBeGreaterThanOrEqual(0);
        expect(testCase.expectedOutput.expectedMemoryAccuracy).toBeLessThanOrEqual(1);
        
        // Validate metadata structure
        expect(['easy', 'medium', 'hard']).toContain(testCase.metadata.difficulty);
        expect(Array.isArray(testCase.metadata.tags)).toBe(true);
        expect(testCase.metadata.estimatedDuration).toBeGreaterThan(0);
        expect(typeof testCase.metadata.requiresExternalAPIs).toBe('boolean');
        expect(Array.isArray(testCase.metadata.platformDependencies)).toBe(true);
      });
    });

    it('should have unique test case IDs', () => {
      const allTestCases = loader.getAllTestCases();
      const ids = allTestCases.map(tc => tc.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have consistent category weights', () => {
      const functionalTests = loader.getTestCasesByCategory('functional');
      const userCentricTests = loader.getTestCasesByCategory('user-centric');
      const systemTests = loader.getTestCasesByCategory('system');
      
      // Each category should have at least one test case
      expect(functionalTests.length).toBeGreaterThan(0);
      expect(userCentricTests.length).toBeGreaterThan(0);
      expect(systemTests.length).toBeGreaterThan(0);
    });
  });

  describe('Test Case Filtering', () => {
    let loader: TestCaseLoader;

    beforeEach(async () => {
      loader = new TestCaseLoader();
      await loader.loadAllTestCases();
    });

    it('should filter by tags', () => {
      const memoryTests = loader.getTestCasesByTag('memory');
      expect(memoryTests.length).toBeGreaterThan(0);
      
      memoryTests.forEach(testCase => {
        expect(testCase.metadata.tags).toContain('memory');
      });
    });

    it('should filter by difficulty', () => {
      const easyTests = loader.getTestCasesByDifficulty('easy');
      const mediumTests = loader.getTestCasesByDifficulty('medium');
      const hardTests = loader.getTestCasesByDifficulty('hard');
      
      expect(easyTests.length).toBeGreaterThan(0);
      expect(mediumTests.length).toBeGreaterThan(0);
      expect(hardTests.length).toBeGreaterThan(0);
      
      easyTests.forEach(testCase => {
        expect(testCase.metadata.difficulty).toBe('easy');
      });
    });

    it('should get specific test cases by ID', async () => {
      const specificTests = await loader.loadSpecificTestCases([
        'memory_consistency_basic',
        'persona_consistency_dating_coach'
      ]);
      
      expect(specificTests.length).toBe(2);
      expect(specificTests[0].id).toBe('memory_consistency_basic');
      expect(specificTests[1].id).toBe('persona_consistency_dating_coach');
    });
  });
});
