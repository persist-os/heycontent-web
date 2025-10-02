/**
 * useWidgetRunner Hook
 * 
 * Manages widget execution state and provides methods for running widgets
 * Follows React hook patterns with proper error handling and state management
 */

import { useState, useCallback } from 'react';
import { runWidget, WidgetRunRequest, WidgetRunResponse } from '@/lib/services/widgetService';
import { toast } from 'sonner';

export interface UseWidgetRunnerReturn {
  /**
   * Execute a widget
   */
  executeWidget: (params: WidgetRunRequest) => Promise<WidgetRunResponse | null>;
  
  /**
   * Loading state for widget execution
   */
  isRunning: boolean;
  
  /**
   * Error message if execution fails
   */
  error: string | null;
  
  /**
   * Latest execution result
   */
  lastResult: WidgetRunResponse | null;
  
  /**
   * Clear error state
   */
  clearError: () => void;
}

/**
 * Custom hook for widget execution
 * 
 * Handles authentication, loading states, error handling, and result management
 * 
 * @example
 * ```tsx
 * const { executeWidget, isRunning, error, lastResult } = useWidgetRunner();
 * 
 * const handleRunWidget = async () => {
 *   const result = await executeWidget({
 *     widgetId: 'widget-123',
 *     projectId: 'project-456'
 *   });
 *   
 *   if (result) {
 *     // Navigate to lab with outputs
 *     router.push(`/lab?noteId=${result.note_id}&widgetOutputId=${result.output_id}`);
 *   }
 * };
 * ```
 */
export function useWidgetRunner(): UseWidgetRunnerReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<WidgetRunResponse | null>(null);

  const executeWidget = useCallback(async (params: WidgetRunRequest): Promise<WidgetRunResponse | null> => {
    try {
      setIsRunning(true);
      setError(null);

      console.log('[useWidgetRunner] Executing widget:', params);

      // Call widget service
      const result = await runWidget(params);

      console.log('[useWidgetRunner] Widget executed successfully:', {
        output_id: result.output_id,
        note_id: result.note_id,
        prompt_count: result.prompts?.length || 0
      });

      setLastResult(result);
      
      // Success toast
      toast.success('Widget executed successfully!', {
        description: `Generated note with ${result.prompts?.length || 0} conversation prompts`
      });

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute widget';
      
      console.error('[useWidgetRunner] Execution failed:', err);
      setError(errorMessage);
      
      // Error toast
      toast.error('Widget execution failed', {
        description: errorMessage
      });

      return null;

    } finally {
      setIsRunning(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    executeWidget,
    isRunning,
    error,
    lastResult,
    clearError
  };
}

