import { useState, useCallback } from 'react';
import { useConvex } from 'convex/react';
import { usePersonaStore } from '@/store/persona-store';
import { useTokenDamCheck } from './useTokenDamCheck';
import { PersonaError } from '@/lib/persona-error-handler';
import { 
  PersonaCrystallizationConfig,
  PersonaCrystallizationState,
  DamStatus,
  INITIAL_STATE,
  extractTracesFromConversation as extractTracesOp,
  crystallizeUserInsights as crystallizeInsightsOp,
  checkBackendHealth as checkHealthOp,
  performAutoCrystallization,
  getErrorMessage,
  canRetry,
  retryWithBackoff
} from '@/lib/persona-crystallization';


export interface UsePersonaCrystallizationReturn {
  // State
  state: PersonaCrystallizationState;
  
  // Dam status
  damStatus: DamStatus;
  
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
  
  // Check token dam status before expensive operations - only when userId is available
  const damCheck = useTokenDamCheck({ 
    userId: userId || '', // Keep empty string as fallback for hook call consistency
  });
  const refreshPersonaData = usePersonaStore(state => state.refreshPersonaData);
  
  const [state, setState] = useState<PersonaCrystallizationState>(INITIAL_STATE);



  /**
   * Extract traces from a conversation with auto-crystallization
   */
  const extractTracesFromConversation = useCallback(async (
    conversationId: string, 
    conversationData: any
  ): Promise<any> => {
    if (!userId) {
      setState(prev => ({ ...prev, extractionError: null }));
      throw new Error('User ID is required for trace extraction');
    }

    setState(prev => ({ 
      ...prev, 
      isExtracting: true, 
      extractionError: null,
      lastStoredTraceIds: []
    }));

    try {
      const { result, storedTraceIds } = await extractTracesOp(
        userId,
        conversationId,
        conversationData,
        damCheck,
        state.config,
        convex
      );
      
      setState(prev => ({ 
        ...prev, 
        isExtracting: false, 
        lastExtraction: result,
        lastStoredTraceIds: storedTraceIds
      }));

      // Auto-crystallization logic
      if (state.config.autoCrystallizationEnabled && storedTraceIds.length > 0) {
        console.log(`🔮 Auto-crystallization enabled, triggering crystallization`, {
          traceIdsCount: storedTraceIds.length,
          minConfidence: state.config.minConfidenceThreshold
        });
        
        try {
          // Run crystallization asynchronously but with error isolation
          const crystallizationPromise = performAutoCrystallization(
            userId,
            storedTraceIds,
            state.config.minConfidenceThreshold,
            damCheck,
            state.config,
            convex,
            refreshPersonaData
          );
          
          // Don't await crystallization to avoid blocking the main flow
          crystallizationPromise.catch((crystallizationError) => {
            console.warn(`⚠️ Auto-crystallization failed but extraction succeeded`, {
              error: crystallizationError?.message || 'Unknown error'
            });
          });
        } catch (autoCrystallizationError) {
          console.warn(`⚠️ Auto-crystallization setup failed`, {
            error: autoCrystallizationError
          });
        }
      }

      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isExtracting: false, 
        extractionError: error as any
      }));
      throw error;
    }
  }, [userId, convex, state.config, damCheck, refreshPersonaData]);

  /**
   * Crystallize insights from trace IDs with enhanced error handling
   */
  const crystallizeUserInsights = useCallback(async (
    traceIds: string[], 
    minConfidence: number = 0.6
  ): Promise<any> => {
    if (!userId) {
      setState(prev => ({ ...prev, crystallizationError: null }));
      throw new Error('User ID is required for insight crystallization');
    }

    setState(prev => ({ 
      ...prev, 
      isCrystallizing: true, 
      crystallizationError: null 
    }));

    try {
      const result = await crystallizeInsightsOp(
        userId,
        traceIds,
        minConfidence,
        damCheck,
        state.config,
        convex,
        refreshPersonaData
      );
      
      setState(prev => ({ 
        ...prev, 
        isCrystallizing: false, 
        lastCrystallization: result 
      }));

      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isCrystallizing: false, 
        crystallizationError: error as any
      }));
      throw error;
    }
  }, [userId, convex, state.config, damCheck, refreshPersonaData]);

  /**
   * Check backend health with enhanced error handling
   */
  const checkBackendHealth = useCallback(async (): Promise<any> => {
    setState(prev => ({ 
      ...prev, 
      isHealthChecking: true, 
      healthError: null 
    }));

    try {
      const result = await checkHealthOp(state.config);
      
      setState(prev => ({ 
        ...prev, 
        isHealthChecking: false, 
        lastHealthCheck: result 
      }));

      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isHealthChecking: false, 
        healthError: error as any
      }));
      throw error;
    }
  }, [state.config]);

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

  // Error utility functions from imported utilities
  const retryWithBackoffWrapper = useCallback(async (
    operation: () => Promise<any>,
    errorType: any
  ): Promise<any> => {
    return retryWithBackoff(operation, errorType, state.config);
  }, [state.config]);

  // Wrapper functions to maintain the same interface
  const getErrorMessageWrapper = useCallback((error: PersonaError | null): string | null => {
    return getErrorMessage(error);
  }, []);

  const canRetryWrapper = useCallback((error: PersonaError | null): boolean => {
    return canRetry(error);
  }, []);

  return {
    state,
    damStatus: {
      isAllowed: damCheck.isAllowed,
      damStatus: damCheck.damStatus,
      reasonBlocked: damCheck.reasonBlocked,
      percentageFull: damCheck.percentageFull,
      tokensRemaining: damCheck.tokensRemaining,
      isLoading: damCheck.isLoading,
    },
    extractTracesFromConversation,
    crystallizeUserInsights,
    checkBackendHealth,
    processConversationAndCrystallize,
    clearErrors,
    updateConfig,
    getErrorMessage: getErrorMessageWrapper,
    canRetry: canRetryWrapper,
    retryWithBackoff: retryWithBackoffWrapper,
  };
};

