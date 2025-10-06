import { getApiKey } from '@/app/lib/api-helpers';
import { ImportStatus, UploadResponse } from './chatGPTImportTypes';

export class ChatGPTImportService {
  /**
   * Upload a ChatGPT export zip file
   */
  static async uploadFile(file: File): Promise<UploadResponse> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);

    // Get backend URL - upload directly to avoid Vercel function size limits
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.hicontent.co';

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/chatgpt/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          error: 'Upload failed', 
          detail: `HTTP ${response.status}` 
        }));
        
        // Provide user-friendly error messages based on status code
        if (response.status === 502) {
          throw new Error('Could not connect to backend service. Please try again later or contact support.');
        } else if (response.status === 504) {
          throw new Error('Upload timed out. Please check your connection and try again with a smaller file.');
        } else if (response.status === 500 && error.detail?.includes('Backend URL not configured')) {
          throw new Error('Service configuration error. Please contact support.');
        } else {
          throw new Error(error.detail || error.error || 'Upload failed');
        }
      }

      return response.json();
    } catch (error: any) {
      // Handle network errors (when fetch itself fails)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Could not reach upload service. Please check your internet connection and try again.');
      }
      
      // Re-throw errors we've already formatted
      throw error;
    }
  }

  /**
   * Check the status of an import job
   */
  static async checkStatus(jobId: string): Promise<ImportStatus> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/chatgpt-import/${jobId}/status`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Status check failed');
    }

    return response.json();
  }

  /**
   * Check if user has already imported (one-time import only)
   */
  static async checkHasImported(): Promise<boolean> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/chatgpt-import/check-imported', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check import status');
    }

    const data = await response.json();
    return data.hasImported || false;
  }

  /**
   * Get user's active ChatGPT imports
   */
  static async getActiveImports(): Promise<ImportStatus[]> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/chatgpt-import/active', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch active imports');
    }

    return response.json();
  }

  /**
   * Cancel an import job and all related background jobs
   */
  static async cancelImport(userId: string, reason?: string): Promise<void> {
    const response = await fetch('/api/chatgptImport/cancelImport', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId,
        reason: reason || 'Cancelled by user'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to cancel import');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to cancel import');
    }
  }

  /**
   * Validate a file before upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file.name.endsWith('.zip')) {
      return { valid: false, error: 'Please upload a .zip file' };
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum: 100MB' };
    }

    return { valid: true };
  }
}

