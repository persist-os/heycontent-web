import { Note, NoteUpdate } from '../types';
import { formatAnalysisToMarkdown } from '../utils/format-utils';
import { getApiKey } from '@/app/lib/api-helpers';

export function useAIInsights(updateNote: (noteId: string, updates: NoteUpdate) => Promise<Note>) {
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

    // Ensure we have a valid content string
    const noteContent = note.content || '';
    console.log('Note content after normalization:', { 
      noteContent, 
      length: noteContent.length, 
      trimmedLength: noteContent.trim().length,
      firstFewChars: noteContent.substring(0, 20)
    });
    
    // Check if note content is empty or whitespace
    if (!noteContent.trim()) {
      console.warn('Cannot analyze empty note');
      const errorReference = {
        type: 'ai_insight' as const,
        content: 'Cannot analyze an empty note. Please add some content first.'
      };
      const updatedReferences = [...(note.references || []).filter(ref => !('isLoading' in ref)), errorReference];
      await updateNote(noteId, { references: updatedReferences });
      return;
    }

    // Show loading state
    const loadingInsight = {
      type: 'ai_insight' as const,
      content: 'Analyzing your note content...',
      isLoading: true
    };

    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('You are not authenticated. Please log in again.');
    }

    // Add the loading insight to the note's references
    const referencesWithLoading = [...(note.references || []).filter(ref => !('isLoading' in ref)), loadingInsight];
    await updateNote(noteId, { references: referencesWithLoading });

    try {
      // Call the smart note analysis API
      const response = await fetch('/api/smart-note/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ content_note: noteContent }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Analysis failed');
      }

      // Format the analysis into a readable insight
      const analysis = data.data?.analysis;

      if (!analysis) {
        console.warn('Analysis data is missing or malformed:', data);
        throw new Error('Invalid analysis data structure');
      }

      const formattedContent = formatAnalysisToMarkdown(analysis);

      // Replace the loading insight with the actual analysis
      const updatedReferences = Array.isArray(note.references)
        ? note.references.filter(ref => !('isLoading' in ref))
        : [];
      updatedReferences.push({
        type: 'ai_insight' as const,
        content: formattedContent
      });

      // Check if we should update the title
      const updates: NoteUpdate = { references: updatedReferences };

      // If the note has the default title "Untitled Note" and we have a suggested title, update it
      if (note.title === 'Untitled Note' && data.suggestedTitle) {
        updates.title = data.suggestedTitle;
      }

      // Update the note with new references and possibly a new title
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

      // Remove the loading insight and add an error message
      const updatedReferences = Array.isArray(note.references)
        ? note.references.filter(ref => !('isLoading' in ref))
        : [];
      updatedReferences.push({
        type: 'ai_insight' as const,
        content: `Error analyzing note: ${errorMessage}`
      });

      await updateNote(noteId, { references: updatedReferences });
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