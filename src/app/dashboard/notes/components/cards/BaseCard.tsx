import React, { useState } from 'react';
import { Star, Trash2, Share2, Users, UserCheck, Eye, Edit3, ArrowUpRight } from 'lucide-react';
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
  onShare?: (noteId: string) => void;
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
  onShare,
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(String(note._id));
  };

  return (
    <>
      <div
        className={cn(
          "group relative overflow-hidden transition-all duration-300 ease-out",
          // Figma Design System: N20 background with rigel blue border
          "bg-[hsl(var(--card-bg-n20))]",
          "border-2 border-[hsl(var(--card-border-rigel))]",
          "rounded-[12px]",
          "hover:scale-[1.02]",
          !isOverlay && !isDragging && "cursor-pointer",
          // Drag states with subtle animations
          isDragging && "opacity-60 scale-95 blur-sm",
          isOverlay && "shadow-2xl rotate-1 scale-105",
          className
        )}
        onClick={!isDragging && !isOverlay ? handleEdit : undefined}
      >
        {/* Gradient overlay - Figma: from transparent to rigel blue at 30% opacity */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[hsl(var(--card-border-rigel)/0.3)] pointer-events-none rounded-[10px] z-0" />
        
        {/* Content wrapper with relative positioning to appear above gradient */}
        <div className="relative z-10">
        {/* Subtle top accent line - sharing and AI status indicator */}
        <div className={cn(
          "h-px w-full transition-all duration-500",
          // Sharing status takes priority
          note.isSharedWithMe
            ? "bg-gradient-to-r from-transparent via-blue-500/60 to-transparent"
            : note.isShared
            ? "bg-gradient-to-r from-transparent via-green-500/60 to-transparent"
            // Then AI generation status
            : note.titleGenerated && note.typeGenerated 
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
              {onShare && (
                <button
                  onClick={handleShare}
                  title="Share note"
                  className="p-2 sm:p-2 rounded-full backdrop-blur-sm bg-background/50 text-muted-foreground/60 hover:text-blue-500 hover:bg-blue-50/80 dark:hover:bg-blue-950/30 transition-all duration-300 hover:scale-110 touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-[auto] sm:min-h-[auto]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              )}
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

        {/* Card content with responsive spacing - Figma: px-[36px] py-[8px] */}
        <div className={cn("px-4 sm:px-9 py-2", hasImages && "pt-2")}>
          {children}
        </div>

        {/* Tags with responsive styling - Figma: gap-[20px] */}
        {note.tags && note.tags.length > 0 && (
          <div className="px-4 sm:px-9 pb-2">
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

        {/* Sharing information banner */}
        {(note.isSharedWithMe || note.isShared) && (
          <div className="px-4 sm:px-6 pb-2">
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
              note.isSharedWithMe 
                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                : "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
            )}>
              {note.isSharedWithMe ? (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Shared by {note.ownerName}</span>
                  <div className="ml-auto flex items-center gap-1">
                    {note.permission === 'edit' ? (
                      <><Edit3 className="w-3 h-3" /> Can edit</>
                    ) : (
                      <><Eye className="w-3 h-3" /> View only</>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Shared with {note.sharedWithCount} {note.sharedWithCount === 1 ? 'person' : 'people'}</span>
                  <Users className="w-3 h-3 ml-auto" />
                </>
              )}
            </div>
          </div>
        )}

        {/* Date with responsive spacing and typography - Figma: px-[36px] py-[8px] */}
        <div className="px-4 sm:px-9 pb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent mb-2 sm:mb-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground/60">
            <span className="font-light">
              {note.isSharedWithMe && note.sharedAt 
                ? `Shared ${new Date(note.sharedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: new Date(note.sharedAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                  })}`
                : new Date(note.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: new Date(note.updatedAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                  })
              }
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