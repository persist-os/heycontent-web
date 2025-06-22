'use client';

import React, { useState, useRef, useCallback } from 'react';
import { uploadImage, validateImageFile, createImageMetadata, ImageMetadata } from '@/lib/imageUpload';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

interface ImageUploadDropzoneProps {
  onImagesUploaded: (images: ImageMetadata[]) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  children?: React.ReactNode;
}

interface UploadingImage {
  file: File;
  progress: number;
  error?: string;
  preview: string;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  onImagesUploaded,
  maxImages = 5,
  className,
  disabled = false,
  showPreview = true,
  children
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<ImageMetadata[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const error = validateImageFile(file);
      return !error;
    });

    if (validFiles.length === 0) return;

    // Check if we exceed max images
    const totalImages = uploadedImages.length + uploadingImages.length + validFiles.length;
    if (totalImages > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Create uploading state for each file
    const newUploadingImages: UploadingImage[] = validFiles.map(file => ({
      file,
      progress: 0,
      preview: URL.createObjectURL(file)
    }));

    setUploadingImages(prev => [...prev, ...newUploadingImages]);

    // Upload each file
    const uploadPromises = newUploadingImages.map(async (uploadingImg, index) => {
      try {
        // Simulate progress (since we don't get real progress from fetch)
        const progressInterval = setInterval(() => {
          setUploadingImages(prev => 
            prev.map(img => 
              img.file === uploadingImg.file 
                ? { ...img, progress: Math.min(img.progress + 10, 90) }
                : img
            )
          );
        }, 200);

        const result = await uploadImage(uploadingImg.file, 'smart-notes');
        clearInterval(progressInterval);

        if (result.success && result.data) {
          const metadata = createImageMetadata(result.data);
          if (metadata) {
            setUploadedImages(prev => [...prev, metadata]);
            
            // Complete progress
            setUploadingImages(prev => 
              prev.map(img => 
                img.file === uploadingImg.file 
                  ? { ...img, progress: 100 }
                  : img
              )
            );

            // Remove from uploading after a brief moment
            setTimeout(() => {
              setUploadingImages(prev => prev.filter(img => img.file !== uploadingImg.file));
              URL.revokeObjectURL(uploadingImg.preview);
            }, 1000);

            return metadata;
          }
        } else {
          // Handle upload error
          setUploadingImages(prev => 
            prev.map(img => 
              img.file === uploadingImg.file 
                ? { ...img, error: result.error || 'Upload failed' }
                : img
            )
          );
          return null;
        }
      } catch (error) {
        setUploadingImages(prev => 
          prev.map(img => 
            img.file === uploadingImg.file 
              ? { ...img, error: error instanceof Error ? error.message : 'Upload failed' }
              : img
          )
        );
        return null;
      }
    });

    // Wait for all uploads and notify parent
    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((metadata): metadata is ImageMetadata => metadata !== null);
    
    if (successfulUploads.length > 0) {
      onImagesUploaded(successfulUploads);
    }
  }, [disabled, maxImages, uploadedImages.length, uploadingImages.length, onImagesUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [processFiles]);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const removeUploadingImage = (file: File) => {
    setUploadingImages(prev => {
      const img = prev.find(img => img.file === file);
      if (img) {
        URL.revokeObjectURL(img.preview);
      }
      return prev.filter(img => img.file !== file);
    });
  };

  const hasUploading = uploadingImages.length > 0;
  const canUpload = !disabled && (uploadedImages.length + uploadingImages.length) < maxImages;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
          isDragOver 
            ? "border-primary bg-primary/5 scale-105" 
            : canUpload
              ? "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              : "border-muted-foreground/10 bg-muted/20 cursor-not-allowed",
          disabled && "opacity-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        {children || (
          <div className="space-y-2">
            <Upload className={cn(
              "mx-auto h-8 w-8",
              canUpload ? "text-muted-foreground" : "text-muted-foreground/50"
            )} />
            <div className="space-y-1">
              <p className={cn(
                "text-sm font-medium",
                canUpload ? "text-foreground" : "text-muted-foreground"
              )}>
                {isDragOver ? "Drop images here" : "Drop images or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground">
                Support: JPG, PNG, GIF, WebP (max {Math.floor(10)}MB, {maxImages - uploadedImages.length - uploadingImages.length} remaining)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Uploading images preview */}
      {hasUploading && showPreview && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Uploading...</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {uploadingImages.map((img, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={img.preview}
                    alt={`Uploading ${img.file.name}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Progress overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    {img.error ? (
                      <div className="text-center text-white">
                        <AlertCircle className="w-6 h-6 mx-auto mb-1 text-red-400" />
                        <p className="text-xs">Failed</p>
                      </div>
                    ) : (
                      <div className="text-center text-white">
                        <Loader2 className="w-6 h-6 mx-auto mb-1 animate-spin" />
                        <p className="text-xs">{img.progress}%</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUploadingImage(img.file);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 