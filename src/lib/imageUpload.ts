export interface ImageMetadata {
  url: string;
  filename: string;
  originalFilename?: string;
  uploadedAt: number;
  size?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface UploadResponse {
  success: boolean;
  data?: {
    filename: string;
    originalFilename: string;
    url: string;
    contentType: string;
    size: number;
    bucket: string;
    source: string;
    storagePath: string;
  };
  error?: string;
}

// Cloud function endpoint - FIXED: Use correct function name
const UPLOAD_ENDPOINT = 'https://us-central1-content-454219.cloudfunctions.net/save_image';

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `File type not supported. Please use: ${ALLOWED_TYPES.join(', ')}`;
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }
  
  return null;
}

export async function uploadImage(
  file: File, 
  source: 'smart-notes' | 'general' = 'smart-notes'
): Promise<UploadResponse> {
  try {
    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source);

    // Upload to cloud function
    const response = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData,
      // Add CORS headers for the request
      headers: {
        // Don't set Content-Type - let browser set it with boundary for multipart
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Upload failed' };
    }
  } catch (error) {
    console.error('Image upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown upload error' 
    };
  }
}

export function createImageMetadata(uploadData: UploadResponse['data']): ImageMetadata | null {
  if (!uploadData) return null;
  
  return {
    url: uploadData.url,
    filename: uploadData.filename,
    originalFilename: uploadData.originalFilename,
    uploadedAt: Date.now(),
    size: uploadData.size,
    mimeType: uploadData.contentType,
    // width and height would be determined from image processing if needed
  };
}

// Utility to get image dimensions (optional)
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
} 