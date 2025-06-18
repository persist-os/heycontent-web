"use client";
import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  noteId?: string;
  onUploadComplete?: () => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
}

export default function ImageUpload({ 
  noteId, 
  onUploadComplete, 
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024 // 10MB default
}: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const generateUploadUrl = useMutation(api.images.generateImageUploadUrl);
  const saveImageMetadata = useMutation(api.images.saveImageMetadata);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Only image files are allowed';
    }
    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }
    return null;
  };

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    let errorMessage = '';

    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      errorMessage = `Maximum ${maxFiles} files allowed`;
    } else {
      // Validate each file
      for (const file of fileArray) {
        const validation = validateFile(file);
        if (validation) {
          errorMessage = validation;
          break;
        }
        validFiles.push(file);
      }
    }

    if (errorMessage) {
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } else {
      setFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  }, [files.length, maxFiles, maxFileSize]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      for (const file of files) {
        // Step 1: Get upload URL
        const uploadUrl = await generateUploadUrl();
        
        // Step 2: Upload file to storage
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }
        
        const { storageId } = await uploadResponse.json();
        
        // Step 3: Save metadata
        await saveImageMetadata({
          noteId: noteId ? noteId as any : undefined,
          storageId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });
      }
      
      setFiles([]);
      onUploadComplete?.();
      
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label className="cursor-pointer">
              <span className="text-sm font-medium text-gray-700">
                Click to upload images or drag and drop
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            PNG, JPG, GIF up to {Math.round(maxFileSize / 1024 / 1024)}MB each (max {maxFiles} files)
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected files:</h4>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({Math.round(file.size / 1024)} KB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload {files.length} image{files.length > 1 ? 's' : ''}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
} 