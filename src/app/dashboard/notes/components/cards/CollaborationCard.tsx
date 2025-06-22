import React from 'react';
import { BaseCard } from './BaseCard';
import { Note } from '../../types';
import { Users, MessageCircle, UserPlus, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollaborationCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
}

export function CollaborationCard({ 
  note, 
  onEdit, 
  onDelete, 
  onToggleImportant 
}: CollaborationCardProps) {
  // Extract mentions from content
  const extractMentions = (content: string) => {
    const mentionMatches = content.match(/@[\w]+/g) || [];
    return mentionMatches.slice(0, 3);
  };

  const mentions = extractMentions(note.content || '');
  
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
      className="bg-green-500/10 border-green-500/30 hover:border-green-500/50"
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
    >
      <div className="p-4">
        {/* Header with collaboration icon */}
        <div className="flex items-center gap-2 mb-3">
          {getIcon()}
          <h3 className="font-semibold text-foreground flex-1 pr-8 line-clamp-1">
            {note.title || getTypeLabel()}
          </h3>
        </div>

        {/* Mentions */}
        {mentions.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {mentions.map((mention, index) => (
              <span 
                key={index}
                className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded-full font-medium"
              >
                {mention}
              </span>
            ))}
          </div>
        )}

        {/* Content preview */}
        <div className="text-sm text-muted-foreground line-clamp-4">
          {note.content?.replace(/@[\w]+/g, '').trim() || 'No content yet...'}
        </div>
      </div>
    </BaseCard>
  );
} 