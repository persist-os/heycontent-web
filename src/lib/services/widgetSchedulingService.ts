/**
 * Widget Scheduling Service
 * 
 * Provides functions to schedule and unschedule widgets for recurring execution.
 * Uses Next.js API routes as thin wrappers that forward to backend.
 */

import { fetchWithApiKey } from '@/app/lib/api-helpers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface ScheduleWidgetResponse {
  success: boolean;
  widget_id: string;
  frequency: string;
  next_run: number;
  job_id?: string;
  error?: string;
}

export interface UnscheduleWidgetResponse {
  success: boolean;
  widget_id: string;
  message: string;
  error?: string;
}

export interface SuggestedScheduleResponse {
  suggested_frequency: string | null;
}

/**
 * Schedule a widget for recurring execution.
 * 
 * @param widgetId Widget ID to schedule
 * @param frequency Execution frequency (hourly, daily, weekly, monthly)
 * @returns Schedule response with next run time
 */
export async function scheduleWidget(
  widgetId: string,
  frequency: string
): Promise<ScheduleWidgetResponse> {
  try {
    const response = await fetchWithApiKey(`${BACKEND_URL}/api/v1/widgets/${widgetId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ frequency }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `Failed to schedule widget: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[WidgetSchedulingService] Failed to schedule widget:', error);
    throw error;
  }
}

/**
 * Unschedule a widget's recurring execution.
 * 
 * @param widgetId Widget ID to unschedule
 * @returns Unschedule response
 */
export async function unscheduleWidget(
  widgetId: string
): Promise<UnscheduleWidgetResponse> {
  try {
    const response = await fetchWithApiKey(`${BACKEND_URL}/api/v1/widgets/${widgetId}/schedule`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `Failed to unschedule widget: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[WidgetSchedulingService] Failed to unschedule widget:', error);
    throw error;
  }
}

/**
 * Get suggested schedule frequency for a widget.
 * 
 * @param widgetId Widget ID
 * @returns Suggested frequency or null
 */
export async function getSuggestedSchedule(
  widgetId: string
): Promise<SuggestedScheduleResponse> {
  try {
    const response = await fetchWithApiKey(`${BACKEND_URL}/api/v1/widgets/${widgetId}/suggested-schedule`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `Failed to get suggested schedule: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[WidgetSchedulingService] Failed to get suggested schedule:', error);
    throw error;
  }
}

