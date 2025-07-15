'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectWithItems, ItemType } from '../../types/project';
import { useProjects } from '../../hooks/useProjects';
import { useNotes } from '@/app/context/notes-context';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useContentManager, usePlatformContent } from '@/app/hooks/use-content';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { Search, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AttachableItem,
  extractRawId,
  convertToAttachableItems,
  getItemIcon,
  getItemColor,
  filterItems,
} from '../../utils/project-items';

interface AttachmentPanelProps {
  projectId: Id<"projects">;
  project: ProjectWithItems;
  isOpen: boolean;
  onClose: () => void;
}

export function AttachmentPanel({ projectId, project, isOpen, onClose }: AttachmentPanelProps) {
  const userId = getCurrentUserId();
  const { notes } = useNotes();
  const { addItemToProject, removeItemFromProject } = useProjects(userId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | ItemType>('all');

  // Initialize content manager
  useContentManager(userId);

  // Fetch conversations (keeping direct query for now as it may not be part of content system)
  const conversations = useQuery(
    api.chatQueries.getHistory,
    userId ? { userId } : "skip"
  );

  // Fetch platform content using content hooks
  const { content: instagramPosts } = usePlatformContent('instagram');
  const { content: youtubeVideos } = usePlatformContent('youtube');
  const { content: gmailContent } = usePlatformContent('gmail');
  const { content: analysisContent } = usePlatformContent('insights');

  // Convert all available items to a unified format
  const allItems = useMemo(() => {
    return convertToAttachableItems(
      notes,
      conversations || [],
      instagramPosts || [],
      youtubeVideos || [],
      gmailContent || [],
      analysisContent || [],
      project
    );
  }, [notes, conversations, instagramPosts, youtubeVideos, gmailContent, analysisContent, project]);

  // Filter items based on search and type
  const filteredItems = useMemo(() => {
    return filterItems(allItems, searchTerm, selectedType);
  }, [allItems, searchTerm, selectedType]);

  // Group items by attached/available
  const attachedItems = filteredItems.filter(item => item.isAttached);
  const availableItems = filteredItems.filter(item => !item.isAttached);

  const handleToggleItem = async (item: AttachableItem) => {
    // Extract the raw database ID for the project system
    const rawId = extractRawId(item.id);
    if (item.isAttached) {
      await removeItemFromProject(projectId, item.type, rawId);
    } else {
      await addItemToProject(projectId, item.type, rawId);
    }
  };

  const itemTypes = [
    { key: 'all', label: 'All Items' },
    { key: 'note', label: 'Notes' },
    { key: 'conversation', label: 'Conversations' },
    { key: 'instagramPost', label: 'Instagram' },
    { key: 'youtubeVideo', label: 'YouTube' },
    { key: 'gmail', label: 'Gmail' },
    { key: 'analysis', label: 'Analysis' },
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
                className={
                  selectedType === type.key && type.key === 'note'
                    ? 'dark:!text-black'
                    : undefined
                }
              >
                {selectedType === type.key && type.key === 'note' ? (
                  <span className="dark:!text-black">{type.label}</span>
                ) : (
                  type.label
                )}
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