import { TestCase, MetricScore, ExpectedOutput } from '../types';
import { DEFAULT_BENCHMARK_CONFIG } from '../configs/benchmark-config';

export class BenchmarkEvaluator {
  private config = DEFAULT_BENCHMARK_CONFIG;

  /**
   * Evaluate a test case and return metric scores
   */
  async evaluateTestCase(testCase: TestCase, actualOutput: any): Promise<MetricScore[]> {
    console.log(`🔍 Evaluating test case: ${testCase.name}`);
    
    const scores: MetricScore[] = [];
    
    try {
      // Evaluate memory accuracy
      const memoryAccuracyScore = await this.evaluateMemoryAccuracy(testCase, actualOutput);
      scores.push(memoryAccuracyScore);
      
      // Evaluate contextual relevance
      const contextualRelevanceScore = await this.evaluateContextualRelevance(testCase, actualOutput);
      scores.push(contextualRelevanceScore);
      
      // Evaluate user friction reduction
      const userFrictionReductionScore = await this.evaluateUserFrictionReduction(testCase, actualOutput);
      scores.push(userFrictionReductionScore);
      
      // Evaluate persona consistency (if applicable)
      if (testCase.input.context?.persona) {
        const personaConsistencyScore = await this.evaluatePersonaConsistency(testCase, actualOutput);
        scores.push(personaConsistencyScore);
      }
      
      // Evaluate vector search performance (if applicable)
      if (actualOutput.vectorSearchResults) {
        const vectorSearchPerformanceScore = await this.evaluateVectorSearchPerformance(testCase, actualOutput);
        scores.push(vectorSearchPerformanceScore);
      }
      
      console.log(`✅ Evaluation completed for ${testCase.name}`);
      
    } catch (error) {
      console.error(`❌ Error evaluating test case ${testCase.name}:`, error);
      
      // Return zero scores for failed evaluations
      this.config.evaluationMetrics.forEach(metric => {
        scores.push({
          metricId: metric.id,
          metricName: metric.name,
          score: 0,
          maxScore: 1,
          weight: metric.weight,
          weightedScore: 0,
          notes: `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`
        });
      });
    }
    
    return scores;
  }

  /**
   * Evaluate memory accuracy using LLM evaluation
   */
  private async evaluateMemoryAccuracy(testCase: TestCase, actualOutput: any): Promise<MetricScore> {
    const metric = this.config.evaluationMetrics.find(m => m.id === 'memory_accuracy')!;
    
    try {
      // Extract expected and actual context
      const expectedContext = testCase.input.context;
      const actualResponse = actualOutput.response || '';
      
      // Check if the response demonstrates memory of previous context
      let score = 0;
      let notes = '';
      
      if (expectedContext?.previousMessages) {
        // Check if response references previous messages
        const contextReferences = this.countContextReferences(actualResponse, expectedContext.previousMessages);
        const totalContexts = expectedContext.previousMessages.length;
        
        if (totalContexts > 0) {
          score = Math.min(contextReferences / totalContexts, 1);
          notes = `Referenced ${contextReferences}/${totalContexts} previous contexts`;
        }
      }
      
      // Check if response asks for information that should be remembered
      const asksForKnownInfo = this.detectsAskingForKnownInfo(actualResponse, expectedContext);
      if (asksForKnownInfo) {
        score = Math.max(0, score - 0.3); // Penalty for asking for known info
        notes += `; Penalty: Asked for information that should be remembered`;
      }
      
      // Apply LLM evaluation if available
      if (this.shouldUseLLMEvaluation()) {
        const llmScore = await this.evaluateWithLLM('memory_accuracy', testCase, actualOutput);
        score = (score + llmScore) / 2; // Average of rule-based and LLM scores
        notes += `; LLM evaluation: ${(llmScore * 100).toFixed(1)}%`;
      }
      
      return {
        metricId: metric.id,
        metricName: metric.name,
        score,
        maxScore: 1,
        weight: metric.weight,
        weightedScore: score * metric.weight,
        notes
      };
      
    } catch (error) {
      return this.createErrorMetricScore(metric, error);
    }
  }

  /**
   * Evaluate contextual relevance
   */
  private async evaluateContextualRelevance(testCase: TestCase, actualOutput: any): Promise<MetricScore> {
    const metric = this.config.evaluationMetrics.find(m => m.id === 'contextual_relevance')!;
    
    try {
      let score = 0;
      let notes = '';
      
      // Check if response leverages retrieved context
      if (actualOutput.vectorSearchResults && actualOutput.vectorSearchResults.length > 0) {
        const contextUtilization = this.evaluateContextUtilization(actualOutput.response, actualOutput.vectorSearchResults);
        score = contextUtilization;
        notes = `Context utilization: ${(contextUtilization * 100).toFixed(1)}%`;
      }
      
      // Check semantic similarity between response and context
      if (testCase.input.context?.contentContext) {
        const semanticSimilarity = await this.calculateSemanticSimilarity(
          actualOutput.response,
          testCase.input.context.contentContext.content
        );
        score = (score + semanticSimilarity) / 2; // Average of utilization and similarity
        notes += `; Semantic similarity: ${(semanticSimilarity * 100).toFixed(1)}%`;
      }
      
      // Apply LLM evaluation if available
      if (this.shouldUseLLMEvaluation()) {
        const llmScore = await this.evaluateWithLLM('contextual_relevance', testCase, actualOutput);
        score = (score + llmScore) / 2;
        notes += `; LLM evaluation: ${(llmScore * 100).toFixed(1)}%`;
      }
      
      return {
        metricId: metric.id,
        metricName: metric.name,
        score,
        maxScore: 1,
        weight: metric.weight,
        weightedScore: score * metric.weight,
        notes
      };
      
    } catch (error) {
      return this.createErrorMetricScore(metric, error);
    }
  }

  /**
   * Evaluate user friction reduction
   */
  private async evaluateUserFrictionReduction(testCase: TestCase, actualOutput: any): Promise<MetricScore> {
    const metric = this.config.evaluationMetrics.find(m => m.id === 'user_friction_reduction')!;
    
    try {
      let score = 1; // Start with perfect score
      let notes = '';
      
      // Check for clarification requests
      const clarificationRequests = this.countClarificationRequests(actualOutput.response);
      if (clarificationRequests > 0) {
        score = Math.max(0, score - (clarificationRequests * 0.2)); // Penalty per clarification
        notes = `Clarification requests: ${clarificationRequests} (penalty: ${(clarificationRequests * 0.2 * 100).toFixed(1)}%)`;
      }
      
      // Check for repetitive questions
      const repetitiveQuestions = this.detectRepetitiveQuestions(actualOutput.response, testCase.input.context);
      if (repetitiveQuestions) {
        score = Math.max(0, score - 0.3); // Penalty for repetitive questions
        notes += `; Repetitive questions detected (penalty: 30%)`;
      }
      
      // Check if response builds upon previous context
      const buildsOnContext = this.detectsBuildingOnContext(actualOutput.response, testCase.input.context);
      if (buildsOnContext) {
        score = Math.min(1, score + 0.1); // Bonus for building on context
        notes += `; Bonus: Builds on previous context (+10%)`;
      }
      
      // Apply LLM evaluation if available
      if (this.shouldUseLLMEvaluation()) {
        const llmScore = await this.evaluateWithLLM('user_friction_reduction', testCase, actualOutput);
        score = (score + llmScore) / 2;
        notes += `; LLM evaluation: ${(llmScore * 100).toFixed(1)}%`;
      }
      
      return {
        metricId: metric.id,
        metricName: metric.name,
        score: Math.max(0, Math.min(1, score)), // Ensure score is between 0 and 1
        maxScore: 1,
        weight: metric.weight,
        weightedScore: Math.max(0, Math.min(1, score)) * metric.weight,
        notes
      };
      
    } catch (error) {
      return this.createErrorMetricScore(metric, error);
    }
  }

  /**
   * Evaluate persona consistency
   */
  private async evaluatePersonaConsistency(testCase: TestCase, actualOutput: any): Promise<MetricScore> {
    const metric = this.config.evaluationMetrics.find(m => m.id === 'persona_consistency')!;
    
    try {
      const persona = testCase.input.context?.persona;
      if (!persona) {
        return this.createErrorMetricScore(metric, new Error('No persona specified'));
      }
      
      let score = 0;
      let notes = '';
      
      // Check if response maintains persona characteristics
      const personaMaintained = this.evaluatePersonaMaintenance(actualOutput.response, persona);
      score = personaMaintained;
      notes = `Persona maintenance: ${(personaMaintained * 100).toFixed(1)}%`;
      
      // Apply LLM evaluation if available
      if (this.shouldUseLLMEvaluation()) {
        const llmScore = await this.evaluateWithLLM('persona_consistency', testCase, actualOutput);
        score = (score + llmScore) / 2;
        notes += `; LLM evaluation: ${(llmScore * 100).toFixed(1)}%`;
      }
      
      return {
        metricId: metric.id,
        metricName: metric.name,
        score,
        maxScore: 1,
        weight: metric.weight,
        weightedScore: score * metric.weight,
        notes
      };
      
    } catch (error) {
      return this.createErrorMetricScore(metric, error);
    }
  }

  /**
   * Evaluate vector search performance
   */
  private async evaluateVectorSearchPerformance(testCase: TestCase, actualOutput: any): Promise<MetricScore> {
    const metric = this.config.evaluationMetrics.find(m => m.id === 'vector_search_performance')!;
    
    try {
      let score = 0;
      let notes = '';
      
      // Check query time
      if (actualOutput.queryTime !== undefined) {
        const timeScore = this.evaluateQueryTime(actualOutput.queryTime);
        score += timeScore * 0.4; // 40% weight for speed
        notes = `Query time: ${actualOutput.queryTime}ms (score: ${(timeScore * 100).toFixed(1)}%)`;
      }
      
      // Check result relevance
      if (actualOutput.vectorSearchResults && actualOutput.vectorSearchResults.length > 0) {
        const relevanceScore = this.evaluateResultRelevance(actualOutput.vectorSearchResults);
        score += relevanceScore * 0.6; // 60% weight for relevance
        notes += `; Result relevance: ${(relevanceScore * 100).toFixed(1)}%`;
      }
      
      return {
        metricId: metric.id,
        metricName: metric.name,
        score,
        maxScore: 1,
        weight: metric.weight,
        weightedScore: score * metric.weight,
        notes
      };
      
    } catch (error) {
      return this.createErrorMetricScore(metric, error);
    }
  }

  // Helper methods for evaluation logic

  /**
   * Count references to previous context in response
   */
  private countContextReferences(response: string, previousMessages: any[]): number {
    let count = 0;
    previousMessages.forEach(message => {
      // Simple keyword matching - could be enhanced with semantic similarity
      const keywords = this.extractKeywords(message.content);
      keywords.forEach(keyword => {
        if (response.toLowerCase().includes(keyword.toLowerCase())) {
          count++;
        }
      });
    });
    return count;
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const words = content.split(/\s+/);
    return words
      .filter(word => word.length > 3) // Filter out short words
      .slice(0, 10); // Take top 10 words
  }

  /**
   * Detect if response asks for information that should be remembered
   */
  private detectsAskingForKnownInfo(response: string, context: any): boolean {
    const askingPatterns = [
      /what is your name/i,
      /what do you know about me/i,
      /tell me about yourself/i,
      /what did we talk about/i
    ];
    
    return askingPatterns.some(pattern => pattern.test(response));
  }

  /**
   * Evaluate context utilization in response
   */
  private evaluateContextUtilization(response: string, searchResults: any[]): number {
    if (!searchResults || searchResults.length === 0) return 0;
    
    let utilizationScore = 0;
    searchResults.forEach(result => {
      const keywords = this.extractKeywords(result.content || result.title);
      const referencedKeywords = keywords.filter(keyword => 
        response.toLowerCase().includes(keyword.toLowerCase())
      );
      utilizationScore += referencedKeywords.length / keywords.length;
    });
    
    return Math.min(1, utilizationScore / searchResults.length);
  }

  /**
   * Calculate semantic similarity between two texts
   */
  private async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    // Placeholder for semantic similarity calculation
    // This could use embeddings, cosine similarity, or other NLP techniques
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Count clarification requests in response
   */
  private countClarificationRequests(response: string): number {
    const clarificationPatterns = [
      /can you clarify/i,
      /what do you mean/i,
      /could you explain/i,
      /i'm not sure/i,
      /please specify/i
    ];
    
    return clarificationPatterns.filter(pattern => pattern.test(response)).length;
  }

  /**
   * Detect repetitive questions
   */
  private detectRepetitiveQuestions(response: string, context: any): boolean {
    if (!context?.previousMessages) return false;
    
    const responseKeywords = this.extractKeywords(response);
    const previousKeywords = context.previousMessages.flatMap(msg => 
      this.extractKeywords(msg.content)
    );
    
    // Check for significant overlap
    const overlap = responseKeywords.filter(keyword => 
      previousKeywords.includes(keyword)
    ).length;
    
    return overlap > responseKeywords.length * 0.7; // 70% overlap threshold
  }

  /**
   * Detect if response builds on previous context
   */
  private detectsBuildingOnContext(response: string, context: any): boolean {
    if (!context?.previousMessages) return false;
    
    const buildingPatterns = [
      /based on/i,
      /as we discussed/i,
      /continuing from/i,
      /building on/i,
      /following up/i
    ];
    
    return buildingPatterns.some(pattern => pattern.test(response));
  }

  /**
   * Evaluate persona maintenance
   */
  private evaluatePersonaMaintenance(response: string, persona: string): number {
    const personaCharacteristics: Record<string, string[]> = {
      'dating_coach': ['relationship', 'dating', 'romance', 'communication', 'confidence'],
      'fitness_trainer': ['workout', 'exercise', 'fitness', 'health', 'training'],
      'therapist': ['therapy', 'mental health', 'emotions', 'coping', 'support'],
      'content_creator': ['content', 'creation', 'strategy', 'audience', 'platform']
    };
    
    const characteristics = personaCharacteristics[persona] || [];
    if (characteristics.length === 0) return 0.5; // Default score for unknown personas
    
    const relevantTerms = characteristics.filter(term => 
      response.toLowerCase().includes(term.toLowerCase())
    );
    
    return relevantTerms.length / characteristics.length;
  }

  /**
   * Evaluate query time performance
   */
  private evaluateQueryTime(queryTime: number): number {
    const targetTime = 2000; // 2 seconds target
    if (queryTime <= targetTime) return 1;
    if (queryTime <= targetTime * 2) return 0.7;
    if (queryTime <= targetTime * 3) return 0.4;
    return 0.1;
  }

  /**
   * Evaluate result relevance
   */
  private evaluateResultRelevance(searchResults: any[]): number {
    if (!searchResults || searchResults.length === 0) return 0;
    
    const relevanceScores = searchResults.map(result => result.score || 0);
    const averageScore = relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length;
    
    return Math.min(1, averageScore);
  }

  /**
   * Check if LLM evaluation should be used
   */
  private shouldUseLLMEvaluation(): boolean {
    // Placeholder - could check for API keys, configuration, etc.
    return false; // Disabled for now
  }

  /**
   * Evaluate with LLM (placeholder)
   */
  private async evaluateWithLLM(metricType: string, testCase: TestCase, actualOutput: any): Promise<number> {
    // Placeholder for LLM evaluation
    // This would integrate with OpenAI, Claude, or other LLM APIs
    console.log(`🤖 LLM evaluation requested for ${metricType} (not implemented yet)`);
    return 0.5; // Default score
  }

  /**
   * Create error metric score
   */
  private createErrorMetricScore(metric: any, error: any): MetricScore {
    return {
      metricId: metric.id,
      metricName: metric.name,
      score: 0,
      maxScore: 1,
      weight: metric.weight,
      weightedScore: 0,
      notes: `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
