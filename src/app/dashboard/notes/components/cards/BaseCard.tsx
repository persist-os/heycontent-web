import React, { useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
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
          "group relative overflow-hidden transition-all duration-300 ease-out",
          "border-0 bg-card/50 backdrop-blur-sm",
          "hover:scale-[1.02] hover:bg-card/80",
          !isOverlay && !isDragging && "cursor-pointer",
          // Drag states with subtle animations
          isDragging && "opacity-60 scale-95 blur-sm",
          isOverlay && "shadow-2xl rotate-1 scale-105 bg-card border border-primary/30",
          className
        )}
        onClick={!isDragging && !isOverlay ? handleEdit : undefined}
      >
        {/* Subtle top accent line - AI-generated status indicator */}
        <div className={cn(
          "h-px w-full transition-all duration-500",
          note.titleGenerated && note.typeGenerated 
            ? "bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
            : note.titleGenerated || note.typeGenerated
            ? "bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" 
            : "bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent"
        )} />

        {/* Floating actions - mobile-friendly with touch targets */}
        {!isOverlay && !isDragging && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 z-10">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handleToggleImportant}
                title={note.important ? "Remove from favorites" : "Add to favorites"}
                className={cn(
                  "p-2 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-300 touch-manipulation",
                  "hover:scale-110 hover:bg-background/90 min-w-[44px] min-h-[44px] sm:min-w-[auto] sm:min-h-[auto]",
                  note.important 
                    ? "text-amber-500 bg-amber-50/80 dark:bg-amber-950/30" 
                    : "text-muted-foreground/60 hover:text-amber-500 bg-background/50"
                )}
              >
                <Star className="w-3.5 h-3.5" fill={note.important ? "currentColor" : "none"} />
              </button>
              <button
                onClick={handleDelete}
                title="Delete note"
                className="p-2 sm:p-2 rounded-full backdrop-blur-sm bg-background/50 text-muted-foreground/60 hover:text-red-500 hover:bg-red-50/80 dark:hover:bg-red-950/30 transition-all duration-300 hover:scale-110 touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-[auto] sm:min-h-[auto]"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Drag indicator with elegant styling */}
        {isOverlay && (
          <div className="absolute -top-1 -right-1 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            Moving...
          </div>
        )}

        {/* Image preview with breathing space */}
        {hasImages && (
          <div className="px-6 pt-6 pb-2">
            <ImageMosaic
              images={note.images}
              onOpenGallery={(e) => {
                e.stopPropagation();
                setShowImageGallery(true);
              }}
              className="rounded-lg overflow-hidden"
            />
          </div>
        )}

        {/* Card content with responsive spacing */}
        <div className={cn("px-4 sm:px-6 py-3 sm:py-4", hasImages && "pt-2 sm:pt-3")}>
          {children}
        </div>

        {/* Tags with responsive styling */}
        {note.tags && note.tags.length > 0 && (
          <div className="px-4 sm:px-6 pb-3 sm:pb-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {note.tags.slice(0, 4).map((tag, index) => (
                <span 
                  key={index} 
                  className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium bg-muted/50 text-muted-foreground/80 rounded-md border border-border/30 transition-colors duration-200 hover:bg-muted/70 touch-manipulation"
                >
                  {tag}
                </span>
              ))}
              {note.tags.length > 4 && (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs text-muted-foreground/60">
                  +{note.tags.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Date with responsive spacing and typography */}
        <div className="px-4 sm:px-6 pb-3 sm:pb-4">
          <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent mb-2 sm:mb-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground/60">
            <span className="font-light">
              {new Date(note.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: new Date(note.updatedAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
              })}
            </span>
            {/* AI generation status indicator */}
            {(note.titleGenerated || note.typeGenerated) && (
              <span className="text-xs font-light text-blue-400/70">
                AI-enhanced
              </span>
            )}
          </div>
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