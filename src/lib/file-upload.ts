/**
 * File upload utilities for chat file attachments.
 */

export interface FileUploadResponse {
  success: boolean;
  file_url: string;
  file_metadata: {
    file_id: string;
    original_filename: string;
    content_type: string;
    file_size: number;
    gcs_url: string;
    uploaded_at: string;
    user_id: string;
    conversation_id?: string;
  };
}

export interface FileUploadError {
  success: false;
  error: string;
  details?: string;
}

/**
 * Upload a file to the backend and return the file URL.
 */
export async function uploadFile(
  file: File,
  userId: string,
  conversationId?: string
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId);
  if (conversationId) {
    formData.append('conversation_id', conversationId);
  }

  // Get backend URL from environment
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  
  // Import Cookies to get API key from cookies (not localStorage)
  const Cookies = (await import('js-cookie')).default;
  const apiKeyCookie = Cookies.get('apiKey');
  const apiKey = apiKeyCookie ? JSON.parse(apiKeyCookie) : null;

  // Debug logging
  console.log('File upload request:', {
    backendUrl,
    hasApiKey: !!apiKey,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'null',
    userId,
    conversationId
  });

  if (!apiKey) {
    throw new Error('No API key found. Please log in again.');
  }

  try {
    const response = await fetch(`${backendUrl}/api/v1/files/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header - let the browser set it with boundary
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

/**
 * Generate a download URL for a file.
 */
export async function getFileDownloadUrl(
  fileId: string,
  userId: string
): Promise<string> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  
  // Import Cookies to get API key from cookies (not localStorage)
  const Cookies = (await import('js-cookie')).default;
  const apiKeyCookie = Cookies.get('apiKey');
  const apiKey = apiKeyCookie ? JSON.parse(apiKeyCookie) : null;
  
  try {
    const response = await fetch(`${backendUrl}/api/v1/files/download/${fileId}?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Download URL generation failed: ${response.status}`);
    }

    const data = await response.json();
    return data.download_url;
  } catch (error) {
    console.error('File download URL error:', error);
    throw error;
  }
}

/**
 * Delete a file from the backend.
 */
export async function deleteFile(
  fileId: string,
  userId: string
): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  
  // Import Cookies to get API key from cookies (not localStorage)
  const Cookies = (await import('js-cookie')).default;
  const apiKeyCookie = Cookies.get('apiKey');
  const apiKey = apiKeyCookie ? JSON.parse(apiKeyCookie) : null;
  
  try {
    const response = await fetch(`${backendUrl}/api/v1/files/delete/${fileId}?user_id=${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `File deletion failed: ${response.status}`);
    }
  } catch (error) {
    console.error('File deletion error:', error);
    throw error;
  }
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file type icon based on MIME type.
 */
export function getFileTypeIcon(contentType: string): string {
  if (contentType.startsWith('image/')) return '🖼️';
  if (contentType.includes('pdf')) return '📄';
  if (contentType.includes('word') || contentType.includes('document')) return '📝';
  if (contentType.includes('text/')) return '📄';
  if (contentType.includes('csv')) return '📊';
  return '📎';
}
