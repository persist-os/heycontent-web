'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectWithItems } from '../../types/project';
import { NoteCard } from '../cards/NoteCard';
import { Play, Heart, Eye, Users, MessageCircle, ExternalLink, ThumbsUp } from 'lucide-react';
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
import { useProjects } from '../../hooks/useProjects';
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
  const { removeItemFromProject } = useProjects(userId);
  const router = useRouter();
  
  // State for overlay modals
  const [selectedYouTubeVideo, setSelectedYouTubeVideo] = useState<string | null>(null);
  const [selectedInstagramPost, setSelectedInstagramPost] = useState<string | null>(null);
  const [selectedGmailContent, setSelectedGmailContent] = useState<GmailContentItem | null>(null);

  // Initialize content manager
  const contentManager = useContentManager(userId);
  
  // Debug content manager
  console.log('Content Manager Debug:', {
    userId,
    contentManager: !!contentManager,
  });

  // Fetch conversations
  const conversations = useQuery(
    api.chatQueries.getHistory,
    userId ? { userId } : "skip"
  );

  // Fetch platform content using content hooks
  const { content: instagramPosts, loading: instagramLoading } = usePlatformContent('instagram');
  const { content: youtubeVideos, loading: youtubeLoading } = usePlatformContent('youtube');
  const { content: gmailContent, loading: gmailLoading } = usePlatformContent('gmail');
  const { content: analysisContent, loading: analysisLoading } = usePlatformContent('insights');
  
  // Debug content loading
  console.log('Content Loading Debug:', {
    userId,
    instagramPosts: instagramPosts?.length || 0,
    instagramLoading,
    youtubeVideos: youtubeVideos?.length || 0,
    youtubeLoading,
    gmailContent: gmailContent?.length || 0,
    gmailLoading,
    analysisContent: analysisContent?.length || 0,
    analysisLoading,
    // Sample data to see what's being loaded
    sampleInstagram: instagramPosts?.[0]?.id,
    sampleYouTube: youtubeVideos?.[0]?.id,
    sampleGmail: gmailContent?.[0]?.id,
    sampleAnalysis: analysisContent?.[0]?.id,
    // Check if there are analysis items available but not attached
    availableAnalysisCount: analysisContent?.length || 0,
    sampleAnalysisData: analysisContent?.[0],
    // Debug analysis content structure
    analysisContentIds: analysisContent?.map(item => item.id) || [],
    analysisContentTypes: analysisContent?.map(item => item.type) || [],
    // Check if analysis items are being found
    hasAnalysisItems: analysisContent && analysisContent.length > 0,
  });

  // Convert project's attached items to unified format using the attachedItems data
  const attachedItems = useMemo(() => {
    const items = project.attachedItems as any;
      console.log('ProjectItemsGrid Debug - Using attachedItems:', {
    projectId: project._id,
    attachedItems: project.attachedItems,
    notes: project.attachedItems?.notes?.length || 0,
    conversations: project.attachedItems?.conversations?.length || 0,
    instagramPosts: project.attachedItems?.instagramPosts?.length || 0,
    youtubeVideos: project.attachedItems?.youtubeVideos?.length || 0,
    gmailItems: project.attachedItems?.gmailItems?.length || 0,
    analysisItems: project.attachedItems?.analysisItems?.length || 0,
    // Sample analysis items
    sampleAnalysis: project.attachedItems?.analysisItems?.[0],
    // Debug project analysis IDs
    projectAnalysisIds: project.analysisIds || [],
    projectAnalysisIdsLength: project.analysisIds?.length || 0,
  });

    // Convert the attachedItems data to the expected format
    const convertedItems = {
      notes: items?.notes || [],
      conversations: items?.conversations || [],
      instagramPosts: items?.instagramPosts || [],
      youtubeVideos: items?.youtubeVideos || [],
      gmail: items?.gmailItems || [],
      analysis: items?.analysisItems || [],
    };

    return convertedItems;
  }, [project]);

  // Navigation handlers for notes and conversations
  const handleNoteClick = (noteId: string) => {
    router.push(`/dashboard/notes?noteId=${noteId}`);
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/dashboard/chat?id=${chatId}`);
  };

  // Delete handler for notes
  const handleNoteDelete = async (noteId: string) => {
    if (!project) return;
    
    const confirmed = window.confirm('Are you sure you want to remove this note from the project?');
    if (confirmed) {
      try {
        // Remove the note from the project
        const success = await removeItemFromProject(project._id, 'note', noteId);
        if (success) {
          console.log('Note removed from project successfully');
        } else {
          console.error('Failed to remove note from project');
        }
      } catch (error) {
        console.error('Error removing note from project:', error);
      }
    }
  };

  // Overlay handlers for Instagram and YouTube
  const handleInstagramClick = (postId: string) => {
    setSelectedInstagramPost(postId);
  };

  const handleYouTubeClick = (videoId: string) => {
    setSelectedYouTubeVideo(videoId);
  };

  // Convert AttachableItem to GmailContentItem format
  const convertToGmailContentItem = (item: any): GmailContentItem => {
    // Extract data directly from the Gmail thread object
    const subject = item.subject || 'No Subject';
    const from = item.from || 'Unknown Sender';
    const snippet = item.snippet || '';
    const messageCount = item.message_count || 1;
    const timestamp = item.createdAt || item.updatedAt || 0;
    
    return {
      id: String(item._id || item.threadId || ''),
      platform: 'gmail',
      content: {
        data: {
          threadId: String(item.threadId || item._id || ''),
          subject: subject,
          from: from,
          snippet: snippet,
          emailId: String(item.threadId || item._id || ''),
          emailType: 'other',
          messages: item.messages || [],
          messageCount: messageCount,
        }
      },
      metrics: {
        replies: messageCount,
      },
      publishedAt: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      analysis: item.analysis || null,
      analysisMarkdown: item.analysisMarkdown || null,
      convexData: item || null,
    };
  };

  // Gmail handlers
  const handleGmailDiscuss = (item: any) => {
    const gmailItem = convertToGmailContentItem(item);
    // The GmailCard will handle the discuss functionality internally
    console.log('Gmail discuss clicked:', gmailItem);
  };

  const handleGmailAnalytics = (item: any) => {
    const gmailItem = convertToGmailContentItem(item);
    setSelectedGmailContent(gmailItem);
    console.log('Gmail analytics clicked:', gmailItem);
  };

  const handleAnalysisClick = (item: any) => {
    console.log('Analysis item clicked:', item);
    // For now, just log the click. You can add navigation or modal opening here later
  };

  // Create a single array of all items with their type information
  const allItems = [
    ...(attachedItems.notes || []).map(item => ({ ...item, itemType: 'note' as const })),
    ...(attachedItems.conversations || []).map(item => ({ ...item, itemType: 'conversation' as const })),
    ...(attachedItems.instagramPosts || []).map(item => ({ ...item, itemType: 'instagramPost' as const })),
    ...(attachedItems.youtubeVideos || []).map(item => ({ ...item, itemType: 'youtubeVideo' as const })),
    ...(attachedItems.gmail || []).map(item => ({ ...item, itemType: 'gmail' as const })),
    ...(attachedItems.analysis || []).map(item => ({ ...item, itemType: 'analysis' as const })),
  ];

  console.log('All Items Debug:', {
    totalItems: allItems.length,
    itemsByType: allItems.reduce((acc, item) => {
      acc[item.itemType] = (acc[item.itemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    sampleItems: allItems.slice(0, 3).map(item => ({ 
      id: item._id || item.id, 
      type: item.itemType, 
      title: item.title || item.subject || item.data?.caption || 'Untitled' 
    })),
    // Check available analysis content
    availableAnalysisContent: analysisContent?.length || 0,
    sampleAvailableAnalysis: analysisContent?.[0],
    // Debug analysis content structure
    analysisContentIds: analysisContent?.map(item => item.id) || [],
    analysisContentTypes: analysisContent?.map(item => item.type) || [],
    // Debug attachedItems structure
    attachedItemsKeys: Object.keys(attachedItems),
    attachedItemsAnalysis: attachedItems.analysis,
    attachedItemsAnalysisLength: attachedItems.analysis?.length || 0,
    // Debug raw project data
    rawProjectData: {
      analysisIds: project.analysisIds,
      attachedItemsKeys: Object.keys(project.attachedItems || {}),
      attachedItemsAnalysisItems: project.attachedItems?.analysisItems,
    },
  });



  if (allItems.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">No items found in this project</div>
        </div>
      </div>
    );
  }

  // Helper function to convert actual data to AttachableItem format for processing
  const createAttachableItem = (item: any, type: string): AttachableItem => {
    if (!item) {
      console.warn('createAttachableItem called with null/undefined item');
      return {
        id: '',
        type: type as any,
        title: '',
        preview: '',
        date: 0,
        data: {},
        isAttached: true,
      };
    }
    
    return {
      id: String(item._id || item.id || ''),
      type: type as any,
      title: item.data?.caption || item.snippet?.title || item.subject || item.title || '',
      preview: item.data?.caption || item.snippet?.description || item.snippet || '',
      date: item.data?.timestamp || item.snippet?.published_at || item.createdAt || item._creationTime || 0,
      data: item,
      isAttached: true,
    };
  };

  // Instagram Card Component
  const InstagramCard = ({ item }: { item: any }) => {
    console.log('InstagramCard received item:', item);
    const id = String(item._id || item.id || '');
    const attachableItem = createAttachableItem(item, 'instagramPost');
    const { likes, comments, mediaUrl, caption, timestamp } = processInstagramData(attachableItem);

    return (
      <div
        key={id}
        className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group h-fit"
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
        <div className="p-3">
          <h3 className="font-medium text-foreground line-clamp-2 mb-1 text-sm">
            {caption.substring(0, 50) || 'Instagram Post'}
            {caption.length > 50 && '...'}
          </h3>
          
          {/* Stats Row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
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
              <span className="text-xs text-muted-foreground">No stats</span>
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
  const YouTubeCard = ({ item }: { item: any }) => {
    console.log('YouTubeCard received item:', item);
    const id = String(item._id || item.id || '');
    const attachableItem = createAttachableItem(item, 'youtubeVideo');
    const { views, likes, comments, thumbnailUrl, title, duration, publishedAt } = processYouTubeData(attachableItem);

    return (
      <div
        key={id}
        className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group h-fit"
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
            {duration && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {duration}
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
        <div className="p-3">
          <h3 className="font-medium text-foreground line-clamp-2 mb-1 text-sm">
            {title || 'YouTube Video'}
          </h3>
          
          {/* Stats Row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
            {views > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(views)}</span>
              </div>
            )}
            {likes > 0 && (
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                <span>{formatNumber(likes)}</span>
              </div>
            )}
            {comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>{formatNumber(comments)}</span>
              </div>
            )}
            {views === 0 && likes === 0 && comments === 0 && (
              <span className="text-xs text-muted-foreground">No stats</span>
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
      <div className="p-4">
        {/* Single unified grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 grid-flow-dense auto-rows-min">
          {allItems.map((item: any) => {
            const config = getSectionConfig(item.itemType);
            const Icon = config.icon;
            
            if (item.itemType === 'note') {
              return (
                <div key={item._id} className="h-fit flex flex-col">
                  <div className="flex-1">
                    <NoteCard
                      note={item}
                      availableNotes={[]}
                      onEdit={() => handleNoteClick(String(item._id))}
                      onDelete={() => handleNoteDelete(String(item._id))}
                      onToggleImportant={() => {}}
                      onUpdate={() => {}}
                    />
                  </div>
                </div>
              );
            }

            if (item.itemType === 'conversation') {
              return (
                <div
                  key={item._id}
                  className="bg-background border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer h-fit"
                  onClick={() => handleChatClick(String(item._id))}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-2">
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0", config.bgColor)}>
                        <Icon className={cn("w-3 h-3", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate text-sm">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.messages?.[item.messages.length - 1]?.content?.substring(0, 80) || 'No messages'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.updatedAt || item._creationTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (item.itemType === 'instagramPost') {
              return <InstagramCard key={item._id} item={item} />;
            }

            if (item.itemType === 'youtubeVideo') {
              return <YouTubeCard key={item._id} item={item} />;
            }

            if (item.itemType === 'gmail') {
              const gmailItem = convertToGmailContentItem(item);
              return (
                <GmailCard
                  key={item._id}
                  item={gmailItem}
                  onDiscussContent={() => handleGmailDiscuss(item)}
                  onViewDetailedAnalytics={() => handleGmailAnalytics(item)}
                />
              );
            }

            if (item.itemType === 'analysis') {
              console.log('Rendering analysis item:', item);
              const attachableItem = createAttachableItem(item, 'analysis');
              console.log('Created attachable item:', attachableItem);
              const analysisData = processAnalysisData(attachableItem);
              console.log('Processed analysis data:', analysisData);
              
              const { title, summary, type, timestamp, status } = analysisData;
              console.log('Analysis item details:', { title, summary, type, timestamp, status });
              
              return (
                <div
                  key={item._id}
                  className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group h-fit"
                  onClick={() => handleAnalysisClick(item)}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", getSectionConfig('analysis').bgColor)}>
                          {React.createElement(getSectionConfig('analysis').icon, { className: "w-3 h-3" })}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Analysis Report
                        </span>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="flex items-center gap-1">
                        <div className={cn("w-2 h-2 rounded-full", 
                          status === 'completed' ? 'bg-green-500' : 
                          status === 'processing' ? 'bg-primary' : 'bg-gray-500'
                        )} />
                        <span className="capitalize text-xs">{status}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-foreground line-clamp-2 mb-1 text-sm">
                      {title}
                    </h3>
                    
                    {/* Type */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      {React.createElement(getSectionConfig('analysis').icon, { className: "w-3 h-3" })}
                      <span className={cn("capitalize font-medium", getAnalysisTypeColor(type))}>
                        {type} Analysis
                      </span>
                    </div>
                    
                    {/* Summary */}
                    {summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
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
                key={item._id}
                className="bg-background border border-border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0", config.bgColor)}>
                    <Icon className={cn("w-3 h-3", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate text-sm">
                      {item.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.date || item.createdAt || item._creationTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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