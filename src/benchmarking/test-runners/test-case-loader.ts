import { TestCase, TestCategory } from '../types';
import { FUNCTIONAL_BENCHMARK_CONFIG, USER_CENTRIC_BENCHMARK_CONFIG, SYSTEM_BENCHMARK_CONFIG } from '../configs/benchmark-config';

export class TestCaseLoader {
  private testCases: Map<string, TestCase> = new Map();
  private categories: Map<string, TestCategory> = new Map();

  constructor() {
    this.initializeCategories();
  }

  /**
   * Initialize the test categories
   */
  private initializeCategories(): void {
    this.categories.set('functional', {
      ...FUNCTIONAL_BENCHMARK_CONFIG,
      testCases: []
    } as TestCategory);

    this.categories.set('user-centric', {
      ...USER_CENTRIC_BENCHMARK_CONFIG,
      testCases: []
    } as TestCategory);

    this.categories.set('system', {
      ...SYSTEM_BENCHMARK_CONFIG,
      testCases: []
    } as TestCategory);
  }

  /**
   * Load all test cases from all categories
   */
  async loadAllTestCases(): Promise<TestCase[]> {
    console.log('📋 Loading all test cases...');
    
    // Load functional test cases
    const functionalTests = await this.loadFunctionalTestCases();
    this.categories.get('functional')!.testCases = functionalTests;
    
    // Load user-centric test cases
    const userCentricTests = await this.loadUserCentricTestCases();
    this.categories.get('user-centric')!.testCases = userCentricTests;
    
    // Load system test cases
    const systemTests = await this.loadSystemTestCases();
    this.categories.get('system')!.testCases = systemTests;

    // Combine all test cases
    const allTestCases = [...functionalTests, ...userCentricTests, ...systemTests];
    
    // Index test cases by ID for quick lookup
    allTestCases.forEach(testCase => {
      this.testCases.set(testCase.id, testCase);
    });

    console.log(`✅ Loaded ${allTestCases.length} total test cases`);
    console.log(`   - Functional: ${functionalTests.length}`);
    console.log(`   - User-Centric: ${userCentricTests.length}`);
    console.log(`   - System: ${systemTests.length}`);

    return allTestCases;
  }

  /**
   * Load test cases by specific category
   */
  async loadTestCasesByCategory(categoryIds: string[]): Promise<TestCase[]> {
    console.log(`📋 Loading test cases for categories: ${categoryIds.join(', ')}`);
    
    const testCases: TestCase[] = [];
    
    for (const categoryId of categoryIds) {
      const category = this.categories.get(categoryId);
      if (!category) {
        console.warn(`⚠️ Unknown category: ${categoryId}`);
        continue;
      }

      let categoryTests: TestCase[] = [];
      
      switch (categoryId) {
        case 'functional':
          categoryTests = await this.loadFunctionalTestCases();
          break;
        case 'user-centric':
          categoryTests = await this.loadUserCentricTestCases();
          break;
        case 'system':
          categoryTests = await this.loadSystemTestCases();
          break;
        default:
          console.warn(`⚠️ No loader implemented for category: ${categoryId}`);
          continue;
      }

      category.testCases = categoryTests;
      testCases.push(...categoryTests);
      
      console.log(`   - ${category.name}: ${categoryTests.length} test cases`);
    }

    // Index test cases by ID
    testCases.forEach(testCase => {
      this.testCases.set(testCase.id, testCase);
    });

    return testCases;
  }

  /**
   * Load specific test cases by ID
   */
  async loadSpecificTestCases(testCaseIds: string[]): Promise<TestCase[]> {
    console.log(`📋 Loading specific test cases: ${testCaseIds.join(', ')}`);
    
    // First load all test cases to ensure we have the ones requested
    await this.loadAllTestCases();
    
    const requestedTestCases: TestCase[] = [];
    const missingTestCases: string[] = [];
    
    for (const testCaseId of testCaseIds) {
      const testCase = this.testCases.get(testCaseId);
      if (testCase) {
        requestedTestCases.push(testCase);
      } else {
        missingTestCases.push(testCaseId);
      }
    }
    
    if (missingTestCases.length > 0) {
      console.warn(`⚠️ Missing test cases: ${missingTestCases.join(', ')}`);
    }
    
    console.log(`✅ Loaded ${requestedTestCases.length} requested test cases`);
    return requestedTestCases;
  }

  /**
   * Load functional benchmark test cases
   */
  private async loadFunctionalTestCases(): Promise<TestCase[]> {
    return [
      // Memory Consistency Tests
      {
        id: 'memory_consistency_basic',
        name: 'Basic Memory Consistency',
        description: 'Test if the system remembers basic user information across sessions',
        category: 'functional',
        input: {
          query: 'What is my name?',
          context: {
            userId: 'test_user_001',
            sessionId: 'session_001',
            persona: 'general',
            previousMessages: [
              {
                id: 'msg_001',
                content: 'My name is John',
                role: 'user',
                timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
              }
            ]
          }
        },
        expectedOutput: {
          shouldRememberContext: true,
          expectedMemoryAccuracy: 0.9,
          expectedContextualRelevance: 0.8,
          expectedUserFrictionReduction: 0.9,
          specificAssertions: [
            'Response should mention the name "John"',
            'Response should not ask for the name again',
            'Response should acknowledge previous conversation'
          ]
        },
        metadata: {
          difficulty: 'easy',
          tags: ['memory', 'consistency', 'basic'],
          estimatedDuration: 30,
          requiresExternalAPIs: false,
          platformDependencies: ['conversation']
        }
      },
      
      // Persona Awareness Tests
      {
        id: 'persona_consistency_dating_coach',
        name: 'Dating Coach Persona Consistency',
        description: 'Test if the dating coach persona remains consistent across sessions',
        category: 'functional',
        input: {
          query: 'Give me dating advice',
          context: {
            userId: 'test_user_002',
            sessionId: 'session_002',
            persona: 'dating_coach',
            previousMessages: [
              {
                id: 'msg_002',
                content: 'I am a dating coach. I help people with relationships.',
                role: 'assistant',
                timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
              }
            ]
          }
        },
        expectedOutput: {
          shouldRememberContext: true,
          expectedMemoryAccuracy: 0.85,
          expectedContextualRelevance: 0.9,
          expectedUserFrictionReduction: 0.8,
          specificAssertions: [
            'Response should maintain dating coach persona',
            'Response should reference previous coaching context',
            'Response should provide dating-specific advice'
          ]
        },
        metadata: {
          difficulty: 'medium',
          tags: ['persona', 'consistency', 'dating_coach'],
          estimatedDuration: 45,
          requiresExternalAPIs: false,
          platformDependencies: ['conversation']
        }
      },

      // Context Linking Tests
      {
        id: 'context_linking_cross_platform',
        name: 'Cross-Platform Context Linking',
        description: 'Test if the system can link context across different platforms (Gmail, YouTube, Notes)',
        category: 'functional',
        input: {
          query: 'What did I learn about content creation from my recent research?',
          context: {
            userId: 'test_user_003',
            sessionId: 'session_003',
            persona: 'content_creator',
            contentContext: {
              type: 'youtube',
              id: 'yt_001',
              title: 'Content Strategy Research',
              content: 'Research shows that consistent posting and audience engagement are key to growth',
              score: 0.85
            }
          }
        },
        expectedOutput: {
          shouldRememberContext: true,
          expectedMemoryAccuracy: 0.8,
          expectedContextualRelevance: 0.9,
          expectedUserFrictionReduction: 0.85,
          specificAssertions: [
            'Response should reference YouTube research content',
            'Response should mention content strategy insights',
            'Response should connect research to actionable advice'
          ]
        },
        metadata: {
          difficulty: 'hard',
          tags: ['context_linking', 'cross_platform', 'content_creator'],
          estimatedDuration: 60,
          requiresExternalAPIs: true,
          platformDependencies: ['youtube', 'conversation', 'note']
        }
      }
    ];
  }

  /**
   * Load user-centric benchmark test cases
   */
  private async loadUserCentricTestCases(): Promise<TestCase[]> {
    return [
      // Repetition Reduction Tests
      {
        id: 'repetition_reduction_workout_plan',
        name: 'Workout Plan Continuity',
        description: 'Test if the user needs to re-explain their fitness goals and injury history',
        category: 'user-centric',
        input: {
          query: 'Update my workout plan for this week',
          context: {
            userId: 'test_user_004',
            sessionId: 'session_004',
            persona: 'fitness_trainer',
            previousMessages: [
              {
                id: 'msg_003',
                content: 'I have a knee injury from running, so I need low-impact exercises',
                role: 'user',
                timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
              },
              {
                id: 'msg_004',
                content: 'I will create a low-impact workout plan focusing on swimming and cycling',
                role: 'assistant',
                timestamp: new Date(Date.now() - 172800000).toISOString()
              }
            ]
          }
        },
        expectedOutput: {
          shouldRememberContext: true,
          expectedMemoryAccuracy: 0.9,
          expectedContextualRelevance: 0.95,
          expectedUserFrictionReduction: 0.95,
          specificAssertions: [
            'Response should acknowledge knee injury without asking for details',
            'Response should reference previous low-impact workout plan',
            'Response should not ask for fitness goals again',
            'Response should build upon previous recommendations'
          ]
        },
        metadata: {
          difficulty: 'medium',
          tags: ['repetition_reduction', 'fitness', 'injury_memory'],
          estimatedDuration: 45,
          requiresExternalAPIs: false,
          platformDependencies: ['conversation', 'note']
        }
      },

      // Insight Continuity Tests
      {
        id: 'insight_continuity_therapy',
        name: 'Therapy Session Continuity',
        description: 'Test if therapeutic insights and progress are maintained across sessions',
        category: 'user-centric',
        input: {
          query: 'How have I been feeling lately?',
          context: {
            userId: 'test_user_005',
            sessionId: 'session_005',
            persona: 'therapist',
            previousMessages: [
              {
                id: 'msg_005',
                content: 'I have been feeling anxious about work deadlines',
                role: 'user',
                timestamp: new Date(Date.now() - 604800000).toISOString() // 1 week ago
              },
              {
                id: 'msg_006',
                content: 'We discussed coping strategies including deep breathing and time management',
                role: 'assistant',
                timestamp: new Date(Date.now() - 604800000).toISOString()
              }
            ]
          }
        },
        expectedOutput: {
          shouldRememberContext: true,
          expectedMemoryAccuracy: 0.9,
          expectedContextualRelevance: 0.9,
          expectedUserFrictionReduction: 0.9,
          specificAssertions: [
            'Response should reference previous anxiety about work',
            'Response should mention coping strategies discussed',
            'Response should ask about progress with those strategies',
            'Response should build upon previous therapeutic work'
          ]
        },
        metadata: {
          difficulty: 'hard',
          tags: ['insight_continuity', 'therapy', 'emotional_memory'],
          estimatedDuration: 60,
          requiresExternalAPIs: false,
          platformDependencies: ['conversation', 'note']
        }
      }
    ];
  }

  /**
   * Load system benchmark test cases
   */
  private async loadSystemTestCases(): Promise<TestCase[]> {
    return [
      // Vector Search Performance Tests
      {
        id: 'vector_search_speed',
        name: 'Vector Search Response Time',
        description: 'Test the speed of vector search operations',
        category: 'system',
        input: {
          query: 'Find content about productivity tips',
          context: {
            userId: 'test_user_006',
            sessionId: 'session_006',
            persona: 'productivity_coach'
          }
        },
        expectedOutput: {
          shouldRememberContext: true,
          expectedMemoryAccuracy: 0.8,
          expectedContextualRelevance: 0.85,
          expectedUserFrictionReduction: 0.8,
          specificAssertions: [
            'Vector search should complete within 2 seconds',
            'Results should be semantically relevant to productivity',
            'Response should include retrieved content context'
          ]
        },
        metadata: {
          difficulty: 'medium',
          tags: ['performance', 'vector_search', 'speed'],
          estimatedDuration: 30,
          requiresExternalAPIs: true,
          platformDependencies: ['vector_search', 'conversation']
        }
      },

      // Load Testing
      {
        id: 'load_testing_multiple_queries',
        name: 'Multiple Concurrent Queries',
        description: 'Test system performance under load with multiple simultaneous queries',
        category: 'system',
        input: {
          query: 'Simultaneous query test',
          context: {
            userId: 'test_user_007',
            sessionId: 'session_007',
            persona: 'general'
          }
        },
        expectedOutput: {
          shouldRememberContext: true,
          expectedMemoryAccuracy: 0.7,
          expectedContextualRelevance: 0.7,
          expectedUserFrictionReduction: 0.7,
          specificAssertions: [
            'System should handle 10+ concurrent queries',
            'Response time should not degrade significantly',
            'Memory accuracy should remain above 70%'
          ]
        },
        metadata: {
          difficulty: 'hard',
          tags: ['load_testing', 'concurrent_queries', 'performance'],
          estimatedDuration: 120,
          requiresExternalAPIs: true,
          platformDependencies: ['vector_search', 'conversation', 'all_platforms']
        }
      }
    ];
  }

  /**
   * Get test case by ID
   */
  getTestCase(testCaseId: string): TestCase | undefined {
    return this.testCases.get(testCaseId);
  }

  /**
   * Get all test cases
   */
  getAllTestCases(): TestCase[] {
    return Array.from(this.testCases.values());
  }

  /**
   * Get test cases by category
   */
  getTestCasesByCategory(categoryId: string): TestCase[] {
    const category = this.categories.get(categoryId);
    return category ? category.testCases : [];
  }

  /**
   * Get test cases by tag
   */
  getTestCasesByTag(tag: string): TestCase[] {
    return Array.from(this.testCases.values()).filter(testCase =>
      testCase.metadata.tags.includes(tag)
    );
  }

  /**
   * Get test cases by difficulty
   */
  getTestCasesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): TestCase[] {
    return Array.from(this.testCases.values()).filter(testCase =>
      testCase.metadata.difficulty === difficulty
    );
  }

  /**
   * Get test case statistics
   */
  getTestCaseStats(): {
    total: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
    byTag: Record<string, number>;
  } {
    const total = this.testCases.size;
    const byCategory: Record<string, number> = {};
    const byDifficulty: Record<string, number> = {};
    const byTag: Record<string, number> = {};

    this.testCases.forEach(testCase => {
      // Count by category
      byCategory[testCase.category] = (byCategory[testCase.category] || 0) + 1;
      
      // Count by difficulty
      byDifficulty[testCase.metadata.difficulty] = (byDifficulty[testCase.metadata.difficulty] || 0) + 1;
      
      // Count by tags
      testCase.metadata.tags.forEach(tag => {
        byTag[tag] = (byTag[tag] || 0) + 1;
      });
    });

    return { total, byCategory, byDifficulty, byTag };
  }
}
