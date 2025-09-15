import { useState, useCallback, useEffect, useRef } from 'react';
import { useConvex, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  triggerConversationTraceExtraction, 
  triggerInsightCrystallization, 
  checkPersonaHealth 
} from '@/app/lib/persona-api';
import { usePersonaStore } from '@/store/persona-store';
import { personaErrorHandler, categorizeError, PersonaError } from '@/lib/persona-error-handler';
import { Id } from '@/convex/_generated/dataModel';

// === INTERFACES ===

export interface TokenDamStatus {
  exists: boolean;
  damStatus: "open" | "approaching" | "full" | "blocked";
  currentTokens: number;
  tokenLimit: number;
  percentageFull: number;
  tokensRemaining: number;
  processingPaused: boolean;
  nextProcessingAllowed?: number;
  lastUpdated?: number;
}

export interface EnhancedProcessingContext {
  // Interface only - for future backend integration
  traceProcessingDepth: 'shallow' | 'medium' | 'deep';
  confidenceTargeting: 'permissive' | 'balanced' | 'strict';
  batchSize: number;
}

export interface EnhancedPersonaCrystallizationConfig {
  autoCrystallizationEnabled: boolean;
  minConfidenceThreshold: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  // Basic token dam settings
  tokenDamEnabled: boolean;
  // Enhanced processing settings (interface only)
  enableEnhancedTraceProcessing: boolean;
  processingContext: EnhancedProcessingContext;
}

export interface EnhancedPersonaCrystallizationState {
  // Original state fields
  isExtracting: boolean;
  isCrystallizing: boolean;
  isHealthChecking: boolean;
  extractionError: PersonaError | null;
  crystallizationError: PersonaError | null;
  healthError: PersonaError | null;
  lastExtraction: any | null;
  lastCrystallization: any | null;
  lastHealthCheck: any | null;
  config: EnhancedPersonaCrystallizationConfig;
  lastStoredTraceIds: string[];
  
  // Simplified enhanced state fields
  tokenDamStatus: TokenDamStatus | null;
  tokenDamError: PersonaError | null;
  processingContext: EnhancedProcessingContext;
}

export interface UseEnhancedPersonaCrystallizationReturn {
  // State
  state: EnhancedPersonaCrystallizationState;
  
  // Original actions (with basic token dam awareness)
  extractTracesFromConversation: (conversationId: string, conversationData: any) => Promise<any>;
  crystallizeUserInsights: (traceIds: string[], minConfidence?: number) => Promise<any>;
  checkBackendHealth: () => Promise<any>;
  
  // Enhanced processing interface (for future backend integration)
  extractTracesWithEnhancedProcessing: (
    conversationId: string, 
    conversationData: any, 
    processingContext?: Partial<EnhancedProcessingContext>
  ) => Promise<any>;
  
  // Basic token dam management via Convex
  refreshTokenDamStatus: () => void;
  checkTokenAvailability: () => boolean;
  
  // Enhanced processing context (interface only)
  updateProcessingContext: (context: Partial<EnhancedProcessingContext>) => void;
  
  // Original utilities (preserved)
  clearErrors: () => void;
  updateConfig: (config: Partial<EnhancedPersonaCrystallizationConfig>) => void;
  getErrorMessage: (error: PersonaError | null) => string | null;
  canRetry: (error: PersonaError | null) => boolean;
  retryWithBackoff: (operation: () => Promise<any>, errorType: PersonaError['type']) => Promise<any>;
}

// === DEFAULT CONFIGURATION ===

const DEFAULT_PROCESSING_CONTEXT: EnhancedProcessingContext = {
  traceProcessingDepth: 'medium',
  confidenceTargeting: 'balanced',
  batchSize: 20
};

const DEFAULT_ENHANCED_CONFIG: EnhancedPersonaCrystallizationConfig = {
  autoCrystallizationEnabled: true,
  minConfidenceThreshold: 0.6,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  tokenDamEnabled: true,
  enableEnhancedTraceProcessing: false, // Disabled until backend supports it
  processingContext: DEFAULT_PROCESSING_CONTEXT
};

// === HOOK IMPLEMENTATION ===

/**
 * Enhanced hook for persona crystallization with token dam integration
 * Provides basic token dam monitoring via Convex and enhanced processing interfaces for future backend integration
 */
export const useEnhancedPersonaCrystallization = (
  userId: string | undefined,
  conversationId: Id<"conversations"> | undefined = undefined
): UseEnhancedPersonaCrystallizationReturn => {
  const convex = useConvex();
  const refreshPersonaData = usePersonaStore(state => state.refreshPersonaData);
  
  // Use Convex query for token dam status instead of API calls
  const tokenDamStatus = useQuery(
    api.tokenDamQueries.getDamStatus,
    userId && conversationId ? { userId, conversationId } : "skip"
  );
  
  const [state, setState] = useState<EnhancedPersonaCrystallizationState>({
    // Original state
    isExtracting: false,
    isCrystallizing: false,
    isHealthChecking: false,
    extractionError: null,
    crystallizationError: null,
    healthError: null,
    lastExtraction: null,
    lastCrystallization: null,
    lastHealthCheck: null,
    config: DEFAULT_ENHANCED_CONFIG,
    lastStoredTraceIds: [],
    
    // Simplified enhanced state
    tokenDamStatus: null,
    tokenDamError: null,
    processingContext: DEFAULT_PROCESSING_CONTEXT
  });

  // Update token dam status in state when Convex query updates
  useEffect(() => {
    if (tokenDamStatus !== undefined) {
      setState(prev => ({
        ...prev,
        tokenDamStatus: tokenDamStatus || null,
        tokenDamError: null
      }));
    }
  }, [tokenDamStatus]);

  // === TOKEN DAM MANAGEMENT ===

  /**
   * Refresh token dam status from Convex
   */
  const refreshTokenDamStatus = useCallback(() => {
    // Token dam status is automatically refreshed via Convex query
    console.log('🪙 [TOKEN-DAM] Token dam status refreshed via Convex query');
  }, []);

  /**
   * Check if tokens are available based on current dam status
   */
  const checkTokenAvailability = useCallback((): boolean => {
    if (!state.config.tokenDamEnabled) {
      return true; // Token dam disabled, always allow
    }

    const currentStatus = state.tokenDamStatus;
    if (!currentStatus) return true; // No dam status, allow processing

    // Check if processing is blocked
    return !currentStatus.processingPaused && currentStatus.damStatus !== 'blocked';
  }, [state.config.tokenDamEnabled, state.tokenDamStatus]);

  // === ENHANCED PROCESSING CONTEXT ===

  /**
   * Update processing context (interface only - for future backend integration)
   */
  const updateProcessingContext = useCallback((context: Partial<EnhancedProcessingContext>) => {
    console.log('⚙️ [CONFIG] Updating processing context (interface only)', context);
    setState(prev => ({
      ...prev,
      processingContext: {
        ...prev.processingContext,
        ...context
      }
    }));
  }, []);

  // === ENHANCED TRACE PROCESSING ===

  /**
   * Validate trace IDs format (inherited from original hook)
   */
  const validateTraceIds = useCallback((traceIds: string[]): boolean => {
    if (!Array.isArray(traceIds)) {
      console.warn('Invalid trace IDs: not an array');
      return false;
    }
    
    if (traceIds.length === 0) return true;

    for (const traceId of traceIds) {
      if (typeof traceId !== 'string' || traceId.trim().length === 0) {
        console.warn(`Invalid trace ID: not a string or empty - ${traceId}`);
        return false;
      }
      
      const isValidExtractedTrace = /^trace_\d{10}_[a-f0-9]{8}_[a-f0-9]{8}$/.test(traceId);
      const isValidManualTrace = /^manual_\d{10,13}_[a-zA-Z0-9]+$/.test(traceId);
      
      if (!isValidExtractedTrace && !isValidManualTrace) {
        console.warn(`Invalid trace ID format: ${traceId}`);
        return false;
      }
    }

    return true;
  }, []);

  /**
   * Retry mechanism with exponential backoff (inherited from original hook)
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
        
        if (errorType === 'validation') throw lastError;
        if (attempt === maxRetryAttempts - 1) throw lastError;
        
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
   * Enhanced trace extraction with basic token dam awareness
   * (Processing context is interface only until backend supports it)
   */
  const extractTracesWithEnhancedProcessing = useCallback(async (
    conversationId: string,
    conversationData: any,
    processingContext?: Partial<EnhancedProcessingContext>
  ): Promise<any> => {
    const hookId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    console.log(`🚀 [ENHANCED-EXTRACTION:${hookId}] Starting enhanced trace extraction`, {
      userId,
      conversationId,
      processingContext: processingContext || 'using_current',
      tokenDamEnabled: state.config.tokenDamEnabled
    });

    if (!userId) {
      const error = new Error('User ID is required for enhanced trace extraction');
      const personaError = personaErrorHandler.logError(
        'validation',
        error.message,
        { operation: 'enhanced_trace_extraction_validation' },
        error
      );
      setState(prev => ({ ...prev, extractionError: personaError }));
      throw error;
    }

    // Check token availability if enabled
    if (state.config.tokenDamEnabled && !checkTokenAvailability()) {
      const error = new Error('Processing paused due to token dam limits');
      const personaError = personaErrorHandler.logError(
        'validation',
        error.message,
        { 
          operation: 'enhanced_trace_extraction_token_check',
          metadata: { currentStatus: state.tokenDamStatus }
        },
        error
      );
      setState(prev => ({ ...prev, extractionError: personaError }));
      throw error;
    }

    setState(prev => ({ 
      ...prev, 
      isExtracting: true, 
      extractionError: null,
      lastStoredTraceIds: []
    }));

    try {
      // Note: Processing context is interface only - backend doesn't support it yet
      if (processingContext) {
        console.log('ℹ️ [ENHANCED-EXTRACTION] Processing context provided but not yet supported by backend', processingContext);
      }

      // Use standard extraction for now
      const result = await retryWithBackoff(
        () => triggerConversationTraceExtraction(
          userId, 
          conversationId, 
          conversationData
        ),
        'extraction'
      );

      const duration = Date.now() - startTime;
      console.log(`✅ [ENHANCED-EXTRACTION:${hookId}] Enhanced extraction completed`, {
        duration_ms: duration,
        tracesCount: result.traces?.length || 0
      });

      // Continue with standard trace storage and processing...
      let storedTraceIds: string[] = [];

      if (result.traces && result.traces.length > 0) {
        try {
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
          
          storedTraceIds = result.traces
            .map((trace: any) => trace.trace_id || trace.id)
            .filter((id: any) => typeof id === 'string' && id.trim().length > 0);

          if (!validateTraceIds(storedTraceIds)) {
            console.warn(`⚠️ [ENHANCED-EXTRACTION:${hookId}] Invalid trace IDs detected`, { storedTraceIds });
            storedTraceIds = [];
          }
          
          console.log(`✅ [ENHANCED-EXTRACTION:${hookId}] Traces stored successfully`, {
            storedCount: storedTraceIds.length
          });
        } catch (convexError) {
          console.warn(`⚠️ [ENHANCED-EXTRACTION:${hookId}] Convex storage failed`, convexError);
        }
      }

      setState(prev => ({ 
        ...prev, 
        isExtracting: false, 
        lastExtraction: result,
        lastStoredTraceIds: storedTraceIds
      }));

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const originalError = error instanceof Error ? error : new Error(String(error));
      
      const personaError = personaErrorHandler.logError(
        categorizeError(originalError, 'trace_extraction'),
        'Enhanced trace extraction failed',
        {
          userId,
          conversationId,
          operation: 'enhanced_trace_extraction',
          duration,
          metadata: { processingContext: processingContext || 'using_current' }
        },
        originalError
      );
      
      setState(prev => ({ 
        ...prev, 
        isExtracting: false, 
        extractionError: personaError 
      }));
      throw error;
    }
  }, [
    userId, 
    convex, 
    state.config, 
    state.tokenDamStatus,
    retryWithBackoff, 
    validateTraceIds, 
    checkTokenAvailability
  ]);

  /**
   * Standard crystallization with basic token dam awareness
   */
  const crystallizeUserInsights = useCallback(async (
    traceIds: string[],
    minConfidence: number = 0.6
  ): Promise<any> => {
    const hookId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    console.log(`💎 [CRYSTALLIZATION:${hookId}] Starting crystallization`, {
      userId,
      traceCount: traceIds.length,
      minConfidence
    });

    if (!userId) {
      const error = new Error('User ID is required for crystallization');
      const personaError = personaErrorHandler.logError(
        'validation',
        error.message,
        { operation: 'crystallization_validation' },
        error
      );
      setState(prev => ({ ...prev, crystallizationError: personaError }));
      throw error;
    }

    if (!validateTraceIds(traceIds)) {
      const error = new Error('Invalid trace IDs provided for crystallization');
      const personaError = personaErrorHandler.logError(
        'validation',
        error.message,
        { userId, operation: 'crystallization_validation', metadata: { traceIds } },
        error
      );
      setState(prev => ({ ...prev, crystallizationError: personaError }));
      throw error;
    }

    // Check token availability if enabled
    if (state.config.tokenDamEnabled && !checkTokenAvailability()) {
      const error = new Error('Processing paused due to token dam limits');
      const personaError = personaErrorHandler.logError(
        'validation',
        error.message,
        { 
          operation: 'crystallization_token_check',
          metadata: { tokenStatus: state.tokenDamStatus }
        },
        error
      );
      setState(prev => ({ ...prev, crystallizationError: personaError }));
      throw error;
    }

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
      
      const duration = Date.now() - startTime;
      console.log(`✅ [CRYSTALLIZATION:${hookId}] Crystallization completed`, {
        duration_ms: duration,
        insightsCount: result.insights?.length || 0
      });

      setState(prev => ({ 
        ...prev, 
        isCrystallizing: false, 
        lastCrystallization: result 
      }));

      // Store insights and refresh persona data
      if (result.insights && result.insights.length > 0) {
        try {
          await retryWithBackoff(
            () => convex.action(api.personaCrystallizationMutations.storeCrystallizedInsightsAction, {
              user_id: userId,
              insights: result.insights
            }),
            'storage'
          );
          
          await retryWithBackoff(
            () => refreshPersonaData(userId, convex),
            'storage'
          );
          
          console.log(`✅ [CRYSTALLIZATION:${hookId}] Insights stored and persona refreshed`);
        } catch (convexError) {
          console.warn(`⚠️ [CRYSTALLIZATION:${hookId}] Storage operations failed`, convexError);
        }
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const originalError = error instanceof Error ? error : new Error(String(error));
      
      const personaError = personaErrorHandler.logError(
        categorizeError(originalError, 'crystallization'),
        'Crystallization failed',
        {
          userId,
          operation: 'crystallization',
          duration,
          metadata: { 
            traceCount: traceIds.length,
            minConfidence
          }
        },
        originalError
      );
      
      setState(prev => ({ 
        ...prev, 
        isCrystallizing: false, 
        crystallizationError: personaError 
      }));
      throw error;
    }
  }, [
    userId,
    convex,
    refreshPersonaData,
    state.config,
    state.tokenDamStatus,
    validateTraceIds,
    retryWithBackoff,
    checkTokenAvailability
  ]);

  // === ORIGINAL METHODS ===

  /**
   * Original extraction method with basic token dam awareness
   */
  const extractTracesFromConversation = useCallback(async (
    conversationId: string,
    conversationData: any
  ): Promise<any> => {
    return extractTracesWithEnhancedProcessing(conversationId, conversationData);
  }, [extractTracesWithEnhancedProcessing]);

  /**
   * Backend health check (unchanged)
   */
  const checkBackendHealth = useCallback(async (): Promise<any> => {
    const healthId = Math.random().toString(36).substring(7);
    
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
      
      console.log(`✅ [HEALTH:${healthId}] Health check completed`, { status: result.status });
      
      setState(prev => ({ 
        ...prev, 
        isHealthChecking: false, 
        lastHealthCheck: result 
      }));

      return result;
    } catch (error) {
      const originalError = error instanceof Error ? error : new Error(String(error));
      
      const personaError = personaErrorHandler.logError(
        'network',
        'Health check failed',
        { operation: 'health_check' },
        originalError
      );
      
      setState(prev => ({ 
        ...prev, 
        isHealthChecking: false, 
        healthError: personaError 
      }));
      throw error;
    }
  }, [retryWithBackoff]);

  // === CONFIGURATION METHODS ===

  /**
   * Update enhanced configuration
   */
  const updateConfig = useCallback((newConfig: Partial<EnhancedPersonaCrystallizationConfig>) => {
    console.log('⚙️ [CONFIG] Updating enhanced crystallization configuration', newConfig);
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
      tokenDamError: null
    }));
  }, []);

  // === ERROR UTILITIES ===

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
    
    // Original actions (with basic token dam awareness)
    extractTracesFromConversation,
    crystallizeUserInsights,
    checkBackendHealth,
    
    // Enhanced processing interface (for future backend integration)
    extractTracesWithEnhancedProcessing,
    
    // Basic token dam management via Convex
    refreshTokenDamStatus,
    checkTokenAvailability,
    
    // Enhanced processing context (interface only)
    updateProcessingContext,
    
    // Original utilities (preserved)
    clearErrors,
    updateConfig,
    getErrorMessage,
    canRetry,
    retryWithBackoff
  };
};
