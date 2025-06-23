import { useState } from 'react';

interface ImageUploadResult {
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

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPG, PNG, GIF, or WebP images.');
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', 'smart-notes');

      console.log('Uploading image:', file.name, file.size, 'bytes');

      const response = await fetch(
        'https://us-central1-content-454219.cloudfunctions.net/save_image',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Origin': window.location.origin
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result: ImageUploadResult = await response.json();
      
      if (result.success && result.data?.url) {
        console.log('Image uploaded successfully:', result.data.url);
        return result.data.url;
      } else {
        throw new Error(result.error || 'Upload failed without error message');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { 
    uploadImage, 
    isUploading 
  };
}; 