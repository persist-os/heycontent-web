'use client';

import { useState } from 'react';
import { useCreateNote } from '@/app/hooks/useCreateNote';
import { Button } from './button';
import React from 'react';
import { FilePlus, Loader2, Eye, Edit3, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTitleGeneration } from '@/app/dashboard/notes/hooks/useTitleGeneration';
import { useTypeClassification } from '@/app/dashboard/notes/hooks/useTypeClassification';

interface CreateNoteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  content: string;
  onNoteCreate?: () => void;
  children?: React.ReactNode;
}

interface NotePreview {
  title: string;
  type: string;
  content: string;
}

export const CreateNoteButton = React.forwardRef<HTMLButtonElement, CreateNoteButtonProps>(
  ({ content, children, onClick, onNoteCreate, className, ...props }, ref) => {
    const { createNote, isCreating } = useCreateNote();
    const { generateTitle } = useTitleGeneration();
    const { classifyType } = useTypeClassification();
    
    const [showPreview, setShowPreview] = useState(false);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [notePreview, setNotePreview] = useState<NotePreview | null>(null);
    const [editingTitle, setEditingTitle] = useState(false);
    const [customTitle, setCustomTitle] = useState('');

    const generatePreview = async () => {
      if (!content.trim() || content.trim().length < 10) {
        // For short content, create directly without preview
        await handleCreateNote();
        return;
      }

      setIsGeneratingPreview(true);
      
      try {
        const tempNoteId = `temp_${Date.now()}`;
        
        // Generate title and type in parallel
        const [titleResult, typeResult] = await Promise.all([
          generateTitle({
            content: content.trim(),
            platform: 'chat',
            noteId: tempNoteId,
          }),
          classifyType({
            content: content.trim(),
            platform: 'chat',
            noteId: tempNoteId,
          })
        ]);

        const suggestedTitle = titleResult.title && titleResult.wasGenerated 
          ? titleResult.title 
          : content.length > 50 
            ? content.substring(0, 50).trim() + "..."
            : content.trim();

        const suggestedType = typeResult.typeGenerated && typeResult.type !== 'idea_bank'
          ? typeResult.type
          : 'idea_bank';

        setNotePreview({
          title: suggestedTitle,
          type: suggestedType,
          content: content.trim()
        });
        setCustomTitle(suggestedTitle);
        setShowPreview(true);
      } catch (error) {
        console.error('Failed to generate preview:', error);
        // Fall back to direct creation
        await handleCreateNote();
      } finally {
        setIsGeneratingPreview(false);
      }
    };

    const handleCreateNote = async (customData?: { title?: string }) => {
      if (onClick) {
        onClick({} as React.MouseEvent<HTMLButtonElement>);
      }
      
      if (content.trim()) {
        // Create note with custom title if provided
        const noteContent = content.trim();
        
        // We'll modify createNote to accept custom title
        await createNote(noteContent, onNoteCreate, customData?.title);
        setShowPreview(false);
        setNotePreview(null);
      }
    };

    const handlePreviewCreate = async () => {
      await handleCreateNote({ title: customTitle });
    };

    const getTypeDisplayName = (type: string) => {
      const typeMap: Record<string, string> = {
        'idea_bank': 'Idea',
        'brainstorm': 'Brainstorm',
        'content': 'Content',
        'learning': 'Learning',
        'project': 'Project',
        'personal': 'Personal'
      };
      return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
    };

    const getTypeColor = (type: string) => {
      const colorMap: Record<string, string> = {
        'idea_bank': 'bg-blue-100 text-blue-800',
        'brainstorm': 'bg-purple-100 text-purple-800',
        'content': 'bg-green-100 text-green-800',
        'learning': 'bg-yellow-100 text-yellow-800',
        'project': 'bg-red-100 text-red-800',
        'personal': 'bg-pink-100 text-pink-800'
      };
      return colorMap[type] || 'bg-gray-100 text-gray-800';
    };

    return (
      <>
        <Button
          ref={ref}
          onClick={generatePreview}
          disabled={!content.trim() || isCreating || isGeneratingPreview || props.disabled}
          variant="ghost"
          className={cn("text-xs bg-gray-100 dark:bg-gray-800", className)}
          {...props}
        >
          {isGeneratingPreview ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="ml-1">Analyzing...</span>
            </>
          ) : isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="ml-1">Creating...</span>
            </>
          ) : (
            <>
              <FilePlus className="w-4 h-4" />
              {children}
            </>
          )}
        </Button>

        {/* Preview Dialog */}
        {showPreview && notePreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Preview Note</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <button
                    onClick={() => setEditingTitle(!editingTitle)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title={editingTitle ? "Save title" : "Edit title"}
                  >
                    {editingTitle ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </button>
                </div>
                {editingTitle ? (
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                    placeholder="Enter custom title..."
                  />
                ) : (
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">
                    {customTitle}
                  </div>
                )}
              </div>

              {/* Type Section */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Type
                </label>
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                  getTypeColor(notePreview.type)
                )}>
                  {getTypeDisplayName(notePreview.type)}
                </span>
              </div>

              {/* Content Preview */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Content Preview
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm max-h-32 overflow-y-auto">
                  {notePreview.content.length > 200 
                    ? notePreview.content.substring(0, 200) + "..."
                    : notePreview.content
                  }
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handlePreviewCreate}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Note
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

CreateNoteButton.displayName = 'CreateNoteButton';