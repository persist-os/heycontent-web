'use client';

import React, { useState } from 'react';
import { useCreateNote } from '@/app/dashboard/notes/hooks/useCreateNote';
import { Button } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateNoteButtonProps {
  content: string;
  onNoteCreate?: () => void;
  title?: string;
  className?: string;
}

export const CreateNoteButton = ({ content, onNoteCreate, title, className }: CreateNoteButtonProps) => {
  const { createNote, isCreating } = useCreateNote();
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateNote = async (redirect: boolean) => {
    if (content.trim()) {
      await createNote(content.trim(), {
        redirect,
        callback: onNoteCreate,
        customTitle: title,
      });
      setIsOpen(false);
    }
  };

  const isContentEmpty = !content.trim();

  if (isContentEmpty) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isCreating}
                className={cn(
                  "group relative h-8 px-3 text-xs font-medium",
                  "bg-muted/50 hover:bg-muted/80 hover:text-foreground",
                  "border border-border/50 hover:border-border",
                  "transition-all duration-200 ease-out",
                  "focus-visible:ring-1 focus-visible:ring-ring",
                  className
                )}
              >
                {isCreating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span className="ml-1.5">Save</span>
                <div className={cn(
                  "ml-1 h-3 w-0.5 bg-border/40 transition-opacity duration-200",
                  "group-hover:bg-border/60"
                )} />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>Save content as note</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent 
          align="end" 
          className="w-40 p-1"
          sideOffset={4}
        >
          <DropdownMenuItem 
            onClick={() => handleCreateNote(false)}
            className="text-xs h-8 cursor-pointer focus:bg-muted/50"
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            <span>Add to Notes</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleCreateNote(true)}
            className="text-xs h-8 cursor-pointer focus:bg-muted/50"
          >
            <ExternalLink className="mr-2 h-3.5 w-3.5" />
            <span>Open as Note</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

CreateNoteButton.displayName = 'CreateNoteButton';