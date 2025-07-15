import { useState } from 'react';
import { ImageData } from '../types';

interface UploadResponse {
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

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<ImageData | null> => {
    if (!file) {
      setError('No file provided');
      return null;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('File type not allowed. Please use JPG, PNG, GIF, or WebP.');
      return null;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 10MB.');
      return null;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        'https://us-central1-content-454219.cloudfunctions.net/save_image',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result: UploadResponse = await response.json();

      console.log('🔍 [useImageUpload] DEBUG - Cloud function response:', result);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Upload failed');
      }

      // Transform cloud function response to ImageData format
      const imageData: ImageData = {
        url: result.data.url,
        filename: result.data.filename,
        originalFilename: result.data.originalFilename,
        uploadedAt: Date.now(),
        size: result.data.size,
        mimeType: result.data.contentType,
        // Note: width and height are not provided by the current cloud function
        // They could be added later if needed
      };

      console.log('🖼️ [useImageUpload] DEBUG - Transformed ImageData:', imageData);
      console.log('🔍 [useImageUpload] DEBUG - ImageData validation:', {
        hasUrl: typeof imageData.url === 'string' && imageData.url.length > 0,
        hasFilename: typeof imageData.filename === 'string' && imageData.filename.length > 0,
        hasOriginalFilename: !imageData.originalFilename || typeof imageData.originalFilename === 'string',
        hasUploadedAt: typeof imageData.uploadedAt === 'number',
        hasSize: !imageData.size || typeof imageData.size === 'number',
        hasMimeType: !imageData.mimeType || typeof imageData.mimeType === 'string',
        hasWidth: !imageData.width || typeof imageData.width === 'number',
        hasHeight: !imageData.height || typeof imageData.height === 'number',
      });

      return imageData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      console.error('Image upload error:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultipleImages = async (files: File[]): Promise<ImageData[]> => {
    const results = await Promise.allSettled(
      files.map(file => uploadImage(file))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<ImageData | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value as ImageData);
  };

  return {
    uploadImage,
    uploadMultipleImages,
    isUploading,
    error,
    clearError: () => setError(null),
  };
}; 