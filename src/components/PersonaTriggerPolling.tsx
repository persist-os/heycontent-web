import React, { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePersonaCrystallization } from '@/hooks/usePersonaCrystallization';

interface PersonaTriggerPollingProps {
  userId?: string;
  enabled?: boolean;
  pollingInterval?: number; // milliseconds
}

interface ProcessingState {
  isExtracting: boolean;
  isCrystallizing: boolean;
  currentOperation: 'idle' | 'extracting' | 'crystallizing' | 'completing';
  startTime: number | null;
  triggerBeingProcessed: string | null;
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
}

interface BackoffState {
  consecutiveFailures: number;
  nextRetryTime: number | null;
  baseDelay: number;
  maxDelay: number;
}

/**
 * Background component that polls for unprocessed persona crystallization triggers
 * and automatically processes them. This creates the complete processing pipeline.
 */
export function PersonaTriggerPolling({ 
  userId, 
  enabled = true, 
  pollingInterval = 30000 // 30 seconds default
}: PersonaTriggerPollingProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef<Set<string>>(new Set()); // Track triggers being processed
  const crystallizationTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track crystallization timeout
  const conversationRetryRef = useRef<Map<string, number>>(new Map()); // Track retry counts for conversation fetching
  const processingStateRef = useRef<ProcessingState>({
    isExtracting: false,
    isCrystallizing: false,
    currentOperation: 'idle',
    startTime: null,
    triggerBeingProcessed: null
  });
  
  // Circuit breaker state
  const circuitBreakerRef = useRef<CircuitBreakerState>({
    state: 'closed',
    failureCount: 0,
    lastFailureTime: null,
    nextAttemptTime: null
  });
  
  // Exponential backoff state
  const backoffStateRef = useRef<BackoffState>({
    consecutiveFailures: 0,
    nextRetryTime: null,
    baseDelay: 1000, // 1 second base delay
    maxDelay: 300000  // 5 minutes max delay
  });
  
  // Performance control constants
  const MAX_CRYSTALLIZATION_TIMEOUT = 120000; // 2 minutes timeout for crystallization
  const MAX_CONVERSATION_RETRIES = 3;
  const CONVERSATION_RETRY_DELAY = 5000; // 5 seconds
  const MAX_PROCESSING_TIMEOUT = 300000; // 5 minutes total timeout for the entire pipeline
  const CIRCUIT_BREAKER_THRESHOLD = 5; // Number of failures before opening circuit
  const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute before trying again
  const MIN_POLLING_INTERVAL = 5000; // Minimum 5 seconds between polls
  const MAX_POLLING_INTERVAL = 300000; // Maximum 5 minutes between polls
  
  // Get unprocessed triggers
  const triggers = useQuery(
    api.personaCrystallizationQueries.getUnprocessedTriggers,
    userId && enabled ? { user_id: userId, limit: 5 } : "skip"
  );
  
  // Persona crystallization hook for processing
  const {
    extractTracesFromConversation,
    crystallizeUserInsights,
    state: { isExtracting, isCrystallizing }
  } = usePersonaCrystallization(userId);

  // Mutation to mark triggers as processed
  const markTriggerProcessed = useMutation(api.personaCrystallizationQueries.markTriggerAsProcessed);

  // Function to fetch conversation data from Convex with improved dependency logic
  const currentTrigger = triggers && triggers.length > 0 ? triggers[0] : null;
  const shouldFetchConversation = Boolean(
    currentTrigger &&
    !isExtracting && 
    !isCrystallizing && 
    enabled && 
    userId &&
    !processingRef.current.has(`${currentTrigger._id}-${currentTrigger.conversation_id}`) &&
    processingStateRef.current.currentOperation === 'idle'
  );
  
  const conversationData = useQuery(
    api.chatQueries.getConversation,
    shouldFetchConversation && currentTrigger
      ? { 
          userId: userId!,
          conversationId: currentTrigger.conversation_id 
        }
      : "skip"
  );

  // Circuit breaker utilities
  const checkCircuitBreaker = useCallback((): boolean => {
    const now = Date.now();
    const circuitBreaker = circuitBreakerRef.current;
    
    switch (circuitBreaker.state) {
      case 'open':
        if (circuitBreaker.nextAttemptTime && now >= circuitBreaker.nextAttemptTime) {
          console.log('🔧 [PERSONA POLLING] Circuit breaker moving to half-open state');
          circuitBreaker.state = 'half-open';
          return true;
        }
        console.log('🚫 [PERSONA POLLING] Circuit breaker is open, blocking requests');
        return false;
      
      case 'half-open':
      case 'closed':
        return true;
      
      default:
        return true;
    }
  }, []);

  const recordSuccess = useCallback(() => {
    console.log('✅ [PERSONA POLLING] Recording success, resetting circuit breaker and backoff');
    circuitBreakerRef.current = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null,
      nextAttemptTime: null
    };
    backoffStateRef.current = {
      ...backoffStateRef.current,
      consecutiveFailures: 0,
      nextRetryTime: null
    };
  }, []);

  const recordFailure = useCallback(() => {
    const now = Date.now();
    const circuitBreaker = circuitBreakerRef.current;
    const backoffState = backoffStateRef.current;
    
    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = now;
    
    // Update exponential backoff
    backoffState.consecutiveFailures++;
    const delay = Math.min(
      backoffState.baseDelay * Math.pow(2, backoffState.consecutiveFailures - 1),
      backoffState.maxDelay
    );
    backoffState.nextRetryTime = now + delay;
    
    console.log(`❌ [PERSONA POLLING] Failure recorded. Count: ${circuitBreaker.failureCount}, Next retry in: ${delay}ms`);
    
    // Check if we should open the circuit breaker
    if (circuitBreaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitBreaker.state = 'open';
      circuitBreaker.nextAttemptTime = now + CIRCUIT_BREAKER_TIMEOUT;
      console.warn('🚫 [PERSONA POLLING] Circuit breaker opened due to excessive failures');
    }
  }, [CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT]);

  const shouldRetry = useCallback((): boolean => {
    const now = Date.now();
    const backoffState = backoffStateRef.current;
    
    if (backoffState.nextRetryTime && now < backoffState.nextRetryTime) {
      const remainingDelay = backoffState.nextRetryTime - now;
      console.log(`⏳ [PERSONA POLLING] Backoff active, retry in ${remainingDelay}ms`);
      return false;
    }
    
    return true;
  }, []);

  // Calculate dynamic polling interval based on system state
  const calculatePollingInterval = useCallback((): number => {
    const baseInterval = pollingInterval;
    const circuitBreaker = circuitBreakerRef.current;
    const backoffState = backoffStateRef.current;
    
    // If circuit breaker is open, use maximum interval
    if (circuitBreaker.state === 'open') {
      return MAX_POLLING_INTERVAL;
    }
    
    // If we have consecutive failures, increase polling interval
    if (backoffState.consecutiveFailures > 0) {
      const multiplier = Math.min(Math.pow(1.5, backoffState.consecutiveFailures), 10);
      return Math.min(baseInterval * multiplier, MAX_POLLING_INTERVAL);
    }
    
    // Default to base interval, but respect minimum
    return Math.max(baseInterval, MIN_POLLING_INTERVAL);
  }, [pollingInterval, MAX_POLLING_INTERVAL, MIN_POLLING_INTERVAL]);

  // Processing timeout handler
  const handleProcessingTimeout = useCallback((triggerKey: string) => {
    console.warn('⚠️ [PERSONA POLLING] Processing timeout reached for trigger:', triggerKey);
    
    // Record failure for circuit breaker and backoff
    recordFailure();
    
    // Reset processing state
    processingStateRef.current = {
      isExtracting: false,
      isCrystallizing: false,
      currentOperation: 'idle',
      startTime: null,
      triggerBeingProcessed: null
    };
    
    // Remove from processing set
    processingRef.current.delete(triggerKey);
    
    // Clear timeouts
    if (crystallizationTimeoutRef.current) {
      clearTimeout(crystallizationTimeoutRef.current);
      crystallizationTimeoutRef.current = null;
    }
  }, [recordFailure]);

  // Update processing state helper
  const updateProcessingState = useCallback((updates: Partial<ProcessingState>) => {
    processingStateRef.current = { ...processingStateRef.current, ...updates };
    
    console.log('📊 [PERSONA POLLING] Processing state updated:', {
      operation: processingStateRef.current.currentOperation,
      isExtracting: processingStateRef.current.isExtracting,
      isCrystallizing: processingStateRef.current.isCrystallizing,
      trigger: processingStateRef.current.triggerBeingProcessed,
      duration: processingStateRef.current.startTime ? Date.now() - processingStateRef.current.startTime : 0
    });
  }, []);

  // Process triggers when they become available
  useEffect(() => {
    if (!userId || !enabled || !triggers || triggers.length === 0 || isExtracting || isCrystallizing) {
      return;
    }
    
    // Check circuit breaker before processing
    if (!checkCircuitBreaker()) {
      console.log('🚫 [PERSONA POLLING] Circuit breaker blocking processing');
      return;
    }
    
    // Check exponential backoff
    if (!shouldRetry()) {
      console.log('⏳ [PERSONA POLLING] Backoff period active, skipping processing');
      return;
    }
    
    // Prevent concurrent processing
    if (processingStateRef.current.currentOperation !== 'idle') {
      console.log('🔄 [PERSONA POLLING] Already processing, skipping new trigger');
      return;
    }

    // Process the first unprocessed trigger
    const trigger = triggers[0];
    const triggerKey = `${trigger._id}-${trigger.conversation_id}`;
    
    // Enhanced conversation data validation with retry logic
    if (!conversationData) {
      console.log('⏳ [PERSONA POLLING] Conversation data not yet loaded for trigger:', trigger._id);
      return;
    }
    
    if (!conversationData.messages || conversationData.messages.length === 0) {
      const retryCount = conversationRetryRef.current.get(triggerKey) || 0;
      
      if (retryCount < MAX_CONVERSATION_RETRIES) {
        console.log(`🔄 [PERSONA POLLING] Empty conversation data, retry ${retryCount + 1}/${MAX_CONVERSATION_RETRIES} for trigger:`, trigger._id);
        conversationRetryRef.current.set(triggerKey, retryCount + 1);
        
        // Schedule a retry after delay
        setTimeout(() => {
          console.log('🔄 [PERSONA POLLING] Retrying conversation data fetch');
          // The useQuery will automatically refetch due to dependency changes
        }, CONVERSATION_RETRY_DELAY);
        return;
      } else {
        console.error('❌ [PERSONA POLLING] Max retries reached for conversation data, skipping trigger:', trigger._id);
        // Mark trigger as processed to avoid infinite loops
        try {
          markTriggerProcessed({ trigger_id: trigger._id });
          console.log('⚠️ [PERSONA POLLING] Marked failed trigger as processed to prevent infinite loops');
        } catch (markError) {
          console.error('❌ [PERSONA POLLING] Failed to mark failed trigger as processed:', markError);
        }
        conversationRetryRef.current.delete(triggerKey);
        return;
      }
    }
    
    // Reset retry count on successful conversation data fetch
    if (conversationRetryRef.current.has(triggerKey)) {
      console.log('✅ [PERSONA POLLING] Conversation data successfully loaded after retries');
      conversationRetryRef.current.delete(triggerKey);
    }
    
    // Skip if already processing this trigger
    if (processingRef.current.has(triggerKey)) {
      return;
    }

    console.log('🔍 [PERSONA POLLING] Found unprocessed trigger:', {
      triggerId: trigger._id,
      conversationId: trigger.conversation_id,
      triggerType: trigger.trigger_type,
      createdAt: new Date(trigger.created_at).toISOString()
    });

    // Process the trigger with validated conversation data
    processingRef.current.add(triggerKey);
    
    // Initialize processing state
    updateProcessingState({
      isExtracting: true,
      isCrystallizing: false,
      currentOperation: 'extracting',
      startTime: Date.now(),
      triggerBeingProcessed: triggerKey
    });
    
    // Set up overall processing timeout
    const processingTimeoutId = setTimeout(() => {
      handleProcessingTimeout(triggerKey);
    }, MAX_PROCESSING_TIMEOUT);
      
    console.log('🚀 [PERSONA POLLING] Processing trigger with conversation data:', {
      messageCount: conversationData.messages.length,
      conversationId: trigger.conversation_id,
      processingState: processingStateRef.current.currentOperation
    });

      extractTracesFromConversation(trigger.conversation_id, conversationData)
        .then(async (extractionResult) => {
          console.log('✅ [PERSONA POLLING] Successfully extracted traces for trigger:', trigger._id);
          
          // Record success for circuit breaker and backoff reset
          recordSuccess();
          
          // Automatic crystallization after successful trace extraction
          if (extractionResult?.traces && extractionResult.traces.length > 0) {
            console.log('🔮 [PERSONA POLLING] Starting automatic crystallization for extracted traces');
            
            // Update processing state for crystallization
            updateProcessingState({
              isExtracting: false,
              isCrystallizing: true,
              currentOperation: 'crystallizing'
            });
            
            // Set up timeout for crystallization
            crystallizationTimeoutRef.current = setTimeout(() => {
              console.warn('⚠️ [PERSONA POLLING] Crystallization timeout reached, continuing with trigger completion');
              updateProcessingState({
                isCrystallizing: false,
                currentOperation: 'completing'
              });
            }, MAX_CRYSTALLIZATION_TIMEOUT);
            
            try {
              // Get trace IDs for crystallization using proper extraction and validation
              const traceIds = extractionResult.traces
                .map((trace: any) => trace.trace_id || trace.id)
                .filter((id: any) => typeof id === 'string' && id.trim().length > 0);
              
              console.log('🔍 [PERSONA POLLING] Extracted trace IDs for crystallization:', {
                totalTraces: extractionResult.traces.length,
                validTraceIds: traceIds.length,
                traceIds: traceIds.slice(0, 3) // Log first 3 for debugging
              });
              
              if (traceIds.length > 0) {
                await crystallizeUserInsights(traceIds);
                console.log('✅ [PERSONA POLLING] Successfully crystallized insights for trigger:', trigger._id);
              } else {
                console.log('ℹ️ [PERSONA POLLING] No valid trace IDs found for crystallization');
              }
            } catch (crystallizationError) {
              console.error('❌ [PERSONA POLLING] Crystallization failed for trigger:', trigger._id, crystallizationError);
              // Don't fail the whole pipeline if crystallization fails
            } finally {
              // Update processing state after crystallization
              updateProcessingState({
                isCrystallizing: false,
                currentOperation: 'completing'
              });
              
              // Clear crystallization timeout
              if (crystallizationTimeoutRef.current) {
                clearTimeout(crystallizationTimeoutRef.current);
                crystallizationTimeoutRef.current = null;
              }
            }
          } else {
            console.log('ℹ️ [PERSONA POLLING] No traces extracted, skipping crystallization');
            updateProcessingState({
              isExtracting: false,
              currentOperation: 'completing'
            });
          }
          
          // Mark trigger as processed
          try {
            await markTriggerProcessed({ trigger_id: trigger._id });
            console.log('✅ [PERSONA POLLING] Marked trigger as processed:', trigger._id);
          } catch (markError) {
            console.error('❌ [PERSONA POLLING] Failed to mark trigger as processed:', trigger._id, markError);
          }
        })
        .catch((error) => {
          console.error('❌ [PERSONA POLLING] Failed to process trigger:', trigger._id, error);
          
          // Record failure for circuit breaker and backoff
          recordFailure();
        })
        .finally(() => {
          // Clear processing timeout
          clearTimeout(processingTimeoutId);
          
          // Reset processing state to idle
          updateProcessingState({
            isExtracting: false,
            isCrystallizing: false,
            currentOperation: 'idle',
            startTime: null,
            triggerBeingProcessed: null
          });
          
          // Remove from processing set
          processingRef.current.delete(triggerKey);
          
          // Clear any remaining crystallization timeout
          if (crystallizationTimeoutRef.current) {
            clearTimeout(crystallizationTimeoutRef.current);
            crystallizationTimeoutRef.current = null;
          }
          
          const duration = processingStateRef.current.startTime ? Date.now() - processingStateRef.current.startTime : 0;
          console.log('🏁 [PERSONA POLLING] Completed processing for trigger:', trigger._id, { duration });
        });
  }, [triggers, conversationData, userId, enabled, isExtracting, isCrystallizing, extractTracesFromConversation, crystallizeUserInsights, markTriggerProcessed, checkCircuitBreaker, shouldRetry, recordSuccess, recordFailure]);

  // Setup polling interval with dynamic intervals and smart polling
  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const setupPolling = () => {
      // Calculate dynamic polling interval
      const currentInterval = calculatePollingInterval();
      
      console.log(`🔄 [PERSONA POLLING] Starting trigger polling for user: ${userId} (interval: ${currentInterval}ms)`);
      
      // Set up new polling interval
      intervalRef.current = setInterval(() => {
        // Skip polling if no triggers are present (smart polling)
        if (!triggers || triggers.length === 0) {
          console.log('📊 [PERSONA POLLING] No triggers present, skipping poll');
          return;
        }
        
        // Skip polling if circuit breaker is open
        if (!checkCircuitBreaker()) {
          console.log('🚫 [PERSONA POLLING] Circuit breaker open, skipping poll');
          return;
        }
        
        // Skip polling if backoff is active
        if (!shouldRetry()) {
          console.log('⏳ [PERSONA POLLING] Backoff active, skipping poll');
          return;
        }
        
        console.log('📊 [PERSONA POLLING] Polling for triggers...');
        // The query will automatically refetch due to Convex reactivity
      }, currentInterval);
    };

    setupPolling();

    // Re-setup polling when interval changes due to circuit breaker or backoff
    const intervalCheckTimer = setInterval(() => {
      const newInterval = calculatePollingInterval();
      const currentInterval = intervalRef.current ? pollingInterval : 0;
      
      // Restart polling if interval has changed significantly (more than 10% difference)
      if (Math.abs(newInterval - currentInterval) > currentInterval * 0.1) {
        console.log(`🔧 [PERSONA POLLING] Adjusting polling interval from ${currentInterval}ms to ${newInterval}ms`);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setupPolling();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (intervalCheckTimer) {
        clearInterval(intervalCheckTimer);
      }
      console.log('🛑 [PERSONA POLLING] Stopped trigger polling');
    };
  }, [enabled, userId, pollingInterval, calculatePollingInterval, triggers, checkCircuitBreaker, shouldRetry]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      processingRef.current.clear();
      conversationRetryRef.current.clear();
      // Clear any remaining timeout
      if (crystallizationTimeoutRef.current) {
        clearTimeout(crystallizationTimeoutRef.current);
        crystallizationTimeoutRef.current = null;
      }
    };
  }, []);

  // This component doesn't render anything visible
  if (!enabled || !userId) {
    return null;
  }

  // Debug info is now handled by PersonaCrystallizationDebugPanel

  return null;
}
