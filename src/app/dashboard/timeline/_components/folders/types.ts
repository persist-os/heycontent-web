export type FolderType = 'blue' | 'purple' | 'orange' | 'yellow';

export interface FolderData {
  color: FolderType;
  count: number;
  items?: any[]; // Real data items from timeline calculations
  personaId?: string; // Persona ID for context
}

export interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderData: FolderData;
}

export interface FolderItem {
  id: string;
  title: string;
  type: string;
  date: Date;
  preview?: string;
  metadata?: Record<string, any>;
}

export interface ChatItem extends FolderItem {
  type: 'chat';
  messageCount: number;
  lastMessage: string;
  participants: string[];
}

export interface SmartNoteItem extends FolderItem {
  type: 'smart-note';
  wordCount: number;
  tags: string[];
  aiInsights?: string[];
}

export interface ContentItem extends FolderItem {
  type: 'content';
  contentType: 'video' | 'article' | 'social-post' | 'blog';
  status: 'draft' | 'published' | 'scheduled';
  platform?: string;
}

export interface AnalyticsItem extends FolderItem {
  type: 'analytics';
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
  platform?: string;
} 