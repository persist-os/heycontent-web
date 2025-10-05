'use client'

/**
 * ChatGPT Import Page
 * 
 * Upload conversations.json.zip from ChatGPT and import into Crystal Dam.
 * Processing happens in background via job queue.
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { ChatGPTImportService } from './service';
import { useChatGPTImport } from './hooks';
import { UploadZone } from './components/UploadZone';
import { StatusDisplay } from './components/StatusDisplay';
import { Instructions } from './components/Instructions';

export default function ChatGPTImportPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { uploading, importStatus, uploadFile, startPolling } = useChatGPTImport();

  // Get userId on mount
  useEffect(() => {
    getCurrentUserId()
      .then(setUserId)
      .catch(err => {
        console.error('Failed to get user ID:', err);
        toast.error('Authentication error. Please refresh the page.');
      });
  }, []);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      // Validate file
      const validation = ChatGPTImportService.validateFile(selectedFile);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !userId) return;
    
    const jobId = await uploadFile(file);
    if (jobId) {
      startPolling(jobId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  // Show loading state while getting userId
  if (!userId) {
    return (
      <div className="container mx-auto max-w-4xl p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Import ChatGPT Conversations</h1>
        <p className="text-muted-foreground">
          Upload your ChatGPT conversation history to add it to your Crystal Dam
        </p>
      </div>

      <Instructions />

      {/* Upload Zone */}
      <UploadZone
        file={file}
        onFileChange={handleFileChange}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      {/* Upload Button */}
      {file && !importStatus && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Upload and Import
            </>
          )}
        </button>
      )}

      {/* Status Display */}
      {importStatus && <StatusDisplay status={importStatus} />}
    </div>
  );
}
