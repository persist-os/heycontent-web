'use client';

import React from 'react';
import { TimelineEvent } from './useTimelineStore';
import { cn } from '@/lib/utils';

interface TimelineCardProps {
  event: TimelineEvent;
  variant?: 'compact' | 'expanded' | 'roadmap';
}

export const TimelineCard: React.FC<TimelineCardProps> = ({ 
  event, 
  variant = 'compact' 
}) => {
  const { date, title, persona, content, streak, type } = event;

  const formatDate = (date: Date) => {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const getFolderIcon = (color: string, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6', 
      lg: 'w-8 h-8'
    };
    
    const folderMap = {
      blue: '/folders/folder_chat.svg',
      purple: '/folders/folder_smartnotes.svg', 
      orange: '/folders/Folder_content.svg',
      yellow: '/folders/folder_analytics.svg',
    };

    const folderSrc = folderMap[color as keyof typeof folderMap] || '/folders/folder_chat.svg';
    
    return (
      <img
        src={folderSrc}
        alt={`${color} folder`}
        className={cn(sizeClasses[size], 'object-contain')}
      />
    );
  };

  if (variant === 'compact') {
    return (
      <div 
        className="flex flex-col items-center space-y-2 cursor-pointer hover:scale-105 transition-transform"
        onClick={() => console.log('Compact card clicked:', { date, title, content, persona })}
      >
        <div className="text-xs text-muted-foreground font-medium">
          {formatDate(date)}
        </div>
        <div className="flex space-x-1">
          {content?.folders?.map((folder, index) => (
            <div 
              key={index} 
              className="relative group hover:scale-110 transition-transform cursor-pointer"
              title={`${folder.color} folder - ${folder.count} items`}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Folder clicked:', folder);
              }}
            >
              {getFolderIcon(folder.color, 'md')}
              {folder.count > 1 && (
                <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-background">
                  {folder.count}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'expanded') {
    return (
      <div 
        className="bg-card/90 rounded-lg p-4 border shadow-sm space-y-3 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] backdrop-blur-sm"
        onClick={() => console.log('Card clicked:', { date, title, content, persona })}
      >
        {persona && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center ring-2 ring-primary/20">
              <span className="text-sm font-bold text-primary">
                {persona.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <div className="font-semibold text-sm">{persona.name}</div>
              <div className="text-xs text-muted-foreground">Level {persona.level}</div>
            </div>
          </div>
        )}
        
        <div className="text-sm font-semibold">{title}</div>
        
        {content?.highlights && (
          <div className="space-y-1">
            {content.highlights.slice(0, 2).map((highlight, index) => (
              <div key={index} className="text-xs text-muted-foreground">
                • {highlight}
              </div>
            ))}
          </div>
        )}

        {content?.folders && (
          <div className="flex space-x-2">
            {content.folders.map((folder, index) => (
              <div 
                key={index} 
                className="relative group hover:scale-110 transition-transform cursor-pointer"
                title={`${folder.color} folder - ${folder.count} items`}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Folder clicked:', folder);
                }}
              >
                {getFolderIcon(folder.color, 'md')}
                {folder.count > 1 && (
                  <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-background">
                    {folder.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {streak && (
          <div className="text-xs text-primary font-semibold bg-primary/10 px-2 py-1 rounded-md">
            🔥 Streak of {streak} Published Posts!
          </div>
        )}
      </div>
    );
  }

  if (variant === 'roadmap') {
    return (
      <div 
        className="bg-card/95 rounded-xl p-6 border-2 shadow-lg space-y-4 min-w-[300px] cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] backdrop-blur-sm"
        onClick={() => console.log('Roadmap card clicked:', { date, title, content, persona })}
      >
        {persona && (
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center ring-2 ring-primary/30">
              <span className="font-bold text-primary">
                {persona.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <div className="font-bold">{persona.name}</div>
              <div className="text-sm text-muted-foreground font-medium">Level {persona.level}</div>
            </div>
          </div>
        )}
        
        <div className="font-bold text-lg">{title}</div>
        
        {type === 'milestone' && (
          <div className="bg-primary/15 text-primary px-3 py-1 rounded-full text-sm font-bold w-fit border border-primary/20">
            🏆 {title}
          </div>
        )}

        {content?.highlights && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Content Highlights</div>
            <div className="space-y-1">
              {content.highlights.map((highlight, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  • {highlight}
                </div>
              ))}
            </div>
          </div>
        )}

        {content?.folders && (
          <div className="flex space-x-3 flex-wrap">
            {content.folders.map((folder, index) => (
              <div 
                key={index} 
                className="relative group hover:scale-110 transition-transform cursor-pointer"
                title={`${folder.color} folder - ${folder.count} items`}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Roadmap folder clicked:', folder);
                }}
              >
                {getFolderIcon(folder.color, 'lg')}
                {folder.count > 1 && (
                  <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-background">
                    {folder.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {streak && (
          <div className="bg-primary/20 text-primary px-3 py-2 rounded-lg text-sm font-bold border border-primary/30">
            🔥 Streak of {streak}
          </div>
        )}
      </div>
    );
  }

  return null;
}; 