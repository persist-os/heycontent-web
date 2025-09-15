import { useState, useCallback } from 'react';
import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  triggerConversationTraceExtraction, 
  triggerInsightCrystallization, 
  checkPersonaHealth 
} from '@/app/lib/persona-api';
import { usePersonaStore } from '@/store/persona-store';
import { personaErrorHandler, categorizeError, PersonaError } from '@/lib/persona-error-handler';

export interface PersonaCrystallizationConfig {
  autoCrystallizationEnabled: boolean;
  minConfidenceThreshold: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
}

export interface PersonaCrystallizationState {
  isExtracting: boolean;
  isCrystallizing: boolean;
  isHealthChecking: boolean;
  extractionError: PersonaError | null;
  crystallizationError: PersonaError | null;
  healthError: PersonaError | null;
  lastExtraction: any | null;
  lastCrystallization: any | null;
  lastHealthCheck: any | null;
  config: PersonaCrystallizationConfig;
  lastStoredTraceIds: string[];
}

export interface UsePersonaCrystallizationReturn {
  // State
  state: PersonaCrystallizationState;
  
  // Actions
  extractTracesFromConversation: (conversationId: string, conversationData: any) => Promise<any>;
  crystallizeUserInsights: (traceIds: string[], minConfidence?: number) => Promise<any>;
  checkBackendHealth: () => Promise<any>;
  
  // Convenience methods
  processConversationAndCrystallize: (conversationId: string, conversationData: any, minConfidence?: number) => Promise<any>;
  clearErrors: () => void;
  
  // Configuration
  updateConfig: (config: Partial<PersonaCrystallizationConfig>) => void;
  
  // Error utilities
  getErrorMessage: (error: PersonaError | null) => string | null;
  canRetry: (error: PersonaError | null) => boolean;
  retryWithBackoff: (operation: () => Promise<any>, errorType: PersonaError['type']) => Promise<any>;
}

/**
 * Enhanced hook for persona crystallization functionality with auto-crystallization
 * Integrates with the existing persona store and provides authenticated access to crystallization APIs
 */
export const usePersonaCrystallization = (userId: string | undefined): UsePersonaCrystallizationReturn => {
  const convex = useConvex();
  const refreshPersonaData = usePersonaStore(state => state.refreshPersonaData);
  
  const [state, setState] = useState<PersonaCrystallizationState>({
    isExtracting: false,
    isCrystallizing: false,
    isHealthChecking: false,
    extractionError: null,
    crystallizationError: null,
    healthError: null,
    lastExtraction: null,
    lastCrystallization: null,
    lastHealthCheck: null,
    config: {
      autoCrystallizationEnabled: true,
      minConfidenceThreshold: 0.6,
      maxRetryAttempts: 3,
      retryDelayMs: 1000
    },
    lastStoredTraceIds: []
  });

  /**
   * Validate trace IDs format and content to match exact backend generation format.
   * 
   * Expected formats:
   * - Extracted traces: trace_{timestamp_ms}_{user_hash}_{unique_id}
   *   - timestamp_ms: 13-digit Unix timestamp in milliseconds
   *   - user_hash: 8-character hexadecimal string (a-f0-9)
   *   - unique_id: 8-character hexadecimal string (a-f0-9)
   * - Manual traces: manual_{timestamp}_{random_string}
   *   - timestamp: Unix timestamp (10-13 digits)
   *   - random_string: alphanumeric string
   */
  const validateTraceIds = useCallback((traceIds: string[]): boolean => {
    if (!Array.isArray(traceIds)) {
      console.warn('Invalid trace IDs: not an array');
      return false;
    }
    
    // Empty arrays are valid - they indicate all-traces crystallization
    if (traceIds.length === 0) {
      return true;
    }

    for (const traceId of traceIds) {
      if (typeof traceId !== 'string' || traceId.trim().length === 0) {
        console.warn(`Invalid trace ID: not a string or empty - ${traceId}`);
        return false;
      }
      
      // Validate extracted trace format (matches backend _generate_trace_id)
      // Pattern: trace_ + 10 digits + _ + 8 hex chars + _ + 8 hex chars  
      const isValidExtractedTrace = /^trace_\d{10}_[a-f0-9]{8}_[a-f0-9]{8}$/.test(traceId);
      
      // Validate manual trace format (legacy support)
      // Pattern: manual_ + timestamp + _ + alphanumeric string
      const isValidManualTrace = /^manual_\d{10,13}_[a-zA-Z0-9]+$/.test(traceId);
      
      if (!isValidExtractedTrace && !isValidManualTrace) {
        console.warn(`Invalid trace ID format: ${traceId}. Expected formats:
          - Extracted: trace_{10-digit-timestamp}_{8-hex-chars}_{8-hex-chars}
          - Manual: manual_{timestamp}_{alphanumeric}`);
        return false;
      }
    }

    return true;
  }, []);

  /**
   * Retry mechanism with exponential backoff
   */
  const retryWithBackoff = useCallback(async (
    operation: () => Promise<any>,
    errorType: PersonaError['type']
  ): Promise<any> => {
    const { maxRetryAttempts, retryDelayMs } = state.config;
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on validation errors
        if (errorType === 'validation') {
          throw lastError;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetryAttempts - 1) {
          throw lastError;
        }
        
        // Calculate delay with exponential backoff
        const delay = retryDelayMs * Math.pow(2, attempt);
        console.log(`🔄 [RETRY] Attempt ${attempt + 1}/${maxRetryAttempts} failed, retrying in ${delay}ms`, {
          errorType,
          error: lastError.message
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }, [state.config]);

  /**
   * Extract trace IDs from extraction result
   */
  const extractTraceIds = useCallback((extractionResult: any): string[] => {
    if (!extractionResult?.traces || !Array.isArray(extractionResult.traces)) {
      return [];
    }

    const traceIds = extractionResult.traces
      .map((trace: any) => trace.trace_id || trace.id)
      .filter((id: any) => typeof id === 'string' && id.trim().length > 0);

    console.log('🔍 [TRACE-ID-EXTRACTION] Extracted trace IDs', {
      totalTraces: extractionResult.traces.length,
      validTraceIds: traceIds.length,
      traceIds: traceIds.slice(0, 3) // Log first 3 for debugging
    });

    return traceIds;
  }, []);

  /**
   * Auto-crystallization helper function
   */
  const performAutoCrystallization = async (traceIds: string[], minConfidence: number) => {
    const crystallizationId = Math.random().toString(36).substring(7);
    
    if (!userId) {
      console.warn(`⚠️ [AUTO-CRYSTALLIZATION:${crystallizationId}] No userId available`);
      return;
    }

    // Validate trace IDs
    if (!validateTraceIds(traceIds)) {
      console.warn(`⚠️ [AUTO-CRYSTALLIZATION:${crystallizationId}] Invalid trace IDs`, { traceIds });
      return;
    }

    console.log(`🔮 [AUTO-CRYSTALLIZATION:${crystallizationId}] Starting auto-crystallization`, {
      traceIdsCount: traceIds.length,
      minConfidence
    });

    setState(prev => ({ 
      ...prev, 
      isCrystallizing: true, 
      crystallizationError: null 
    }));

    try {
      const result = await retryWithBackoff(
        () => triggerInsightCrystallization(userId, traceIds, minConfidence),
        'crystallization'
      );
      
      console.log(`✅ [AUTO-CRYSTALLIZATION:${crystallizationId}] Crystallization completed`, {
        insightsCount: result.insights?.length || 0
      });

      setState(prev => ({ 
        ...prev, 
        isCrystallizing: false, 
        lastCrystallization: result 
      }));

      // Store insights in Convex
      if (result.insights && result.insights.length > 0) {
        try {
          await retryWithBackoff(
            () => convex.action(api.personaCrystallizationMutations.storeCrystallizedInsightsAction, {
              user_id: userId,
              insights: result.insights
            }),
            'storage'
          );
          
          // Refresh persona data
          await retryWithBackoff(
            () => refreshPersonaData(userId, convex),
            'storage'
          );
          
          console.log(`🔄 [AUTO-CRYSTALLIZATION:${crystallizationId}] Persona data refreshed`);
        } catch (convexError) {
          console.warn(`⚠️ [AUTO-CRYSTALLIZATION:${crystallizationId}] Storage failed:`, convexError);
        }
      }
    } catch (error) {
      const originalError = error instanceof Error ? error : new Error(String(error));
      
      const personaError = personaErrorHandler.logError(
        categorizeError(originalError, 'crystallization'),
        'Auto-crystallization failed',
        {
          userId,
          operation: 'auto_crystallize_insights',
          metadata: { 
            traceIdsCount: traceIds.length,
            minConfidence,
            traceIds: traceIds.slice(0, 3)
          }
        },
        originalError
      );
      
      setState(prev => ({ 
        ...prev, 
        isCrystallizing: false, 
        crystallizationError: personaError 
      }));
      
      console.warn(`⚠️ [AUTO-CRYSTALLIZATION:${crystallizationId}] Failed:`, originalError.message);
    }
  };

  /**
   * Extract traces from a conversation with auto-crystallization
   */
  const extractTracesFromConversation = useCallback(async (
    conversationId: string, 
    conversationData: any
  ): Promise<any> => {
    const hookId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    console.log(`🪝 [HOOK:${hookId}] Starting trace extraction from conversation`, {
      userId,
      conversationId,
      hasConversationData: !!conversationData,
      autoCrystallizationEnabled: state.config.autoCrystallizationEnabled,
      timestamp: new Date().toISOString()
    });

    if (!userId) {
      console.error(`❌ [HOOK:${hookId}] User ID is required for trace extraction`);
      const validationError = personaErrorHandler.logError(
        'validation',
        'User ID is required for trace extraction',
        { operation: 'extract_traces_validation' },
        new Error('Missing userId parameter')
      );
      setState(prev => ({ ...prev, extractionError: validationError }));
      throw new Error('User ID is required for trace extraction');
    }

    console.log(`🔄 [HOOK:${hookId}] Setting extraction state to loading`);
    setState(prev => ({ 
      ...prev, 
      isExtracting: true, 
      extractionError: null,
      lastStoredTraceIds: [] // Clear previous trace IDs
    }));

    try {
      console.log(`🚀 [HOOK:${hookId}] Calling triggerConversationTraceExtraction with retry logic`);
      
      const result = await retryWithBackoff(
        () => triggerConversationTraceExtraction(userId, conversationId, conversationData),
        'extraction'
      );
      
      const duration = Date.now() - startTime;
      console.log(`📊 [HOOK:${hookId}] Trace extraction completed`, {
        duration_ms: duration,
        tracesCount: result.traces?.length || 0,
        hasMetadata: !!result.extraction_metadata
      });
      
      let storedTraceIds: string[] = [];
      
      // Store traces in Convex if they were extracted
      if (result.traces && result.traces.length > 0) {
        console.log(`💾 [HOOK:${hookId}] Storing ${result.traces.length} traces in Convex`);
        try {
          // Call Convex action to store the traces (filter out convex_id field that's not needed)
          const cleanedTraces = result.traces.map((trace: any) => {
            const { convex_id, ...cleanTrace } = trace;
            return cleanTrace;
          });
          
          await retryWithBackoff(
            () => convex.action(api.personaCrystallizationMutations.storePersonaTracesAction, {
              user_id: userId,
              conversation_id: conversationId as any,
              traces: cleanedTraces
            }),
            'storage'
          );
          
          // Extract and validate trace IDs from the stored traces
          storedTraceIds = extractTraceIds(result);
          
          if (!validateTraceIds(storedTraceIds)) {
            console.warn(`⚠️ [HOOK:${hookId}] Invalid trace IDs detected`, { storedTraceIds });
            const validationError = personaErrorHandler.logError(
              'validation',
              'Invalid trace IDs after storage',
              {
                userId,
                conversationId,
                operation: 'validate_trace_ids',
                metadata: { invalidTraceIds: storedTraceIds }
              },
              new Error('Trace IDs validation failed')
            );
            // Don't throw, just log the warning
            storedTraceIds = [];
          }
          
          console.log(`✅ [HOOK:${hookId}] Traces stored in Convex successfully`, {
            storedTraceIds: storedTraceIds.length,
            validTraceIds: storedTraceIds.slice(0, 3) // Log first 3 for debugging
          });
        } catch (convexError) {
          const error = personaErrorHandler.logError(
            'storage',
            'Failed to store traces in Convex',
            {
              userId,
              conversationId,
              operation: 'store_traces',
              metadata: { tracesCount: result.traces.length }
            },
            convexError instanceof Error ? convexError : new Error(String(convexError))
          );
          
          // Don't fail the whole operation if Convex storage fails
          console.warn(`⚠️ [HOOK:${hookId}] ${personaErrorHandler.getUserMessage(error)}`);
        }
      } else {
        console.log(`ℹ️ [HOOK:${hookId}] No traces to store in Convex`);
      }
      
      // Update state with extraction result and stored trace IDs
      setState(prev => ({ 
        ...prev, 
        isExtracting: false, 
        lastExtraction: result,
        lastStoredTraceIds: storedTraceIds
      }));

      // Auto-crystallization logic
      if (state.config.autoCrystallizationEnabled && storedTraceIds.length > 0) {
        console.log(`🔮 [HOOK:${hookId}] Auto-crystallization enabled, triggering crystallization`, {
          traceIdsCount: storedTraceIds.length,
          minConfidence: state.config.minConfidenceThreshold
        });
        
        try {
          // Run crystallization asynchronously but with error isolation
          const crystallizationPromise = performAutoCrystallization(
            storedTraceIds, 
            state.config.minConfidenceThreshold
          );
          
          // Don't await crystallization to avoid blocking the main flow
          crystallizationPromise.catch((crystallizationError) => {
            console.warn(`⚠️ [HOOK:${hookId}] Auto-crystallization failed but extraction succeeded`, {
              error: crystallizationError?.message || 'Unknown error'
            });
            // Error is already handled in performAutoCrystallization
          });
        } catch (autoCrystallizationError) {
          // Log but don't fail the extraction
          console.warn(`⚠️ [HOOK:${hookId}] Auto-crystallization setup failed`, {
            error: autoCrystallizationError
          });
        }
      } else {
        console.log(`ℹ️ [HOOK:${hookId}] Auto-crystallization skipped`, {
          enabled: state.config.autoCrystallizationEnabled,
          hasTraceIds: storedTraceIds.length > 0
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const originalError = error instanceof Error ? error : new Error(String(error));
      
      const personaError = personaErrorHandler.logError(
        categorizeError(originalError, 'trace_extraction'),
        'Trace extraction failed',
        {
          userId,
          conversationId,
          operation: 'extract_traces',
          duration,
          metadata: { 
            hasConversationData: !!conversationData,
            messageCount: conversationData?.messages?.length || 0,
            autoCrystallizationEnabled: state.config.autoCrystallizationEnabled
          }
        },
        originalError
      );
      
      console.log(`🔄 [HOOK:${hookId}] Setting extraction error state`);
      setState(prev => ({ 
        ...prev, 
        isExtracting: false, 
        extractionError: personaError 
      }));
      throw error;
    }
  }, [userId, convex, state.config, retryWithBackoff, extractTraceIds, validateTraceIds]);

  /**
   * Crystallize insights from trace IDs with enhanced error handling
   */
  const crystallizeUserInsights = useCallback(async (
    traceIds: string[], 
    minConfidence: number = 0.6
  ): Promise<any> => {
    const crystallizationId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    console.log(`🔮 [CRYSTALLIZATION:${crystallizationId}] Starting insight crystallization`, {
      userId,
      traceIdsCount: traceIds.length,
      minConfidence,
      timestamp: new Date().toISOString()
    });

    if (!userId) {
      console.error(`❌ [CRYSTALLIZATION:${crystallizationId}] STEP 0 FAILED: User ID is required`);
      const validationError = personaErrorHandler.logError(
        'validation',
        'User ID is required for insight crystallization',
        { operation: 'crystallize_insights_validation' },
        new Error('Missing userId parameter')
      );
      setState(prev => ({ ...prev, crystallizationError: validationError }));
      throw new Error('User ID is required for insight crystallization');
    }

    console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] STEP 1: Validating ${traceIds.length} trace IDs`, {
      traceIds: traceIds.slice(0, 3),
      totalCount: traceIds.length
    });

    // Validate trace IDs before proceeding
    if (!validateTraceIds(traceIds)) {
      console.error(`❌ [CRYSTALLIZATION:${crystallizationId}] STEP 1 FAILED: Trace ID validation failed`);
      const validationError = personaErrorHandler.logError(
        'validation',
        'Invalid trace IDs provided for crystallization',
        {
          userId,
          operation: 'crystallize_insights_validation',
          metadata: { traceIds, traceIdsCount: traceIds.length }
        },
        new Error('Trace IDs validation failed')
      );
      setState(prev => ({ ...prev, crystallizationError: validationError }));
      throw new Error('Invalid trace IDs provided for crystallization');
    }

    console.warn(`✅ [CRYSTALLIZATION:${crystallizationId}] STEP 1 SUCCESS: Trace IDs validated successfully`);

    setState(prev => ({ 
      ...prev, 
      isCrystallizing: true, 
      crystallizationError: null 
    }));

    try {
      console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] STEP 2: Calling backend triggerInsightCrystallization`, {
        userId,
        traceIdsCount: traceIds.length,
        minConfidence
      });
      
      const result = await retryWithBackoff(
        () => triggerInsightCrystallization(userId, traceIds, minConfidence),
        'crystallization'
      );
      
      const duration = Date.now() - startTime;
      console.warn(`✅ [CRYSTALLIZATION:${crystallizationId}] STEP 2 SUCCESS: Backend crystallization completed`, {
        duration_ms: duration,
        insightsCount: result.insights?.length || 0,
        hasMetadata: !!result.crystallization_metadata,
        resultKeys: Object.keys(result || {})
      });
      
      setState(prev => ({ 
        ...prev, 
        isCrystallizing: false, 
        lastCrystallization: result 
      }));

      // Store crystallized insights in Convex if they were created
      if (result.insights && result.insights.length > 0) {
        console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] STEP 3: Storing ${result.insights.length} insights in Convex`, {
          insightsCount: result.insights.length,
          firstInsight: result.insights[0] ? {
            id: result.insights[0].insight_id,
            type: result.insights[0].insight_type,
            confidence: result.insights[0].confidence
          } : null
        });
        try {
          // Call Convex action to store the insights with retry logic
          await retryWithBackoff(
            () => convex.action(api.personaCrystallizationMutations.storeCrystallizedInsightsAction, {
              user_id: userId,
              insights: result.insights
            }),
            'storage'
          );
          
          console.warn(`✅ [CRYSTALLIZATION:${crystallizationId}] STEP 3 SUCCESS: Insights stored in Convex successfully`);
          
          console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] STEP 4: Refreshing persona data`);
          // Refresh persona data to reflect any updates
          await retryWithBackoff(
            () => refreshPersonaData(userId, convex),
            'storage'
          );
          
          console.warn(`✅ [CRYSTALLIZATION:${crystallizationId}] STEP 4 SUCCESS: Persona data refreshed`);
        } catch (convexError) {
          console.error(`❌ [CRYSTALLIZATION:${crystallizationId}] STEP 3/4 FAILED: Convex storage error`, convexError);
          const error = personaErrorHandler.logError(
            'storage',
            'Failed to store crystallized insights in Convex',
            {
              userId,
              operation: 'store_insights',
              metadata: { insightsCount: result.insights.length }
            },
            convexError instanceof Error ? convexError : new Error(String(convexError))
          );
          
          // Don't fail the whole operation if Convex storage fails
          console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] ${personaErrorHandler.getUserMessage(error)}`);
        }
      } else {
        console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] STEP 3 SKIPPED: No insights to store (${result.insights?.length || 0} insights returned)`);
      }

      console.warn(`🎉 [CRYSTALLIZATION:${crystallizationId}] FINAL: Crystallization process completed successfully`, {
        totalDuration: Date.now() - startTime,
        insightsGenerated: result.insights?.length || 0,
        hasMetadata: !!result.crystallization_metadata
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const originalError = error instanceof Error ? error : new Error(String(error));
      
      console.error(`❌ [CRYSTALLIZATION:${crystallizationId}] FATAL ERROR: Crystallization process failed`, {
        error: originalError.message,
        duration,
        step: 'unknown_failure',
        traceIdsCount: traceIds.length,
        minConfidence,
        stackTrace: originalError.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
      });
      
      const personaError = personaErrorHandler.logError(
        categorizeError(originalError, 'crystallization'),
        'Insight crystallization failed',
        {
          userId,
          operation: 'crystallize_insights',
          duration,
          metadata: { 
            traceIdsCount: traceIds.length,
            minConfidence,
            traceIds: traceIds.slice(0, 3) // Log first 3 for debugging
          }
        },
        originalError
      );
      
      console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] Setting crystallization error state and terminating`);
      setState(prev => ({ 
        ...prev, 
        isCrystallizing: false, 
        crystallizationError: personaError 
      }));
      throw error;
    }
  }, [userId, convex, refreshPersonaData, retryWithBackoff, validateTraceIds]);

  /**
   * Check backend health with enhanced error handling
   */
  const checkBackendHealth = useCallback(async (): Promise<any> => {
    const healthId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    console.log(`🏥 [HEALTH:${healthId}] Starting backend health check`);
    
    setState(prev => ({ 
      ...prev, 
      isHealthChecking: true, 
      healthError: null 
    }));

    try {
      const result = await retryWithBackoff(
        () => checkPersonaHealth(),
        'network'
      );
      
      const duration = Date.now() - startTime;
      console.log(`✅ [HEALTH:${healthId}] Health check completed`, {
        duration_ms: duration,
        status: result.status
      });
      
      setState(prev => ({ 
        ...prev, 
        isHealthChecking: false, 
        lastHealthCheck: result 
      }));

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const originalError = error instanceof Error ? error : new Error(String(error));
      
      const personaError = personaErrorHandler.logError(
        'network',
        'Health check failed',
        {
          operation: 'health_check',
          duration
        },
        originalError
      );
      
      console.log(`❌ [HEALTH:${healthId}] Setting health error state`);
      setState(prev => ({ 
        ...prev, 
        isHealthChecking: false, 
        healthError: personaError 
      }));
      throw error;
    }
  }, [retryWithBackoff]);

  /**
   * Convenience method to extract traces and then crystallize insights
   */
  const processConversationAndCrystallize = useCallback(async (
    conversationId: string, 
    conversationData: any, 
    minConfidence: number = 0.6
  ): Promise<any> => {
    console.log('🔄 [CRYSTALLIZATION] Starting conversation processing and crystallization');
    
    // Step 1: Extract traces
    const extractionResult = await extractTracesFromConversation(conversationId, conversationData);
    
    if (!extractionResult.traces || extractionResult.traces.length === 0) {
      console.log('ℹ️ [CRYSTALLIZATION] No traces extracted, skipping crystallization');
      return { extraction: extractionResult, crystallization: null };
    }

    // Step 2: Get trace IDs
    const traceIds = extractionResult.traces.map((trace: any) => trace.trace_id || trace.id);
    
    if (traceIds.length === 0) {
      console.log('ℹ️ [CRYSTALLIZATION] No valid trace IDs found, skipping crystallization');
      return { extraction: extractionResult, crystallization: null };
    }

    // Step 3: Crystallize insights
    const crystallizationResult = await crystallizeUserInsights(traceIds, minConfidence);
    
    console.log('✅ [CRYSTALLIZATION] Conversation processing and crystallization completed');
    
    return { 
      extraction: extractionResult, 
      crystallization: crystallizationResult 
    };
  }, [extractTracesFromConversation, crystallizeUserInsights]);

  /**
   * Update configuration settings
   */
  const updateConfig = useCallback((newConfig: Partial<PersonaCrystallizationConfig>) => {
    console.log('⚙️ [CONFIG] Updating persona crystallization configuration', newConfig);
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        ...newConfig
      }
    }));
  }, []);

  /**
   * Clear all error states
   */
  const clearErrors = useCallback(() => {
    console.log('🧹 [CLEANUP] Clearing all error states');
    setState(prev => ({
      ...prev,
      extractionError: null,
      crystallizationError: null,
      healthError: null,
    }));
  }, []);

  // Error utility functions
  const getErrorMessage = useCallback((error: PersonaError | null): string | null => {
    if (!error) return null;
    return personaErrorHandler.getUserMessage(error);
  }, []);

  const canRetry = useCallback((error: PersonaError | null): boolean => {
    if (!error) return false;
    return error.retryable && (error.retryCount || 0) < 3;
  }, []);

  return {
    state,
    extractTracesFromConversation,
    crystallizeUserInsights,
    checkBackendHealth,
    processConversationAndCrystallize,
    clearErrors,
    updateConfig,
    getErrorMessage,
    canRetry,
    retryWithBackoff,
  };
};
