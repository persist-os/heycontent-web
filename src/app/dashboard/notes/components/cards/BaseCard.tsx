import React, { useState } from 'react';
import { MoreHorizontal, Star, Trash2, Edit } from 'lucide-react';
import { Note } from '../../types';
import { cn } from '@/lib/utils';
import { ImageMosaic } from '../ImageMosaic';
import { ImageGalleryModal } from '../ImageGalleryModal';

interface BaseCardProps {
  note: Note;
  className?: string;
  hoverBgClass?: string;
  children: React.ReactNode;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}

export function BaseCard({
  note,
  className,
  hoverBgClass,
  children,
  onEdit,
  onDelete,
  onToggleImportant,
  isDragging = false,
  isOverlay = false
}: BaseCardProps) {
  const [showImageGallery, setShowImageGallery] = useState(false);
  
  const hasImages = note.images && note.images.length > 0;

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
    <>
      <div
        className={cn(
          "group relative border border-border rounded-lg shadow-sm transition-all duration-200",
          "hover:shadow-md hover:border-border/60",
          hoverBgClass,
          !isOverlay && !isDragging && "cursor-pointer",
          // Drag states
          isDragging && "opacity-50 scale-95 shadow-lg",
          isOverlay && "shadow-2xl rotate-3 scale-105 border-primary/50",
          className
        )}
        onClick={!isDragging && !isOverlay ? handleEdit : undefined}
      >
        {/* Header with actions */}
        {!isOverlay && !isDragging && (
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
        )}

        {/* Drag indicator for overlay */}
        {isOverlay && (
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium">
            Dragging...
          </div>
        )}

        {/* NEW: Image Mosaic Preview */}
        {hasImages && (
          <div className="p-4 pb-0">
            <ImageMosaic
              images={note.images}
              onOpenGallery={(e) => {
                e.stopPropagation(); // Prevent card click
                setShowImageGallery(true);
              }}
              className="rounded-md mb-3"
            />
          </div>
        )}

        {/* Card content */}
        <div className={cn("p-4", hasImages && "pt-3")}>
          {children}
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="px-4 pt-2 pb-1">
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((tag, index) => (
                <span key={index} className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Date footer */}
        <div className="px-3 pb-2 text-xs text-muted-foreground">
          {new Date(note.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showImageGallery && hasImages && (
        <ImageGalleryModal
          isOpen={showImageGallery}
          noteId={String(note._id)}
          images={note.images}
          onClose={() => setShowImageGallery(false)}
        />
      )}
    </>
  );
} 