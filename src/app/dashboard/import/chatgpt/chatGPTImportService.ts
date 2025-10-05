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

    const response = await fetch('/api/chatgpt-import/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
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

