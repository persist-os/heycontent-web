'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Clock, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, Square, Trash2, X } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { RecentActivityItem, ActivityItemType } from '../hooks/useRecentActivity';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { T } from '@/components/translation';
import toast from 'react-hot-toast';
import { useProjects } from '../hooks/useProjects';

type SortField = 'name' | 'type' | 'lastOpened';
type SortOrder = 'asc' | 'desc';

const typeLabels: Record<ActivityItemType, string> = {
  note: 'Note',
  artifact: 'Artifact',
  chat: 'Chat', // Kept for type compatibility, but not displayed
  assignment: 'Assignment',
};

/**
 * RecentActivityTable - Displays unified recent activity across notes, artifacts, and assignments
 * 
 * ARCHITECTURE COMPLIANCE (convex-frontend-data-display.md):
 * - All useQuery calls are in this component directly (not in hooks)
 * - Rule: "components do the useQuery/useMutation directly"
 * - This component merges data from 3 sources: notes, artifacts, assignments (projects)
 * - Merge/sort logic is in component (not abstracted to hook) to keep queries explicit
 * 
 * Pattern: Direct component queries (not hook abstraction)
 * See: convex-frontend-data-display.md rule statement
 */
export function RecentActivityTable() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const limit = 20;

  // CRITICAL: Direct Convex queries in component per convex-frontend-data-display.md
  // Rule states: "components do the useQuery/useMutation directly"
  // Hooks should NOT call useQuery - this was a violation fixed 2025-01-25
  const notesResult = useQuery(
    api.noteQueries.getUserNotes,
    userId ? { userId, numItems: 50, sortField: 'updatedAt', sortOrder: 'desc' } : 'skip'
  );
  const notes = notesResult?.page;

  const artifacts = useQuery(
    api.artifactQueries.getUserArtifacts,
    userId ? { userId, limit: 50 } : 'skip'
  );

  const recentProjects = useQuery(
    api.projectsQueries.getRecent,
    userId ? { userId, limit: 50 } : 'skip'
  );

  const isLoading = 
    (userId && notesResult === undefined) ||
    (userId && artifacts === undefined) ||
    (userId && recentProjects === undefined);

  // Merge and sort all activity items from 3 sources
  // This logic is in component (not hook) to keep queries explicit and visible
  const items = useMemo(() => {
    if (!userId) return [];

    const allItems: RecentActivityItem[] = [];

    // Add notes
    if (notes) {
      notes.forEach((note) => {
        allItems.push({
          id: note._id,
          name: note.title || 'Untitled Note',
          type: 'note',
          lastOpened: note.updatedAt || note._creationTime,
          url: `/dashboard/thinking_lab?noteId=${note._id}`,
        });
      });
    }

    // Add artifacts
    if (artifacts) {
      artifacts.forEach((artifact) => {
        allItems.push({
          id: artifact._id,
          name: artifact.title || 'Untitled Artifact',
          type: 'artifact',
          lastOpened: artifact.updatedAt || artifact._creationTime,
          url: artifact.projectId 
            ? `/dashboard/living-projects/${artifact.projectId}/gallery?id=${artifact._id}`
            : undefined,
        });
      });
    }

    // Add assignments (projects)
    if (recentProjects) {
      recentProjects.forEach((project: any) => {
        allItems.push({
          id: project._id,
          name: project.name || 'Untitled Project',
          type: 'assignment',
          lastOpened: project.updatedAt || project._creationTime,
          url: `/dashboard/living-projects/${project._id}/assignment`,
        });
      });
    }

    // Sort by lastOpened descending (most recent first)
    allItems.sort((a, b) => b.lastOpened - a.lastOpened);

    // Apply limit
    return allItems.slice(0, limit);
  }, [notes, artifacts, recentProjects, limit, userId]);
  const [sortField, setSortField] = useState<SortField>('lastOpened');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<{ notes: string[]; projects: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mutations and hooks for deletion
  const batchDeleteNotesMutation = useMutation(api.noteMutations.batchDeleteNotes);
  const { batchDeleteProjects } = useProjects(userId);

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    
    sorted.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'lastOpened':
          aValue = a.lastOpened;
          bValue = b.lastOpened;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [items, sortField, sortOrder]);

  // Filter items to only selectable ones (notes and assignments)
  const selectableItems = useMemo(() => {
    return sortedItems.filter(item => item.type === 'note' || item.type === 'assignment');
  }, [sortedItems]);

  // Selection mode handlers
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (!prev) {
        setSelectedItems(new Set());
      }
      return !prev;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(selectableItems.map(item => item.id)));
  }, [selectableItems]);

  const deselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const handleBatchDelete = useCallback(() => {
    // Filter selected items to only notes and assignments
    const selectedNotes: string[] = [];
    const selectedProjects: string[] = [];

    selectedItems.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item) {
        if (item.type === 'note') {
          selectedNotes.push(id);
        } else if (item.type === 'assignment') {
          selectedProjects.push(id);
        }
      }
    });

    if (selectedNotes.length > 0 || selectedProjects.length > 0) {
      setItemsToDelete({ notes: selectedNotes, projects: selectedProjects });
    }
  }, [selectedItems, items]);

  const confirmBatchDelete = useCallback(async () => {
    if (!userId || !itemsToDelete) return;

    const { notes: noteIds, projects: projectIds } = itemsToDelete;
    const totalItems = noteIds.length + projectIds.length;

    if (totalItems === 0) return;

    setIsDeleting(true);

    try {
      const results = await Promise.allSettled([
        projectIds.length > 0 ? batchDeleteProjects(projectIds as any) : Promise.resolve(false),
        noteIds.length > 0 ? batchDeleteNotesMutation({
          noteIds: noteIds as any,
          userId
        }) : Promise.resolve({ success: false, successfulOperations: 0, failedOperations: 0 })
      ]);

      let successCount = 0;
      let failCount = 0;
      const messages: string[] = [];

      // Process project deletion results
      if (projectIds.length > 0) {
        const projectResult = results[0];
        if (projectResult.status === 'fulfilled' && projectResult.value) {
          successCount += projectIds.length;
          messages.push(`${projectIds.length} project${projectIds.length !== 1 ? 's' : ''}`);
        } else {
          failCount += projectIds.length;
        }
      }

      // Process note deletion results
      if (noteIds.length > 0) {
        const noteResult = results[1];
        if (noteResult.status === 'fulfilled' && noteResult.value && typeof noteResult.value === 'object' && 'successfulOperations' in noteResult.value) {
          const noteData = noteResult.value as { success: boolean; successfulOperations: number; failedOperations: number };
          successCount += noteData.successfulOperations;
          failCount += noteData.failedOperations;
          if (noteData.successfulOperations > 0) {
            messages.push(`${noteData.successfulOperations} note${noteData.successfulOperations !== 1 ? 's' : ''}`);
          }
        } else {
          failCount += noteIds.length;
        }
      }

      // Show success/error messages
      if (successCount > 0) {
        toast.success(<T context="toast.dashboard.notes.delete.success">Successfully deleted {messages.join(' and ')}</T>);
      }
      if (failCount > 0) {
        toast.error(<T context="toast.dashboard.notes.delete.error.count">Failed to delete {failCount} item{failCount !== 1 ? 's' : ''}</T>);
      }

      // Clear selections and exit selection mode
      setItemsToDelete(null);
      setSelectedItems(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Failed to batch delete:', error);
      toast.error(<T context="toast.dashboard.notes.delete.error">Failed to delete items</T>);
    } finally {
      setIsDeleting(false);
    }
  }, [itemsToDelete, batchDeleteProjects, batchDeleteNotesMutation, userId]);

  const cancelBatchDelete = useCallback(() => {
    setItemsToDelete(null);
  }, []);

  const hasSelection = selectedItems.size > 0;
  const selectedCount = selectedItems.size;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleRowClick = (item: RecentActivityItem) => {
    if (item.url) {
      router.push(item.url);
    }
  };

  const toggleSelect = useCallback((id: string) => {
    // Only allow selection of notes and assignments
    const item = items.find(i => i.id === id);
    if (item && (item.type === 'note' || item.type === 'assignment')) {
      setSelectedItems(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }
  }, [items]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground/50" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-foreground" />
      : <ArrowDown className="w-3 h-3 ml-1 text-foreground" />;
  };

  if (isLoading) {
    return (
      <div className="bg-[hsl(var(--notes-surface-dim))] border-2 border-[hsl(var(--notes-stroke-focus))] rounded-[12px] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted/20 rounded w-48" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted/10 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--notes-surface-dim))] border-2 border-[hsl(var(--notes-stroke-focus))] rounded-[12px] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-foreground" />
          <h2 className="text-h2 text-foreground">Recent Activity</h2>
        </div>
        
        {/* Selection Mode UI */}
        {isSelectionMode ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAll}
              className="text-muted-foreground hover:text-foreground"
            >
              <Square className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline"><T context="button.deselect.all">Deselect All</T></span>
              <span className="sm:hidden"><T context="button.clear">Clear</T></span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="text-muted-foreground hover:text-foreground"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline"><T context="button.select.all">Select All</T></span>
              <span className="sm:hidden"><T context="button.all">All</T></span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={!hasSelection || selectedCount === 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">
                {selectedCount > 0 ? <T context="button.delete.count">Delete {selectedCount}</T> : <T context="button.delete">Delete</T>}
              </span>
              <span className="sm:hidden">{selectedCount > 0 ? selectedCount : <T context="button.delete">Delete</T>}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectionMode}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              <T context="button.cancel">Cancel</T>
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectionMode}
            className="text-muted-foreground hover:text-foreground"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Select</span>
            <span className="sm:hidden">Select</span>
          </Button>
        )}
      </div>

      {/* Table - Hidden on mobile, show cards instead */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[hsl(var(--notes-stroke-focus))]">
              {isSelectionMode && (
                <th className="text-left py-3 px-4 w-12">
                  <Checkbox
                    checked={selectedItems.size === selectableItems.length && selectableItems.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedItems(new Set(selectableItems.map(item => item.id)));
                      } else {
                        setSelectedItems(new Set());
                      }
                    }}
                  />
                </th>
              )}
              <th 
                className="text-left py-3 px-4 cursor-pointer hover:bg-muted/20 transition-colors"
                style={{ width: '400px' }}
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center text-body-m text-foreground font-medium">
                  Name
                  <SortIcon field="name" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 cursor-pointer hover:bg-muted/20 transition-colors"
                style={{ width: '120px' }}
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center text-body-m text-foreground font-medium">
                  Type
                  <SortIcon field="type" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 cursor-pointer hover:bg-muted/20 transition-colors"
                style={{ width: '300px' }}
                onClick={() => handleSort('lastOpened')}
              >
                <div className="flex items-center text-body-m text-foreground font-medium">
                  Last opened
                  <SortIcon field="lastOpened" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={isSelectionMode ? 5 : 4} className="text-center py-8 text-muted-foreground text-body-m">
                  No recent activity
                </td>
              </tr>
            ) : (
              sortedItems.map((item, index) => {
                const isSelectable = item.type === 'note' || item.type === 'assignment';
                return (
                  <tr
                    key={item.id}
                    onClick={() => !isSelectionMode && handleRowClick(item)}
                    className={cn(
                      "border-b border-[hsl(var(--notes-stroke-focus))]/50 transition-colors",
                      !isSelectionMode && "cursor-pointer",
                      index % 2 === 0 
                        ? "bg-[hsl(var(--notes-surface-bright))]" 
                        : "bg-[hsl(var(--notes-surface-dim))]",
                      !isSelectionMode && "hover:bg-primary/5"
                    )}
                  >
                    {isSelectionMode && (
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        {isSelectable ? (
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                          />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className="text-body-l text-foreground">{item.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-body-m text-muted-foreground">{typeLabels[item.type]}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-body-m text-muted-foreground">
                        {formatDistanceToNow(new Date(item.lastOpened), { addSuffix: true })}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-body-m">
            No recent activity
          </div>
        ) : (
          sortedItems.map((item) => {
            const isSelectable = item.type === 'note' || item.type === 'assignment';
            return (
              <div
                key={item.id}
                onClick={() => !isSelectionMode && handleRowClick(item)}
                className={cn(
                  "bg-[hsl(var(--notes-surface-bright))] border border-[hsl(var(--notes-stroke-focus))] rounded-lg p-4 transition-colors",
                  !isSelectionMode && "cursor-pointer hover:bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isSelectionMode && (
                        isSelectable ? (
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="w-4 h-4" />
                        )
                      )}
                      <span className="text-body-l text-foreground font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-m text-muted-foreground">
                      <span>{typeLabels[item.type]}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(item.lastOpened), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Batch Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={itemsToDelete !== null && (itemsToDelete.notes.length > 0 || itemsToDelete.projects.length > 0)}
        onClose={cancelBatchDelete}
        onConfirm={confirmBatchDelete}
        title="Delete Items"
        titleContext="modal.delete_items_title"
        description={(() => {
          const projectCount = itemsToDelete?.projects.length || 0;
          const noteCount = itemsToDelete?.notes.length || 0;
          const parts: string[] = [];
          if (projectCount > 0) {
            parts.push(`${projectCount} project${projectCount !== 1 ? 's' : ''}`);
          }
          if (noteCount > 0) {
            parts.push(`${noteCount} note${noteCount !== 1 ? 's' : ''}`);
          }
          return `Are you sure you want to delete ${parts.join(' and ')}? This action cannot be undone.`;
        })()}
        descriptionContext="modal.delete_items_description"
        confirmText={(() => {
          const projectCount = itemsToDelete?.projects.length || 0;
          const noteCount = itemsToDelete?.notes.length || 0;
          const total = projectCount + noteCount;
          return `Delete ${total} Item${total !== 1 ? 's' : ''}`;
        })()}
        confirmContext="button.delete_items"
        cancelText="Cancel"
        cancelContext="button.cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}

