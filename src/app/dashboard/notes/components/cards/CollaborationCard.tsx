import React from 'react';
import { BaseCard } from './BaseCard';
import { Note } from '../../types';
import { Users, MessageCircle, UserPlus, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NoteContentRenderer } from '../NoteContentRenderer';

interface CollaborationCardProps {
  note: Note;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
}

export function CollaborationCard({ 
  note, 
  availableNotes = [],
  onEdit, 
  onDelete, 
  onToggleImportant 
}: CollaborationCardProps) {
  // Determine collaboration type based on content
  const getCollaborationType = () => {
    const content = note.content?.toLowerCase() || '';
    const title = note.title?.toLowerCase() || '';
    
    if (title.includes('meeting') || content.includes('meeting') || content.includes('agenda')) {
      return 'meeting';
    }
    if (title.includes('project') || content.includes('project') || content.includes('milestone')) {
      return 'project';
    }
    if (title.includes('feedback') || content.includes('feedback') || content.includes('review')) {
      return 'feedback';
    }
    return 'general';
  };

  const collaborationType = getCollaborationType();

  const getIcon = () => {
    switch (collaborationType) {
      case 'meeting':
        return <Calendar className="w-4 h-4 text-green-600" />;
      case 'project':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'feedback':
        return <MessageCircle className="w-4 h-4 text-green-600" />;
      default:
        return <UserPlus className="w-4 h-4 text-green-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (collaborationType) {
      case 'meeting':
        return 'Meeting Notes';
      case 'project':
        return 'Project Collaboration';
      case 'feedback':
        return 'Feedback & Review';
      default:
        return 'Team Collaboration';
    }
  };

  return (
    <BaseCard
      note={note}
      className="border-green-500/30 hover:border-green-500/50"
      hoverBgClass="hover:bg-green-500/10"
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
    >
      <div className="p-4">
        {/* Header with collaboration icon */}
        <div className="flex items-center gap-2 mb-3">
          {getIcon()}
          <h3 className="font-semibold text-foreground flex-1 pr-8 line-clamp-1">
            {(note.title && note.title.trim()) || getTypeLabel()}
          </h3>
        </div>

        {/* Content preview */}
        <div className="text-sm text-muted-foreground line-clamp-4">
          {note.content ? (
            <NoteContentRenderer 
              content={note.content} 
              availableNotes={availableNotes}
            />
          ) : (
            'No content yet...'
          )}
        </div>
      </div>
    </BaseCard>
  );
} 