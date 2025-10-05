import React from 'react';
import { Upload, FileText } from 'lucide-react';

interface UploadZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function UploadZone({ file, onFileChange, onDragOver, onDrop }: UploadZoneProps) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center space-y-4 transition-colors ${
        file ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
      }`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {file ? (
        <div className="space-y-3">
          <FileText className="h-12 w-12 mx-auto text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={() => onFileChange(null)}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Remove file
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium">Drop your conversations.json.zip here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
          <input
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90"
          >
            Choose File
          </label>
        </div>
      )}
    </div>
  );
}

