import { Id } from "@/convex/_generated/dataModel";

export type NoteType = 'idea_bank' | 'content_script' | 'collaboration_note' | 'analytics_insight' | 'reflection_journal' | 'task_checklist' | 'email_draft' | 'project';

export interface ImageData {
  url: string;
  filename: string;
  originalFilename?: string;
  uploadedAt: number;
  size?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface Note {
  _id: string | Id<"notes">; // Accept both Convex and backend IDs
  _creationTime: number;
  userId: string;
  title: string;
  content?: string;
  createdAt: number;
  updatedAt: number;
  important?: boolean;
  type?: NoteType;
  tags: string[];
  platform?: string;
  postType?: string;
  goal?: string;
  fields?: any;
  analysis?: any;
  titleGenerated?: boolean;
  typeGenerated?: boolean;
  isLocal?: boolean;
  isTemporary?: boolean; // Flag for optimistic updates during note creation
  images?: ImageData[];
  sourceConversationId?: string;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  important?: boolean;
  type?: NoteType;
  tags?: string[];
  platform?: string;
  postType?: string;
  goal?: string;
  fields?: any;
  analysis?: any;
  titleGenerated?: boolean;
  typeGenerated?: boolean;
  images?: ImageData[];
}

export interface Command {
  label: string;
  type: 'metadata' | 'format' | 'block';
  metadata?: {
    type: 'important' | 'idea_bank';
    value: boolean;
  };
  template?: string;
  shortcut?: string;
}

export interface Shortcut {
  key: string;
  description: string;
  action: () => void;
} 