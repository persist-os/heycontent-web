'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderModalProps } from './types';
import { FileText, Tags, Clock, Lightbulb } from 'lucide-react';

export const SmartNotesFolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  folderData,
  onNoteClick,
}) => {
  // Transform real note data into display format
  const noteItems = useMemo(() => {
    if (!folderData.items || !Array.isArray(folderData.items)) return [];
    
    return folderData.items.map((note: any) => ({
      id: note._id,
      title: note.title || 'Untitled Note',
      date: new Date(note.createdAt),
      wordCount: note.content ? note.content.split(' ').length : 0,
      tags: note.tags || [],
      preview: note.content ? note.content.slice(0, 100) + '...' : 'No content yet...',
      type: note.type || 'idea_bank',
      important: note.important || false,
      analysis: note.analysis
    }));
  }, [folderData.items]);

  // Prevent scroll propagation to timeline - following TimelineScroller.tsx pattern
  const handleWheel = (e: React.WheelEvent) => {
    // Only prevent propagation for non-zoom scroll events
    if (!e.ctrlKey && !e.metaKey) {
      e.stopPropagation();
    }
  };

  const handleScroll = (e: React.UIEvent) => {
    e.stopPropagation();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            File System
            <span className="text-sm text-muted-foreground">({folderData.count} items)</span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] custom-scrollbar">
          <div 
            className="space-y-4 pr-4"
            onWheel={handleWheel}
            onScroll={handleScroll}
            style={{ overscrollBehavior: 'contain' }}
          >
            {noteItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notes found for this time period</p>
              </div>
            ) : (
              noteItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  tabIndex={0}
                  role="button"
                  aria-label={`Open note: ${item.title}`}
                  onClick={() => onNoteClick && onNoteClick(item.id)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onNoteClick) {
                      e.preventDefault();
                      onNoteClick(item.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      {item.important && (
                        <span className="text-accent-foreground text-xs">⭐</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {item.date.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.preview}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs mb-3 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {item.wordCount} words
                    </div>
                    <div className="flex items-center gap-1">
                      <Tags className="w-3 h-3" />
                      {item.tags.length} tags
                    </div>
                    {item.analysis && (
                      <div className="flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-accent-foreground" />
                        AI Analysis
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs">
                      {item.type?.replace('_', ' ') || 'Note'}
                    </span>
                    {item.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-accent/20 text-accent-foreground px-2 py-1 rounded-full text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="inline-block bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {item.analysis && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-2">
                        <Lightbulb className="w-3 h-3 text-accent-foreground" />
                        <span className="text-xs font-medium text-foreground">AI Analysis</span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {item.analysis}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}; 