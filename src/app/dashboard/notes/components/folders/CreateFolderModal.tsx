'use client';

import React, { useState } from 'react';
import { X, Folder, Palette } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, description?: string, parentFolderId?: Id<"folders">, color?: string) => Promise<Id<"folders">>;
  isCreating: boolean;
  parentFolderId?: Id<"folders">;
  parentFolderName?: string;
}

const FOLDER_COLORS = [
  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500' },
  { name: 'Green', value: '#10B981', bg: 'bg-emerald-500' },
  { name: 'Purple', value: '#8B5CF6', bg: 'bg-violet-500' },
  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-500' },
  { name: 'Orange', value: '#F59E0B', bg: 'bg-amber-500' },
  { name: 'Red', value: '#EF4444', bg: 'bg-red-500' },
  { name: 'Teal', value: '#14B8A6', bg: 'bg-teal-500' },
  { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-500' },
];

export function CreateFolderModal({
  isOpen,
  onClose,
  onCreateFolder,
  isCreating,
  parentFolderId,
  parentFolderName,
}: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await onCreateFolder(name.trim(), description.trim() || undefined, parentFolderId, selectedColor);
      setName('');
      setDescription('');
      setSelectedColor(undefined);
      onClose();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedColor(undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Create New Folder
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {parentFolderName && (
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              Creating folder inside: <span className="font-medium">{parentFolderName}</span>
            </div>
          )}

          <div>
            <label htmlFor="folder-name" className="block text-sm font-medium text-foreground mb-2">
              Folder Name *
            </label>
            <input
              id="folder-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name..."
              className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="folder-description" className="block text-sm font-medium text-foreground mb-2">
              Description (optional)
            </label>
            <textarea
              id="folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              <Palette className="w-4 h-4 inline mr-2" />
              Color (optional)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(selectedColor === color.value ? undefined : color.value)}
                  className={cn(
                    "w-full h-10 rounded-lg border-2 transition-all duration-200 flex items-center justify-center",
                    color.bg,
                    selectedColor === color.value
                      ? "border-foreground scale-105"
                      : "border-transparent hover:border-muted-foreground/50 hover:scale-105"
                  )}
                  title={`Select ${color.name} color`}
                  aria-label={`Select ${color.name} color`}
                >
                  {selectedColor === color.value && (
                    <Folder className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
            {selectedColor && (
              <button
                type="button"
                onClick={() => setSelectedColor(undefined)}
                className="text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
                title="Clear selected color"
              >
                Clear color
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-muted-foreground border border-border rounded-lg hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isCreating}
              className="flex-1 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Folder className="w-4 h-4" />
                  Create Folder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
