import { Id } from "@/convex/_generated/dataModel";

export type NoteType = 'ai_insight' | 'conversation' | 'idea' | 'url' | 'date' | 'brainstorm' | 'click';
export type ReferenceType = 'ai_insight' | 'conversation' | 'idea' | 'url' | 'date' | 'brainstorm' | 'click';

export interface Note {
  _id: string | Id<"notes">; // Accept both Convex and backend IDs
  _creationTime: number;
  userId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  important: boolean;
  type?: NoteType;
  tags: string[];
  references: Reference[];
  platform?: string;
  postType?: string;
  goal?: string;
  fields?: any;
  noteContent?: string;
  analysis?: any;
  templateInput?: any;
  analysisId?: string;
}

export interface Reference {
  type: ReferenceType;
  content: string;
  isLoading?: boolean;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  important?: boolean;
  type?: NoteType;
  tags?: string[];
  references?: Reference[];
  platform?: string;
  postType?: string;
  goal?: string;
  fields?: any;
  noteContent?: string;
  analysis?: any;
}

export interface Command {
  label: string;
  type: 'metadata' | 'format' | 'block';
  metadata?: {
    type: 'important' | 'idea';
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