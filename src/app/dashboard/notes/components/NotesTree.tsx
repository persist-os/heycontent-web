'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Plus, ChevronRight, ChevronDown, FileText, Folder, Calendar, Tag, Star, Clock, Filter, FolderPlus, Users, Share2, Eye, Edit3, UserCheck, ArrowUpRight } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
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
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

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
  droppableType?: 'starred' | 'project' | 'tag' | 'all-notes';
  tagName?: string;
  projectId?: string;
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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'important' | 'recent' | 'projects' | 'shared' | 'my-shared'>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['recent', 'projects', 'tags', 'important', 'shared', 'my-shared']));
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  
  // Use the creation hooks
  const { createNote } = useCreateNote();
  const { setActiveNoteId, updateNote } = useNotes();
  const { firebaseUser } = useAuth();
  
  // Get shared notes
  const sharedNotes = useQuery(
    api.noteSharing.getSharedNotes,
    firebaseUser?.uid ? { userId: firebaseUser.uid } : 'skip'
  );
  
  // Get content shared by current user
  const mySharedContent = useQuery(
    api.contentSharingQueries.getMySharedContent,
    firebaseUser?.uid ? { userId: firebaseUser.uid, contentType: 'note' } : 'skip'
  );
  const router = useRouter();
  const { 
    projects: hookProjects, 
    createProject, 
    isCreating: isCreatingProject,
    addItemToProject,
    removeItemFromProject
  } = useProjects(firebaseUser?.uid);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance to start dragging
      },
    })
  );
  
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
        (selectedFilter === 'projects' && note.type === 'project') ||
        (selectedFilter === 'shared' && note.isSharedWithMe) ||
        (selectedFilter === 'my-shared' && note.isShared);
      
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

    // Shared with me notes
    if (sharedNotes && sharedNotes.length > 0) {
      // Group shared notes by owner for better organization
      const sharedByOwner = new Map<string, typeof sharedNotes>();
      sharedNotes.forEach(note => {
        const ownerKey = `${note.ownerId}-${note.ownerName}`;
        if (!sharedByOwner.has(ownerKey)) {
          sharedByOwner.set(ownerKey, []);
        }
        sharedByOwner.get(ownerKey)!.push(note);
      });

      const sharedChildren: TreeNode[] = [];
      
      // If only one owner, show notes directly
      if (sharedByOwner.size === 1) {
        const [ownerNotes] = Array.from(sharedByOwner.values());
        sharedChildren.push(...ownerNotes.map(sharedNote => ({
          id: `shared-${sharedNote._id}`,
          type: 'note' as const,
          title: sharedNote.title || 'Untitled',
          note: {
            ...sharedNote,
            userId: sharedNote.ownerId,
            isSharedWithMe: true,
            ownerName: sharedNote.ownerName,
            ownerId: sharedNote.ownerId,
            permission: sharedNote.permission,
            sharedAt: sharedNote.sharedAt,
          } as Note,
          level: 1,
          children: []
        })));
      } else {
        // Multiple owners, group by owner
        Array.from(sharedByOwner.entries())
          .sort(([, a], [, b]) => b[0].sharedAt - a[0].sharedAt)
          .forEach(([ownerKey, ownerNotes]) => {
            const ownerName = ownerNotes[0].ownerName;
            sharedChildren.push({
              id: `shared-owner-${ownerKey}`,
              type: 'folder',
              title: `${ownerName} (${ownerNotes.length})`,
              count: ownerNotes.length,
              level: 1,
              children: ownerNotes.map(sharedNote => ({
                id: `shared-${sharedNote._id}`,
                type: 'note' as const,
                title: sharedNote.title || 'Untitled',
                note: {
                  ...sharedNote,
                  userId: sharedNote.ownerId,
                  isSharedWithMe: true,
                  ownerName: sharedNote.ownerName,
                  ownerId: sharedNote.ownerId,
                  permission: sharedNote.permission,
                  sharedAt: sharedNote.sharedAt,
                } as Note,
                level: 2,
                children: []
              }))
            });
          });
      }

      tree.push({
        id: 'shared',
        type: 'folder',
        title: 'Shared with me',
        count: sharedNotes.length,
        level: 0,
        children: sharedChildren
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
        droppableType: 'starred',
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
        children: [],
        droppableType: 'project',
        projectId: project._id
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
          droppableType: 'tag',
          tagName: tag,
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

    // My shared content
    if (mySharedContent && mySharedContent.length > 0) {
      tree.push({
        id: 'my-shared',
        type: 'folder',
        title: 'My shared content',
        count: mySharedContent.length,
        level: 0,
        children: mySharedContent.map(sharedItem => ({
          id: `my-shared-${sharedItem._id}`,
          type: 'note' as const,
          title: sharedItem.title || 'Untitled',
          note: {
            _id: sharedItem._id,
            _creationTime: sharedItem.createdAt,
            userId: firebaseUser?.uid || '',
            title: sharedItem.title,
            content: sharedItem.content,
            createdAt: sharedItem.createdAt,
            updatedAt: sharedItem.updatedAt,
            type: sharedItem.type,
            tags: sharedItem.tags || [],
            important: sharedItem.important,
            isShared: true,
            sharedWithCount: sharedItem.sharedWithCount,
            sharedUsers: sharedItem.sharedUsers,
          } as Note,
          level: 1,
          children: []
        }))
      });
    }

    // All other notes
    const otherNotes = filteredNotes
      .filter(note => 
        !note.important && 
        Date.now() - note.updatedAt >= 7 * 24 * 60 * 60 * 1000 &&
        note.type !== 'project' &&
        !note.isSharedWithMe // Exclude shared notes from "All Notes" section
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);

    if (otherNotes.length > 0) {
      tree.push({
        id: 'all',
        type: 'folder',
        title: 'All Notes',
        count: otherNotes.length,
        level: 0,
        droppableType: 'all-notes',
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
  }, [notes, projects, searchTerm, selectedFilter]);

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

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'note') {
      const note = active.data.current.note;
      // Only allow dragging if user has edit permission or owns the note
      if (!note.isSharedWithMe || note.permission === 'edit') {
        setDraggedNote(note);
      }
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over?.data.current?.droppableType) {
      setDragOverFolder(String(over.id));
    } else {
      setDragOverFolder(null);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setDraggedNote(null);
    setDragOverFolder(null);

    if (!over || !active.data.current?.note) return;

    const note = active.data.current.note as Note;
    const dropData = over.data.current;
    const droppableType = dropData?.droppableType;

    try {
      switch (droppableType) {
        case 'starred':
          // Toggle the important field to add to starred
          await updateNote(String(note._id), { important: true });
          break;
          
        case 'project':
          // Add note to project
          if (dropData?.projectId) {
            await addItemToProject(dropData.projectId, 'note', String(note._id));
          }
          break;
          
        case 'tag':
          // Add tag to note
          if (dropData?.tagName) {
            const currentTags = note.tags || [];
            if (!currentTags.includes(dropData.tagName)) {
              await updateNote(String(note._id), { 
                tags: [...currentTags, dropData.tagName] 
              });
            }
          }
          break;
          
        case 'all-notes':
          // Remove from special categories (make it a regular note)
          const updates: any = {};
          if (note.important) {
            updates.important = false;
          }
          if (Object.keys(updates).length > 0) {
            await updateNote(String(note._id), updates);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to move note:', error);
    }
  }, [updateNote, addItemToProject]);

  // Droppable folder component
  const DroppableFolder = ({ node, children }: { node: TreeNode; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: node.id,
      data: {
        droppableType: node.droppableType,
        tagName: node.tagName,
        projectId: node.projectId,
      },
      disabled: !node.droppableType,
    });

    return (
      <div 
        ref={setNodeRef}
        className={cn(
          "transition-all duration-200",
          isOver && draggedNote && "bg-primary/10 rounded-lg"
        )}
      >
        {children}
      </div>
    );
  };

  // Draggable note component
  const DraggableNote = ({ node }: { node: TreeNode }) => {
    // Disable dragging for read-only shared notes
    const canDrag = node.note && (!node.note.isSharedWithMe || node.note.permission === 'edit');
    
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id: String(node.id),
      data: {
        type: 'note',
        note: node.note,
      },
      disabled: !canDrag,
    });

    const transformStyle = transform ? CSS.Translate.toString(transform) : undefined;

    return (
      <div
        ref={setNodeRef}
        {...(canDrag ? listeners : {})}
        {...(canDrag ? attributes : {})}
        className={cn(
          "group relative",
          node.level === 1 && "ml-6",
          node.level === 2 && "ml-12",
          isDragging && "opacity-50",
          !canDrag && "cursor-default"
        )}
        style={transformStyle ? { transform: transformStyle } : undefined}
      >
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
            <div className="relative flex-shrink-0">
              <FileText className="w-4 h-4 text-muted-foreground/60" />
              {/* Sharing indicator overlay */}
              {(node.note!.isSharedWithMe || node.note!.isShared) && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 border border-background flex items-center justify-center">
                  {node.note!.isSharedWithMe ? (
                    <ArrowUpRight className="w-1.5 h-1.5 text-white" />
                  ) : (
                    <Share2 className="w-1.5 h-1.5 text-white" />
                  )}
                </div>
              )}
            </div>
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
                {node.note!.important && (
                  <Star className="w-3 h-3 text-amber-500 fill-current flex-shrink-0" />
                )}
                {/* Sharing badges */}
                {node.note!.isSharedWithMe && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <Users className="w-2.5 h-2.5" />
                    <span className="font-medium">{node.note!.permission === 'edit' ? 'Edit' : 'View'}</span>
                  </div>
                )}
                {node.note!.isShared && node.note!.sharedWithCount && node.note!.sharedWithCount > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 dark:bg-green-950/30 rounded text-xs text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
                    <Share2 className="w-2.5 h-2.5" />
                    <span className="font-medium">{node.note!.sharedWithCount}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground/70 mt-0.5">
                {/* Owner attribution for shared notes */}
                {node.note!.isSharedWithMe && node.note!.ownerName && (
                  <span className="flex items-center gap-1 text-blue-600/70 dark:text-blue-400/70">
                    <UserCheck className="w-3 h-3" />
                    by {node.note!.ownerName}
                  </span>
                )}
                {!node.note!.isSharedWithMe && (
                  <span>{formatDistanceToNow(new Date(node.note!.updatedAt), { addSuffix: true })}</span>
                )}
                {node.note!.isSharedWithMe && node.note!.sharedAt && (
                  <span>shared {formatDistanceToNow(new Date(node.note!.sharedAt), { addSuffix: true })}</span>
                )}
                {node.note!.tags && node.note!.tags.length > 0 && (
                  <span>• {node.note!.tags.slice(0, 2).join(', ')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
              <Folder className="w-5 h-5 text-blue-500/70 flex-shrink-0" />
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
        <DraggableNote key={node.id} node={node} />
      );
    }

    return (
      <DroppableFolder key={node.id} node={node}>
        <div className={cn(
          "relative",
          node.level === 1 && "ml-4",
          node.level === 2 && "ml-8"
        )}>
          <div 
            className={cn(
              "flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-muted/20 transition-all duration-200 cursor-pointer group",
              dragOverFolder === node.id && draggedNote && "bg-primary/10 border border-primary/30 border-dashed"
            )}
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
              {node.id === 'shared' ? (
                <Users className="w-5 h-5 text-blue-500/70 transition-colors" />
              ) : node.id === 'my-shared' ? (
                <Share2 className="w-5 h-5 text-green-500/70 transition-colors" />
              ) : (
                <Folder className={cn(
                  "w-5 h-5 transition-colors",
                  node.level === 0 ? "text-blue-500/70" : "text-muted-foreground/60"
                )} />
              )}
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
            {dragOverFolder === node.id && draggedNote && node.droppableType && (
              <span className="text-xs text-primary font-medium ml-auto">
                Drop here
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
      </DroppableFolder>
    );
  }, [expandedNodes, toggleNode, onEditNote, dragOverFolder, draggedNote, router, searchTerm]);

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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground">
                  Files
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
                    <FolderPlus className="w-5 h-5" />
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
              
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'All', icon: FileText },
                  { key: 'important', label: 'Starred', icon: Star },
                  { key: 'recent', label: 'Recent', icon: Clock },
                  { key: 'projects', label: 'Projects', icon: Folder },
                  { key: 'shared', label: 'Shared with me', icon: Users, count: sharedNotes?.length },
                  { key: 'my-shared', label: 'My shared', icon: Share2, count: mySharedContent?.length }
                ].map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFilter(key as any)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative",
                      selectedFilter === key
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", key === 'projects' && "w-5 h-5")} />
                    <span>{label}</span>
                    {count && count > 0 && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full font-medium",
                        selectedFilter === key
                          ? "bg-background/20 text-background"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {count}
                      </span>
                    )}
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
                {selectedFilter === 'shared' 
                  ? 'No notes have been shared with you yet'
                  : selectedFilter === 'my-shared'
                  ? 'You haven\'t shared any notes with others yet'
                  : searchTerm || selectedFilter !== 'all' 
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

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedNote ? (
          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground/60" />
              <span className="text-sm font-medium">
                {draggedNote.title || 'Untitled'}
              </span>
              {draggedNote.important && (
                <Star className="w-3 h-3 text-amber-500 fill-current" />
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
