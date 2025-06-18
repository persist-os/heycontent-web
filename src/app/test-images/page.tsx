"use client";
import { useState } from "react";
import ImageUpload from "../../components/ImageUpload";
import ImageDisplay from "../../components/ImageDisplay";
import { RefreshCw } from "lucide-react";

export default function TestImagesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);
  const [showAllImages, setShowAllImages] = useState(false);

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleImageDeleted = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Image Upload Test</h1>
              <p className="mt-2 text-gray-600">
                Test the complete image upload and display functionality
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Test Controls</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note ID (optional - leave empty for standalone images)
              </label>
              <input
                type="text"
                value={selectedNoteId || ""}
                onChange={(e) => setSelectedNoteId(e.target.value || undefined)}
                placeholder="Enter a note ID to link images..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Images can be uploaded with or without being linked to a specific note
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showAllImages}
                  onChange={(e) => setShowAllImages(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Show all user images (instead of note-specific)
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Images
              </h2>
              <ImageUpload 
                noteId={selectedNoteId}
                onUploadComplete={handleUploadComplete}
                maxFiles={5}
                maxFileSize={10 * 1024 * 1024} // 10MB
              />
            </div>

            {/* Upload Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Drag and drop images or click to select</li>
                <li>• Supports PNG, JPG, GIF up to 10MB each</li>
                <li>• Maximum 5 files per upload</li>
                <li>• Images are stored securely in Convex storage</li>
                <li>• Can be linked to notes or uploaded as standalone</li>
              </ul>
            </div>
          </div>

          {/* Display Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {showAllImages ? 'All Images' : selectedNoteId ? `Images for Note: ${selectedNoteId}` : 'Standalone Images'}
              </h2>
              <div key={refreshKey}>
                <ImageDisplay 
                  noteId={showAllImages ? undefined : selectedNoteId}
                  showUserImages={showAllImages}
                  onImageDeleted={handleImageDeleted}
                />
              </div>
            </div>

            {/* Display Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-2">Features:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• View images in a responsive grid</li>
                <li>• Click edit icon to add/edit captions</li>
                <li>• Click trash icon to delete images</li>
                <li>• Shows file info (size, upload date)</li>
                <li>• Images are optimized with Next.js Image component</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Current Configuration:</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Note ID:</strong> {selectedNoteId || 'None (standalone images)'}</p>
            <p><strong>Display Mode:</strong> {showAllImages ? 'All user images' : 'Note-specific images'}</p>
            <p><strong>Refresh Key:</strong> {refreshKey}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 