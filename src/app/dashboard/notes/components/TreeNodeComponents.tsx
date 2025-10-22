'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Folder, 
  Star, 
  Users, 
  Share2, 
  ArrowUpRight, 
  UserCheck, 
  Edit3,
  Eye,
  Clock,
  Hash,
  FolderOpen,
  NotebookPen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { TreeNode, DroppableComponentProps, DraggableComponentProps } from './NotesTree.types';
import { Note } from '../types';
import { T } from '@/components/translation';

// Droppable folder component
export function DroppableFolder({ node, children, dragOverFolder, draggedNote }: DroppableComponentProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: node.id,
    data: {
      droppableType: node.droppableType,
      tagName: node.tagName,
      projectId: node.projectId,
      folderId: node.folderId,
    },
    disabled: !node.droppableType,
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "transition-all duration-200",
        isOver && draggedNote && "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20 shadow-sm shadow-primary/10"
      )}
    >
      {children}
    </div>
  );
}

// Draggable note component
export function DraggableNote({ node, router, searchTerm }: DraggableComponentProps) {
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
      {...(transformStyle && { style: { transform: transformStyle } })}
    >
      {/* Subtle connection line */}
      <div 
        className={cn(
          "absolute top-0 bottom-0 w-px bg-border/20",
          node.level === 1 && "left-3",
          node.level === 2 && "left-7"
        )}
      />
      
      <div className="flex items-center gap-3 py-3 sm:py-2 px-3 rounded-lg hover:bg-gradient-to-r hover:from-primary/5 hover:via-transparent hover:to-transparent active:bg-primary/10 transition-all duration-200 cursor-pointer relative min-h-[48px] sm:min-h-0 group"
           onClick={() => {
             const conversationParam = node.note!.sourceConversationId 
               ? `&conversationId=${node.note!.sourceConversationId}` 
               : '';
             
             router.push(`/dashboard/thinking_lab?noteId=${node.note!._id}${conversationParam}`);
           }}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <FileText className="w-4 h-4 text-primary/50 group-hover:text-primary/70 transition-colors" />
            {/* Sharing indicator overlay */}
            {(node.note!.isSharedWithMe || node.note!.isShared) && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 border border-background flex items-center justify-center shadow-sm shadow-blue-500/30">
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
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-blue-500/10 to-blue-400/5 rounded text-xs text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Users className="w-2.5 h-2.5" />
                  <span className="font-medium">
                    {node.note!.permission === 'edit' ? (
                      <T context="notes.permission.edit">Edit</T>
                    ) : (
                      <T context="notes.permission.view">View</T>
                    )}
                  </span>
                </div>
              )}
              {node.note!.isShared && node.note!.sharedWithCount && node.note!.sharedWithCount > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-green-500/10 to-green-400/5 rounded text-xs text-green-600 dark:text-green-400 border border-green-500/20">
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
                  <T context="notes.by-owner">by</T> {node.note!.ownerName}
                </span>
              )}
              {!node.note!.isSharedWithMe && (
                <span>{formatDistanceToNow(new Date(node.note!.updatedAt), { addSuffix: true })}</span>
              )}
              {node.note!.isSharedWithMe && node.note!.sharedAt && (
                <span><T context="notes.shared">shared</T> {formatDistanceToNow(new Date(node.note!.sharedAt), { addSuffix: true })}</span>
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
}

interface TreeNodeRendererProps {
  node: TreeNode;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggleNode: (nodeId: string) => void;
  router: any;
  searchTerm: string;
  dragOverFolder?: string | null;
  draggedNote?: Note | null;
}

export function TreeNodeRenderer({
  node,
  isExpanded,
  hasChildren,
  onToggleNode,
  router,
  searchTerm,
  dragOverFolder,
  draggedNote
}: TreeNodeRendererProps) {
  if (node.type === 'project' && node.project) {
    return (
      <DroppableFolder node={node} dragOverFolder={dragOverFolder} draggedNote={draggedNote}>
        <div className={cn(
          "group relative",
          node.level === 1 && "ml-6",
          node.level === 2 && "ml-12"
        )}>
          <div 
            className={cn(
              "flex items-center gap-3 py-3 sm:py-2 px-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-500/5 hover:via-transparent hover:to-transparent active:bg-blue-500/10 transition-all cursor-pointer min-h-[48px] sm:min-h-0 group",
              dragOverFolder === node.id && draggedNote && "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 border-dashed shadow-sm shadow-primary/10"
            )}
            onClick={() => {
              if (node.project) {
                router.push(`/dashboard/living-projects/${node.project._id}`);
              }
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Folder className="w-5 h-5 text-blue-500/70 group-hover:text-blue-500 transition-colors flex-shrink-0" />
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
            {dragOverFolder === node.id && draggedNote && (
              <span className="text-xs text-primary font-medium ml-auto">
                <T context="notes.drag.add-to-project">Add to project</T>
              </span>
            )}
          </div>
        </div>
      </DroppableFolder>
    );
  }

  if (node.type === 'user-folder' && node.folder) {
    return (
      <DroppableFolder node={node} dragOverFolder={dragOverFolder} draggedNote={draggedNote}>
        <div className={cn(
          "group relative",
          node.level === 1 && "ml-6",
          node.level === 2 && "ml-12",
          node.level === 3 && "ml-18"
        )}>
          <div 
            className={cn(
              "flex items-center gap-3 py-3 sm:py-2 px-3 rounded-lg hover:bg-gradient-to-r hover:from-indigo-500/5 hover:via-transparent hover:to-transparent active:bg-indigo-500/10 transition-all cursor-pointer min-h-[48px] sm:min-h-0 group",
              dragOverFolder === node.id && draggedNote && "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 border-dashed shadow-sm shadow-primary/10"
            )}
            onClick={() => hasChildren && onToggleNode(node.id)}
          >
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <div className="transition-transform duration-200">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground/60 group-hover:text-indigo-500/70" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-indigo-500/70" />
                  )}
                </div>
              ) : (
                <div className="w-4" />
              )}
              <Folder 
                className="w-5 h-5 flex-shrink-0 text-indigo-500/70 group-hover:text-indigo-500 transition-colors"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {node.title}
                </span>
                {node.count && node.count > 0 && (
                  <span className="text-xs text-muted-foreground/50 bg-muted/40 px-1.5 py-0.5 rounded">
                    {node.count}
                  </span>
                )}
              </div>
              {node.folder.description && (
                <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                  {node.folder.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground/50">
                  {formatDistanceToNow(node.folder.updatedAt)} ago
                </span>
              </div>
            </div>
            {dragOverFolder === node.id && draggedNote && (
              <span className="text-xs text-primary font-medium ml-auto">
                <T context="notes.drag.drop-here">Drop here</T>
              </span>
            )}
          </div>
        </div>
      </DroppableFolder>
    );
  }

  if (node.type === 'note' && node.note) {
    return (
      <DraggableNote node={node} router={router} searchTerm={searchTerm} />
    );
  }

  return (
    <DroppableFolder node={node} dragOverFolder={dragOverFolder} draggedNote={draggedNote}>
      <div className={cn(
        "relative",
        node.level === 1 && "ml-4",
        node.level === 2 && "ml-8"
      )}>
        <div 
          className={cn(
            "flex items-center gap-2 py-3 sm:py-2.5 px-3 rounded-lg transition-all duration-200 cursor-pointer group min-h-[48px] sm:min-h-0",
            node.id === 'recent' && "hover:bg-gradient-to-r hover:from-orange-500/5 hover:via-transparent hover:to-transparent",
            node.id === 'tags' && "hover:bg-gradient-to-r hover:from-purple-500/5 hover:via-transparent hover:to-transparent",
            node.id === 'important' && "hover:bg-gradient-to-r hover:from-amber-500/5 hover:via-transparent hover:to-transparent",
            node.id === 'projects' && "hover:bg-gradient-to-r hover:from-blue-500/5 hover:via-transparent hover:to-transparent",
            node.id === 'shared' && "hover:bg-gradient-to-r hover:from-blue-500/5 hover:via-transparent hover:to-transparent",
            node.id === 'my-shared' && "hover:bg-gradient-to-r hover:from-green-500/5 hover:via-transparent hover:to-transparent",
            node.id === 'user-folders' && "hover:bg-gradient-to-r hover:from-indigo-500/5 hover:via-transparent hover:to-transparent",
            (!node.id.match(/^(recent|tags|important|projects|shared|my-shared|user-folders)$/)) && "hover:bg-gradient-to-r hover:from-primary/5 hover:via-transparent hover:to-transparent",
            dragOverFolder === node.id && draggedNote && "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 border-dashed shadow-sm shadow-primary/10"
          )}
          onClick={() => hasChildren && onToggleNode(node.id)}
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <div className="transition-transform duration-200">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground/70" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground/70" />
                )}
              </div>
            ) : (
              <div className="w-4" />
            )}
            {node.id === 'recent' ? (
              <Clock className="w-5 h-5 text-orange-500/70 group-hover:text-orange-500 transition-colors" />
            ) : node.id === 'tags' ? (
              <Hash className="w-5 h-5 text-purple-500/70 group-hover:text-purple-500 transition-colors" />
            ) : node.id === 'important' ? (
              <Star className="w-5 h-5 text-amber-500/70 group-hover:text-amber-500 transition-colors" />
            ) : node.id === 'projects' ? (
              <FolderOpen className="w-5 h-5 text-blue-500/70 group-hover:text-blue-500 transition-colors" />
            ) : node.id === 'shared' ? (
              <Users className="w-5 h-5 text-blue-500/70 group-hover:text-blue-500 transition-colors" />
            ) : node.id === 'my-shared' ? (
              <Share2 className="w-5 h-5 text-green-500/70 group-hover:text-green-500 transition-colors" />
            ) : node.id === 'user-folders' ? (
              <Folder className="w-5 h-5 text-indigo-500/70 group-hover:text-indigo-500 transition-colors" />
            ) : node.id === 'all' ? (
              <NotebookPen className="w-5 h-5 text-slate-500/70 group-hover:text-slate-500 transition-colors" />
            ) : node.folder && node.folder.color ? (
              /* eslint-disable-next-line react/forbid-dom-props */
              <Folder 
                className="w-5 h-5 transition-colors"
                style={{ color: node.folder.color }}
              />
            ) : (
              <Folder className={cn(
                "w-5 h-5 transition-colors",
                node.level === 0 ? "text-blue-500/70 group-hover:text-blue-500" : "text-muted-foreground/60 group-hover:text-muted-foreground"
              )} />
            )}
          </div>
          <span className={cn(
            "font-medium transition-colors",
            node.level === 0 ? "text-foreground text-sm" : "text-muted-foreground/90 text-sm group-hover:text-foreground"
          )}>
            {node.title}
          </span>
          {node.count && (
            <span className="text-xs text-muted-foreground/50 bg-gradient-to-r from-muted/40 to-muted/20 px-1.5 py-0.5 rounded transition-all group-hover:from-primary/10 group-hover:to-primary/5 group-hover:text-foreground/60">
              {node.count}
            </span>
          )}
          {dragOverFolder === node.id && draggedNote && node.droppableType && (
            <span className="text-xs text-primary font-medium ml-auto">
              <T context="notes.drag.drop-here">Drop here</T>
            </span>
          )}
        </div>
      </div>
    </DroppableFolder>
  );
}
