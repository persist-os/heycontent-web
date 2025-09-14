import { ItemType } from '../types/project';
import { FileText, MessageSquare, BarChart3 } from 'lucide-react';

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
  analysisContent: any[],
  project?: {
    noteIds?: string[];
    conversationIds?: string[];
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

  // Social media platforms removed - no longer processing Instagram, YouTube, or Gmail content

  
  
  // Debug project data
  if (project) {
    console.log('=== PROJECT DEBUG ===');
    console.log('Project ID:', project._id);
    console.log('Project noteIds:', project.noteIds);
  }

  return items;
}

// Group items by type for display
export function groupItemsByType(items: AttachableItem[]) {
  return {
    notes: items.filter(item => item.type === 'note'),
    conversations: items.filter(item => item.type === 'conversation'),
    analysis: items.filter(item => item.type === 'analysis'),
  };
}

// Get icon component for item type
export function getItemIcon(type: ItemType) {
  switch (type) {
    case 'note': return FileText;
    case 'conversation': return MessageSquare;
    case 'analysis': return BarChart3;
    default: return FileText; // Fallback for any remaining social media types
  }
}

// Get color classes for item type
export function getItemColor(type: ItemType) {
  switch (type) {
    case 'note': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    case 'conversation': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    case 'analysis': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'; // Fallback for any remaining social media types
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
      analysis: 'Analysis Reports',
    }[type] || 'Unknown Items', // Fallback for deprecated social media types
  };
}

// Social media processing functions removed - no longer supporting Instagram, YouTube, Gmail

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