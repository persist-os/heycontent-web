import { useMemo } from 'react';
import { Note, NoteType } from '../types';

export interface TypeStats {
  type: NoteType;
  count: number;
  label: string;
  icon: string;
  color: string;
}

export function useNoteTypeStats(notes: Note[]) {
  const typeStats = useMemo(() => {
    // Count notes by type
    const typeCounts = notes.reduce((acc, note) => {
      const type = note.type || 'idea_bank'; // Default to idea_bank if no type
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<NoteType, number>);

    // Define type metadata with Lucide icon names
    const typeMetadata: Record<NoteType, { label: string; icon: string; color: string }> = {
      idea_bank: { label: 'Ideas', icon: 'Lightbulb', color: 'text-yellow-600 border-yellow-500' },
      content_script: { label: 'Scripts', icon: 'FileText', color: 'text-blue-600 border-blue-500' },
      collaboration_note: { label: 'Collabs', icon: 'Users', color: 'text-green-600 border-green-500' },
      analytics_insight: { label: 'Analytics', icon: 'BarChart3', color: 'text-purple-600 border-purple-500' },
      reflection_journal: { label: 'Reflections', icon: 'BookOpen', color: 'text-indigo-600 border-indigo-500' },
      task_checklist: { label: 'Tasks', icon: 'CheckSquare', color: 'text-emerald-600 border-emerald-500' },
      email_draft: { label: 'Emails', icon: 'Mail', color: 'text-orange-600 border-orange-500' },
    };

    // Create stats array only for types that have notes
    const stats: TypeStats[] = Object.entries(typeCounts)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        type: type as NoteType,
        count,
        ...typeMetadata[type as NoteType],
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    return {
      stats,
      totalNotes: notes.length,
      importantCount: notes.filter(note => note.important).length,
    };
  }, [notes]);

  return typeStats;
} 