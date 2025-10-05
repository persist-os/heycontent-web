'use client'

/**
 * ChatGPT Import Page
 * 
 * Upload conversations.json.zip from ChatGPT and import into Crystal Dam.
 * Processing happens in background via job queue.
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Upload, Loader2, CheckCircle } from 'lucide-react';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { ChatGPTImportService } from './chatGPTImportService';
import { useChatGPTImport } from './useChatGPTImport';
import { UploadZone } from './components/UploadZone';
import { StatusDisplay } from './components/StatusDisplay';
import { Instructions } from './components/Instructions';

export default function ChatGPTImportPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { 
    uploading, 
    importStatus, 
    checkingExisting,
    hasActiveImport,
    hasAlreadyImported,
    uploadFile,
    cancelImport 
  } = useChatGPTImport();

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
    
    // Upload file - Convex will automatically track status via reactive query
    await uploadFile(file);
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

  // Show loading state while getting userId or checking existing imports
  if (!userId || checkingExisting) {
    return (
      <div className="container mx-auto max-w-4xl p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            {!userId ? 'Loading...' : 'Checking for existing imports...'}
          </p>
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

      {/* Already Imported Warning */}
      {hasAlreadyImported && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Already Imported
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You've already imported your ChatGPT conversations. Each user can only import once to prevent duplicates.
                Your conversations are now part of your Crystal Dam and are being processed into insights.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Import Warning */}
      {!hasAlreadyImported && hasActiveImport && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            You have an active import in progress. Please wait for it to complete or cancel it before starting a new import.
          </p>
        </div>
      )}

      {/* Upload Zone - Disabled if already imported or active import */}
      {!hasAlreadyImported && !hasActiveImport && (
        <>
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
        </>
      )}

      {/* Status Display */}
      {importStatus && <StatusDisplay status={importStatus} onCancel={cancelImport} />}
    </div>
  );
}
