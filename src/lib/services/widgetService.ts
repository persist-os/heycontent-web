/**
 * Widget Service
 * 
 * Handles widget generation and execution through the Next.js API route
 * Follows frontend-backend connection rules: service → Next.js API → backend
 */

import { fetchWithApiKey, getCurrentUserId, waitForAuthReady } from '@/app/lib/api-helpers';
import { AuthenticationError } from '@/app/lib/errors';

/**
 * Widget run request parameters
 */
export interface WidgetRunRequest {
  widgetId: string;
  projectId: string;
  executionPrompt?: string;  // Optional custom user prompt for widget execution
}

/**
 * Widget run response data
 */
export interface WidgetRunResponse {
  success: boolean;
  output_id: string;
  note_id: string;
  prompts: Array<{
    text: string;
    priority: number;
  }>;
  opening_message?: string;  // AI's first conversational message to start the dialogue
  user_id: string;
}

/**
 * Widget output data from Convex
 */
export interface WidgetOutputData {
  outputId: string;
  widgetId: string;
  projectId: string;
  userId: string;
  noteId: string;
  prompts: Array<{
    text: string;
    priority: number;
  }>;
  executionPrompt?: string;  // User's custom prompt that was used for execution
  createdAt: number;
}

/**
 * Widget generation request parameters
 */
export interface WidgetGenerationRequest {
  projectId: string;
  widgetDescription: string;  // Natural language description of desired widget family
}

/**
 * Widget generation response
 */
export interface WidgetGenerationResponse {
  success: boolean;
  widgets_id?: string;
  error?: string;
  metadata?: {
    generated_at: string;
    project_id: string;
    fingerprint_id?: string;
    user_id: string;
    widget_type?: string;
    single_widget_mode: boolean;
  };
}

/**
 * Execute a widget and generate outputs
 * 
 * @param params Widget execution parameters
 * @returns Widget execution result with output_id, note_id, and prompts
 * 
 * @throws {AuthenticationError} If user is not authenticated
 * @throws {Error} If execution fails
 */
export async function runWidget(params: WidgetRunRequest): Promise<WidgetRunResponse> {
  const { widgetId, projectId, executionPrompt } = params;

  // Auth readiness and userId resolution
  let userId: string | null = null;
  const ready = await waitForAuthReady(5, 150);
  
  if (ready) {
    try {
      userId = await getCurrentUserId();
    } catch (_) {
      // Will retry below
    }
  }

  if (!userId) {
    // Retry for auth timing issues with longer timeout
    const readyAgain = await waitForAuthReady(8, 300);
    if (!readyAgain) {
      throw new AuthenticationError('Authentication state not ready. Please wait and try again.');
    }
    userId = await getCurrentUserId();
  }

  try {
    console.log('[WidgetService] Running widget:', {
      widgetId,
      projectId,
      userId
    });

    // Call Next.js API route (thin wrapper that forwards to backend)
    const requestBody: any = {
      user_id: userId,
      widget_id: widgetId,
      project_id: projectId
    };

    
    const response = await fetchWithApiKey('/api/widgets/run', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[WidgetService] Execution failed:', response.status, errorData);
      throw new Error(errorData.error || errorData.detail || `Widget execution failed: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('[WidgetService] Widget executed successfully:', {
      output_id: data.output_id,
      note_id: data.note_id,
      prompt_count: data.prompts?.length || 0
    });

    return data;

  } catch (error) {
    console.error('[WidgetService] Error running widget:', error);
    throw error;
  }
}

/**
 * Get widget execution status and latest output
 * 
 * @param widgetId Widget ID to check
 * @returns Latest widget output data or null
 */
export async function getWidgetStatus(widgetId: string): Promise<WidgetOutputData | null> {
  const userId = await getCurrentUserId();

  try {
    console.log('[WidgetService] Getting widget status:', { widgetId, userId });

    const response = await fetchWithApiKey(`/api/widgets/status?widget_id=${widgetId}&user_id=${userId}`, {
      method: 'GET'
    });

    if (!response.ok) {
      console.error('[WidgetService] Status fetch failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.latest_output;

  } catch (error) {
    console.error('[WidgetService] Error getting widget status:', error);
    return null;
  }
}

/**
 * Generate a new widget family based on natural language description
 * 
 * @param params Widget generation parameters
 * @returns Widget generation result with widgets_id
 * 
 * @throws {AuthenticationError} If user is not authenticated
 * @throws {Error} If generation fails
 */
export async function generateWidget(params: WidgetGenerationRequest): Promise<WidgetGenerationResponse> {
  const { projectId, widgetDescription } = params;

  // Auth readiness and userId resolution
  let userId: string | null = null;
  const ready = await waitForAuthReady(5, 150);
  
  if (ready) {
    try {
      userId = await getCurrentUserId();
    } catch (_) {
      // Will retry below
    }
  }

  if (!userId) {
    // Retry for auth timing issues with longer timeout
    const readyAgain = await waitForAuthReady(8, 300);
    if (!readyAgain) {
      throw new AuthenticationError('Authentication state not ready. Please wait and try again.');
    }
    userId = await getCurrentUserId();
  }

  try {
    console.log('[WidgetService] Generating widget:', {
      projectId,
      descriptionLength: widgetDescription.length,
      userId
    });

    // Call Next.js API route (thin wrapper that forwards to backend)
    const requestBody: any = {
      project_id: projectId,
      widget_description: widgetDescription,
      user_id: userId
    };

    const response = await fetchWithApiKey('/api/widgets/generate', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[WidgetService] Generation failed:', response.status, errorData);
      throw new Error(errorData.error || errorData.detail || `Widget generation failed: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('[WidgetService] Widget generated successfully:', {
      success: data.success,
      widgets_id: data.widgets_id,
      widget_type: data.metadata?.widget_type
    });

    return data;

  } catch (error) {
    console.error('[WidgetService] Error generating widget:', error);
    throw error;
  }
}

