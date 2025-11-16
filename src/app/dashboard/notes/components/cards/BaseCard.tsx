import React, { useState } from 'react';
import { Star, Trash2, Share2, Users, UserCheck, Eye, Edit3, ArrowUpRight } from 'lucide-react';
import { Note } from '../../types';
import { cn } from '@/lib/utils';
import { ImageMosaic } from '../ImageMosaic';
import { ImageGalleryModal } from '../ImageGalleryModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { formatDistanceToNow } from '@/app/dashboard/living-projects/[projectId]/components/utils/dateFormatting';

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

  const updatedAt = note.updatedAt || note._creationTime || Date.now()
  const relativeTime = formatDistanceToNow(new Date(updatedAt), { addSuffix: true, short: true })
  const noteType = note.type || 'note'
  const formattedType = noteType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())

  return (
    <>
      <Card
        className={cn(
          "group relative w-[348px] h-[129px] overflow-hidden transition-all duration-300 ease-out opacity-75",
          "border-2 rounded-[12px]",
          "bg-[hsl(var(--assignment-bg))] border-[hsl(var(--assignment-stroke-focus))]",
          !isOverlay && !isDragging && "cursor-pointer",
          // Drag states with subtle animations
          isDragging && "opacity-60 scale-95 blur-sm",
          isOverlay && "shadow-2xl rotate-1 scale-105",
          className
        )}
        onClick={!isDragging && !isOverlay ? handleEdit : undefined}
      >
        {/* Widget Icon - Top Right */}
        <div className="absolute top-[9px] left-[307px] w-6 h-6 z-20">
          <Image
            src="/icons/artifact-widget.svg"
            alt="Widget icon"
            width={24}
            height={24}
            className="opacity-75"
          />
        </div>

        {/* Floating actions - mobile-friendly with touch targets */}
        {!isOverlay && !isDragging && (
          <div className="absolute top-[9px] right-[9px] opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 z-20">
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
        
        {/* Content wrapper with AssignmentArtifactCard layout */}
        <div className="absolute left-[6px] top-[7px] px-[8px] py-0 w-[335px] h-[116px] flex flex-col gap-[16px] z-10">
          {/* Title and subtitle section */}
          <div className="flex flex-col gap-[4px]">
            {children}
          </div>
          
          {/* Metadata and action button */}
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-normal leading-[20px] text-[hsl(var(--assignment-text-regular))] whitespace-nowrap">
              {`${formattedType} • ${relativeTime}`}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 p-[8px]"
              onClick={(e) => {
                e.stopPropagation()
                handleEdit(e)
              }}
            >
              <ArrowUpRight className="w-6 h-6 text-[hsl(var(--assignment-stroke-focus))]" />
            </Button>
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