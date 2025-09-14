import React from 'react';
import { Note } from '../../types';
import { TodoCard } from './TodoCard';
import { ContentCard } from './ContentCard';
import { AnalyticsCard } from './AnalyticsCard';
import { ReflectionCard } from './ReflectionCard';
import { TipsCard } from './TipsCard';
import { CollaborationCard } from './CollaborationCard';
import { BaseCard } from './BaseCard';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useNotes } from '@/app/context/notes-context';

interface NoteCardProps {
  note: Note;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
  onUpdate?: (noteId: string, updates: any) => void;
  onShare?: (noteId: string) => void;
  isDraggable?: boolean;
  isOverlay?: boolean;
}

export function NoteCard({ 
  note, 
  availableNotes = [],
  onEdit, 
  onDelete, 
  onToggleImportant, 
  onUpdate,
  onShare,
  isDraggable = false,
  isOverlay = false
}: NoteCardProps) {
  // Set up draggable functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: String(note._id),
    data: {
      type: 'note',
      note,
    },
    disabled: !isDraggable || isOverlay,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  // Use setActiveNoteId from context for note selection if needed
  const { setActiveNoteId } = useNotes();

  // Determine card type based on note properties and content
  // Priority: Convex note type first, then content-based detection
  const getCardType = (): 'todo' | 'content' | 'analytics' | 'reflection' | 'tips' | 'collaboration' | 'default' => {
    const title = note.title?.toLowerCase() || '';
    const content = note.content?.toLowerCase() || '';
    const type = note.type;

    // Priority 1: Use Convex note types from schema
    if (type === 'task_checklist') {
      return 'todo';
    }
    
    if (type === 'analytics_insight') {
      return 'analytics';
    }
    
    if (type === 'reflection_journal') {
      return 'reflection';
    }
    
    if (type === 'content_script') {
      return 'content';
    }
    
    if (type === 'idea_bank') {
      return 'content';
    }
    
    if (type === 'collaboration_note') {
      return 'collaboration';
    }

    // Priority 2: Content-based detection for notes without specific types
    
    // Check for todo/checklist content patterns
    if (title.includes('todo') || 
        title.includes('task') ||
        title.includes('checklist') ||
        content.includes('[ ]') || 
        content.includes('[x]') ||
        content.match(/^[-*]\s/m) ||
        content.match(/^\d+\.\s/m)) {
      return 'todo';
    }

    // Check for analytics/insights content patterns
    if (title.includes('analytics') || 
        title.includes('engagement') || 
        title.includes('metrics') ||
        title.includes('insight') ||
        content.includes('growth') || 
        content.includes('retention') ||
        content.includes('%') ||
        content.includes('data') ||
        content.includes('performance')) {
      return 'analytics';
    }

    // Check for collaboration patterns
    if (title.includes('meeting') || 
        title.includes('project') ||
        title.includes('team') ||
        title.includes('collaboration') ||
        content.includes('@') ||
        content.includes('meeting') ||
        content.includes('feedback') ||
        content.includes('review')) {
      return 'collaboration';
    }

    // Check for tips content patterns
    if (title.includes('tips') || 
        title.includes('advice') ||
        title.includes('heycontent') ||
        title.includes('guide') ||
        content.includes('tip:') ||
        content.match(/^[-*•]\s.*tip/mi) ||
        content.includes('how to')) {
      return 'tips';
    }

    // Check for reflection/journal content patterns
    if (title.includes('reflection') || 
        title.includes('check-in') || 
        title.includes('journal') ||
        title.includes('diary') ||
        title.includes('thoughts') ||
        content.includes('feel') || 
        content.includes('think') || 
        content.includes('grateful') ||
        content.includes('today i') ||
        content.includes('reflect')) {
      return 'reflection';
    }

    // Enhanced content creation patterns - be more inclusive for content notes
    if (title.includes('content') || 
        title.includes('script') || 
        title.includes('vlog') || 
        title.includes('ootd') ||
        title.includes('inspiration') ||
        title.includes('post') ||
        title.includes('video') ||
        title.includes('caption') ||
        title.includes('idea') ||
        title.includes('tiktok') ||
        title.includes('instagram') ||
        title.includes('youtube') ||
        title.includes('reel') ||
        title.includes('story') ||
        content.includes('#') ||
        content.includes('caption') ||
        content.includes('hashtag') ||
        content.includes('hook') ||
        content.includes('cta') ||
        content.includes('call to action') ||
        content.includes('platform') ||
        (note.platform && note.platform.length > 0)) {
      return 'content';
    }

    // If no specific pattern matches, default to content for better user experience
    // since content creation is the primary use case
    return 'content';
  };

  const cardType = getCardType();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(note);
    } else {
      setActiveNoteId(note._id);
    }
  };

  const renderCard = () => {
    const commonProps = {
      note,
      availableNotes,
      onEdit: handleEdit,
      onDelete,
      onToggleImportant,
      onUpdate,
      onShare,
      isDragging: isDraggable && isDragging,
      isOverlay,
    };

    switch (cardType) {
      case 'todo':
        return (
          <TodoCard
            {...commonProps}
          />
        );

      case 'content':
        return (
          <ContentCard
            {...commonProps}
          />
        );

      case 'analytics':
        return (
          <AnalyticsCard
            {...commonProps}
          />
        );

      case 'collaboration':
        return (
          <CollaborationCard
            {...commonProps}
          />
        );

      case 'reflection':
        return (
          <ReflectionCard
            {...commonProps}
          />
        );

      case 'tips':
        return (
          <TipsCard
            {...commonProps}
          />
        );

      default:
        return (
          <ContentCard
            {...commonProps}
          />
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="note-card-wrapper"
      onClick={handleEdit}
    >
      {renderCard()}
    </div>
  );
}