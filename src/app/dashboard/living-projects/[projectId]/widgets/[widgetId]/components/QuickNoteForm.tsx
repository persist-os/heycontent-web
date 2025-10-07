'use client';

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getApiKey } from '@/app/lib/api-helpers';
import toast from 'react-hot-toast';

interface QuickNoteFormProps {
  userId: string;
  widgetId?: string | Id<"widgets">;
  projectId?: Id<"projects">;
  isOpen: boolean;
  onToggle: () => void;
  onSuccess?: () => void;
}

export function QuickNoteForm({
  userId,
  widgetId,
  projectId,
  isOpen,
  onToggle,
  onSuccess
}: QuickNoteFormProps) {
  const [pasteContent, setPasteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const createNoteConvex = useMutation(api.noteMutations.createNote);

  const handleSave = async () => {
    if (!pasteContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    if (pasteContent.trim().length < 10) {
      toast.error('Content must be at least 10 characters');
      return;
    }

    setIsSaving(true);
    try {
      // Step 1: Create the note in Convex
      const newNote = await createNoteConvex({
        userId,
        content: pasteContent.trim(),
        title: 'Untitled Note',
        type: 'idea_bank',
        widgetId: widgetId,
        projectId: projectId,
      });

      if (!newNote || !newNote._id) {
        throw new Error('Failed to create note');
      }

      // Step 2: Generate metadata via backend
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required');
      }

      const metadataResponse = await fetch('/api/smart-notes/generate-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          noteId: newNote._id,
          noteContent: pasteContent.trim(),
        }),
      });

      if (!metadataResponse.ok) {
        console.warn('Metadata generation failed, but note was created');
      }

      const contextType = widgetId ? 'widget' : 'project';
      toast.success(`Note created and attached to ${contextType}!`);
      
      // Reset form
      setPasteContent('');
      onToggle();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create note');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="bg-muted/10 border border-border/40 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">Create Quick Note</h3>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Paste or type content - we'll generate a smart title and tags
                </p>
              </div>
            </div>
            <Textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste your content here... (minimum 10 characters)"
              className="min-h-[120px] mb-3 bg-background/50 border-border/40 rounded-xl resize-none focus:ring-2 focus:ring-primary/30 font-light"
              disabled={isSaving}
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground/60">
                {pasteContent.length} characters
                {pasteContent.length > 0 && pasteContent.length < 10 && (
                  <span className="text-destructive ml-2">
                    • Need {10 - pasteContent.length} more
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onToggle();
                    setPasteContent('');
                  }}
                  disabled={isSaving}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || pasteContent.trim().length < 10}
                  className="rounded-xl"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Save & Attach
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
