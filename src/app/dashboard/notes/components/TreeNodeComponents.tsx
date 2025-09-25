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
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { TreeNode, DroppableComponentProps, DraggableComponentProps } from './NotesTree.types';
import { Note } from '../types';

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
        isOver && draggedNote && "bg-primary/10 rounded-lg"
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
      
      <div className="flex items-center gap-3 py-3 sm:py-2 px-3 rounded-lg hover:bg-muted/30 active:bg-muted/40 transition-all duration-200 cursor-pointer relative min-h-[48px] sm:min-h-0"
           onClick={() => {
             const conversationParam = node.note!.sourceConversationId 
               ? `&conversationId=${node.note!.sourceConversationId}` 
               : '';
             
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
              "flex items-center gap-3 py-3 sm:py-2 px-3 rounded-lg hover:bg-muted/30 active:bg-muted/40 transition-colors cursor-pointer min-h-[48px] sm:min-h-0",
              dragOverFolder === node.id && draggedNote && "bg-primary/10 border border-primary/30 border-dashed"
            )}
            onClick={() => {
              if (node.project) {
                router.push(`/dashboard/notes/projects/${node.project._id}`);
              }
            }}
          >
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
            {dragOverFolder === node.id && draggedNote && (
              <span className="text-xs text-primary font-medium ml-auto">
                Add to project
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
              "flex items-center gap-3 py-3 sm:py-2 px-3 rounded-lg hover:bg-muted/30 active:bg-muted/40 transition-colors cursor-pointer min-h-[48px] sm:min-h-0",
              dragOverFolder === node.id && draggedNote && "bg-primary/10 border border-primary/30 border-dashed"
            )}
            onClick={() => hasChildren && onToggleNode(node.id)}
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
              <Folder 
                className="w-5 h-5 flex-shrink-0 text-blue-500/70"
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
                Drop here
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
            "flex items-center gap-2 py-3 sm:py-2.5 px-3 rounded-lg hover:bg-muted/20 active:bg-muted/30 transition-all duration-200 cursor-pointer group min-h-[48px] sm:min-h-0",
            dragOverFolder === node.id && draggedNote && "bg-primary/10 border border-primary/30 border-dashed"
          )}
          onClick={() => hasChildren && onToggleNode(node.id)}
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
      </div>
    </DroppableFolder>
  );
}
