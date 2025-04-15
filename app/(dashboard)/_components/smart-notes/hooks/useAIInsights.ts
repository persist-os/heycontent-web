import { Note, Reference } from '../types';
import { formatAnalysisToMarkdown } from '../utils/format-utils';

export function useAIInsights(updateNote: (noteId: string, updates: any) => Promise<void>) {
  const requestAIInsights = async (noteId: string, note: Note) => {
    if (!note || !noteId) {
      console.error('Invalid note or noteId:', { noteId, note });
      return;
    }

    // Show loading state
    const loadingInsight: Reference = {
      type: 'ai_insight',
      content: 'Analyzing your note content...',
      isLoading: true
    };

    // Add the loading insight to the note's references
    const referencesWithLoading = [...(note.references || []), loadingInsight];
    await updateNote(noteId, { references: referencesWithLoading });

    try {
      // Call the smart note analysis API
      const response = await fetch('/api/smart-note/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content_note: note.content }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Analysis failed');
      }

      // Format the analysis into a readable insight
      // Check if data.data exists and has analysis property
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
        type: 'ai_insight',
        content: formattedContent
      });

      // Check if we should update the title
      const updates: any = { references: updatedReferences };

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
        type: 'ai_insight',
        content: `Error analyzing note: ${errorMessage}`
      });

      await updateNote(noteId, { references: updatedReferences });
    }
  };

  return { requestAIInsights };
}