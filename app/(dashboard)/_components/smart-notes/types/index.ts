export type NoteType = 'default' | 'idea';
export type ReferenceType = 'ai_insight' | 'conversation' | 'idea' | 'url' | 'date';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
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
}

export interface Shortcut {
  key: string;
  description: string;
  action: () => void;
} 