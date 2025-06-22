"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImagesUploaded: (images: Array<{
    url: string;
    filename: string;
    originalFilename?: string;
    uploadedAt: number;
    size?: number;
    mimeType?: string;
    width?: number;
    height?: number;
  }>) => void;
  existingImages?: Array<{
    url: string;
    filename: string;
    originalFilename?: string;
    uploadedAt: number;
    size?: number;
    mimeType?: string;
    width?: number;
    height?: number;
  }>;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({ 
  onImagesUploaded, 
  existingImages = [], 
  maxImages = 5,
  className 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug logging
  console.log('[ImageUpload] Render - existingImages:', existingImages);

  const uploadToCloudFunction = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', 'smart-notes');

    const response = await fetch('https://us-central1-content-454219.cloudfunctions.net/save_image', {
      method: 'POST',
      body: formData,
      headers: {
        'Origin': window.location.origin
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    console.log('[ImageUpload] Cloud function response:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    const imageData = {
      url: result.data.url,
      filename: result.data.filename,
      originalFilename: result.data.originalFilename,
      uploadedAt: Date.now(),
      size: result.data.size,
      mimeType: result.data.contentType,
      ...(result.data.width && { width: result.data.width }),
      ...(result.data.height && { height: result.data.height })
    };
    
    console.log('[ImageUpload] Processed image data:', imageData);
    return imageData;
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    const remainingSlots = maxImages - existingImages.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    
    try {
      const uploadPromises = filesToUpload.map(uploadToCloudFunction);
      const uploadedImages = await Promise.all(uploadPromises);
      
      const allImages = [...existingImages, ...uploadedImages];
      onImagesUploaded(allImages);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = existingImages.filter((_, i) => i !== index);
    onImagesUploaded(updatedImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {existingImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-border">
                <img
                  src={image.url}
                  alt={image.originalFilename || image.filename}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {existingImages.length < maxImages && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            dragActive 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50",
            uploading && "pointer-events-none opacity-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading images...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Drop images here or click to upload</p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF, WebP up to 10MB ({maxImages - existingImages.length} remaining)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 