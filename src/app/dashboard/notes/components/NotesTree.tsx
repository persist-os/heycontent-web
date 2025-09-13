'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Plus, ChevronRight, ChevronDown, FileText, Folder, Calendar, Tag, Star, Clock, Filter, FolderPlus } from 'lucide-react';
import { Note } from '../types';
import { Project } from '../types/project';
import { cn } from '@/lib/utils';
import { NoteCard } from './cards/NoteCard';
import { formatDistanceToNow } from 'date-fns';
import { useCreateNote } from '../hooks/useCreateNote';
import { useNotes } from '@/app/context/notes-context';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '@/app/context/auth-context';
import { CreateProjectModal } from './projects/CreateProjectModal';
import { useRouter } from 'next/navigation';

interface NotesTreeProps {
  notes: Note[];
  projects?: Project[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleImportant: (noteId: string) => void;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  isLoading: boolean;
}

interface TreeNode {
  id: string;
  type: 'folder' | 'note' | 'project';
  title: string;
  children: TreeNode[];
  note?: Note;
  project?: Project;
  count?: number;
  isExpanded?: boolean;
  level: number;
}

export function NotesTree({
  notes,
  projects: propProjects,
  onEditNote,
  onDeleteNote,
  onToggleImportant,
  onUpdateNote,
  isLoading
}: NotesTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'important' | 'recent' | 'projects'>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['recent', 'projects', 'tags', 'important']));
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  
  // Use the creation hooks
  const { createNote } = useCreateNote();
  const { setActiveNoteId } = useNotes();
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const { 
    projects: hookProjects, 
    createProject, 
    isCreating: isCreatingProject 
  } = useProjects(firebaseUser?.uid);
  
  // Use projects from props if provided, otherwise from hook
  const projects = propProjects || hookProjects;

  // Create hierarchical tree structure
  const treeStructure = useMemo(() => {
    const filteredNotes = notes.filter(note => {
      const matchesSearch = !searchTerm || 
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = selectedFilter === 'all' || 
        (selectedFilter === 'important' && note.important) ||
        (selectedFilter === 'recent' && Date.now() - note.updatedAt < 7 * 24 * 60 * 60 * 1000) ||
        (selectedFilter === 'projects' && note.type === 'project');
      
      return matchesSearch && matchesFilter;
    });

    const tree: TreeNode[] = [];
    
    // Recent notes (last 7 days)
    const recentNotes = filteredNotes
      .filter(note => Date.now() - note.updatedAt < 7 * 24 * 60 * 60 * 1000)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 10);
    
    if (recentNotes.length > 0) {
      tree.push({
        id: 'recent',
        type: 'folder',
        title: 'Recent',
        count: recentNotes.length,
        level: 0,
        children: recentNotes.map(note => ({
          id: note._id,
          type: 'note' as const,
          title: note.title || 'Untitled',
          note,
          level: 1,
          children: []
        }))
      });
    }

    // Important notes
    const importantNotes = filteredNotes
      .filter(note => note.important)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    
    if (importantNotes.length > 0) {
      tree.push({
        id: 'important',
        type: 'folder',
        title: 'Starred',
        count: importantNotes.length,
        level: 0,
        children: importantNotes.map(note => ({
          id: note._id,
          type: 'note' as const,
          title: note.title || 'Untitled',
          note,
          level: 1,
          children: []
        }))
      });
    }

    // Projects - always show this folder even if empty
    const filteredProjects = projects?.filter(project => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return project.name?.toLowerCase().includes(searchLower) ||
             project.description?.toLowerCase().includes(searchLower);
    }).sort((a, b) => b.updatedAt - a.updatedAt) || [];
    
    tree.push({
      id: 'projects',
      type: 'folder',
      title: 'Projects',
      count: filteredProjects.length,
      level: 0,
      children: filteredProjects.map(project => ({
        id: project._id,
        type: 'project' as const,
        title: project.name || 'Untitled Project',
        project,
        level: 1,
        children: []
      }))
    });

    // Group by tags
    const tagGroups = new Map<string, Note[]>();
    filteredNotes.forEach(note => {
      if (note.tags && note.tags.length > 0) {
        note.tags.forEach(tag => {
          if (!tagGroups.has(tag)) {
            tagGroups.set(tag, []);
          }
          tagGroups.get(tag)!.push(note);
        });
      }
    });

    if (tagGroups.size > 0) {
      const tagChildren: TreeNode[] = [];
      Array.from(tagGroups.entries())
        .sort(([, a], [, b]) => b.length - a.length)
        .slice(0, 8) // Show top 8 tags
        .forEach(([tag, tagNotes]) => {
          tagChildren.push({
            id: `tag-${tag}`,
            type: 'folder',
            title: tag,
            count: tagNotes.length,
            level: 1,
            children: tagNotes
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map(note => ({
                id: `${tag}-${note._id}`,
                type: 'note' as const,
                title: note.title || 'Untitled',
                note,
                level: 2,
                children: []
              }))
          });
        });

      tree.push({
        id: 'tags',
        type: 'folder',
        title: 'Tags',
        count: tagGroups.size,
        level: 0,
        children: tagChildren
      });
    }

    // All other notes
    const otherNotes = filteredNotes
      .filter(note => 
        !note.important && 
        Date.now() - note.updatedAt >= 7 * 24 * 60 * 60 * 1000 &&
        note.type !== 'project'
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);

    if (otherNotes.length > 0) {
      tree.push({
        id: 'all',
        type: 'folder',
        title: 'All Notes',
        count: otherNotes.length,
        level: 0,
        children: otherNotes.map(note => ({
          id: `all-${note._id}`,
          type: 'note' as const,
          title: note.title || 'Untitled',
          note,
          level: 1,
          children: []
        }))
      });
    }

    return tree;
  }, [notes, searchTerm, selectedFilter]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleCreateNote = useCallback(async () => {
    setIsCreatingNote(true);
    try {
      const newNoteId = await createNote('', {
        customType: selectedFilter === 'projects' ? undefined : (selectedFilter !== 'all' ? selectedFilter : undefined)
      });
      if (newNoteId) {
        // Navigate to chat page with the new note
        router.push(`/dashboard/chat?noteId=${newNoteId}`);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsCreatingNote(false);
    }
  }, [createNote, router, selectedFilter]);

  const handleCreateProject = useCallback(async (name: string, description?: string) => {
    const projectId = await createProject(name, description);
    return projectId;
  }, [createProject]);

  const renderTreeNode = useCallback((node: TreeNode): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    if (node.type === 'project' && node.project) {
      return (
        <div key={node.id} className={cn(
          "group relative",
          node.level === 1 && "ml-6",
          node.level === 2 && "ml-12"
        )}>
          <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
               onClick={() => {
                 if (node.project) {
                   router.push(`/dashboard/notes/projects/${node.project._id}`);
                 }
               }}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Folder className="w-4 h-4 text-blue-500/70 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {node.title}
                  </span>
                </div>
                {node.project.description && (
                  <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                    {node.project.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground/50">
                    {formatDistanceToNow(node.project.updatedAt)} ago
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (node.type === 'note' && node.note) {
      return (
        <div key={node.id} className={cn(
          "group relative",
          node.level === 1 && "ml-6",
          node.level === 2 && "ml-12"
        )}>
          {/* Subtle connection line */}
          <div 
            className={cn(
              "absolute top-0 bottom-0 w-px bg-border/20",
              node.level === 1 && "left-3",
              node.level === 2 && "left-7"
            )}
          />
          
          <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-all duration-200 cursor-pointer relative"
               onClick={() => {
                 // Check if note has source conversation
                 const conversationParam = node.note!.sourceConversationId 
                   ? `&conversationId=${node.note!.sourceConversationId}` 
                   : '';
                 
                 // Navigate to chat with both noteId and conversationId
                 router.push(`/dashboard/chat?noteId=${node.note!._id}${conversationParam}`);
               }}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium truncate transition-colors",
                    searchTerm && node.title.toLowerCase().includes(searchTerm.toLowerCase())
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-foreground"
                  )}>
                    {node.title}
                  </span>
                  {node.note.important && (
                    <Star className="w-3 h-3 text-amber-500 fill-current flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground/70 mt-0.5">
                  <span>{formatDistanceToNow(new Date(node.note.updatedAt), { addSuffix: true })}</span>
                  {node.note.tags && node.note.tags.length > 0 && (
                    <span>• {node.note.tags.slice(0, 2).join(', ')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={node.id} className={cn(
        "relative",
        node.level === 1 && "ml-4",
        node.level === 2 && "ml-8"
      )}>
        <div 
          className="flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-muted/20 transition-all duration-200 cursor-pointer group"
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <div className="transition-transform duration-200">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground/60" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                )}
              </div>
            ) : (
              <div className="w-4" />
            )}
            <Folder className={cn(
              "w-4 h-4 transition-colors",
              node.level === 0 ? "text-blue-500/70" : "text-muted-foreground/60"
            )} />
          </div>
          <span className={cn(
            "font-medium transition-colors",
            node.level === 0 ? "text-foreground text-sm" : "text-muted-foreground/90 text-sm"
          )}>
            {node.title}
          </span>
          {node.count && (
            <span className="text-xs text-muted-foreground/50 bg-muted/40 px-1.5 py-0.5 rounded transition-colors">
              {node.count}
            </span>
          )}
        </div>
        
        {hasChildren && (
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            isExpanded ? "max-h-screen opacity-100 mt-1" : "max-h-0 opacity-0"
          )}>
            <div className="space-y-0.5">
              {node.children.map(child => renderTreeNode(child))}
            </div>
          </div>
        )}
      </div>
    );
  }, [expandedNodes, toggleNode, onEditNote]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted/30 rounded-lg w-full" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 bg-muted/20 rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground">
                  Smart Notes
                </h1>
                <p className="text-muted-foreground/70 mt-1">
                  Your thoughts, organized and accessible
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateProjectModal(true)}
                  disabled={isCreatingProject}
                  className="flex items-center gap-2 border border-border hover:bg-muted/30 text-foreground px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isCreatingProject ? (
                    <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  ) : (
                    <FolderPlus className="w-4 h-4" />
                  )}
                  New Project
                </button>
                <button
                  onClick={handleCreateNote}
                  disabled={isCreatingNote}
                  className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
                >
                  {isCreatingNote ? (
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  New Note
                </button>
              </div>
            </div>

            {/* Search and filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-muted/30 transition-colors"
                />
              </div>
              
              <div className="flex items-center gap-2">
                {[
                  { key: 'all', label: 'All', icon: FileText },
                  { key: 'important', label: 'Starred', icon: Star },
                  { key: 'recent', label: 'Recent', icon: Clock },
                  { key: 'projects', label: 'Projects', icon: Folder }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFilter(key as any)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      selectedFilter === key
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tree content */}
        <div className="p-6">
          {treeStructure.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm || selectedFilter !== 'all' ? 'No notes found' : 'No notes yet'}
              </h3>
              <p className="text-muted-foreground/70 max-w-sm mx-auto">
                {searchTerm || selectedFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first note to get started with organizing your thoughts'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {treeStructure.map(node => renderTreeNode(node))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onCreateProject={handleCreateProject}
        isCreating={isCreatingProject}
      />
    </div>
  );
}
