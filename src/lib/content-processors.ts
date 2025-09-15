import { Doc } from '@/convex/_generated/dataModel';
import { UnifiedContent } from '@/types/content';

// Data transformation helpers - pure functions for converting API data to UnifiedContent

export function processNotesData(result: PromiseSettledResult<Doc<'notes'>[]>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch notes:', result.reason);
    return [];
  }

  return result.value.map(note => ({
    id: String(note._id),
    title: note.title || 'Untitled Note',
    type: 'note' as const,
    contentType: note.type || 'idea_bank',
    platform: 'smart-notes',
    createdAt: note.createdAt || Date.now(),
    updatedAt: note.updatedAt || Date.now(),
    important: note.important || false,
    tags: note.tags || [],
    analysis: note.analysis,
    content: note.content || '',
  }));
}




