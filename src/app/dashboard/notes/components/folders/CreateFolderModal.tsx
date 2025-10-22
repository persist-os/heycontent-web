'use client';

import React, { useState } from 'react';
import { X, Folder, Palette } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { T } from '@/components/translation';
import { useTranslation } from '@/hooks/useTranslation';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, description?: string, parentFolderId?: Id<"folders">, color?: string) => Promise<Id<"folders">>;
  isCreating: boolean;
  parentFolderId?: Id<"folders">;
  parentFolderName?: string;
}

// Default folder color - primary blue
const DEFAULT_FOLDER_COLOR = '#3B82F6';

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
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_FOLDER_COLOR);
  
  const { text: folderNamePlaceholder } = useTranslation('Enter folder name...', {
    sourceLang: 'en',
    context: 'folders.placeholder.name'
  });
  
  const { text: descriptionPlaceholder } = useTranslation('Add a description...', {
    sourceLang: 'en',
    context: 'folders.placeholder.description'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await onCreateFolder(name.trim(), description.trim() || undefined, parentFolderId, selectedColor);
      setName('');
      setDescription('');
      setSelectedColor(DEFAULT_FOLDER_COLOR);
      onClose();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedColor(DEFAULT_FOLDER_COLOR);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl shadow-2xl shadow-primary/10 w-full max-w-md">
        {/* Gradient line at top */}
        <div className="h-px bg-gradient-to-r from-primary/40 via-primary/20 to-transparent w-3/4 mt-6 mx-6" />
        
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-2xl font-light tracking-tight text-foreground">
              <T context="folders.create.title">Create New Folder</T>
            </h2>
            <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent w-2/3 mt-3" />
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-lg p-1 transition-all duration-300"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {parentFolderName && (
            <div className="text-sm text-muted-foreground bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-3 rounded-lg border border-primary/10">
              <T context="folders.create.inside">Creating folder inside:</T> <span className="font-medium text-foreground">{parentFolderName}</span>
            </div>
          )}

          <div>
            <label htmlFor="folder-name" className="block text-sm font-medium text-foreground/90 mb-2">
              <T context="folders.label.name">Folder Name</T> *
            </label>
            <input
              id="folder-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={folderNamePlaceholder}
              className="w-full px-3 py-3 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-colors duration-300"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="folder-description" className="block text-sm font-medium text-foreground/90 mb-2">
              <T context="folders.label.description">Description (optional)</T>
            </label>
            <textarea
              id="folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={descriptionPlaceholder}
              rows={3}
              className="w-full px-3 py-3 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 resize-none transition-colors duration-300"
            />
          </div>

          <div>
            <label htmlFor="folder-color" className="block text-sm font-medium text-foreground/90 mb-3">
              <Palette className="w-4 h-4 inline mr-2" />
              <T context="folders.label.color">Folder Color</T>
            </label>
            <div className="flex items-center gap-4">
              {/* Color preview with folder icon */}
              {/* eslint-disable-next-line react/forbid-dom-props, react/no-unknown-property */}
              <div 
                className="w-16 h-16 rounded-lg border-2 border-border flex items-center justify-center transition-all duration-200 hover:scale-105"
                // @ts-ignore - Dynamic color styling required
                style={{ backgroundColor: selectedColor }}
              >
                <Folder className="w-8 h-8 text-white drop-shadow-md" />
              </div>
              
              {/* Color picker input */}
              <div className="flex-1 space-y-2">
                <input
                  id="folder-color"
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full h-12 rounded-lg border-2 border-border/50 cursor-pointer hover:border-primary/60 transition-colors duration-300"
                  title="Choose folder color"
                />
                <button
                  type="button"
                  onClick={() => setSelectedColor(DEFAULT_FOLDER_COLOR)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Reset to default color"
                >
                  <T context="folders.reset-color">Reset to default</T>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 text-base border border-border/50 rounded-lg hover:border-border hover:bg-muted/30 transition-all duration-300"
              disabled={isCreating}
            >
              <T context="button.cancel">Cancel</T>
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isCreating}
              className="flex-1 px-4 py-3 text-base bg-foreground text-background rounded-lg hover:bg-foreground/90 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  <T context="button.creating">Creating...</T>
                </>
              ) : (
                <>
                  <Folder className="w-4 h-4" />
                  <T context="button.create-folder">Create Folder</T>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
