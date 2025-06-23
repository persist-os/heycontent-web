"use client";
import React, { forwardRef, useCallback } from 'react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useInlineAI } from '../hooks/useInlineAI';

interface NoteEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  noteId?: string;
  noteTitle?: string;
  platform?: string;
  tags?: string[];
  userId: string;
  noteType?: string;
}

export const NoteEditor = forwardRef<HTMLTextAreaElement, NoteEditorProps>(({
  content,
  onContentChange,
  placeholder = 'Start writing...',
  disabled = false,
  noteId,
  noteTitle,
  platform,
  tags,
  userId,
  noteType = 'idea_bank'
}, ref) => {
  const { askAI, requestAnalysis, requestIdeas } = useInlineAI({
    noteId,
    noteContent: content,
    noteTitle,
    platform,
    tags,
    userId,
  });

  // Handle AI responses with proper formatting
  const handleAskAI = useCallback(async (prompt: string) => {
    try {
      const response = await askAI(prompt);
      // The RichTextEditor will handle inserting the response
      return response;
    } catch (error) {
      console.error('Failed to get AI response:', error);
      throw error;
    }
  }, [askAI]);

  const handleRequestAnalysis = useCallback(async (noteType: string) => {
    try {
      const analysis = await requestAnalysis(noteType);
      // The RichTextEditor will handle inserting the analysis
      return analysis;
    } catch (error) {
      console.error('Failed to get analysis:', error);
      throw error;
    }
  }, [requestAnalysis]);

  const handleRequestIdeas = useCallback(async () => {
    try {
      const ideas = await requestIdeas();
      // The RichTextEditor will handle formatting and inserting the ideas
      return ideas;
    } catch (error) {
      console.error('Failed to get ideas:', error);
      throw error;
    }
  }, [requestIdeas]);

  return (
    <RichTextEditor
      ref={ref}
      content={content}
      onContentChange={onContentChange}
      placeholder={placeholder}
      disabled={disabled}
      onAskAI={handleAskAI}
      onRequestAnalysis={handleRequestAnalysis}
      onRequestIdeas={handleRequestIdeas}
      noteId={noteId}
      noteTitle={noteTitle}
      platform={platform}
      tags={tags}
      userId={userId}
      noteType={noteType}
    />
  );
});

NoteEditor.displayName = 'NoteEditor';
