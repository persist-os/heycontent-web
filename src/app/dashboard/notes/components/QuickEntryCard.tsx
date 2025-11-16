'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { T } from '@/components/translation/T';

export interface QuickEntryCardProps {
  type: 'chats' | 'artifacts' | 'assignments' | 'uploaded-files';
  title: React.ReactNode;
  tokenUsed?: string;
  fileCount?: number;
  mbUsed?: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

const cardConfig = {
  chats: {
    iconSrc: '/icons/chat-left-text-fill.svg',
    borderColor: 'border-[hsl(var(--notes-ghost-blue))]',
  },
  artifacts: {
    iconSrc: '/icons/artifact-widget.svg',
    borderColor: 'border-[hsl(var(--notes-ghost-accent))]',
  },
  assignments: {
    iconSrc: '/icons/cloud.svg',
    borderColor: 'border-[hsl(var(--notes-stroke-focus))]',
  },
  'uploaded-files': {
    iconSrc: '/icons/document.svg',
    borderColor: 'border-[hsl(var(--notes-stroke-focus))]',
  },
};

export function QuickEntryCard({
  type,
  title,
  tokenUsed,
  fileCount,
  mbUsed,
  isSelected = false,
  onClick,
  className,
}: QuickEntryCardProps) {
  const config = cardConfig[type];

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex-1 h-[186px] min-w-0 relative rounded-[12px] cursor-pointer transition-all',
        'border-2',
        config.borderColor,
        'bg-background',
        className
      )}
    >
      <div className="flex flex-col h-full items-end justify-between overflow-hidden px-0 py-[15px] rounded-[inherit] w-full">
        {/* Header with icon and title */}
        <div className="flex items-center justify-between px-4 py-0 w-full">
          <div className="flex gap-4 items-center">
            {/* Icon with background */}
            <div className="overflow-hidden rounded-[8px] shrink-0 size-[44px] flex items-center justify-center">
              <Image
                src={config.iconSrc}
                alt={typeof title === 'string' ? `${title} icon` : 'Card icon'}
                width={44}
                height={44}
                className="size-full"
              />
            </div>
            {/* Title */}
            <h2 className="text-h2 text-[hsl(var(--assignment-text-regular))] tracking-[-0.72px] whitespace-nowrap">
              {title}
            </h2>
          </div>
        </div>

        {/* Footer with stats */}
        <div className="flex items-center justify-between leading-0 px-4 py-0 w-full whitespace-nowrap">
          {/* Left stat */}
          <p className="text-body-m text-[hsl(var(--notes-on-surface-variant))] tracking-[-0.14px]">
            {tokenUsed || mbUsed || '—'}
          </p>
          {/* Right stat */}
          <p className="text-body-l text-[hsl(var(--assignment-text-regular))]">
            {fileCount !== undefined ? (
              <T context="notes.quick_entry.file_count">
                {fileCount} file{fileCount !== 1 ? 's' : ''}
              </T>
            ) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

