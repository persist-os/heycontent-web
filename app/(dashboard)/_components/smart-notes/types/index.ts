import { Id } from "@/convex/_generated/dataModel";

export type NoteType = 'ai_insight' | 'conversation' | 'idea' | 'url' | 'date';
export type ReferenceType = 
  | 'ai_insight' 
  | 'conversation' 
  | 'idea' 
  | 'url' 
  | 'date'
  | 'screen'
  | 'component'
  | 'section'
  | 'feature'
  | 'workflow';

export interface Note {
  _id: Id<"notes">;
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