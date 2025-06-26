'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProjectWithItems } from '../../types/project';
import { NoteCard } from '../cards/NoteCard';
import { FileText, MessageSquare, Instagram, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectItemsGridProps {
  project: ProjectWithItems;
}

export function ProjectItemsGrid({ project }: ProjectItemsGridProps) {
  const { attachedItems } = project;
  const router = useRouter();

  // Navigation handlers similar to FolderModalManager
  const handleNoteClick = (noteId: string) => {
    router.push(`/dashboard/notes?noteId=${noteId}`);
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/dashboard/chat?id=${chatId}`);
  };

  const handleInstagramClick = (postId: string, item?: any) => {
    // Navigate to content-analytics with Instagram context
    router.push(`/dashboard/content-analytics?analyticsId=${postId}&platform=instagram&tab=posts`);
  };

  const handleYouTubeClick = (videoId: string, item?: any) => {
    // Navigate to content-analytics with YouTube context
    router.push(`/dashboard/content-analytics?analyticsId=${videoId}&platform=youtube&tab=posts`);
  };

  const sections = [
    {
      title: 'Notes',
      items: attachedItems?.notes || [],
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      title: 'Conversations',
      items: attachedItems?.conversations || [],
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Instagram Posts',
      items: attachedItems?.instagramPosts || [],
      icon: Instagram,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    },
    {
      title: 'YouTube Videos',
      items: attachedItems?.youtubeVideos || [],
      icon: Youtube,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
    },
  ].filter(section => section.items.length > 0);

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="p-6 space-y-8">
      {sections.map((section) => {
        const Icon = section.icon;
        
        return (
          <div key={section.title}>
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", section.bgColor)}>
                <Icon className={cn("w-4 h-4", section.color)} />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {section.title}
              </h2>
              <span className="text-sm text-muted-foreground">
                ({section.items.length})
              </span>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.items.map((item: any) => {
                if (section.title === 'Notes') {
                  return (
                    <div key={String(item._id)} className="h-fit">
                      <NoteCard
                        note={item}
                        availableNotes={[]} // Not needed in project view
                        onEdit={() => handleNoteClick(String(item._id))}
                        onDelete={() => {}} // TODO: Implement remove from project
                        onToggleImportant={() => {}} // TODO: Implement
                        onUpdate={() => {}} // TODO: Implement
                      />
                    </div>
                  );
                }

                // Handle different item types appropriately
                if (section.title === 'Conversations') {
                  return (
                    <div
                      key={String(item._id)}
                      className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleChatClick(String(item._id))}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", section.bgColor)}>
                          <Icon className={cn("w-4 h-4", section.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.messages?.[item.messages.length - 1]?.content?.substring(0, 100) || 'No messages'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(item.updatedAt || item._creationTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (section.title === 'Instagram Posts') {
                  return (
                    <div
                      key={String(item._id)}
                      className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleInstagramClick(String(item._id), item)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", section.bgColor)}>
                          <Icon className={cn("w-4 h-4", section.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {item.data?.caption?.substring(0, 50) || 'Instagram Post'}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.data?.caption || 'No caption'}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{new Date(item.data?.timestamp || item.createdAt).toLocaleDateString()}</span>
                            {item.data?.like_count && <span>• {item.data.like_count} likes</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (section.title === 'YouTube Videos') {
                  return (
                    <div
                      key={String(item._id)}
                      className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleYouTubeClick(String(item._id), item)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", section.bgColor)}>
                          <Icon className={cn("w-4 h-4", section.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {item.snippet?.title || 'YouTube Video'}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.snippet?.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{item.snippet?.published_at ? new Date(item.snippet.published_at).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}</span>
                            {item.statistics?.views && <span>• {item.statistics.views} views</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Fallback for unknown types
                return (
                  <div
                    key={String(item._id)}
                    className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", section.bgColor)}>
                        <Icon className={cn("w-4 h-4", section.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {item.title || 'Untitled'}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(item._creationTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
} 