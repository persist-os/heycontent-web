import { ContentType } from '../types/project';
import { FileText, MessageSquare, BarChart3, Sparkles, Zap } from 'lucide-react';

// Types
export interface AttachableItem {
  id: string;
  type: ContentType;
  title: string;
  preview?: string;
  date: number;
  data?: any;
  isAttached?: boolean;
}

export interface ProcessedPlatformData {
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
  crystals: any[],
  shards: any[],
  analysisContent: any[],
  project?: {
    noteIds?: string[];
    conversationIds?: string[];
    crystalIds?: string[];
    shardIds?: string[];
    analysisIds?: string[];
  }
): AttachableItem[] {
  const items: AttachableItem[] = [];
  
  

  // Add notes
  notes.forEach(note => {
    const fullId = String(note._id);
    items.push({
      id: fullId,
      type: 'note',
      title: note.title,
      preview: note.content?.substring(0, 100),
      date: note.updatedAt || note._creationTime || 0,
      data: note,
      isAttached: project?.noteIds?.includes(fullId) || false,
    });
  });

  // Add conversations
  (conversations || []).forEach(conversation => {
    const fullId = String(conversation._id);
    items.push({
      id: fullId,
      type: 'conversation',
      title: conversation.title,
      preview: conversation.messages?.[conversation.messages.length - 1]?.content?.substring(0, 100),
      date: conversation.updatedAt || conversation._creationTime || 0,
      data: conversation,
      isAttached: project?.conversationIds?.includes(fullId) || false,
    });
  });

  // Add crystals
  (crystals || []).forEach(crystal => {
    const fullId = String(crystal._id);
    items.push({
      id: fullId,
      type: 'crystal',
      title: crystal.name || 'Untitled Crystal',
      preview: crystal.description || crystal.core_insight?.substring(0, 100),
      date: crystal.updatedAt || crystal._creationTime || 0,
      data: crystal,
      isAttached: project?.crystalIds?.includes(fullId) || false,
    });
  });

  // Add shards
  (shards || []).forEach(shard => {
    const fullId = String(shard._id);
    items.push({
      id: fullId,
      type: 'shard',
      title: shard.exact_quote || (shard.dimension ? `${shard.dimension} Insight` : 'Insight Shard'),
      preview: shard.what_it_reveals?.substring(0, 100),
      date: shard.updatedAt || shard._creationTime || 0,
      data: shard,
      isAttached: project?.shardIds?.includes(fullId) || false,
    });
  });

  return items;
}

// Group items by type for display
export function groupItemsByType(items: AttachableItem[]) {
  return {
    notes: items.filter(item => item.type === 'note'),
    conversations: items.filter(item => item.type === 'conversation'),
    crystals: items.filter(item => item.type === 'crystal'),
    shards: items.filter(item => item.type === 'shard'),
    analysis: items.filter(item => item.type === 'analysis'),
  };
}

// Get icon component for item type
export function getItemIcon(type: ContentType) {
  switch (type) {
    case 'note': return FileText;
    case 'conversation': return MessageSquare;
    case 'crystal': return Sparkles;
    case 'shard': return Zap;
    case 'analysis': return BarChart3;
    default: return FileText; // Fallback for any remaining social media types
  }
}

// Get color classes for item type
export function getItemColor(type: ContentType) {
  switch (type) {
    case 'note': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    case 'conversation': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    case 'crystal': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
    case 'shard': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    case 'analysis': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'; // Fallback for any remaining social media types
  }
}

// Get section config for display
export function getSectionConfig(type: ContentType) {
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
      analysis: 'Analysis Reports',
    }[type] || 'Unknown Items', // Fallback for deprecated social media types
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
    metrics: data.metrics || {},
    timestamp: data.createdAt || data.completedAt || item.date,
  };
}


// Get analysis type color
export function getAnalysisTypeColor(type: string) {
  switch (type) {
    case 'audience': return 'text-green-500';
    case 'performance': return 'text-purple-500';
    default: return 'text-indigo-500';
  }
}

// Filter items based on search and type
export function filterItems(
  items: AttachableItem[],
  searchTerm: string,
  selectedType: 'all' | ContentType
): AttachableItem[] {
  return items.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.preview?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || item.type === selectedType;

    return matchesSearch && matchesType;
  });
} 