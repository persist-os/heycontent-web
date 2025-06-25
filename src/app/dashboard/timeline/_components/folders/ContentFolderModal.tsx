'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderModalProps, ContentItem } from './types';
import { Video, FileText, Image, Calendar, Clock } from 'lucide-react';

// Mock data for demonstration
const mockContentItems: ContentItem[] = [
  {
    id: '1',
    title: 'How to Create Engaging Social Media Content',
    type: 'content',
    date: new Date('2024-01-15'),
    contentType: 'video',
    status: 'published',
    platform: 'YouTube',
    preview: 'A comprehensive guide to creating content that drives engagement...'
  },
  {
    id: '2',
    title: 'The Future of Content Marketing',
    type: 'content',
    date: new Date('2024-01-12'),
    contentType: 'article',
    status: 'draft',
    platform: 'Blog',
    preview: 'Exploring emerging trends and technologies in content marketing...'
  },
  {
    id: '3',
    title: 'Quick Tips for Better Videos',
    type: 'content',
    date: new Date('2024-01-18'),
    contentType: 'social-post',
    status: 'scheduled',
    platform: 'Instagram',
    preview: 'Short video tips for improving your video content quality...'
  }
];

const getContentIcon = (type: string) => {
  switch (type) {
    case 'video': return Video;
    case 'article': return FileText;
    case 'blog': return FileText;
    case 'social-post': return Image;
    default: return FileText;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'draft': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'scheduled': return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const ContentFolderModal: React.FC<FolderModalProps & { onContentClick?: (contentId: string, item?: any) => void }> = ({
  isOpen,
  onClose,
  folderData,
  onContentClick,
}) => {
  // Transform real content data into display format
  const contentItems = useMemo(() => {
    if (!folderData.items || !Array.isArray(folderData.items)) return [];
    
    return folderData.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: 'content',
      date: item.date || new Date(item.createdAt || Date.now()),
      contentType: item.contentType || 'article',
      status: item.status || 'published',
      platform: item.platform || 'Unknown',
      preview: item.preview || 'No preview available',
      metadata: item.metadata || {}
    }));
  }, [folderData.items]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            Content Library
            <span className="text-sm text-muted-foreground">({folderData.count} items)</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {contentItems.map((item) => {
              const ContentIcon = getContentIcon(item.contentType);
              
              return (
                <div
                  key={item.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  tabIndex={0}
                  role="button"
                  aria-label={`Open content: ${item.title}`}
                  onClick={() => onContentClick && onContentClick(item.id, item)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onContentClick) {
                      e.preventDefault();
                      onContentClick(item.id, item);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {item.date.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.preview}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs mb-3">
                    <div className="flex items-center gap-1">
                      <ContentIcon className="w-3 h-3" />
                      {item.contentType.charAt(0).toUpperCase() + item.contentType.slice(1).replace('-', ' ')}
                    </div>
                    {item.platform && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.platform}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {item.contentType.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  {item.status === 'scheduled' && (
                    <div className="mt-2 text-xs text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/20 rounded p-2">
                      Scheduled for publication
                    </div>
                  )}
                  
                  {item.status === 'draft' && (
                    <div className="mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
                      Work in progress
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 