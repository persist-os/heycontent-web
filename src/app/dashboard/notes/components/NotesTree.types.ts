import React from 'react';
import { Note } from '../types';
import { Project } from '../types/project';
import { Folder as FolderType } from '../hooks/useFolders';

export interface NotesTreeProps {
  notes: Note[];
  projects?: Project[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleImportant: (noteId: string) => void;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  isLoading: boolean;
}

export interface TreeNode {
  id: string;
  type: 'folder' | 'note' | 'project' | 'user-folder';
  title: string;
  children: TreeNode[];
  note?: Note;
  project?: Project;
  folder?: FolderType;
  count?: number;
  isExpanded?: boolean;
  level: number;
  droppableType?: 'starred' | 'project' | 'tag' | 'all-notes' | 'user-folder';
  tagName?: string;
  projectId?: string;
  folderId?: string;
}

export type FilterType = 'all' | 'important' | 'recent' | 'projects' | 'shared' | 'my-shared' | 'folders';

export interface DroppableComponentProps {
  node: TreeNode;
  children: React.ReactNode;
  dragOverFolder?: string | null;
  draggedNote?: Note | null;
}

export interface DraggableComponentProps {
  node: TreeNode;
  router: any;
  searchTerm: string;
  isSelectionMode?: boolean;
  selectedNotes?: Set<string>;
  onToggleNoteSelection?: (noteId: string) => void;
}
