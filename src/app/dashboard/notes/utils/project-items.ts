import { ItemType } from '../types/project';
import { FileText, MessageSquare, Instagram, Youtube, Mail, BarChart3 } from 'lucide-react';
import { normalizePrefixedId } from '@/lib/content-utils';

// Types
export interface AttachableItem {
  id: string;
  type: ItemType;
  title: string;
  preview?: string;
  date: number;
  data?: any;
  isAttached?: boolean;
}

export interface ProcessedPlatformData {
  instagram: {
    likes: number;
    comments: number;
    mediaUrl?: string;
    caption: string;
    timestamp?: number;
  };
  youtube: {
    views: number;
    likes: number;
    comments: number;
    thumbnailUrl?: string;
    title: string;
    duration?: string;
    publishedAt?: number;
  };
  gmail: {
    subject: string;
    from: string;
    snippet: string;
    messageCount: number;
    category: string;
    timestamp?: number;
  };
  analysis: {
    title: string;
    type: string;
    status: string;
    summary?: string;
    metrics?: Record<string, any>;
    timestamp?: number;
  };
}

// Helper function to extract raw database ID from unified content ID
export function extractRawId(unifiedId: string): string {
  if (unifiedId.includes(':')) {
    const parts = unifiedId.split(':');
    return parts[parts.length - 1];
  }
  return unifiedId;
}

// Convert content arrays to unified AttachableItem format
export function convertToAttachableItems(
  notes: any[],
  conversations: any[],
  instagramPosts: any[],
  youtubeVideos: any[],
  gmailContent: any[],
  analysisContent: any[],
  project?: {
    noteIds?: string[];
    conversationIds?: string[];
    instagramPostIds?: string[];
    youtubeVideoIds?: string[];
    gmailIds?: string[];
    analysisIds?: string[];
  }
): AttachableItem[] {
  const items: AttachableItem[] = [];
  
  

  // Add notes
  notes.forEach(note => {
    const rawId = extractRawId(String(note._id));
    items.push({
      id: String(note._id),
      type: 'note',
      title: note.title,
      preview: note.content?.substring(0, 100),
      date: note.updatedAt || note._creationTime || 0,
      data: note,
      isAttached: project?.noteIds?.includes(rawId) || false,
    });
  });

  // Add conversations
  (conversations || []).forEach(conversation => {
    const rawId = extractRawId(String(conversation._id));
    items.push({
      id: String(conversation._id),
      type: 'conversation',
      title: conversation.title,
      preview: conversation.messages?.[conversation.messages.length - 1]?.content?.substring(0, 100),
      date: conversation.updatedAt || conversation._creationTime || 0,
      data: conversation,
      isAttached: project?.conversationIds?.includes(rawId) || false,
    });
  });

  // Add Instagram posts
  (instagramPosts || []).forEach(post => {
    const rawId = extractRawId(String(post.id));
    items.push({
      id: String(post.id),
      type: 'instagramPost',
      title: post.title || 'Instagram Post',
      preview: post.content?.substring(0, 100),
      date: post.createdAt || 0,
      data: post,
      isAttached: project?.instagramPostIds?.includes(rawId) || false,
    });
  });

  // Add YouTube videos
  (youtubeVideos || []).forEach(video => {
    const rawId = extractRawId(String(video.id));
    items.push({
      id: String(video.id),
      type: 'youtubeVideo',
      title: video.title || 'YouTube Video',
      preview: video.content?.substring(0, 100),
      date: video.createdAt || 0,
      data: video,
      isAttached: project?.youtubeVideoIds?.includes(rawId) || false,
    });
  });

  // Add Gmail threads
  (gmailContent || []).forEach(thread => {
    const rawId = extractRawId(String(thread.id));
    items.push({
      id: String(thread.id),
      type: 'gmail',
      title: thread.title || 'Gmail Thread',
      preview: thread.content?.substring(0, 100),
      date: thread.createdAt || 0,
      data: thread,
      isAttached: project?.gmailIds?.includes(rawId) || false,
    });
  });

  // Add analysis content
  (analysisContent || []).forEach(analysis => {
    // For analysis items, we use the full insight ID (e.g., "insight:abc123:0")
    // not the extracted raw ID, since these are synthetic IDs
    const rawId = String(analysis.id);
    const normalizedId = normalizePrefixedId(rawId);
    
    items.push({
      id: normalizedId,
      type: 'analysis',
      title: analysis.title || 'Analysis Report',
      preview: analysis.summary?.substring(0, 100) || analysis.content?.substring(0, 100),
      date: analysis.createdAt || 0,
      data: analysis,
      // Check both normalized and original ID for attachment status (to handle legacy stored IDs)
      isAttached: project?.analysisIds?.includes(normalizedId) || project?.analysisIds?.includes(rawId) || false,
    });
  });
  
  console.log('=== CONTENT DEBUG ===');
console.log('instagramPosts:', instagramPosts?.slice(0, 2)); // First 2 items
console.log('youtubeVideos:', youtubeVideos?.slice(0, 2));
console.log('gmailContent:', gmailContent?.slice(0, 2));
console.log('analysisContent:', analysisContent?.slice(0, 2));

  return items;
}

// Group items by type for display
export function groupItemsByType(items: AttachableItem[]) {
  return {
    notes: items.filter(item => item.type === 'note'),
    conversations: items.filter(item => item.type === 'conversation'),
    instagramPosts: items.filter(item => item.type === 'instagramPost'),
    youtubeVideos: items.filter(item => item.type === 'youtubeVideo'),
    gmailThreads: items.filter(item => item.type === 'gmail'),
    analysis: items.filter(item => item.type === 'analysis'),
  };
}

// Get icon component for item type
export function getItemIcon(type: ItemType) {
  switch (type) {
    case 'note': return FileText;
    case 'conversation': return MessageSquare;
    case 'instagramPost': return Instagram;
    case 'youtubeVideo': return Youtube;
    case 'gmail': return Mail;
    case 'analysis': return BarChart3;
  }
}

// Get color classes for item type
export function getItemColor(type: ItemType) {
  switch (type) {
    case 'note': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    case 'conversation': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    case 'instagramPost': return 'text-pink-600 bg-pink-100 dark:bg-pink-900/20';
    case 'youtubeVideo': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    case 'gmail': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    case 'analysis': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20';
  }
}

// Get section config for display
export function getSectionConfig(type: ItemType) {
  const Icon = getItemIcon(type);
  const colorClass = getItemColor(type);
  const [textColor, bgColor] = colorClass.split(' bg-');
  
  return {
    icon: Icon,
    color: textColor,
    bgColor: 'bg-' + bgColor,
    title: {
      note: 'Notes',
      conversation: 'Conversations',
      instagramPost: 'Instagram Posts',
      youtubeVideo: 'YouTube Videos',
      gmail: 'Gmail Threads',
      analysis: 'Analysis Reports',
    }[type],
  };
}

// Process Instagram post data
export function processInstagramData(item: AttachableItem): ProcessedPlatformData['instagram'] {
  const data = item.data?.data || item.data || {};
  const insights = data.insights || {};
  
  return {
    likes: insights.likes || data.like_count || data.likes || 0,
    comments: insights.comments || data.comments_count || data.comments || 0,
    mediaUrl: data.media_url || data.thumbnail_url || data.mediaUrl || data.thumbnailUrl,
    caption: data.caption || item.title || '',
    timestamp: data.timestamp || data.createdAt || item.date,
  };
}

// Process YouTube video data
export function processYouTubeData(item: AttachableItem): ProcessedPlatformData['youtube'] {
  const data = item.data || {};
  const snippet = data.snippet || {};
  const statistics = data.statistics || {};
  const contentDetails = data.content_details || {};
  
  return {
    views: statistics.views || 0,
    likes: statistics.likes || 0,
    comments: statistics.comments || 0,
    thumbnailUrl: snippet.thumbnails?.high || snippet.thumbnails?.medium || snippet.thumbnails?.default || data.thumbnailUrl,
    title: snippet.title || item.title || 'YouTube Video',
    duration: contentDetails.duration,
    publishedAt: snippet.published_at || snippet.publishedAt || data.createdAt || item.date,
  };
}

// Process Gmail thread data
export function processGmailData(item: AttachableItem): ProcessedPlatformData['gmail'] {
  const data = item.data || {};
  
  return {
    subject: data.subject || item.title || 'No Subject',
    from: data.from || 'Unknown Sender',
    snippet: data.snippet || item.preview || '',
    messageCount: data.message_count || data.messageCount || 1,
    category: data.category || 'none',
    timestamp: data.createdAt || item.date,
  };
}

// Process analysis data
export function processAnalysisData(item: AttachableItem): ProcessedPlatformData['analysis'] {
  const data = item.data || {};
  
  return {
    title: data.title || item.title || 'Analysis Report',
    type: data.type || data.analysisType || 'general',
    status: data.status || 'completed',
    summary: data.summary || data.description || item.preview,
    metrics: data.metrics || data.insights || {},
    timestamp: data.createdAt || data.completedAt || item.date,
  };
}

// Get category color for Gmail
export function getGmailCategoryColor(category: string) {
  switch (category) {
    case 'partnership': return 'text-purple-500';
    case 'media': return 'text-blue-500';
    case 'business': return 'text-green-500';
    case 'community': return 'text-orange-500';
    default: return 'text-gray-500';
  }
}

// Get analysis type color
export function getAnalysisTypeColor(type: string) {
  switch (type) {
    case 'instagram': return 'text-pink-500';
    case 'youtube': return 'text-red-500';
    case 'gmail': return 'text-blue-500';
    case 'audience': return 'text-green-500';
    case 'performance': return 'text-purple-500';
    default: return 'text-indigo-500';
  }
}

// Filter items based on search and type
export function filterItems(
  items: AttachableItem[],
  searchTerm: string,
  selectedType: 'all' | ItemType
): AttachableItem[] {
  return items.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.preview?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || item.type === selectedType;

    return matchesSearch && matchesType;
  });
} 