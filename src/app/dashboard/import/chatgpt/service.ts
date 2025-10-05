import { getApiKey } from '@/app/lib/api-helpers';
import { ImportStatus, UploadResponse } from './types';

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

    const response = await fetch(`/api/chatgpt-import/status?job_id=${jobId}`, {
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

