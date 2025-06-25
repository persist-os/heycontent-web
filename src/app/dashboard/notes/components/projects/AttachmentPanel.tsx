'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectWithItems, ItemType } from '../../types/project';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '@/app/context/auth-context';
import { useNotes } from '@/app/context/notes-context';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Search, Plus, Minus, FileText, MessageSquare, Instagram, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachmentPanelProps {
  projectId: Id<"projects">;
  project: ProjectWithItems;
  isOpen: boolean;
  onClose: () => void;
}

interface AttachableItem {
  id: string;
  type: ItemType;
  title: string;
  preview?: string;
  date: number;
  isAttached: boolean;
}

export function AttachmentPanel({ projectId, project, isOpen, onClose }: AttachmentPanelProps) {
  const { firebaseUser } = useAuth();
  const { notes } = useNotes();
  const { addItemToProject, removeItemFromProject } = useProjects(firebaseUser?.uid);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | ItemType>('all');

  // Fetch conversations
  const conversations = useQuery(
    api.chatQueries.getHistory,
    firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  // Fetch Instagram posts
  const instagramPosts = useQuery(
    api.instagramQueries.getAllInstagramPosts,
    firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  // Fetch YouTube videos
  const youtubeVideos = useQuery(
    api.youtubeQueries.getYouTubeVideos,
    firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  // Convert all available items to a unified format
  const allItems = useMemo(() => {
    const items: AttachableItem[] = [];

    // Add notes
    notes.forEach(note => {
      items.push({
        id: String(note._id),
        type: 'note',
        title: note.title,
        preview: note.content?.substring(0, 100),
        date: note.updatedAt || note._creationTime || 0,
        isAttached: project.noteIds?.includes(String(note._id)) || false,
      });
    });

    // Add conversations
    (conversations || []).forEach(conversation => {
      items.push({
        id: String(conversation._id),
        type: 'conversation',
        title: conversation.title,
        preview: conversation.messages?.[conversation.messages.length - 1]?.content?.substring(0, 100),
        date: conversation.updatedAt || conversation._creationTime || 0,
        isAttached: project.conversationIds?.includes(String(conversation._id)) || false,
      });
    });

    // Add Instagram posts
    (instagramPosts || []).forEach(post => {
      items.push({
        id: String(post._id),
        type: 'instagramPost',
        title: post.data?.caption?.substring(0, 50) || 'Instagram Post',
        preview: post.data?.caption?.substring(0, 100),
        date: post.data?.timestamp || post.createdAt || 0,
        isAttached: project.instagramPostIds?.includes(String(post._id)) || false,
      });
    });

    // Add YouTube videos
    (youtubeVideos || []).forEach(video => {
      items.push({
        id: String(video._id),
        type: 'youtubeVideo',
        title: video.snippet?.title || 'YouTube Video',
        preview: video.snippet?.description?.substring(0, 100),
        date: video.snippet?.published_at ? new Date(video.snippet.published_at).getTime() : video.createdAt || 0,
        isAttached: project.youtubeVideoIds?.includes(String(video._id)) || false,
      });
    });

    return items;
  }, [notes, conversations, instagramPosts, youtubeVideos, project]);

  // Filter items based on search and type
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.preview?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === 'all' || item.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [allItems, searchTerm, selectedType]);

  // Group items by attached/available
  const attachedItems = filteredItems.filter(item => item.isAttached);
  const availableItems = filteredItems.filter(item => !item.isAttached);

  const handleToggleItem = async (item: AttachableItem) => {
    if (item.isAttached) {
      await removeItemFromProject(projectId, item.type, item.id);
    } else {
      await addItemToProject(projectId, item.type, item.id);
    }
  };

  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case 'note': return FileText;
      case 'conversation': return MessageSquare;
      case 'instagramPost': return Instagram;
      case 'youtubeVideo': return Youtube;
    }
  };

  const getItemColor = (type: ItemType) => {
    switch (type) {
      case 'note': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'conversation': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'instagramPost': return 'text-pink-600 bg-pink-100 dark:bg-pink-900/20';
      case 'youtubeVideo': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    }
  };

  const itemTypes = [
    { key: 'all', label: 'All Items' },
    { key: 'note', label: 'Notes' },
    { key: 'conversation', label: 'Conversations' },
    { key: 'instagramPost', label: 'Instagram' },
    { key: 'youtubeVideo', label: 'YouTube' },
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col w-[95vw]">
        <DialogHeader>
          <DialogTitle>Manage Project Items</DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="flex flex-col gap-4 border-b pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            {itemTypes.map((type) => (
              <Button
                key={type.key}
                variant={selectedType === type.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type.key as any)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Content - Two Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-auto">
          {/* Available Items */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                Available Items ({availableItems.length})
              </h3>
            </div>
            
            <ScrollArea className="flex-1 max-h-96">
              <div className="space-y-2 pr-2">
                {availableItems.map((item) => {
                  const Icon = getItemIcon(item.type);
                  const colorClass = getItemColor(item.type);
                  
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg hover:shadow-sm transition-shadow min-w-0"
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-3">
                        <h4 className="font-medium text-foreground line-clamp-2 break-words leading-tight">
                          {item.title}
                        </h4>
                        {item.preview && (
                          <p className="text-sm text-muted-foreground line-clamp-2 break-words mt-1 leading-tight">
                            {item.preview}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleItem(item)}
                        className="flex-shrink-0 w-8 h-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}

                {availableItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || selectedType !== 'all' 
                      ? 'No items found matching your criteria'
                      : 'All items are already attached to this project'
                    }
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Attached Items */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                Attached Items ({attachedItems.length})
              </h3>
            </div>
            
            <ScrollArea className="flex-1 max-h-96">
              <div className="space-y-2 pr-2">
                {attachedItems.map((item) => {
                  const Icon = getItemIcon(item.type);
                  const colorClass = getItemColor(item.type);
                  
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg min-w-0"
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-3">
                        <h4 className="font-medium text-foreground line-clamp-2 break-words leading-tight">
                          {item.title}
                        </h4>
                        {item.preview && (
                          <p className="text-sm text-muted-foreground line-clamp-2 break-words mt-1 leading-tight">
                            {item.preview}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleItem(item)}
                        className="flex-shrink-0 w-8 h-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}

                {attachedItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No items attached to this project yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 