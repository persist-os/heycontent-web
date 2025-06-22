import { Note, NoteUpdate } from '../types';
import { formatAnalysisToMarkdown } from '../utils/format-utils';
import { getApiKey } from '@/app/lib/api-helpers';
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useAIInsights(updateNote: (noteId: string | Id<"notes">, updates: NoteUpdate) => Promise<Note>) {
  const addAnalysisToNote = useMutation(api.notes.addAnalysisToNote);
  const requestAIInsights = async (noteId: string | undefined, note: Note | undefined) => {
    // Add detailed logging to understand what's happening
    console.log('requestAIInsights called with:', { 
      noteId, 
      noteExists: !!note,
      noteContent: note?.content,
      noteContentLength: note?.content?.length,
      noteContentType: note?.content ? typeof note.content : 'undefined'
    });
    
    if (!note || !noteId) {
      console.error('Invalid note or noteId:', { noteId, note });
      return;
    }

    // Provide default placeholders if content or platform are missing
    const safeContent = note.content && note.content.trim() ? note.content : 'Write your note here...';
    const safePlatform = note.platform && note.platform.trim() ? note.platform : 'web';

    // Optionally log if we are using defaults
    if (!note.content || !note.content.trim()) {
      console.warn('No note content provided, using default placeholder.');
    }
    if (!note.platform || !note.platform.trim()) {
      console.warn('No platform provided, using default platform \'web\'.');
    }

    // Ensure we have a valid content string
    const noteContent = safeContent;
    console.log('Note content after normalization:', { 
      noteContent, 
      length: noteContent.length, 
      trimmedLength: noteContent.trim().length,
      firstFewChars: noteContent.substring(0, 20)
    });
    
    // Check if note content is empty or whitespace
    if (!noteContent.trim()) {
      console.warn('Cannot analyze empty note');
      await updateNote(noteId as Id<"notes">, { analysis: 'Cannot analyze an empty note. Please add some content first.' });
      return;
    }

    // Show loading state
    await updateNote(noteId as Id<"notes">, { analysis: 'Analyzing your note content...' });

    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('You are not authenticated. Please log in again.');
    }

    try {
      // Use typed analysis for all notes
      const requestBody = {
        noteId: noteId,
        content: noteContent,
        title: note.title || 'Untitled Note',
        type: note.type || 'idea_bank', // Default to idea_bank if no type
        platform: note?.platform || 'web',
        tags: note.tags || [],
        important: note.important || false,
        references: [] // Can add references later if needed
      };

      console.log(`[useAIInsights] Using typed analysis for type: ${requestBody.type}`);

      const response = await fetch('/api/smart-note-typed/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Analysis failed');
      }

      // Handle typed analysis response format
      let formattedContent = '';
      
      // Typed analysis returns markdown directly in the analysis field
      if (data.data?.analysis && typeof data.data.analysis === 'string') {
        formattedContent = data.data.analysis;
        console.log('Using typed analysis response format');
      }
      // Fallback for any unexpected response structure
      else {
        console.warn('Response data structure is unexpected:', data);
        formattedContent = '### Analysis Failed\n\nThe AI was unable to analyze your note. Please try again later.';
      }

      // Write the entire backend response to Convex analysis field
      try {
        await addAnalysisToNote({ noteId: noteId as Id<"notes">, analysis: JSON.stringify(data) });
      } catch (err) {
        console.error('Failed to write analysis to Convex:', err);
      }

      // Update the note with the analysis result only
      const updates: NoteUpdate = { analysis: formattedContent };

      // If the note has the default title "Untitled Note" and we have a suggested title, update it
      if (note.title === 'Untitled Note' && data.suggestedTitle) {
        updates.title = data.suggestedTitle;
      }

      // Update the note with new analysis and possibly a new title
      await updateNote(noteId, updates);
      console.log('AI insights generated successfully');

    } catch (error) {
      console.error('Failed to generate AI insights:', error);

      // Get a more detailed error message
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }

      console.log('AI Insight error details:', { errorMessage, error });

      // Update the note with an error message in the analysis field
      await updateNote(noteId, { analysis: `Error analyzing note: ${errorMessage}` });
    }
  };

  return { 
    requestAIInsights: async (noteId: string | undefined, note: Note | undefined) => {
      try {
        await requestAIInsights(noteId, note);
      } catch (error) {
        console.error('Error in requestAIInsights:', error);
        throw error; // Re-throw to allow caller to handle if needed
      }
    } 
  };
}