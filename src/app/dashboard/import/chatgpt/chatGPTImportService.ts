import { getApiKey } from '@/app/lib/api-helpers';
import { ImportStatus, UploadResponse } from './chatGPTImportTypes';

export class ChatGPTImportService {
  /**
   * Upload a ChatGPT export zip file using chunked uploads (bypasses Cloud Run 32MB limit)
   * 
   * Flow:
   * 1. Get signed URL and chunk_size from backend
   * 2. Upload file in chunks with Content-Range headers
   * 3. Backend assembles chunks in Redis
   * 4. Confirm upload with backend to trigger processing
   * 
   * Supports files up to 200MB by splitting into 10MB chunks.
   */
  static async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('Not authenticated');
    }

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.hicontent.co';

    try {
      // Step 1: Get signed upload URL
      onProgress?.(10);
      const urlResponse = await fetch(`${BACKEND_URL}/api/v1/chatgpt/upload-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!urlResponse.ok) {
        const error = await urlResponse.json().catch(() => ({ 
          error: 'Failed to get upload URL', 
          detail: `HTTP ${urlResponse.status}` 
        }));
        throw new Error(error.detail || error.error || 'Failed to get upload URL');
      }

      const { upload_url, file_path, chunk_size } = await urlResponse.json();

      // Step 2: Upload file in chunks (bypasses Cloud Run 32MB limit)
      const totalSize = file.size;
      const chunkSize = chunk_size || (10 * 1024 * 1024); // Default 10MB from backend
      let uploaded = 0;
      
      console.log(`[CHATGPT_UPLOAD] Starting chunked upload: ${totalSize} bytes, chunk size: ${chunkSize}`);
      onProgress?.(10);
      
      while (uploaded < totalSize) {
        const start = uploaded;
        const end = Math.min(start + chunkSize, totalSize);
        const chunk = file.slice(start, end);
        
        console.log(`[CHATGPT_UPLOAD] Sending chunk: ${start}-${end-1}/${totalSize} (${((uploaded/totalSize)*100).toFixed(1)}%)`);
        
        const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/zip',
            'Content-Range': `bytes ${start}-${end-1}/${totalSize}`,
          },
          body: chunk,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text().catch(() => uploadResponse.statusText);
          throw new Error(`Chunk upload failed: ${uploadResponse.status} - ${errorText}`);
        }
        
        uploaded = end;
        
        // Update progress (10% to 80% during upload)
        const uploadProgress = 10 + (uploaded / totalSize) * 70;
        onProgress?.(Math.round(uploadProgress));
      }

      console.log(`[CHATGPT_UPLOAD] All chunks uploaded successfully`);
      onProgress?.(85);

      // Step 3: Confirm upload and trigger processing
      const confirmResponse = await fetch(`${BACKEND_URL}/api/v1/chatgpt/confirm-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: file_path,
          filename: file.name,
        }),
      });

      if (!confirmResponse.ok) {
        const error = await confirmResponse.json().catch(() => ({ 
          error: 'Upload confirmation failed', 
          detail: `HTTP ${confirmResponse.status}` 
        }));
        throw new Error(error.detail || error.error || 'Upload confirmation failed');
      }

      onProgress?.(100);
      return confirmResponse.json();

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

    const maxSize = 200 * 1024 * 1024; // 200MB (matches backend limit)
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum: 200MB' };
    }

    return { valid: true };
  }
}

