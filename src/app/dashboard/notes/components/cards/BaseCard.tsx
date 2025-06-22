import React from 'react';
import { MoreHorizontal, Star, Trash2, Edit } from 'lucide-react';
import { Note } from '../../types';
import { cn } from '@/lib/utils';

interface BaseCardProps {
  note: Note;
  className?: string;
  children: React.ReactNode;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
}

export function BaseCard({
  note,
  className,
  children,
  onEdit,
  onDelete,
  onToggleImportant
}: BaseCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(note);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(String(note._id));
  };

  const handleToggleImportant = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleImportant?.(String(note._id));
  };

  return (
    <div
      className={cn(
        "group relative bg-background border border-border rounded-lg shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-border/60 cursor-pointer",
        className
      )}
      onClick={handleEdit}
    >
      {/* Header with actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleImportant}
            title={note.important ? "Remove from favorites" : "Add to favorites"}
            className={cn(
              "p-1 rounded hover:bg-background/80 transition-colors",
              note.important ? "text-yellow-500" : "text-muted-foreground"
            )}
          >
            <Star className="w-3 h-3" fill={note.important ? "currentColor" : "none"} />
          </button>
          <button
            onClick={handleDelete}
            title="Delete note"
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Card content */}
      {children}

      {/* Date footer */}
      <div className="px-3 pb-2 text-xs text-muted-foreground">
        {new Date(note.updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </div>
    </div>
  );
} 