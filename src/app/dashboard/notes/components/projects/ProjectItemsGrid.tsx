'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectWithItems } from '../../types/project';
import { NoteCard } from '../cards/NoteCard';
import { Play, Heart, Eye, Users, MessageCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { YouTubeOverlay } from '@/components/content/overlays/YouTubeOverlay';
import { InstagramOverlay } from '@/components/content/overlays/InstagramOverlay';
import { GmailCard } from '@/app/dashboard/content-analytics/cards/GmailCard';
import { GmailModal } from '@/app/dashboard/content-analytics/modals/GmailModal';
import { GmailContentItem } from '@/app/dashboard/content-analytics/types';
import { formatNumber, formatDate, formatDuration } from '@/lib/content-utils';
import { useNotes } from '@/app/context/notes-context';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useContentManager, usePlatformContent } from '@/app/hooks/use-content';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import {
  AttachableItem,
  extractRawId,
  convertToAttachableItems,
  groupItemsByType,
  getSectionConfig,
  processInstagramData,
  processYouTubeData,
  processGmailData,
  processAnalysisData,
  getGmailCategoryColor,
  getAnalysisTypeColor,
} from '../../utils/project-items';

interface ProjectItemsGridProps {
  project: ProjectWithItems;
}

export function ProjectItemsGrid({ project }: ProjectItemsGridProps) {
  const userId = getCurrentUserId();
  const { notes } = useNotes();
  const router = useRouter();
  
  // State for overlay modals
  const [selectedYouTubeVideo, setSelectedYouTubeVideo] = useState<string | null>(null);
  const [selectedInstagramPost, setSelectedInstagramPost] = useState<string | null>(null);
  const [selectedGmailContent, setSelectedGmailContent] = useState<GmailContentItem | null>(null);

  // Initialize content manager
  useContentManager(userId);

  // Fetch conversations
  const conversations = useQuery(
    api.chatQueries.getHistory,
    userId ? { userId } : "skip"
  );

  // Fetch platform content using content hooks
  const { content: instagramPosts } = usePlatformContent('instagram');
  const { content: youtubeVideos } = usePlatformContent('youtube');
  const { content: gmailContent } = usePlatformContent('gmail');
  const { content: analysisContent } = usePlatformContent('insights');

  // Convert project's attached items to unified format
  const attachedItems = useMemo(() => {
    const allItems = convertToAttachableItems(
      notes,
      conversations || [],
      instagramPosts || [],
      youtubeVideos || [],
      gmailContent || [],
      analysisContent || [],
      project
    );

    // Filter only attached items and group by type
    const attached = allItems.filter(item => item.isAttached);
    return groupItemsByType(attached);
  }, [notes, conversations, instagramPosts, youtubeVideos, gmailContent, analysisContent, project]);

  // Navigation handlers for notes and conversations
  const handleNoteClick = (noteId: string) => {
    router.push(`/dashboard/notes?noteId=${noteId}`);
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/dashboard/chat?id=${chatId}`);
  };

  // Overlay handlers for Instagram and YouTube
  const handleInstagramClick = (postId: string) => {
    setSelectedInstagramPost(postId);
  };

  const handleYouTubeClick = (videoId: string) => {
    setSelectedYouTubeVideo(videoId);
  };

  // Convert AttachableItem to GmailContentItem format
  const convertToGmailContentItem = (item: AttachableItem): GmailContentItem => {
    const { subject, from, snippet, messageCount, timestamp } = processGmailData(item);
    
    return {
      id: extractRawId(item.id),
      platform: 'gmail',
      content: {
        data: {
          threadId: extractRawId(item.id),
          subject: subject,
          from: from,
          snippet: snippet,
          emailId: extractRawId(item.id),
          emailType: 'other',
          messages: item.data?.messages || [],
          messageCount: messageCount,
        }
      },
      metrics: {
        replies: messageCount,
      },
      publishedAt: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      analysis: item.data?.analysis || null,
      analysisMarkdown: item.data?.analysisMarkdown || null,
      convexData: item.data || null,
    };
  };

  // Gmail handlers
  const handleGmailDiscuss = (item: AttachableItem) => {
    const gmailItem = convertToGmailContentItem(item);
    // The GmailCard will handle the discuss functionality internally
  };

  const handleGmailAnalytics = (item: AttachableItem) => {
    const gmailItem = convertToGmailContentItem(item);
    setSelectedGmailContent(gmailItem);
  };

  const sections = [
    {
      type: 'note' as const,
      items: attachedItems.notes || [],
    },
    {
      type: 'conversation' as const,
      items: attachedItems.conversations || [],
    },
    {
      type: 'instagramPost' as const,
      items: attachedItems.instagramPosts || [],
    },
    {
      type: 'youtubeVideo' as const,
      items: attachedItems.youtubeVideos || [],
    },
    {
      type: 'gmail' as const,
      items: attachedItems.gmailThreads || [],
    },
    {
      type: 'analysis' as const,
      items: attachedItems.analysis || [],
    },
  ].filter(section => section.items.length > 0);

  if (sections.length === 0) {
    return null;
  }

  // Instagram Card Component
  const InstagramCard = ({ item }: { item: AttachableItem }) => {
    const id = extractRawId(item.id);
    const { likes, comments, mediaUrl, caption, timestamp } = processInstagramData(item);

    return (
      <div
        key={id}
        className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
        onClick={() => handleInstagramClick(id)}
      >
        {/* Media Preview */}
        {mediaUrl ? (
          <div className="relative aspect-square bg-muted">
            <img
              src={mediaUrl}
              alt={caption.substring(0, 50) || 'Instagram Post'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-2">
                <ExternalLink className="w-4 h-4 text-gray-900" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative aspect-square bg-muted flex items-center justify-center">
            {React.createElement(getSectionConfig('instagramPost').icon, { className: "w-12 h-12 text-pink-400" })}
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              No Image
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-foreground line-clamp-2 mb-2">
            {caption.substring(0, 60) || 'Instagram Post'}
            {caption.length > 60 && '...'}
          </h3>
          
          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            {likes > 0 && (
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-500" />
                <span>{formatNumber(likes)}</span>
              </div>
            )}
            {comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-blue-500" />
                <span>{formatNumber(comments)}</span>
              </div>
            )}
            {likes === 0 && comments === 0 && (
              <span className="text-xs text-muted-foreground">No stats available</span>
            )}
          </div>
          
          {/* Date */}
          {timestamp && (
            <p className="text-xs text-muted-foreground">
              {formatDate(new Date(timestamp).getTime())}
            </p>
          )}
        </div>
      </div>
    );
  };

  // YouTube Card Component
  const YouTubeCard = ({ item }: { item: AttachableItem }) => {
    const id = extractRawId(item.id);
    const { views, likes, comments, thumbnailUrl, title, duration, publishedAt } = processYouTubeData(item);

    return (
      <div
        key={id}
        className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
        onClick={() => handleYouTubeClick(id)}
      >
        {/* Thumbnail Preview */}
        {thumbnailUrl ? (
          <div className="relative aspect-video bg-muted">
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-red-600 rounded-full p-3">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
            {/* Duration Badge */}
            {duration && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {formatDuration(duration)}
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-video bg-muted flex items-center justify-center">
            {React.createElement(getSectionConfig('youtubeVideo').icon, { className: "w-12 h-12 text-red-400" })}
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              No Thumbnail
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-foreground line-clamp-2 mb-2">
            {title}
          </h3>
          
          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            {views > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-blue-500" />
                <span>{formatNumber(views)}</span>
              </div>
            )}
            {likes > 0 && (
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-500" />
                <span>{formatNumber(likes)}</span>
              </div>
            )}
            {comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-green-500" />
                <span>{formatNumber(comments)}</span>
              </div>
            )}
            {views === 0 && likes === 0 && comments === 0 && (
              <span className="text-xs text-muted-foreground">No stats available</span>
            )}
          </div>
          
          {/* Date */}
          {publishedAt && (
            <p className="text-xs text-muted-foreground">
              {formatDate(new Date(publishedAt).getTime())}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-6 space-y-8">
        {sections.map((section) => {
          const config = getSectionConfig(section.type);
          const Icon = config.icon;
          
          return (
            <div key={section.type}>
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bgColor)}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {config.title}
                </h2>
                <span className="text-sm text-muted-foreground">
                  ({section.items.length})
                </span>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.items.map((item: AttachableItem) => {
                  if (section.type === 'note') {
                    return (
                      <div key={item.id} className="h-fit">
                        <NoteCard
                          note={item.data}
                          availableNotes={[]}
                          onEdit={() => handleNoteClick(extractRawId(item.id))}
                          onDelete={() => {}}
                          onToggleImportant={() => {}}
                          onUpdate={() => {}}
                        />
                      </div>
                    );
                  }

                  if (section.type === 'conversation') {
                    return (
                      <div
                        key={item.id}
                        className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleChatClick(extractRawId(item.id))}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bgColor)}>
                            <Icon className={cn("w-4 h-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {item.preview || 'No messages'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(item.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (section.type === 'instagramPost') {
                    return <InstagramCard key={item.id} item={item} />;
                  }

                  if (section.type === 'youtubeVideo') {
                    return <YouTubeCard key={item.id} item={item} />;
                  }

                  if (section.type === 'gmail') {
                    const gmailItem = convertToGmailContentItem(item);
                    return (
                      <GmailCard
                        key={item.id}
                        item={gmailItem}
                        onDiscussContent={() => handleGmailDiscuss(item)}
                        onViewDetailedAnalytics={() => handleGmailAnalytics(item)}
                      />
                    );
                  }

                  if (section.type === 'analysis') {
                    const id = extractRawId(item.id);
                    const { title, type, status, summary, timestamp } = processAnalysisData(item);

                    return (
                      <div
                        key={item.id}
                        className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                      >
                        {/* Header with Analysis icon */}
                        <div className="relative bg-muted/30 p-3 border-b border-border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {React.createElement(getSectionConfig('analysis').icon, { className: "w-5 h-5 text-indigo-500" })}
                              <span className="text-xs text-muted-foreground capitalize">
                                {type !== 'general' ? type : 'Analysis'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                status === 'completed' ? 'bg-green-500' : 
                                status === 'processing' ? 'bg-yellow-500' : 'bg-gray-500'
                              )} />
                              <span className="capitalize">{status}</span>
                            </div>
                          </div>
                          
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/90 rounded-full p-2">
                              <ExternalLink className="w-4 h-4 text-gray-900" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-4">
                          <h3 className="font-medium text-foreground line-clamp-2 mb-2">
                            {title}
                          </h3>
                          
                          {/* Type */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            {React.createElement(getSectionConfig('analysis').icon, { className: "w-3 h-3" })}
                            <span className={cn("capitalize font-medium", getAnalysisTypeColor(type))}>
                              {type} Analysis
                            </span>
                          </div>
                          
                          {/* Summary */}
                          {summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {summary}
                            </p>
                          )}
                          
                          {/* Date */}
                          {timestamp && (
                            <p className="text-xs text-muted-foreground">
                              {formatDate(new Date(timestamp).getTime())}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Fallback for unknown types
                  return (
                    <div
                      key={item.id}
                      className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bgColor)}>
                          <Icon className={cn("w-4 h-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {item.title || 'Untitled'}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(item.date).toLocaleDateString()}
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

      {/* Overlay Modals */}
      {selectedYouTubeVideo && (
        <YouTubeOverlay
          videoId={selectedYouTubeVideo}
          onClose={() => setSelectedYouTubeVideo(null)}
          showAnalysis={true}
        />
      )}

      {selectedInstagramPost && (
        <InstagramOverlay
          postId={selectedInstagramPost}
          onClose={() => setSelectedInstagramPost(null)}
          showAnalysis={true}
        />
      )}

      {selectedGmailContent && (
        <GmailModal
          selectedContent={selectedGmailContent}
          onClose={() => setSelectedGmailContent(null)}
        />
      )}
    </>
  );
} 