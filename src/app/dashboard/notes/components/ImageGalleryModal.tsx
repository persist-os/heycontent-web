'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImageData } from '../types';
import { useImageUpload } from '../hooks/useImageUpload';
import { Upload, X, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useNotes } from '@/app/context/notes-context';
import { useAuth } from '@/app/context/auth-context';

interface ImageGalleryModalProps {
  isOpen: boolean;
  noteId: string;
  images: ImageData[];
  onClose: () => void;
}

export function ImageGalleryModal({ isOpen, noteId, images, onClose }: ImageGalleryModalProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploadMultipleImages, isUploading, error, clearError } = useImageUpload();
  const { updateNote } = useNotes();
  const { firebaseUser } = useAuth();

  // DEBUG: Check authentication
  console.log('🔍 [ImageGalleryModal] Authentication check:', {
    hasFirebaseUser: !!firebaseUser,
    userId: firebaseUser?.uid,
    noteId,
    noteIdType: typeof noteId
  });

  const handleAddImages = useCallback(async (newImages: ImageData[]) => {
    if (newImages.length === 0) return;

    // Check authentication
    if (!firebaseUser?.uid) {
      console.error('❌ [ImageGalleryModal] User not authenticated');
      toast.error('You must be logged in to upload images');
      return;
    }

    try {
      const updatedImages = [...images, ...newImages];
      // Validate each image object structure
      updatedImages.forEach((img, index) => {
        console.log(`Image ${index} validation:`, {
          hasUrl: typeof img.url === 'string',
          hasFilename: typeof img.filename === 'string',
          hasOriginalFilename: img.originalFilename === undefined || typeof img.originalFilename === 'string',
          hasUploadedAt: typeof img.uploadedAt === 'number',
          hasSize: img.size === undefined || typeof img.size === 'number',
          hasMimeType: img.mimeType === undefined || typeof img.mimeType === 'string',
          hasWidth: img.width === undefined || typeof img.width === 'number',
          hasHeight: img.height === undefined || typeof img.height === 'number',
        });
      });

      // TEST: First try a simple update to see if the noteId works
      console.log('🧪 [ImageGalleryModal] TEST - Trying simple update first...');
      await updateNote(noteId, { title: "Test update" });
      console.log('✅ [ImageGalleryModal] TEST - Simple update worked!');
      
      // Now try the images update
      console.log('🖼️ [ImageGalleryModal] Now trying images update...');
      await updateNote(noteId, { images: updatedImages });
      
      toast.success(`${newImages.length} image${newImages.length > 1 ? 's' : ''} uploaded successfully`);
    } catch (error) {
      console.error('❌ [ImageGalleryModal] Failed to save images to note:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      toast.error('Failed to save images to note');
    }
  }, [images, noteId, updateNote, firebaseUser]);

  const handleDeleteImage = useCallback(async (imageToDelete: ImageData) => {
    try {
      const updatedImages = images.filter(img => img.filename !== imageToDelete.filename);
      await updateNote(noteId, { images: updatedImages });
      
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete image');
    }
  }, [images, noteId, updateNote]);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    clearError();
    
    if (files.length === 1) {
      const result = await uploadImage(files[0]);
      if (result) {
        await handleAddImages([result]);
      }
    } else {
      const results = await uploadMultipleImages(files);
      if (results.length > 0) {
        await handleAddImages(results);
      }
    }
  }, [uploadImage, uploadMultipleImages, handleAddImages, clearError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Image Gallery
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors",
              isDragOver ? "border-primary bg-primary/5" : "border-border",
              isUploading && "opacity-50 pointer-events-none"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              title="Upload images"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              
              <div>
                <p className="text-lg font-medium">
                  {isUploading ? 'Uploading...' : 'Drop images here or click to upload'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports JPG, PNG, GIF, WebP • Max 10MB per file
                </p>
              </div>

              <Button
                variant="outline"
                onClick={openFileDialog}
                disabled={isUploading}
                className="mt-4"
              >
                {isUploading ? 'Uploading...' : 'Choose Files'}
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Images Grid */}
          {images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.filename}
                  className="relative group border border-border rounded-lg overflow-hidden bg-muted"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={image.url}
                      alt={image.originalFilename || image.filename || 'Uploaded image'}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
                    onClick={() => handleDeleteImage(image)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  {/* Image Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs truncate" title={image.originalFilename || image.filename}>
                      {image.originalFilename || image.filename}
                    </p>
                    {image.size && (
                      <p className="text-xs text-gray-300">
                        {(image.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No images yet</p>
              <p className="text-sm text-muted-foreground">
                Upload your first image to get started
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {images.length} image{images.length !== 1 ? 's' : ''}
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 