import { Id } from "@/convex/_generated/dataModel";

export type NoteType = 'ai_insight' | 'conversation' | 'idea' | 'url' | 'date' | 'brainstorm' | 'click';


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
  platform?: string;
  postType?: string;
  goal?: string;
  fields?: any;
  analysis?: any;
  titleGenerated?: boolean;
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